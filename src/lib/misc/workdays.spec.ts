import { describe, expect, it } from 'vitest'
import { addWorkingDays, easterSunday, formatIsoDate, polishHolidays, workingDaysBetween } from './workdays'

describe('Polish working days', () => {
  it('places Easter and the holidays that move with it', () => {
    expect(formatIsoDate(easterSunday(2024))).toBe('2024-03-31')
    expect(formatIsoDate(easterSunday(2025))).toBe('2025-04-20')
    expect(formatIsoDate(easterSunday(2026))).toBe('2026-04-05')
    const names = polishHolidays(2026).map((holiday) => `${holiday.date} ${holiday.name}`)
    expect(names).toContain('2026-04-06 Poniedziałek Wielkanocny')
    expect(names).toContain('2026-05-24 Zielone Świątki')
    expect(names).toContain('2026-06-04 Boże Ciało')
    expect(names).toContain('2026-12-24 Wigilia Bożego Narodzenia')
    expect(polishHolidays(2024).some((holiday) => holiday.date === '2024-12-24')).toBe(false)
  })

  it('counts working days after the start date and skips weekends and holidays', () => {
    expect(workingDaysBetween('2026-11-09', '2026-11-13')).toEqual({
      ok: true,
      days: 3,
      holidays: [{ date: '2026-11-11', name: 'Narodowe Święto Niepodległości' }],
    })
    expect(workingDaysBetween('2026-11-13', '2026-11-09').ok).toBe(false)
  })

  it('adds working days across the May holidays', () => {
    expect(addWorkingDays('2026-04-30', 1)).toEqual({ ok: true, date: '2026-05-04' })
    expect(addWorkingDays('2026-05-04', -1)).toEqual({ ok: true, date: '2026-04-30' })
    expect(addWorkingDays('nie-data', 1).ok).toBe(false)
  })
})
