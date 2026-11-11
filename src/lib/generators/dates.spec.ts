import { describe, expect, it } from 'vitest'
import {
  compareDates,
  formatIsoDate,
  formatPolishDate,
  isLeapYear,
  isValidDate,
  parseIsoDate,
  randomDateBetween,
  toEpochDay,
} from './dates'
import { sequenceRng } from './sequence-rng'

describe('calendar dates', () => {
  it('recognises leap years, including the century exceptions', () => {
    expect(isLeapYear(2000)).toBe(true)
    expect(isLeapYear(1900)).toBe(false)
    expect(isLeapYear(2004)).toBe(true)
    expect(isLeapYear(2100)).toBe(false)
    expect(isValidDate({ year: 1900, month: 2, day: 29 })).toBe(false)
    expect(isValidDate({ year: 2000, month: 2, day: 29 })).toBe(true)
  })

  it('parses only strict, real ISO dates', () => {
    expect(parseIsoDate('1944-05-14')).toEqual({ year: 1944, month: 5, day: 14 })
    expect(parseIsoDate(' 2000-02-29 ')).toEqual({ year: 2000, month: 2, day: 29 })
    expect(parseIsoDate('1900-02-29')).toBeNull()
    expect(parseIsoDate('2020-2-29')).toBeNull()
    expect(parseIsoDate('2020-13-01')).toBeNull()
    expect(parseIsoDate('')).toBeNull()
  })

  it('formats Polish and ISO dates', () => {
    const date = { year: 1944, month: 5, day: 14 }
    expect(formatPolishDate(date)).toBe('14.05.1944')
    expect(formatIsoDate(date)).toBe('1944-05-14')
  })

  it('round-trips epoch days across the Unix epoch', () => {
    expect(toEpochDay({ year: 1970, month: 1, day: 1 })).toBe(0)
    expect(toEpochDay({ year: 1969, month: 12, day: 31 })).toBe(-1)
    expect(compareDates({ year: 1800, month: 1, day: 1 }, { year: 2299, month: 12, day: 31 })).toBeLessThan(0)
  })

  it('draws both endpoints of an inclusive range', () => {
    const from = { year: 2020, month: 2, day: 28 }
    const to = { year: 2020, month: 3, day: 1 }
    expect(randomDateBetween(from, to, sequenceRng([0]))).toEqual(from)
    expect(randomDateBetween(from, to, sequenceRng([2]))).toEqual(to)
    expect(randomDateBetween(from, to, sequenceRng([1]))).toEqual({ year: 2020, month: 2, day: 29 })
  })

  it('rejects a reversed range and stays inside a wide range', () => {
    const from = { year: 1990, month: 1, day: 1 }
    const to = { year: 1989, month: 12, day: 31 }
    expect(() => randomDateBetween(from, to)).toThrow(RangeError)

    const start = { year: 1800, month: 1, day: 1 }
    const end = { year: 2299, month: 12, day: 31 }
    for (let index = 0; index < 50; index += 1) {
      const date = randomDateBetween(start, end)
      expect(isValidDate(date)).toBe(true)
      expect(compareDates(date, start)).toBeGreaterThanOrEqual(0)
      expect(compareDates(date, end)).toBeLessThanOrEqual(0)
    }
  })
})
