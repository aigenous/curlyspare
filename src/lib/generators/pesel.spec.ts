import { describe, expect, it } from 'vitest'
import { formatIsoDate, fromEpochDay, toEpochDay, type CalendarDate } from './dates'
import {
  generatePesel,
  generatePeselOnDate,
  generatePesels,
  parsePesel,
  peselCheckDigit,
  randomPeselDate,
  validatePesel,
  type PeselSex,
  type PeselSexCode,
} from './pesel'
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

describe('PESEL parse and dated generation', () => {
  it('parses the published male number and ignores separators', () => {
    expect(parsePesel('44 051-401 359')).toEqual({
      digits: [4, 4, 0, 5, 1, 4, 0, 1, 3, 5, 9],
      complete: true,
      valid: true,
      sum: 101,
      expected: 9,
      dateOk: true,
      date: { year: 1944, month: 5, day: 14 },
      sex: 'M',
      checksumOk: true,
    })
    expect(validatePesel('44051401359').valid).toBe(true)
  })

  it('parses the leap-day number and rejects 29 February 1900', () => {
    expect(parsePesel('00222900009')).toMatchObject({
      valid: true,
      dateOk: true,
      date: { year: 2000, month: 2, day: 29 },
      sex: 'F',
      checksumOk: true,
    })
    const notLeap = parsePesel('00022900003')
    expect(notLeap).toMatchObject({
      valid: false,
      dateOk: false,
      sex: 'F',
      checksumOk: true,
    })
    expect(notLeap.date).toBeUndefined()
  })

  it('reports a bad check digit without dropping a valid date', () => {
    expect(parsePesel('44051401358')).toMatchObject({
      complete: true,
      valid: false,
      expected: 9,
      dateOk: true,
      date: { year: 1944, month: 5, day: 14 },
      sex: 'M',
      checksumOk: false,
    })
  })

  it('rejects 31 February and a month that is outside 1-12 after the century offset', () => {
    const february = parsePesel(withCheckDigit('0002310000'))
    expect(february.dateOk).toBe(false)
    expect(february.date).toBeUndefined()
    expect(february.valid).toBe(false)

    const offset = parsePesel(withCheckDigit('0015010000'))
    expect(offset.dateOk).toBe(false)
    expect(offset.valid).toBe(false)
  })

  it('supports a partial value and starts the sum at ten digits', () => {
    expect(parsePesel('   ')).toEqual({ digits: [], complete: false, valid: false })
    const partial = parsePesel('44051')
    expect(partial).toMatchObject({
      digits: [4, 4, 0, 5, 1],
      complete: false,
      valid: false,
    })
    expect(partial.sum).toBeUndefined()
    expect(partial.expected).toBeUndefined()
    expect(parsePesel('4405140135')).toMatchObject({
      digits: [4, 4, 0, 5, 1, 4, 0, 1, 3, 5],
      complete: false,
      valid: false,
      sum: 101,
      expected: 9,
    })
    expect(parsePesel('44051401359999').digits).toHaveLength(11)
  })

  it('round-trips both sexes across the PESEL centuries', () => {
    const dates: readonly CalendarDate[] = [
      { year: 1899, month: 12, day: 31 },
      { year: 1990, month: 5, day: 12 },
      { year: 2000, month: 2, day: 29 },
      { year: 2024, month: 7, day: 8 },
      { year: 2299, month: 1, day: 1 },
    ]
    for (const date of dates) {
      for (const sex of ['F', 'M'] as const satisfies readonly PeselSexCode[]) {
        const pesel = generatePeselOnDate(date, sex, sequenceRng([1, 2, 3, 0]))
        const parsed = parsePesel(pesel)
        expect(parsed).toMatchObject({ valid: true, date, sex, checksumOk: true })
        expect(validatePesel(pesel)).toMatchObject({
          valid: true,
          birthDate: date,
          sex: sex === 'F' ? 'kobieta' : 'mezczyzna',
        })
        expect(peselCheckDigit(parsed.digits.slice(0, 10))).toBe(parsed.expected)
      }
    }
  })

  it('accepts a UTC date and draws a random sex through the shared generator', () => {
    const pesel = generatePeselOnDate(new Date(Date.UTC(1990, 4, 12)), 'random', sequenceRng([0, 4, 5, 6, 1]))
    expect(parsePesel(pesel)).toMatchObject({
      valid: true,
      date: { year: 1990, month: 5, day: 12 },
      sex: 'F',
    })
    expect(pesel.slice(6, 10)).toBe('4562')
  })

  it('draws a uniform day from 1950-01-01 through 2010-12-31', () => {
    const from = toEpochDay({ year: 1950, month: 1, day: 1 })
    const to = toEpochDay({ year: 2010, month: 12, day: 31 })
    expect(randomPeselDate(sequenceRng([0]))).toEqual(fromEpochDay(from))
    expect(randomPeselDate(sequenceRng([to - from]))).toEqual(fromEpochDay(to))
  })

  it('rejects a date the PESEL calendar cannot encode', () => {
    expect(() => generatePeselOnDate({ year: 1990, month: 2, day: 31 }, 'F')).toThrow(RangeError)
    expect(() => generatePeselOnDate(new Date(Number.NaN), 'M')).toThrow(RangeError)
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
