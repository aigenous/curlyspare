import { describe, expect, it } from 'vitest'
import { generateKrs, generateKrsNumbers, validateKrs } from './krs'
import { sequenceRng } from './sequence-rng'

describe('KRS', () => {
  it('generates a 10-digit number, including leading zeros', () => {
    expect(generateKrs(sequenceRng([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe('0123456789')
    expect(validateKrs('0000 123 456')).toEqual({ valid: true, krs: '0000123456' })
    expect(validateKrs('0000000000')).toEqual({ valid: true, krs: '0000000000' })
  })

  it('checks the format only', () => {
    expect(validateKrs('')).toEqual({ valid: false, error: 'empty' })
    expect(validateKrs('000012345')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateKrs('000012345A')).toEqual({ valid: false, error: 'invalid-characters' })
  })

  it('generates distinct numbers that validate', () => {
    const batch = generateKrsNumbers(20)
    expect(new Set(batch).size).toBe(20)
    for (const krs of batch) {
      expect(krs).toMatch(/^\d{10}$/)
      expect(validateKrs(krs).valid).toBe(true)
    }
  })
})
