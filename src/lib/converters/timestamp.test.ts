import { describe, expect, it } from 'vitest'
import { currentUnixView, unixToZoned, zonedToUnix } from './timestamp'

describe('unix timestamps', () => {
  it('converts the epoch to Europe/Warsaw', () => {
    const view = unixToZoned('0')
    expect(view.ok).toBe(true)
    if (!view.ok) return
    expect(view.value.isoUtc).toBe('1970-01-01T00:00:00.000Z')
    expect(view.value.parts).toMatchObject({ year: 1970, month: 1, day: 1, hour: 1, minute: 0, second: 0 })
    expect(view.value.timeZone).toBe('Europe/Warsaw')
    expect(view.value.local).toContain('1970')
  })

  it('treats a 13-digit value as milliseconds and a fraction as seconds', () => {
    const millis = unixToZoned('1700000000123')
    const seconds = unixToZoned('1700000000.5', { unit: 'seconds' })
    expect(millis.ok && millis.value.milliseconds).toBe(1700000000123)
    expect(seconds.ok && seconds.value.milliseconds).toBe(1700000000500)
  })

  it('interprets winter and summer wall time in Warsaw', () => {
    const winter = zonedToUnix('2024-01-15 12:00:00')
    const summer = zonedToUnix('2024-07-15T12:00:00')
    const midnight = zonedToUnix('2024-01-15 00:00:00')
    expect(winter.ok && winter.value.isoUtc).toBe('2024-01-15T11:00:00.000Z')
    expect(summer.ok && summer.value.isoUtc).toBe('2024-07-15T10:00:00.000Z')
    expect(midnight.ok && midnight.value.isoUtc).toBe('2024-01-14T23:00:00.000Z')
  })

  it('rejects a daylight-saving gap and picks the earlier overlap', () => {
    expect(zonedToUnix('2024-03-31 02:30:00').ok).toBe(false)
    const overlap = zonedToUnix('2024-10-27 02:30:00')
    expect(overlap.ok && overlap.value.ambiguous).toBe(true)
    expect(overlap.ok && overlap.value.isoUtc).toBe('2024-10-27T00:30:00.000Z')
  })

  it('keeps an explicit offset and displays it in the selected zone', () => {
    const view = zonedToUnix('2024-01-15T11:00:00Z')
    expect(view.ok && view.value.isoUtc).toBe('2024-01-15T11:00:00.000Z')
    expect(view.ok && view.value.parts.hour).toBe(12)
  })

  it('round-trips a zoned date and rejects bad input', () => {
    const forward = zonedToUnix('2024-05-02 08:15:30', { timeZone: 'UTC' })
    expect(forward.ok).toBe(true)
    if (!forward.ok) return
    const back = unixToZoned(String(forward.value.seconds), { timeZone: 'UTC', unit: 'seconds' })
    expect(back.ok && back.value.parts).toMatchObject({ year: 2024, month: 5, day: 2, hour: 8, minute: 15, second: 30 })
    expect(zonedToUnix('2024-02-31').ok).toBe(false)
    expect(unixToZoned('nope').ok).toBe(false)
    expect(zonedToUnix('2024-01-01', { timeZone: 'Not/AZone' }).ok).toBe(false)
  })

  it('reads the current instant', () => {
    const before = Date.now()
    const view = currentUnixView('UTC')
    const after = Date.now()
    expect(view.ok).toBe(true)
    if (!view.ok) return
    expect(view.value.milliseconds).toBeGreaterThanOrEqual(before)
    expect(view.value.milliseconds).toBeLessThanOrEqual(after)
  })
})
