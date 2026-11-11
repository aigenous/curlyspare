import { cryptoRandomInt, type RandomInt } from './random'

export interface CalendarDate {
  year: number
  month: number
  day: number
}

const MS_PER_DAY = 86_400_000

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

export function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28
  }
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31
}

export function isValidDate({ year, month, day }: CalendarDate): boolean {
  return (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    Number.isInteger(day) &&
    month >= 1 &&
    month <= 12 &&
    day >= 1 &&
    day <= daysInMonth(year, month)
  )
}

export function formatIsoDate({ year, month, day }: CalendarDate): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${year.toString().padStart(4, '0')}-${pad(month)}-${pad(day)}`
}

export function formatPolishDate({ year, month, day }: CalendarDate): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(day)}.${pad(month)}.${year}`
}

/** Parses a strict `YYYY-MM-DD` string. Returns null for malformed or impossible dates. */
export function parseIsoDate(value: string): CalendarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }
  return isValidDate(date) ? date : null
}

export function toEpochDay({ year, month, day }: CalendarDate): number {
  return Math.round(Date.UTC(year, month - 1, day) / MS_PER_DAY)
}

export function fromEpochDay(epochDay: number): CalendarDate {
  const date = new Date(epochDay * MS_PER_DAY)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

export function compareDates(left: CalendarDate, right: CalendarDate): number {
  return toEpochDay(left) - toEpochDay(right)
}

/** Uniformly random calendar date in the inclusive range [from, to]. */
export function randomDateBetween(
  from: CalendarDate,
  to: CalendarDate,
  rng: RandomInt = cryptoRandomInt,
): CalendarDate {
  const start = toEpochDay(from)
  const end = toEpochDay(to)
  if (end < start) {
    throw new RangeError('The end date must not be earlier than the start date')
  }
  return fromEpochDay(start + rng(end - start + 1))
}
