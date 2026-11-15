import { format, isToday, isTomorrow, isYesterday, parseISO } from 'date-fns'

export function formatDate(value, pattern = 'MMM d, yyyy') {
  if (!value) return '—'
  return format(typeof value === 'string' ? parseISO(value) : value, pattern)
}

export function relativeDay(value) {
  const date = typeof value === 'string' ? parseISO(value) : value
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'EEE, MMM d')
}

export function initials(name = '') {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}
