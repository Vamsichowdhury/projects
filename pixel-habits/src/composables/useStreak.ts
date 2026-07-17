import { computed, type Ref } from 'vue'
import {
  format,
  subDays,
  subWeeks,
  subMonths,
  parseISO,
  startOfWeek,
  startOfMonth,
} from 'date-fns'
import type { HabitEntry, HabitFrequency } from '@/types'

export function useStreak(entries: Ref<HabitEntry[]>, frequency: Ref<HabitFrequency>) {
  const entryDateSet = computed(() => new Set(entries.value.map((e) => e.date)))

  const currentStreak = computed<number>(() => {
    const today = new Date()

    if (frequency.value === 'daily') {
      const todayStr = format(today, 'yyyy-MM-dd')
      let check = entryDateSet.value.has(todayStr) ? today : subDays(today, 1)
      let streak = 0
      for (let i = 0; i < 366; i++) {
        if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
          streak++
          check = subDays(check, 1)
        } else break
      }
      return streak
    }

    if (frequency.value === 'weekly') {
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
      const thisWeekStr = format(thisWeekStart, 'yyyy-MM-dd')
      let check = entryDateSet.value.has(thisWeekStr) ? thisWeekStart : subWeeks(thisWeekStart, 1)
      let streak = 0
      for (let i = 0; i < 104; i++) {
        if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
          streak++
          check = subWeeks(check, 1)
        } else break
      }
      return streak
    }

    // monthly
    const thisMonthStart = startOfMonth(today)
    const thisMonthStr = format(thisMonthStart, 'yyyy-MM-dd')
    let check = entryDateSet.value.has(thisMonthStr) ? thisMonthStart : subMonths(thisMonthStart, 1)
    let streak = 0
    for (let i = 0; i < 60; i++) {
      if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
        streak++
        check = subMonths(check, 1)
      } else break
    }
    return streak
  })

  const longestStreak = computed<number>(() => {
    const dates = [...entryDateSet.value].sort()
    if (dates.length === 0) return 0

    let longest = 1
    let current = 1

    for (let i = 1; i < dates.length; i++) {
      const prev = parseISO(dates[i - 1]!)
      const curr = parseISO(dates[i]!)

      let consecutive = false
      if (frequency.value === 'daily') {
        consecutive = Math.round((curr.getTime() - prev.getTime()) / 86400000) === 1
      } else if (frequency.value === 'weekly') {
        consecutive = Math.round((curr.getTime() - prev.getTime()) / 86400000) === 7
      } else {
        const monthDiff =
          (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth())
        consecutive = monthDiff === 1
      }

      if (consecutive) {
        current++
        if (current > longest) longest = current
      } else {
        current = 1
      }
    }

    return longest
  })

  return { currentStreak, longestStreak }
}

