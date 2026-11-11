import { describe, expect, it } from 'vitest'
import { generateGtin, generateGtins, validateGtin } from './gtin'
import { sequenceRng } from './sequence-rng'

describe('EAN and GTIN', () => {
  it('accepts the published EAN-13, EAN-8 and UPC-A vectors', () => {
    expect(validateGtin('5901234123457')).toEqual({
      valid: true,
      gtin: '5901234123457',
      length: 13,
      kind: 'EAN-13',
    })
    expect(validateGtin('96385074')).toMatchObject({ valid: true, length: 8, kind: 'EAN-8' })
    expect(validateGtin('036000291452')).toMatchObject({ valid: true, length: 12, kind: 'UPC-A' })
    expect(validateGtin('5901234123458')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('accepts a hand-computed GTIN-14', () => {
    // Body 1234567890123, weights 3,1 from the left, sum 109, check digit 1.
    expect(validateGtin('12345678901231')).toEqual({
      valid: true,
      gtin: '12345678901231',
      length: 14,
      kind: 'GTIN-14',
    })
    expect(validateGtin('1-234567-890123-1').valid).toBe(true)
  })

  it('rejects the wrong length and non-digits', () => {
    expect(validateGtin('')).toEqual({ valid: false, error: 'empty' })
    expect(validateGtin('59012341234')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateGtin('590123412345A')).toEqual({ valid: false, error: 'invalid-characters' })
  })

  it('generates numbers that validate for each length', () => {
    expect(generateGtin(13, sequenceRng([5, 9, 0, 1, 2, 3, 4, 1, 2, 3, 4, 5]))).toBe('5901234123457')
    for (const length of [8, 13, 14] as const) {
      const batch = generateGtins(15, length)
      expect(new Set(batch).size).toBe(15)
      for (const value of batch) {
        expect(validateGtin(value)).toMatchObject({ valid: true, length })
        expect(validateGtin(flip(value)).valid).toBe(false)
      }
    }
  })
})

function flip(value: string): string {
  const last = value[value.length - 1] === '0' ? '1' : '0'
  return `${value.slice(0, -1)}${last}`
}
