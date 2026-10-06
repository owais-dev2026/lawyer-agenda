const LOCALE = 'ar-u-nu-latn'

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function addDays(value: string, days: number): string {
  const date = parseISODate(value)
  date.setDate(date.getDate() + days)
  return toISODate(date)
}

const longDate = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})
const shortDate = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})
const monthYear = new Intl.DateTimeFormat(LOCALE, { month: 'long', year: 'numeric' })

export function formatLongDate(value: string) {
  return longDate.format(parseISODate(value))
}

export function formatShortDate(value: string) {
  return shortDate.format(parseISODate(value))
}

export function formatMonthYear(date: Date) {
  return monthYear.format(date)
}

export function formatTime(value: string) {
  if (!value) return 'بدون وقت'
  const [h, m] = value.split(':').map(Number)
  const period = h < 12 ? 'ص' : 'م'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

export function relativeDayLabel(value: string): string | null {
  const today = todayISO()
  if (value === today) return 'اليوم'
  if (value === addDays(today, 1)) return 'غداً'
  if (value === addDays(today, -1)) return 'أمس'
  return null
}

export const WEEKDAYS_FROM_SATURDAY = [
  'السبت',
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
]
