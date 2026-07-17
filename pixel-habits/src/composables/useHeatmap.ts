import { computed, type Ref } from 'vue'
import {
  format,
  getDay,
  eachDayOfInterval,
  differenceInCalendarDays,
  isAfter,
  startOfYear,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  addWeeks,
  addMonths,
  isSameYear,
} from 'date-fns'
import type { HabitEntry, HeatmapCell, HeatmapTier, HabitFrequency } from '@/types'

function ratingToTier(rating: number): HeatmapTier {
  return Math.min(5, Math.max(1, rating)) as HeatmapTier
}

export function useHeatmap(frequency: Ref<HabitFrequency>, entries: Ref<HabitEntry[]>) {
  const today = new Date()
  const yearStart = startOfYear(today)

  const entryMap = computed(() => {
    const map = new Map<string, HabitEntry>()
    for (const e of entries.value) map.set(e.date, e)
    return map
  })

  // ── DAILY ────────────────────────────────────────────────────────────────────────────
  const startOffset = computed(() => getDay(yearStart))

  const dailyCells = computed<HeatmapCell[]>(() => {
    const days = eachDayOfInterval({ start: yearStart, end: today })
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const entry = entryMap.value.get(dateStr) ?? null
      return {
        date,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,
        entry,
        label: format(date, 'MMM d, yyyy'),
        isFuture: false,
      }
    })
  })

  const dailyWeeks = computed<(HeatmapCell | null)[][]>(() => {
    const cells: (HeatmapCell | null)[] = [
      ...new Array<null>(startOffset.value).fill(null),
      ...dailyCells.value,
    ]
    const result: (HeatmapCell | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7)
      while (week.length < 7) week.push(null)
      result.push(week)
    }
    return result
  })

  const monthLabels = computed<{ name: string; column: number }[]>(() => {
    const labels: { name: string; column: number }[] = []
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(today.getFullYear(), m, 1)
      if (isAfter(firstDay, today)) break
      const dayIndex = differenceInCalendarDays(firstDay, yearStart)
      const column = Math.floor((dayIndex + startOffset.value) / 7) + 1
      labels.push({ name: format(firstDay, 'MMM'), column })
    }
    return labels
  })

  // ── WEEKLY ─────────────────────────────────────────────────────────────────────────
  const weeklyCells = computed<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = []
    let week = startOfWeek(yearStart, { weekStartsOn: 1 })
    while (!isAfter(week, today)) {
      const dateStr = format(week, 'yyyy-MM-dd')
      const entry = entryMap.value.get(dateStr) ?? null
      const weekEnd = endOfWeek(week, { weekStartsOn: 1 })
      cells.push({
        date: week,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,
        entry,
        label: `${format(week, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`,
        isFuture: false,
      })
      week = addWeeks(week, 1)
    }
    return cells
  })

  // ── MONTHLY ────────────────────────────────────────────────────────────────────────
  const monthlyCells = computed<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = []
    let month = startOfMonth(yearStart)
    while (!isAfter(month, today) && isSameYear(month, today)) {
      const dateStr = format(month, 'yyyy-MM-dd')
      const entry = entryMap.value.get(dateStr) ?? null
      cells.push({
        date: month,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,
        entry,
        label: format(month, 'MMMM yyyy'),
        isFuture: false,
      })
      month = addMonths(month, 1)
    }
    return cells
  })

  return { dailyWeeks, monthLabels, startOffset, weeklyCells, monthlyCells }
}
