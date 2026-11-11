import { describe, expect, it } from 'vitest'
import {
  formatPaszport,
  generatePaszport,
  generatePaszporty,
  validatePaszport,
} from './paszport'
import { sequenceRng } from './sequence-rng'

describe('paszport', () => {
  it('reproduces AA3234567, whose check digit is the 3rd character', () => {
    // Weights 7,3,9,1,7,3,1,7,3 give 230, which is divisible by 10.
    const number = generatePaszport(sequenceRng([0, 0, 2, 3, 4, 5, 6, 7]))
    expect(number).toBe('AA3234567')
    expect(validatePaszport('aa 3234567')).toEqual({
      valid: true,
      number: 'AA3234567',
      formatted: 'AA 3234567',
      series: 'AA',
    })
    expect(formatPaszport(number)).toBe('AA 3234567')
    expect(validatePaszport('AA3234568')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('reproduces AB4123456 from the weight table without the check position', () => {
    // A=10, B=11 and digits 123456 weigh 184, and 184 mod 10 = 4.
    expect(validatePaszport('AB4123456').valid).toBe(true)
    expect(validatePaszport('AB-4123456').valid).toBe(true)
  })

  it('rejects a bad shape before checking the sum', () => {
    expect(validatePaszport(' ')).toEqual({ valid: false, error: 'empty' })
    expect(validatePaszport('A13234567')).toEqual({ valid: false, error: 'invalid-format' })
    expect(validatePaszport('AA323456')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validatePaszport('AĄ3234567')).toEqual({ valid: false, error: 'invalid-characters' })
  })

  it('generates numbers that validate, and a one-character change does not', () => {
    const batch = generatePaszporty(30)
    expect(new Set(batch).size).toBe(30)
    for (const number of batch) {
      expect(number).toMatch(/^[A-Z]{2}\d{7}$/)
      expect(validatePaszport(number).valid).toBe(true)
      expect(validatePaszport(flipChar(number, 2)).valid).toBe(false)
      expect(validatePaszport(flipChar(number, 8)).valid).toBe(false)
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
