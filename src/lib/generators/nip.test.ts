import { describe, expect, it } from 'vitest'
import { NIP_WEIGHTS, formatNip, generateNip, generateNips, validateNip } from './nip'
import { sequenceRng } from './sequence-rng'
import { toDigits, weightedSum } from './validation'

describe('NIP', () => {
  it('reproduces the published vector 5260250274', () => {
    // 5,2,6,0,2,5,0,2,7 weighted by 6,5,7,2,3,4,5,6,7 = 169, and 169 mod 11 = 4.
    const nip = generateNip(sequenceRng([4, 2, 6, 0, 2, 5, 0, 2, 7]))
    expect(nip).toBe('5260250274')
    expect(validateNip('526-025-02-74')).toEqual({
      valid: true,
      nip: '5260250274',
      formatted: '526-025-02-74',
    })
    expect(formatNip('5260250274')).toBe('526-025-02-74')
  })

  it('accepts the hand-computed vector 1234563218', () => {
    // Weights give 118, and 118 mod 11 = 8.
    expect(validateNip('1234563218')).toMatchObject({ valid: true, formatted: '123-456-32-18' })
    expect(validateNip('1234563219')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('rejects every completion of a body whose remainder is 10', () => {
    const body = bodyWithRemainder(10)
    const sum = weightedSum(toDigits(body), NIP_WEIGHTS)
    expect(sum % 11).toBe(10)
    for (let digit = 0; digit <= 9; digit += 1) {
      expect(validateNip(`${body}${digit}`)).toEqual({ valid: false, error: 'invalid-checksum' })
    }
  })

  it('rejects empty, non-digit and wrong-length input', () => {
    expect(validateNip('')).toEqual({ valid: false, error: 'empty' })
    expect(validateNip('526025027A')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(validateNip('526025027')).toEqual({ valid: false, error: 'invalid-length' })
    expect(() => formatNip('526')).toThrow(RangeError)
  })

  it('generates numbers that validate and do not start with zero', () => {
    const batch = generateNips(40)
    expect(new Set(batch).size).toBe(40)
    for (const nip of batch) {
      expect(nip.startsWith('0')).toBe(false)
      expect(validateNip(nip).valid).toBe(true)
      expect(validateNip(flipLast(nip)).valid).toBe(false)
    }
  })
})

function bodyWithRemainder(remainder: number): string {
  const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
  for (let value = 0; value < 1_000_000; value += 1) {
    const body = String(value).padStart(9, '0')
    const sum = [...body].reduce((total, char, index) => total + Number(char) * (weights[index] ?? 0), 0)
    if (sum % 11 === remainder) {
      return body
    }
  }
  throw new Error('no NIP body found')
}

function flipLast(value: string): string {
  const digit = value[value.length - 1] === '0' ? '1' : '0'
  return `${value.slice(0, -1)}${digit}`
}
