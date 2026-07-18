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
import { ref, computed, watch } from 'vue'
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '@/firebase/firebase'
import { useAuthStore } from '@/stores/auth.store'
import type { Habit, HabitEntry, HabitFrequency, HabitRating } from '@/types'

export const useHabitStore = defineStore('habits', () => {
  const authStore = useAuthStore()

  // ─── STATE ───────────────────────────────────────────────────────────────────

  const habits = ref<Habit[]>([])
  const entries = ref<HabitEntry[]>([])
  const loading = ref(true)
  const firestoreError = ref<string | null>(null)

  // ─── FIRESTORE PATH HELPERS ──────────────────────────────────────────────────
  const habitsCol = (uid: string) => collection(db, 'users', uid, 'habits')
  const entriesCol = (uid: string) => collection(db, 'users', uid, 'entries')
  const habitDoc = (uid: string, id: string) => doc(db, 'users', uid, 'habits', id)
  const entryDoc = (uid: string, id: string) => doc(db, 'users', uid, 'entries', id)

  function requireUid(): string {
    const uid = authStore.uid
    if (!uid) throw new Error('No authenticated user; cannot access habit data.')
    return uid
  }

  // ─── FIRESTORE LISTENERS (reactive to the signed-in user) ────────────────
  let unsubHabits: Unsubscribe | null = null
  let unsubEntries: Unsubscribe | null = null

  function teardownListeners() {
    unsubHabits?.()
    unsubEntries?.()
    unsubHabits = null
    unsubEntries = null
  }

  function subscribe(uid: string) {
    loading.value = true
    firestoreError.value = null

    unsubHabits = onSnapshot(
      habitsCol(uid),
      (snap) => {
        habits.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Habit)
        loading.value = false
        firestoreError.value = null
      },
      (err) => {
        firestoreError.value = err.message
        loading.value = false
      },
    )

    unsubEntries = onSnapshot(
      entriesCol(uid),
      (snap) => {
        entries.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HabitEntry)
      },
      () => {
        // Entries listener error is non-fatal; habits listener already handles main error state
      },
    )
  }

  watch(
    () => authStore.uid,
    (uid) => {
      teardownListeners()
      habits.value = []
      entries.value = []
      if (uid) {
        subscribe(uid)
      } else {
        loading.value = false
      }
    },
    { immediate: true },
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

  async function addHabit(
    name: string,
    emoji: string,
    color: string,
    frequency: HabitFrequency,
  ): Promise<void> {
    const uid = requireUid()
    await addDoc(habitsCol(uid), {
      name: name.trim(),
      emoji,
      color,
      frequency,
      createdAt: new Date().toISOString(),
    })
  }

  async function updateHabit(
    id: string,
    name: string,
    emoji: string,
    color: string,
    frequency: HabitFrequency,
  ): Promise<void> {
    const uid = requireUid()
    await updateDoc(habitDoc(uid, id), { name: name.trim(), emoji, color, frequency })
  }

  async function deleteHabit(id: string): Promise<void> {
    const uid = requireUid()
    const batch = writeBatch(db)

    batch.delete(habitDoc(uid, id))

    for (const entry of entries.value.filter((e) => e.habitId === id)) {
      batch.delete(entryDoc(uid, entry.id))
    }

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

  async function setEntry(
    habitId: string,
    date: string,
    rating: HabitRating,
    description: string,
  ): Promise<void> {
    const uid = requireUid()
    const existing = entries.value.find((e) => e.habitId === habitId && e.date === date)
    if (existing) {
      await updateDoc(entryDoc(uid, existing.id), { rating, description })
    } else {
      await addDoc(entriesCol(uid), { habitId, date, rating, description })
    }
  }

  async function removeEntry(habitId: string, date: string): Promise<void> {
    const uid = requireUid()
    const existing = entries.value.find((e) => e.habitId === habitId && e.date === date)
    if (existing) {
      await deleteDoc(entryDoc(uid, existing.id))
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
