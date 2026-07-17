export type HabitFrequency = 'daily' | 'weekly' | 'monthly'
export type HabitRating = 1 | 2 | 3 | 4 | 5
export type HeatmapTier = 0 | 1 | 2 | 3 | 4 | 5

export interface Habit {
  id: string
  name: string
  emoji: string
  color: string
  frequency: HabitFrequency
  createdAt: string
}

export interface HabitEntry {
  id: string
  habitId: string
  date: string        // YYYY-MM-DD — weekly: Monday; monthly: 1st of month
  rating: HabitRating
  description: string
}

export interface HeatmapCell {
  date: Date
  dateStr: string
  tier: HeatmapTier
  entry: HabitEntry | null
  label: string
  isFuture: boolean
}
