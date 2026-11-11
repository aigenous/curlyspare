import { describe, expect, it } from 'vitest'
import { convertTimeZone, isTimeZone } from './timezone'

describe('time zone conversion', () => {
  it('converts Europe/Warsaw to New York in winter and summer', () => {
    expect(convertTimeZone('2026-01-15', '12:00', 'Europe/Warsaw', 'America/New_York')).toMatchObject({
      ok: true,
      source: { offset: 'UTC+01:00' },
      target: { date: '2026-01-15', time: '06:00', offset: 'UTC-05:00' },
    })
    expect(convertTimeZone('2026-07-15', '12:00', 'Europe/Warsaw', 'America/New_York')).toMatchObject({
      ok: true,
      source: { offset: 'UTC+02:00' },
      target: { time: '06:00', offset: 'UTC-04:00' },
    })
  })

  it('rejects an unknown zone and accepts an IANA name', () => {
    expect(isTimeZone('Europe/Warsaw')).toBe(true)
    expect(isTimeZone('Mars/Olympus')).toBe(false)
    expect(convertTimeZone('2026-01-15', '12:00', 'nie-strefa', 'UTC').ok).toBe(false)
  })
})
