import { describe, expect, it } from 'vitest'
import { calculateVat } from './vat'

describe('VAT calculator', () => {
  it('adds 23, 8, 5, and 0 percent to a net amount', () => {
    expect(calculateVat('100', 23, 'net').ok && calculateVat('100', 23, 'net')).toEqual({
      ok: true,
      breakdown: { net: '100,00', vat: '23,00', gross: '123,00' },
    })
    expect(calculateVat('10', 8, 'net')).toMatchObject({ breakdown: { vat: '0,80', gross: '10,80' } })
    expect(calculateVat('10', 5, 'net')).toMatchObject({ breakdown: { vat: '0,50', gross: '10,50' } })
    expect(calculateVat('50', 0, 'net')).toMatchObject({ breakdown: { net: '50,00', vat: '0,00', gross: '50,00' } })
  })

  it('extracts net and VAT from a gross amount, rounding half up to grosze', () => {
    expect(calculateVat('100,00', 23, 'gross')).toEqual({
      ok: true,
      breakdown: { net: '81,30', vat: '18,70', gross: '100,00' },
    })
    expect(calculateVat('1 234,56', 8, 'gross').ok).toBe(true)
  })

  it('rejects a negative or empty amount', () => {
    expect(calculateVat('-1', 23, 'net').ok).toBe(false)
    expect(calculateVat(' ', 23, 'gross').ok).toBe(false)
  })
})
