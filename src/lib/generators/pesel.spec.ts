import { describe, expect, it } from 'vitest'
import { formatIsoDate } from './dates'
import { generatePesel, generatePesels, validatePesel, type PeselSex } from './pesel'
import { sequenceRng } from './sequence-rng'

describe('PESEL', () => {
  it('reproduces the published 1944-05-14 male vector', () => {
    const pesel = generatePesel(
      { birthDate: { year: 1944, month: 5, day: 14 }, sex: 'mezczyzna' },
      sequenceRng([0, 1, 3, 2]),
    )
    expect(pesel).toBe('44051401359')

    const result = validatePesel('440514 01359')
    expect(result).toEqual({
      valid: true,
      pesel: '44051401359',
      birthDate: { year: 1944, month: 5, day: 14 },
      sex: 'mezczyzna',
    })
  })

  it('reproduces a hand-computed 29 February 2000 female vector', () => {
    // 00 22 29 000 0, weighted sum 61, check digit (10 − 1) mod 10 = 9.
    const pesel = generatePesel(
      { birthDate: { year: 2000, month: 2, day: 29 }, sex: 'kobieta' },
      sequenceRng([0, 0, 0, 0]),
    )
    expect(pesel).toBe('00222900009')
    expect(validatePesel(pesel)).toMatchObject({
      valid: true,
      birthDate: { year: 2000, month: 2, day: 29 },
      sex: 'kobieta',
    })
  })

  it('reproduces a hand-computed 31 December 1990 male vector', () => {
    // 90 12 31 999 9, weighted sum 220, check digit 0.
    expect(validatePesel('90123199990')).toMatchObject({
      valid: true,
      birthDate: { year: 1990, month: 12, day: 31 },
      sex: 'mezczyzna',
    })
  })

  it('encodes each PESEL century in the month field', () => {
    const cases: readonly { year: number; month: number; day: number; prefix: string }[] = [
      { year: 1800, month: 1, day: 1, prefix: '008101' },
      { year: 1899, month: 12, day: 31, prefix: '999231' },
      { year: 1900, month: 1, day: 1, prefix: '000101' },
      { year: 1999, month: 12, day: 31, prefix: '991231' },
      { year: 2000, month: 1, day: 1, prefix: '002101' },
      { year: 2099, month: 12, day: 31, prefix: '993231' },
      { year: 2100, month: 1, day: 1, prefix: '004101' },
      { year: 2199, month: 12, day: 31, prefix: '995231' },
      { year: 2200, month: 1, day: 1, prefix: '006101' },
      { year: 2299, month: 12, day: 31, prefix: '997231' },
    ]

    for (const { year, month, day, prefix } of cases) {
      for (const sex of ['kobieta', 'mezczyzna'] as const) {
        const pesel = generatePesel({ birthDate: { year, month, day }, sex })
        expect(pesel.startsWith(prefix)).toBe(true)
        expect(Number(pesel[9]) % 2 === 0).toBe(sex === 'kobieta')
        expect(validatePesel(pesel)).toMatchObject({
          valid: true,
          birthDate: { year, month, day },
          sex,
        })
      }
    }
  })

  it('rejects a checksum-valid number that encodes 29 February 1900', () => {
    // 00 02 29 000 0, weighted sum 47, check digit 3. 1900 is not a leap year.
    expect(validatePesel('00022900003')).toEqual({ valid: false, error: 'invalid-date' })
  })

  it('rejects a month that does not belong to any century band', () => {
    expect(validatePesel(withCheckDigit('0013010000'))).toEqual({
      valid: false,
      error: 'invalid-date',
    })
  })

  it('rejects an empty value, foreign characters, the wrong length and a bad check digit', () => {
    expect(validatePesel('   ')).toEqual({ valid: false, error: 'empty' })
    expect(validatePesel('4405140135A')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(validatePesel('4405140135')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validatePesel('44051401358')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('accepts dashes around a valid number', () => {
    expect(validatePesel('440514-01359').valid).toBe(true)
  })

  it('validates every generated number and keeps a fixed date and sex', () => {
    const birthDate = { year: 1984, month: 7, day: 21 }
    const batch = generatePesels(30, { birthDate, sex: 'kobieta' })
    expect(new Set(batch).size).toBe(30)
    for (const pesel of batch) {
      expect(validatePesel(pesel)).toMatchObject({ valid: true, birthDate, sex: 'kobieta' })
      expect(flipDigit(pesel, 10)).not.toBe(pesel)
      expect(validatePesel(flipDigit(pesel, 10)).valid).toBe(false)
    }
  })

  it('draws a random sex and date when neither is requested', () => {
    const seen = new Set<PeselSex>()
    for (let index = 0; index < 40; index += 1) {
      const result = validatePesel(generatePesel())
      expect(result.valid).toBe(true)
      if (result.valid) {
        seen.add(result.sex)
        expect(result.birthDate.year).toBeGreaterThanOrEqual(1950)
        expect(result.birthDate.year).toBeLessThanOrEqual(2005)
      }
    }
    expect(seen.size).toBe(2)
  })

  it('rejects dates outside the PESEL calendar and an inverted range', () => {
    expect(() => generatePesel({ birthDate: { year: 1799, month: 12, day: 31 } })).toThrow(RangeError)
    expect(() => generatePesel({ birthDate: { year: 2300, month: 1, day: 1 } })).toThrow(RangeError)
    expect(() => generatePesel({ birthDate: { year: 1900, month: 2, day: 29 } })).toThrow(RangeError)
    expect(() => generatePesel({ birthDate: { year: 2100, month: 2, day: 29 } })).toThrow(RangeError)
    expect(() =>
      generatePesel({
        from: { year: 2001, month: 1, day: 1 },
        to: { year: 2000, month: 1, day: 1 },
      }),
    ).toThrow(RangeError)
    expect(() => generatePesel({ sex: 'inna' as PeselSex })).toThrow(RangeError)
  })

  it('changes the check digit when any earlier digit changes', () => {
    const pesel = generatePesel({ birthDate: { year: 2012, month: 11, day: 3 }, sex: 'mezczyzna' })
    for (let index = 0; index < 10; index += 1) {
      expect(validatePesel(flipDigit(pesel, index)).valid).toBe(false)
    }
    expect(formatIsoDate({ year: 2012, month: 11, day: 3 })).toBe('2012-11-03')
  })
})

function withCheckDigit(body: string): string {
  const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
  const sum = [...body].reduce((total, char, index) => total + Number(char) * (weights[index] ?? 0), 0)
  return `${body}${(10 - (sum % 10)) % 10}`
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
