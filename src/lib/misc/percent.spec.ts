import { describe, expect, it } from 'vitest'
import { adjustPercent, percentChange, percentOf, ratioPercent } from './percent'

describe('percentages', () => {
  it('finds a share, a ratio, a change, and an adjusted value', () => {
    expect(percentOf('20', '150')).toEqual({ ok: true, text: '30' })
    expect(ratioPercent('30', '150')).toEqual({ ok: true, text: '20' })
    expect(percentChange('80', '100')).toEqual({ ok: true, text: '25' })
    expect(percentChange('100', '80')).toEqual({ ok: true, text: '-20' })
    expect(adjustPercent('200', '10', 'add')).toEqual({ ok: true, text: '220' })
    expect(adjustPercent('200', '10', 'subtract')).toEqual({ ok: true, text: '180' })
  })

  it('rejects division by zero and blank input', () => {
    expect(ratioPercent('1', '0').ok).toBe(false)
    expect(percentChange('0', '5').ok).toBe(false)
    expect(percentOf('', '1').ok).toBe(false)
  })
})