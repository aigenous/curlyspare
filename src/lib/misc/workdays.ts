export interface CalendarDate {
  year: number
  month: number
  day: number
}

export interface Holiday {
  date: string
  name: string
}

const fixedHolidays: { month: number; day: number; name: string; fromYear?: number }[] = [
  { month: 1, day: 1, name: 'Nowy Rok' },
  { month: 1, day: 6, name: 'Trzech Króli' },
  { month: 5, day: 1, name: 'Święto Pracy' },
  { month: 5, day: 3, name: 'Święto Konstytucji 3 Maja' },
  { month: 8, day: 15, name: 'Wniebowzięcie Najświętszej Maryi Panny' },
  { month: 11, day: 1, name: 'Wszystkich Świętych' },
  { month: 11, day: 11, name: 'Narodowe Święto Niepodległości' },
  { month: 12, day: 24, name: 'Wigilia Bożego Narodzenia', fromYear: 2025 },
  { month: 12, day: 25, name: 'Boże Narodzenie' },
  { month: 12, day: 26, name: 'Drugi dzień Bożego Narodzenia' },
]

export function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null
  return { year, month, day }
}

export function formatIsoDate(date: CalendarDate): string {
  return `${date.year}-${pad(date.month)}-${pad(date.day)}`
}

export function easterSunday(year: number): CalendarDate {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return { year, month, day }
}

export function polishHolidays(year: number): Holiday[] {
  const easter = easterSunday(year)
  const movable = [
    { date: easter, name: 'Niedziela Wielkanocna' },
    { date: addCalendarDays(easter, 1), name: 'Poniedziałek Wielkanocny' },
    { date: addCalendarDays(easter, 49), name: 'Zielone Świątki' },
    { date: addCalendarDays(easter, 60), name: 'Boże Ciało' },
  ]
  const fixed = fixedHolidays
    .filter((holiday) => year >= (holiday.fromYear ?? 0))
    .map((holiday) => ({ date: { year, month: holiday.month, day: holiday.day }, name: holiday.name }))
  return [...fixed, ...movable]
    .sort((left, right) => compareDates(left.date, right.date))
    .map((holiday) => ({ date: formatIsoDate(holiday.date), name: holiday.name }))
}

export function isWeekend(date: CalendarDate): boolean {
  const weekday = new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()
  return weekday === 0 || weekday === 6
}

export function isWorkingDay(date: CalendarDate): boolean {
  if (isWeekend(date)) return false
  return !polishHolidays(date.year).some((holiday) => holiday.date === formatIsoDate(date))
}

export function workingDaysBetween(
  fromText: string,
  toText: string,
): { ok: true; days: number; holidays: Holiday[] } | { ok: false; error: string } {
  const from = parseIsoDate(fromText)
  const to = parseIsoDate(toText)
  if (!from || !to) return { ok: false, error: 'Podaj obie daty w formacie RRRR-MM-DD.' }
  if (compareDates(to, from) < 0) return { ok: false, error: 'Data końcowa jest wcześniejsza niż początkowa.' }
  const span = Math.abs(dayNumber(to) - dayNumber(from))
  if (span > 366 * 50) return { ok: false, error: 'Zakres może mieć najwyżej 50 lat.' }
  let days = 0
  const holidays: Holiday[] = []
  for (let cursor = addCalendarDays(from, 1); compareDates(cursor, to) <= 0; cursor = addCalendarDays(cursor, 1)) {
    const holiday = holidayOn(cursor)
    if (holiday) holidays.push(holiday)
    if (isWorkingDay(cursor)) days += 1
  }
  return { ok: true, days, holidays }
}

export function addWorkingDays(
  fromText: string,
  count: number,
): { ok: true; date: string } | { ok: false; error: string } {
  const from = parseIsoDate(fromText)
  if (!from) return { ok: false, error: 'Podaj datę w formacie RRRR-MM-DD.' }
  if (!Number.isInteger(count) || count < -10000 || count > 10000) {
    return { ok: false, error: 'Liczba dni roboczych musi być całkowita, od -10000 do 10000.' }
  }
  const step = count < 0 ? -1 : 1
  let left = Math.abs(count)
  let cursor = from
  let guard = 0
  while (left > 0 && guard < 40000) {
    cursor = addCalendarDays(cursor, step)
    if (isWorkingDay(cursor)) left -= 1
    guard += 1
  }
  return { ok: true, date: formatIsoDate(cursor) }
}

function holidayOn(date: CalendarDate): Holiday | undefined {
  const iso = formatIsoDate(date)
  return polishHolidays(date.year).find((holiday) => holiday.date === iso)
}

export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + days))
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() }
}

function compareDates(left: CalendarDate, right: CalendarDate): number {
  return left.year - right.year || left.month - right.month || left.day - right.day
}

function dayNumber(date: CalendarDate): number {
  return Math.floor(Date.UTC(date.year, date.month - 1, date.day) / 86_400_000)
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}
