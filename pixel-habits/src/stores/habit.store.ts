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
  const habits = ref<Habit[]>([])
  const entries = ref<HabitEntry[]>([])
  const loading = ref(true)
  const firestoreError = ref<string | null>(null)

  // Real-time Firestore listeners (active for entire app lifetime)
  onSnapshot(
    collection(db, 'habits'),
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

  onSnapshot(
    collection(db, 'entries'),
    (snap) => {
      entries.value = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HabitEntry)
    },
    () => {
      // entries listener failure is non-fatal; habits listener error already surfaced
    },
  )

  // Today's progress (daily habits only)
  const dailyHabits = computed(() => habits.value.filter((h) => h.frequency === 'daily'))

  const todayCompleted = computed(() => {
    const today = format(new Date(), 'yyyy-MM-dd')
    return dailyHabits.value.filter((h) =>
      entries.value.some((e) => e.habitId === h.id && e.date === today),
    ).length
  })

  const todayTotal = computed(() => dailyHabits.value.length)

  const todayPercent = computed(() =>
    todayTotal.value === 0 ? 0 : Math.round((todayCompleted.value / todayTotal.value) * 100),
  )

  async function addHabit(
    name: string,
    emoji: string,
    color: string,
    frequency: HabitFrequency,
  ): Promise<void> {
    await addDoc(collection(db, 'habits'), {
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
    await updateDoc(doc(db, 'habits', id), { name: name.trim(), emoji, color, frequency })
  }

  async function deleteHabit(id: string): Promise<void> {
    const batch = writeBatch(db)
    batch.delete(doc(db, 'habits', id))
    for (const entry of entries.value.filter((e) => e.habitId === id)) {
      batch.delete(doc(db, 'entries', entry.id))
    }
    await batch.commit()
  }

  function getEntry(habitId: string, date: string): HabitEntry | null {
    return entries.value.find((e) => e.habitId === habitId && e.date === date) ?? null
  }

  function getEntriesForHabit(habitId: string): HabitEntry[] {
    return entries.value.filter((e) => e.habitId === habitId)
  }

  async function setEntry(
    habitId: string,
    date: string,
    rating: HabitRating,
    description: string,
  ): Promise<void> {
    const existing = entries.value.find((e) => e.habitId === habitId && e.date === date)
    if (existing) {
      await updateDoc(doc(db, 'entries', existing.id), { rating, description })
    } else {
      await addDoc(collection(db, 'entries'), { habitId, date, rating, description })
    }
  }

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
