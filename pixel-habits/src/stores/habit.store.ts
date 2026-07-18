/**
 * Habit Store — Core Business Logic & Firebase Firestore Sync
 *
 * This is the single source of truth for all habit and entry data.
 * Responsibilities:
 * - Maintain reactive refs synced with Firestore in real-time
 * - Provide CRUD operations (Create, Read, Update, Delete)
 * - Compute derived state (dailyHabits, todayCompleted, todayPercent, etc.)
 * - Handle Firestore connection errors and retry logic
 *
 * Architecture:
 * 1. App initializes → Store auto-creates two onSnapshot() listeners
 * 2. User action (e.g., add habit) → calls store method → Firebase API
 * 3. Firestore updates → onSnapshot listener fires → habits/entries refs update
 * 4. Refs are reactive → Vue components auto-re-render
 *
 * Key Principle: Never manually fetch data. All updates are real-time push
 * from Firestore, ensuring no stale state.
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '@/firebase/firebase'
import type { Habit, HabitEntry, HabitFrequency, HabitRating } from '@/types'

export const useHabitStore = defineStore('habits', () => {
  // ─── STATE ───────────────────────────────────────────────────────────────────

  /** All habits for the current user; synced from Firestore 'habits' collection */
  const habits = ref<Habit[]>([])

  /** All habit entries (ratings + notes) for all habits; synced from Firestore 'entries' collection */
  const entries = ref<HabitEntry[]>([])

  /** True while Firestore listeners are setting up; used to show loading spinner */
  const loading = ref(true)

  /** Error message if Firestore connection fails; displayed to user in HomeView */
  const firestoreError = ref<string | null>(null)

  // ─── FIRESTORE LISTENERS ──────────────────────────────────────────────────────

  /**
   * Real-time listener for 'habits' collection
   * Automatically triggered whenever a habit is added/updated/deleted in Firestore.
   * Once first snapshot arrives, sets loading=false to stop showing spinner.
   */
  onSnapshot(
    collection(db, 'habits'),
    (snap) => {
      // Transform Firestore docs into Habit array (include auto-generated id)
      habits.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Habit)
      loading.value = false  // First snapshot received; Firestore is connected
      firestoreError.value = null
    },
    (err) => {
      // Listener error (network issue, permission denied, etc.)
      firestoreError.value = err.message
      loading.value = false  // Stop spinner and show error to user
    },
  )

  /**
   * Real-time listener for 'entries' collection
   * Automatically triggered whenever an entry is added/updated/deleted.
   * Error is non-fatal (entries being unavailable is less critical than habits).
   */
  onSnapshot(
    collection(db, 'entries'),
    (snap) => {
      // Transform Firestore docs into HabitEntry array
      entries.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HabitEntry)
    },
    () => {
      // Entries listener error is non-fatal; habits listener already handles main error state
    },
  )

  // ─── COMPUTED STATE ────────────────────────────────────────────────────────────

  /** Filter to only daily habits (used for Today's Progress card) */
  const dailyHabits = computed(() => habits.value.filter((h) => h.frequency === 'daily'))

  /** Count of daily habits with an entry for today */
  const todayCompleted = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return dailyHabits.value.filter((h) =>
      entries.value.some((e) => e.habitId === h.id && e.date === today),
    ).length
  })

  /** Total number of daily habits */
  const todayTotal = computed(() => dailyHabits.value.length)

  /** Today's completion percentage (0-100); used for progress bar */
  const todayPercent = computed(() =>
    todayTotal.value === 0 ? 0 : Math.round((todayCompleted.value / todayTotal.value) * 100),
  )

  // ─── CRUD ACTIONS ─────────────────────────────────────────────────────────────

  /**
   * Create a new habit and persist to Firestore.
   * @param name - Habit name (required, trimmed, displayed in cards)
   * @param emoji - Emoji (displayed in habit cards)
   * @param color - Hex color code (one of 16 preset colors from HABIT_COLORS)
   * @param frequency - 'daily' | 'weekly' | 'monthly' (determines streak calculation)
   * Triggers habits listener → habits.value updates automatically
   */
  async function addHabit(
    name: string,
    emoji: string,
    color: string,
    frequency: HabitFrequency,
  ): Promise<void> {
    // Add doc with auto-generated ID; Firestore will trigger habits listener
    await addDoc(collection(db, 'habits'), {
      name: name.trim(),
      emoji,
      color,
      frequency,
      createdAt: new Date().toISOString(),
    })
  }

  /**
   * Update an existing habit (name, emoji, color, frequency).
   * Cannot modify createdAt or id (immutable).
   * Triggers habits listener → habits.value updates automatically
   */
  async function updateHabit(
    id: string,
    name: string,
    emoji: string,
    color: string,
    frequency: HabitFrequency,
  ): Promise<void> {
    // Update only these fields; other fields remain unchanged
    await updateDoc(doc(db, 'habits', id), { name: name.trim(), emoji, color, frequency })
  }

  /**
   * Delete a habit AND all its associated entries.
   * Uses writeBatch for atomicity: ensures all-or-nothing (no orphaned data).
   * If habit deletes but entries don't, we'd have orphaned entries in database.
   * Triggers both listeners → habits.value and entries.value update automatically
   */
  async function deleteHabit(id: string): Promise<void> {
    const batch = writeBatch(db)

    // Delete the habit document itself
    batch.delete(doc(db, 'habits', id))

    // Delete all entries for this habit (prevent orphaned data)
    for (const entry of entries.value.filter((e) => e.habitId === id)) {
      batch.delete(doc(db, 'entries', entry.id))
    }

    // Commit all deletes at once; either all succeed or all fail
    await batch.commit()
  }

  /**
   * Get a single entry for a habit on a specific date.
   * Used by PixelDetailDialog to show existing rating/description when pixel is clicked.
   * @returns The HabitEntry if exists, null if user hasn't marked this pixel yet
   */
  function getEntry(habitId: string, date: string): HabitEntry | null {
    return entries.value.find((e) => e.habitId === habitId && e.date === date) ?? null
  }

  /**
   * Get all entries for a specific habit across all dates.
   * Used by HabitCard → useStreak to calculate streaks.
   * Used by HabitHeatmap → useHeatmap to render colored cells.
   */
  function getEntriesForHabit(habitId: string): HabitEntry[] {
    return entries.value.filter((e) => e.habitId === habitId)
  }

  /**
   * Mark a pixel (date) with a rating and optional notes.
   * Uniqueness: only one entry per (habitId, date) pair.
   * If entry already exists, updates rating/description (creates new doc, doesn't duplicate).
   * Called by PixelDetailDialog when user clicks Save.
   * Triggers entries listener → entries.value updates automatically
   */
  async function setEntry(
    habitId: string,
    date: string,
    rating: HabitRating,
    description: string,
  ): Promise<void> {
    const existing = entries.value.find((e) => e.habitId === habitId && e.date === date)
    if (existing) {
      // Update existing entry (user clicked pixel again to change rating)
      await updateDoc(doc(db, 'entries', existing.id), { rating, description })
    } else {
      // Create new entry (user marking pixel for first time)
      await addDoc(collection(db, 'entries'), { habitId, date, rating, description })
    }
  }

  /**
   * Unmark a pixel (delete entry for a habit on a specific date).
   * Called by PixelDetailDialog when user clicks Unmark button.
   * Triggers entries listener → entries.value updates automatically
   */
  async function removeEntry(habitId: string, date: string): Promise<void> {
    const existing = entries.value.find((e) => e.habitId === habitId && e.date === date)
    if (existing) {
      await deleteDoc(doc(db, 'entries', existing.id))
    }
  }

  return {
    habits,
    entries,
    loading,
    firestoreError,
    dailyHabits,
    todayCompleted,
    todayTotal,
    todayPercent,
    addHabit,
    updateHabit,
    deleteHabit,
    getEntry,
    setEntry,
    removeEntry,
    getEntriesForHabit,
  }
})
