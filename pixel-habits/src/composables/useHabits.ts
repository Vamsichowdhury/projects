import { computed } from 'vue'
import { useHabitStore } from '@/stores/habit.store'
import type { HabitFrequency } from '@/types'

export function useHabits() {
  const store = useHabitStore()

  const hasHabits = computed(() => store.habits.length > 0)

  return {
    habits: computed(() => store.habits),
    hasHabits,
    addHabit: (name: string, emoji: string, color: string, frequency: HabitFrequency) =>
      store.addHabit(name, emoji, color, frequency),
    updateHabit: (
      id: string,
      name: string,
      emoji: string,
      color: string,
      frequency: HabitFrequency,
    ) => store.updateHabit(id, name, emoji, color, frequency),
    deleteHabit: (id: string) => store.deleteHabit(id),
  }
}
