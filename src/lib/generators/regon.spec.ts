import { describe, expect, it } from 'vitest'
import { REGON14_WEIGHTS, REGON9_WEIGHTS, generateRegon, generateRegons, validateRegon } from './regon'
import { sequenceRng } from './sequence-rng'
import { toDigits, weightedSum } from './validation'

describe('REGON', () => {
  it('reproduces the published 9-digit vector 000002217', () => {
    // Non-zero products: 2×5 + 2×6 + 1×7 = 29, and 29 mod 11 = 7.
    expect(generateRegon(9, sequenceRng([0, 0, 0, 0, 0, 2, 2, 1]))).toBe('000002217')
    expect(validateRegon('000-002-217')).toEqual({
      valid: true,
      regon: '000002217',
      length: 9,
      entityRegon: '000002217',
    })
    expect(validateRegon('000002218')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('builds the 14-digit extension 00000221700018', () => {
    // First 13 digits weighted by 2,4,8,5,0,9,7,3,6,1,2,4,8 sum to 85, and 85 mod 11 = 8.
    const regon = generateRegon(14, sequenceRng([0, 0, 0, 0, 0, 2, 2, 1, 0, 0, 0, 1]))
    expect(regon).toBe('00000221700018')
    expect(validateRegon(regon)).toEqual({
      valid: true,
      regon,
      length: 14,
      entityRegon: '000002217',
    })
    expect(validateRegon(`${regon.slice(0, 13)}0`)).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('writes check digit 0 when the 9-digit remainder is 10', () => {
    const regon = regon9WithRemainder(10)
    expect(regon.endsWith('0')).toBe(true)
    expect(weightedSum(toDigits(regon.slice(0, 8)), REGON9_WEIGHTS) % 11).toBe(10)
    expect(validateRegon(regon).valid).toBe(true)
    expect(validateRegon(`${regon.slice(0, 8)}1`).valid).toBe(false)
  })

  it('rejects a 14-digit number whose embedded 9-digit checksum was damaged', () => {
    const regon = '00000221700018'
    const damaged = flipDigit(regon, 4)
    expect(weightedSum(toDigits(damaged.slice(0, 13)), REGON14_WEIGHTS) % 11).toBe(
      weightedSum(toDigits(regon.slice(0, 13)), REGON14_WEIGHTS) % 11,
    )
    expect(validateRegon(damaged)).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('rejects the wrong length and non-digits', () => {
    expect(validateRegon('')).toEqual({ valid: false, error: 'empty' })
    expect(validateRegon('00000221')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateRegon('00000221A')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(() => generateRegon(10 as 9)).toThrow(RangeError)
  })

  it('generates 9-digit and 14-digit numbers that validate', () => {
    for (const length of [9, 14] as const) {
      const batch = generateRegons(25, length)
      expect(new Set(batch).size).toBe(25)
      for (const regon of batch) {
        const result = validateRegon(regon)
        expect(result).toMatchObject({ valid: true, length })
        if (result.valid && length === 14) {
          expect(validateRegon(result.entityRegon).valid).toBe(true)
        }
      }
    }
  })
})

function regon9WithRemainder(remainder: number): string {
  const weights = [8, 9, 2, 3, 4, 5, 6, 7]
  for (let value = 0; value < 100_000; value += 1) {
    const body = String(value).padStart(8, '0')
    const sum = [...body].reduce((total, char, index) => total + Number(char) * (weights[index] ?? 0), 0)
    if (sum % 11 === remainder) {
      return `${body}${remainder === 10 ? 0 : remainder}`
    }
  }
  throw new Error('no REGON body found')
}

function flipDigit(value: string, index: number): string {
  const chars = [...value]
  const current = chars[index]
  if (current === undefined) {
    throw new Error('index out of range')
  }
  chars[index] = current === '9' ? '0' : String(Number(current) + 1)
  return chars.join('')
}
