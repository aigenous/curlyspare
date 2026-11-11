import { parseIsoDate, type CalendarDate } from './workdays'

export interface DateSpan {
  years: number
  months: number
  days: number
  totalDays: number
  words: string
}

export function dateSpan(
  fromText: string,
  toText: string,
): { ok: true; span: DateSpan } | { ok: false; error: string } {
  const from = parseIsoDate(fromText)
  const to = parseIsoDate(toText)
  if (!from || !to) return { ok: false, error: 'Podaj obie daty w formacie RRRR-MM-DD.' }
  const forward = compare(to, from) >= 0
  const start = forward ? from : to
  const end = forward ? to : from
  const parts = calendarSpan(start, end)
  const totalDays = dayNumber(end) - dayNumber(start)
  return {
    ok: true,
    span: { ...parts, totalDays, words: spanWords(parts, totalDays, forward) },
  }
}

function calendarSpan(start: CalendarDate, end: CalendarDate): Pick<DateSpan, 'years' | 'months' | 'days'> {
  let cursor = start
  let years = 0
  while (compare(addYears(cursor, 1), end) <= 0) {
    cursor = addYears(cursor, 1)
    years += 1
  }
  let months = 0
  while (compare(addMonths(cursor, 1), end) <= 0) {
    cursor = addMonths(cursor, 1)
    months += 1
  }
  return { years, months, days: dayNumber(end) - dayNumber(cursor) }
}

function spanWords(parts: Pick<DateSpan, 'years' | 'months' | 'days'>, totalDays: number, forward: boolean): string {
  const phrase = `${count(parts.years, ['rok', 'lata', 'lat'])}, ${count(parts.months, ['miesiąc', 'miesiące', 'miesięcy'])} i ${count(parts.days, ['dzień', 'dni', 'dni'])}`
  const direction = forward ? phrase : `data początkowa jest później o ${phrase}`
  return `${direction} (${totalDays} ${count(totalDays, ['dzień', 'dni', 'dni']).split(' ').slice(1).join(' ') || 'dni'})`
}

function count(value: number, forms: [string, string, string]): string {
  return `${value} ${form(value, forms)}`
}

function form(value: number, forms: [string, string, string]): string {
  const tail = value % 100
  if (tail < 12 || tail > 14) {
    const last = value % 10
    if (last === 1) return forms[0]
    if (last >= 2 && last <= 4) return forms[1]
  }
  return forms[2]
}

function addYears(date: CalendarDate, years: number): CalendarDate {
  return addMonths(date, years * 12)
}

function addMonths(date: CalendarDate, months: number): CalendarDate {
  const index = date.month - 1 + months
  const year = date.year + Math.floor(index / 12)
  const month = ((index % 12) + 12) % 12 + 1
  const day = Math.min(date.day, daysInMonth(year, month))
  return { year, month, day }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function dayNumber(date: CalendarDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86_400_000)
}

function compare(left: CalendarDate, right: CalendarDate): number {
  return left.year - right.year || left.month - right.month || left.day - right.day
}

