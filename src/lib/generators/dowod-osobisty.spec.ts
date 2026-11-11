import { describe, expect, it } from 'vitest'
import {
  formatDowodOsobisty,
  generateDowodOsobisty,
  generateDowodyOsobiste,
  validateDowodOsobisty,
} from './dowod-osobisty'
import { sequenceRng } from './sequence-rng'

describe('dowód osobisty', () => {
  it('reproduces ABS123456, whose check digit is the 4th character', () => {
    // A=10, B=11, S=28. The other eight weights sum to 211, and 211 mod 10 = 1.
    const number = generateDowodOsobisty(sequenceRng([0, 1, 18, 2, 3, 4, 5, 6]))
    expect(number).toBe('ABS123456')
    expect(validateDowodOsobisty('abs 123456')).toEqual({
      valid: true,
      number: 'ABS123456',
      formatted: 'ABS 123456',
      series: 'ABS',
    })
    expect(formatDowodOsobisty(number)).toBe('ABS 123456')
  })

  it('accepts the published series ZZC108201', () => {
    // (35×7)+(35×3)+(12×1)+(1×9)+(0×7)+(8×3)+(2×1)+(0×7)+(1×3) = 400.
    expect(validateDowodOsobisty('ZZC108201').valid).toBe(true)
    expect(validateDowodOsobisty('ZZC108202')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('rejects a bad shape before checking the sum', () => {
    expect(validateDowodOsobisty('')).toEqual({ valid: false, error: 'empty' })
    expect(validateDowodOsobisty('ABŚ123456')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(validateDowodOsobisty('AB123456')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateDowodOsobisty('AB1123456')).toEqual({ valid: false, error: 'invalid-format' })
  })

  it('generates numbers that validate, and a one-digit change does not', () => {
    const batch = generateDowodyOsobiste(30)
    expect(new Set(batch).size).toBe(30)
    for (const number of batch) {
      expect(number).toMatch(/^[A-Z]{3}\d{6}$/)
      expect(validateDowodOsobisty(number).valid).toBe(true)
      expect(validateDowodOsobisty(flipChar(number, 3)).valid).toBe(false)
      expect(validateDowodOsobisty(flipChar(number, 0)).valid).toBe(false)
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
