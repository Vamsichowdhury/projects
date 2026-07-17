import { format, parseISO, isToday, isYesterday } from 'date-fns'

export function getTodayStr(): string {
  return format(new Date(), 'yyyy-MM-dd')
}

export function formatDisplayDate(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return 'Today'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEEE, MMMM d, yyyy')
}

export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d, yyyy')
}
