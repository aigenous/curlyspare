import { describe, expect, it } from 'vitest'
import {
  formatIdCardNumber,
  generateIdCardNumber,
  generateIdCardNumbers,
  validateIdCardNumber,
} from './id-card'
import { sequenceRng } from './sequence-rng'

describe('identity card', () => {
  it('reproduces ABS123456, whose check digit is the 4th character', () => {
    // A=10, B=11, S=28. The other eight weights sum to 211, and 211 mod 10 = 1.
    const number = generateIdCardNumber(sequenceRng([0, 1, 18, 2, 3, 4, 5, 6]))
    expect(number).toBe('ABS123456')
    expect(validateIdCardNumber('abs 123456')).toEqual({
      valid: true,
      number: 'ABS123456',
      formatted: 'ABS 123456',
      series: 'ABS',
    })
    expect(formatIdCardNumber(number)).toBe('ABS 123456')
  })

  it('accepts the published series ZZC108201', () => {
    // (35×7)+(35×3)+(12×1)+(1×9)+(0×7)+(8×3)+(2×1)+(0×7)+(1×3) = 400.
    expect(validateIdCardNumber('ZZC108201').valid).toBe(true)
    expect(validateIdCardNumber('ZZC108202')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('rejects a bad shape before checking the sum', () => {
    expect(validateIdCardNumber('')).toEqual({ valid: false, error: 'empty' })
    expect(validateIdCardNumber('ABŚ123456')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(validateIdCardNumber('AB123456')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateIdCardNumber('AB1123456')).toEqual({ valid: false, error: 'invalid-format' })
  })

  it('generates numbers that validate, and a one-digit change does not', () => {
    const batch = generateIdCardNumbers(30)
    expect(new Set(batch).size).toBe(30)
    for (const number of batch) {
      expect(number).toMatch(/^[A-Z]{3}\d{6}$/)
      expect(validateIdCardNumber(number).valid).toBe(true)
      expect(validateIdCardNumber(flipChar(number, 3)).valid).toBe(false)
      expect(validateIdCardNumber(flipChar(number, 0)).valid).toBe(false)
    }
  })
})

function flipChar(value: string, index: number): string {
  const chars = [...value]
  const current = chars[index]
  if (current === undefined) {
    throw new Error('index out of range')
  }
  chars[index] = current === 'Z' || current === '9' ? '0' : String.fromCharCode(current.charCodeAt(0) + 1)
  return chars.join('')
}
