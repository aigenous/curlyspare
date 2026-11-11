import { describe, expect, it } from 'vitest'
import { dateSpan } from './dates'

describe('date span and age', () => {
  it('breaks a span into years, months, and days, clamping short months', () => {
    expect(dateSpan('2000-02-29', '2001-02-28').ok && dateSpan('2000-02-29', '2001-02-28')).toMatchObject({
      ok: true,
      span: { years: 1, months: 0, days: 0, totalDays: 365 },
    })
    const span = dateSpan('2000-01-31', '2000-03-01')
    expect(span.ok && span.span).toMatchObject({ years: 0, months: 1, days: 1, totalDays: 30 })
    expect(dateSpan('2020-01-01', '2020-01-01').ok && dateSpan('2020-01-01', '2020-01-01')).toMatchObject({
      span: { years: 0, months: 0, days: 0, totalDays: 0 },
    })
  })

  it('states an age in Polish and notices a reversed range', () => {
    const age = dateSpan('1990-05-15', '2026-11-11')
    expect(age.ok && age.span.words).toBe('36 lat, 5 miesięcy i 27 dni (13329 dni)')
    const reversed = dateSpan('2026-11-11', '1990-05-15')
    expect(reversed.ok && reversed.span.words.startsWith('data początkowa jest później')).toBe(true)
    expect(dateSpan('2026-13-01', '2026-11-11').ok).toBe(false)
  })
})
