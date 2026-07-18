/**
 * Heatmap Grid Generator Composable
 *
 * Generates grid structures for GitHub-style contribution heatmaps.
 * Supports three frequency types with different grid layouts:
 * - daily: 365-day grid (52 weeks × 7 days), similar to GitHub contribution graph
 * - weekly: Linear strip of 52 weeks in current year
 * - monthly: 12-cell grid (one per month)
 *
 * Input: reactive refs for habit frequency and its entries
 * Output: computed grids ready for rendering by HabitHeatmap component
 *
 * All dates are in YYYY-MM-DD format (standard ISO 8601).
 * Tiers: 0=empty, 1-5=intensity based on entry rating.
 */

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

/**
 * Convert entry rating (1-5) to heatmap tier (1-5).
 * Clamps to valid range; used for color calculation.
 */
function ratingToTier(rating: number): HeatmapTier {
  return Math.min(5, Math.max(1, rating)) as HeatmapTier
}

/**
 * @param frequency - reactive ref to habit frequency ('daily' | 'weekly' | 'monthly')
 * @param entries - reactive ref to all entries for this habit
 * @returns computed grid structures (dailyWeeks, weeklyCells, monthlyCells, etc.)
 */
export function useHeatmap(frequency: Ref<HabitFrequency>, entries: Ref<HabitEntry[]>) {
  const today = new Date()
  const yearStart = startOfYear(today)  // Jan 1 of current year

  /**
   * Map entries by date for O(1) lookup.
   * Example: { '2025-01-15': HabitEntry, '2025-01-20': HabitEntry }
   * Computed so it updates whenever entries.value changes.
   */
  const entryMap = computed(() => {
    const map = new Map<string, HabitEntry>()
    for (const e of entries.value) map.set(e.date, e)
    return map
  })

  // ──────────────────────────────────────────────────────────────────────────────────────
  // DAILY: 365-day GitHub-style grid (52 weeks × 7 days)
  // ──────────────────────────────────────────────────────────────────────────────────────

  /**
   * How many empty cells to add at the start of the first row.
   * Example: If Jan 1 is Wednesday (day 3), add 3 null cells to align properly.
   * This ensures Sunday is always in column 0, Monday in column 1, etc.
   */
  const startOffset = computed(() => getDay(yearStart))  // 0=Sunday, 6=Saturday

  /**
   * All days from Jan 1 to today, converted to HeatmapCell objects.
   * Each cell has tier (0-5 based on entry rating) and entry data for tooltips.
   */
  const dailyCells = computed<HeatmapCell[]>(() => {
    const days = eachDayOfInterval({ start: yearStart, end: today })
    return days.map((date) => {
      const dateStr = format(date, 'yyyy-MM-dd')
      const entry = entryMap.value.get(dateStr) ?? null  // null if user hasn't marked this day
      return {
        date,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,  // 0=empty (gray), 1-5=colored
        entry,  // Full entry data (rating, description) for tooltip/detail dialog
        label: format(date, 'MMM d, yyyy'),  // Human-readable date for tooltip
        isFuture: false,
      }
    })
  })

  /**
   * Group dailyCells into weeks (7-day rows).
   * Structure: [ [Sun, Mon, Tue, Wed, Thu, Fri, Sat], [Sun, Mon, ...], ... ]
   * Null cells: used for alignment (startOffset) and padding last week.
   * Example structure:
   *   Week 1: [null, null, null, Jan1, Jan2, Jan3, Jan4]  (Jan 1 is Wed)
   *   Week 2: [Jan5, Jan6, Jan7, Jan8, Jan9, Jan10, Jan11]
   *   ...
   * HabitHeatmap renders each week as a column, each day as a cell.
   */
  const dailyWeeks = computed<(HeatmapCell | null)[][]>(() => {
    // Prepend null cells for startOffset, then flatten all days into single array
    const alignmentNulls: (HeatmapCell | null)[] = Array.from({ length: startOffset.value }, () => null)
    const cells: (HeatmapCell | null)[] = [
      ...alignmentNulls,  // Alignment nulls
      ...dailyCells.value,
    ]

    // Split into 7-day chunks (weeks), padding last week with nulls
    const result: (HeatmapCell | null)[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      const week = cells.slice(i, i + 7)
      while (week.length < 7) week.push(null)  // Pad last week to 7 cells
      result.push(week)
    }
    return result
  })

  /**
   * Month labels ("Jan", "Feb", etc.) positioned at the correct column.
   * Used to render month names above the daily grid.
   * Example: If Feb 1 falls in week 5, column = 5, so label appears above week 5.
   */
  const monthLabels = computed<{ name: string; column: number; span: number }[]>(() => {
    const labels: { name: string; column: number }[] = []
    for (let m = 0; m < 12; m++) {
      const firstDay = new Date(today.getFullYear(), m, 1)
      if (isAfter(firstDay, today)) break  // Skip months after today

      // Calculate which week column this month starts in
      const dayIndex = differenceInCalendarDays(firstDay, yearStart)  // Days since Jan 1
      const column = Math.floor((dayIndex + startOffset.value) / 7) + 1  // Which week?
      labels.push({ name: format(firstDay, 'MMM'), column })
    }

    // Span = number of week-columns this month occupies, so the label can be centered over them
    const totalWeeks = dailyWeeks.value.length
    return labels.map((label, i) => {
      const nextColumn = i < labels.length - 1 ? labels[i + 1]!.column : totalWeeks + 1
      return { ...label, span: nextColumn - label.column }
    })
  })

  // ──────────────────────────────────────────────────────────────────────────────────────
  // WEEKLY: Linear strip of 52 weeks (one cell per week)
  // ──────────────────────────────────────────────────────────────────────────────────────

  /**
   * One cell per week (52 weeks this year).
   * Linear layout: renders as a single row of cells.
   * Example: Cell 1 = Jan 1-7, Cell 2 = Jan 8-14, ..., Cell 52 = Dec 23-29
   * Note: Uses Monday (weekStartsOn: 1) as week start for consistency with GitHub.
   */
  const weeklyCells = computed<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = []
    let week = startOfWeek(yearStart, { weekStartsOn: 1 })  // Monday-based weeks

    while (!isAfter(week, today)) {
      const dateStr = format(week, 'yyyy-MM-dd')  // Use Monday date as identifier
      const entry = entryMap.value.get(dateStr) ?? null  // Look up entry by week start
      const weekEnd = endOfWeek(week, { weekStartsOn: 1 })

      cells.push({
        date: week,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,  // Rating is per week, not daily
        entry,
        label: `${format(week, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`,  // Week range
        isFuture: false,
      })
      week = addWeeks(week, 1)  // Next week
    }
    return cells
  })

  // ──────────────────────────────────────────────────────────────────────────────────────
  // MONTHLY: 12-cell grid (one per month)
  // ──────────────────────────────────────────────────────────────────────────────────────

  /**
   * One cell per month (12 total, or fewer if we're before December).
   * Grid layout: 4×3 or similar, rendered by HabitHeatmap component.
   * Example: Cell 1 = January, Cell 2 = February, ..., Cell 12 = December
   */
  const monthlyCells = computed<HeatmapCell[]>(() => {
    const cells: HeatmapCell[] = []
    let month = startOfMonth(yearStart)  // Jan 1

    while (!isAfter(month, today) && isSameYear(month, today)) {
      const dateStr = format(month, 'yyyy-MM-dd')  // First day of month
      const entry = entryMap.value.get(dateStr) ?? null  // Look up entry by month start

      cells.push({
        date: month,
        dateStr,
        tier: entry ? ratingToTier(entry.rating) : 0,  // Rating is per month, not daily
        entry,
        label: format(month, 'MMMM yyyy'),  // "January 2025"
        isFuture: false,
      })
      month = addMonths(month, 1)  // Next month
    }
    return cells
  })

  return { dailyWeeks, monthLabels, startOffset, weeklyCells, monthlyCells }
}
