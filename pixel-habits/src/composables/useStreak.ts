/**
 * Streak Calculation Composable
 *
 * Calculates two metrics for each habit:
 * 1. currentStreak: How many consecutive periods (days/weeks/months) ending today/this-period
 * 2. longestStreak: Maximum consecutive periods across entire habit history
 *
 * Frequency-aware:
 * - daily: Consecutive calendar days (e.g., Jan 1, Jan 2, Jan 3 = 3-day streak)
 * - weekly: Consecutive weeks starting Monday (e.g., Week 1, Week 2, Week 3 = 3-week streak)
 * - monthly: Consecutive months (e.g., Jan, Feb, Mar = 3-month streak)
 *
 * Algorithm uses entryDateSet for O(1) lookups. All dates are YYYY-MM-DD strings.
 *
 * Examples:
 * - If daily habit has entries for [Jan1, Jan2, Jan3, Jan5, Jan6]
 *   → currentStreak = 1 (only Jan3, Jan2 broken by missing Jan4)
 *   → longestStreak = 3 (Jan1-3 chain)
 *
 * - If weekly habit has entries for 5 consecutive Mondays
 *   → currentStreak = 5 (continuing through this week)
 *   → longestStreak = 5 (best run so far)
 */

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
  /**
   * Set of all entry dates for this habit.
   * Example: { '2025-01-01', '2025-01-02', '2025-01-05', ... }
   * Used for O(1) lookups: `entryDateSet.has('2025-01-01')` is fast.
   */
  const entryDateSet = computed(() => new Set(entries.value.map((e) => e.date)))

  /**
   * Current streak: consecutive periods ending today (or this week/month).
   * Returns 0 if today has no entry (daily) or this period has no entry.
   * Checks up to 366 days back (1 year + leap days), 104 weeks, or 60 months.
   *
   * Algorithm for daily:
   * 1. Check if today has entry → start from today
   * 2. If not, start from yesterday
   * 3. Count backwards while each day has an entry
   * 4. Stop at first gap
   * Example: entries [5, 4, 3, 2, X, X] → currentStreak = 1 (day 5 only)
   */
  const currentStreak = computed<number>(() => {
    const today = new Date()

    if (frequency.value === 'daily') {
      const todayStr = format(today, 'yyyy-MM-dd')
      // If today has entry, start from today; else start from yesterday
      let check = entryDateSet.value.has(todayStr) ? today : subDays(today, 1)
      let streak = 0

      // Count consecutive days going backwards
      for (let i = 0; i < 366; i++) {
        if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
          streak++
          check = subDays(check, 1)  // Go back one day
        } else {
          break  // Gap found; streak ends
        }
      }
      return streak
    }

    if (frequency.value === 'weekly') {
      // Same logic but for weeks (Monday-based)
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })
      const thisWeekStr = format(thisWeekStart, 'yyyy-MM-dd')
      let check = entryDateSet.value.has(thisWeekStr) ? thisWeekStart : subWeeks(thisWeekStart, 1)
      let streak = 0

      for (let i = 0; i < 104; i++) {
        if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
          streak++
          check = subWeeks(check, 1)  // Go back one week
        } else {
          break
        }
      }
      return streak
    }

    // Same logic but for months
    const thisMonthStart = startOfMonth(today)
    const thisMonthStr = format(thisMonthStart, 'yyyy-MM-dd')
    let check = entryDateSet.value.has(thisMonthStr) ? thisMonthStart : subMonths(thisMonthStart, 1)
    let streak = 0

    for (let i = 0; i < 60; i++) {
      if (entryDateSet.value.has(format(check, 'yyyy-MM-dd'))) {
        streak++
        check = subMonths(check, 1)  // Go back one month
      } else {
        break
      }
    }
    return streak
  })

  /**
   * Longest streak: maximum consecutive periods found anywhere in habit history.
   * Scans all entries sorted by date and finds the longest gap-free sequence.
   *
   * Algorithm:
   * 1. Sort all entry dates chronologically
   * 2. Iterate through, checking if each date is consecutive to previous
   * 3. If consecutive: increment current streak, update longest if needed
   * 4. If gap: reset current to 1, continue
   *
   * Example (daily):
   * Dates: [Jan1, Jan2, Jan3, Jan5, Jan6, Jan7, Jan8]
   * → Longest streak is 4 (Jan5-8), not 3 (Jan1-3)
   *
   * Example (weekly):
   * Dates: [Mon1, Mon8, Mon15, Mon22, Mon50]  (7 days apart = consecutive weeks)
   * → First run: Mon1-22 = 4 weeks
   * → Gap at Mon50 = only 1 week
   * → Longest = 4
   */
  const longestStreak = computed<number>(() => {
    const dates = [...entryDateSet.value].sort()  // Sort chronologically
    if (dates.length === 0) return 0  // No entries

    let longest = 1  // Best streak found so far
    let current = 1  // Current streak being evaluated

    for (let i = 1; i < dates.length; i++) {
      const prev = parseISO(dates[i - 1]!)
      const curr = parseISO(dates[i]!)
      const diffMs = curr.getTime() - prev.getTime()
      const diffDays = Math.round(diffMs / 86400000)  // Convert ms to days

      // Check if current and previous are consecutive (depends on frequency)
      let consecutive = false
      if (frequency.value === 'daily') {
        consecutive = diffDays === 1  // Exactly 1 day apart
      } else if (frequency.value === 'weekly') {
        consecutive = diffDays === 7  // Exactly 7 days apart (1 week)
      } else {
        // For monthly, compare year + month
        const monthDiff =
          (curr.getFullYear() - prev.getFullYear()) * 12 + (curr.getMonth() - prev.getMonth())
        consecutive = monthDiff === 1  // Exactly 1 month apart
      }

      if (consecutive) {
        // Continue the streak
        current++
        if (current > longest) longest = current  // Update best if this is new best
      } else {
        // Gap found; reset to 1 and continue searching
        current = 1
      }
    }

    return longest
  })

  return { currentStreak, longestStreak }
}

