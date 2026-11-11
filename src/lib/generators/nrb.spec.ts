import { describe, expect, it } from 'vitest'
import { generateNrb, generateNrbs, validateNrb } from './nrb'
import { sequenceRng } from './sequence-rng'
import { validateIbanPl } from './iban'

const MINISTRY = '09101010100075912223000000'
const WIKIPEDIA = '61109010140000071219812874'

describe('NRB', () => {
  it('accepts the Ministry of Finance account and the ISO example', () => {
    expect(validateNrb('09 1010 1010 0075 9122 2300 0000')).toEqual({
      valid: true,
      nrb: MINISTRY,
      formatted: '09 1010 1010 0075 9122 2300 0000',
      iban: `PL${MINISTRY}`,
      bank: '10101010',
    })
    expect(validateNrb(`PL${WIKIPEDIA}`)).toMatchObject({
      valid: true,
      nrb: WIKIPEDIA,
      bank: '10901014',
    })
    expect(validateIbanPl(`PL${MINISTRY}`).valid).toBe(true)
  })

  it('rejects a damaged check digit and a settlement number whose own check digit was changed', () => {
    expect(validateNrb(`${MINISTRY.slice(0, 25)}1`)).toEqual({
      valid: false,
      error: 'invalid-checksum',
    })
    const brokenBank = `${WIKIPEDIA.slice(0, 9)}5${WIKIPEDIA.slice(10)}`
    const repaired = `${checkDigits(brokenBank.slice(2))}${brokenBank.slice(2)}`
    expect(validateNrb(repaired)).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('rejects an empty value, letters and the wrong length', () => {
    expect(validateNrb('  ')).toEqual({ valid: false, error: 'empty' })
    expect(validateNrb('PL')).toEqual({ valid: false, error: 'empty' })
    expect(validateNrb('0910101010007591222300000A')).toEqual({
      valid: false,
      error: 'invalid-characters',
    })
    expect(validateNrb('0910101010')).toEqual({ valid: false, error: 'invalid-length' })
  })

  it('uses a supplied settlement number and validates every generated account', () => {
    const nrb = generateNrb({ bank: '10101010' }, sequenceRng(Array.from({ length: 16 }, () => 1)))
    expect(nrb.slice(2, 10)).toBe('10101010')
    expect(nrb.slice(10)).toBe('1111111111111111')
    expect(validateNrb(nrb).valid).toBe(true)

    const batch = generateNrbs(20)
    expect(new Set(batch).size).toBe(20)
    for (const value of batch) {
      expect(validateNrb(value).valid).toBe(true)
      expect(validateIbanPl(`PL${value}`).valid).toBe(true)
    }
  })

  it('rejects a settlement number that fails its own checksum', () => {
    expect(() => generateNrb({ bank: '10101011' })).toThrow(RangeError)
    expect(() => generateNrb({ bank: '1010' })).toThrow(RangeError)
  })
})

function checkDigits(bban: string): string {
  let remainder = 0
  for (const char of `${bban}252100`) {
    remainder = (remainder * 10 + Number(char)) % 97
  }
  return String(98 - remainder).padStart(2, '0')
}
