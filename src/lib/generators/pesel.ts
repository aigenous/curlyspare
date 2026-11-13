import {
  compareDates,
  isValidDate,
  randomDateBetween,
  type CalendarDate,
} from './dates'
import { cryptoRandomInt, generateUnique, type RandomInt } from './random'
import {
  invalid,
  readDigits,
  toDigits,
  weightedSum,
  type ValidationResult,
} from './validation'

/**
 * PESEL: YYMMDD + 3 serial digits + sex digit + check digit.
 * The month is shifted by century. The 10th digit is even for a woman and odd for a man.
 * Weights 1, 3, 7, 9, 1, 3, 7, 9, 1, 3. Check digit = (10 − sum mod 10) mod 10.
 */
export const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const

const MIN_YEAR = 1800
const MAX_YEAR = 2299

/** Inclusive range used when a caller does not supply a birth date. */
export const PESEL_DEFAULT_YEAR_RANGE = {
  from: { year: 1950, month: 1, day: 1 },
  to: { year: 2005, month: 12, day: 31 },
} as const satisfies { from: CalendarDate; to: CalendarDate }

const CENTURY_MONTH_OFFSET: Readonly<Record<number, number>> = {
  18: 80,
  19: 0,
  20: 20,
  21: 40,
  22: 60,
}

const MONTH_BANDS: readonly { from: number; to: number; baseYear: number; shift: number }[] = [
  { from: 81, to: 92, baseYear: 1800, shift: 80 },
  { from: 1, to: 12, baseYear: 1900, shift: 0 },
  { from: 21, to: 32, baseYear: 2000, shift: 20 },
  { from: 41, to: 52, baseYear: 2100, shift: 40 },
  { from: 61, to: 72, baseYear: 2200, shift: 60 },
]

export type PeselSex = 'kobieta' | 'mezczyzna'

/** English sex code used by the progressive parser. F is female, M is male. */
export type PeselSexCode = 'F' | 'M'

/**
 * Progressive read of a PESEL.
 * Non-digits are ignored so the UI can render while the value is still incomplete.
 * `sum` and `expected` appear once ten digits are present. Date and sex appear once eleven are.
 */
export interface PeselParse {
  digits: readonly number[]
  complete: boolean
  valid: boolean
  /** Weighted sum of the first ten digits. */
  sum?: number
  /** Check digit required by that sum. */
  expected?: number
  dateOk?: boolean
  date?: CalendarDate
  sex?: PeselSexCode
  checksumOk?: boolean
}

export interface PeselDetails {
  pesel: string
  birthDate: CalendarDate
  sex: PeselSex
}

export type PeselValidation = ValidationResult<PeselDetails>

export interface PeselGenerateOptions {
  birthDate?: CalendarDate
  sex?: PeselSex
  from?: CalendarDate
  to?: CalendarDate
}

export function peselCheckDigit(body: readonly number[]): number {
  const sum = weightedSum(body, PESEL_WEIGHTS)
  return (10 - (sum % 10)) % 10
}

export function encodePeselMonth(year: number, month: number): number {
  const offset = CENTURY_MONTH_OFFSET[Math.floor(year / 100)]
  if (offset === undefined || year < MIN_YEAR || year > MAX_YEAR) {
    throw new RangeError('PESEL year must be between 1800 and 2299')
  }
  return month + offset
}

export function generatePesel(
  options: PeselGenerateOptions = {},
  rng: RandomInt = cryptoRandomInt,
): string {
  const birthDate = resolveBirthDate(options, rng)
  const sex = options.sex ?? randomSex(rng)
  assertSex(sex)

  const digits: number[] = []
  appendTwoDigits(digits, birthDate.year % 100)
  appendTwoDigits(digits, encodePeselMonth(birthDate.year, birthDate.month))
  appendTwoDigits(digits, birthDate.day)
  digits.push(rng(10), rng(10), rng(10), randomSexDigit(sex, rng))
  digits.push(peselCheckDigit(digits))
  return digits.join('')
}

export function generatePesels(
  count: number,
  options: PeselGenerateOptions = {},
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generatePesel(options, rng))
}

/**
 * Uniform day inside `PESEL_DEFAULT_YEAR_RANGE`.
 * Uses the shared cryptographic RNG.
 */
export function randomPeselDate(rng: RandomInt = cryptoRandomInt): CalendarDate {
  return randomDateBetween(PESEL_DEFAULT_YEAR_RANGE.from, PESEL_DEFAULT_YEAR_RANGE.to, rng)
}

/**
 * Builds a PESEL for a calendar day.
 * `sex` is the English code, or `random` when the caller wants either sex.
 * The date is `{ year, month, day }` so a local timezone cannot shift the day.
 * The digits come from `generatePesel`, including its cryptographic RNG.
 */
export function generatePeselOnDate(
  date: CalendarDate,
  sex: PeselSexCode | 'random' = 'random',
  rng: RandomInt = cryptoRandomInt,
): string {
  const polishSex = toPeselSex(sex)
  return generatePesel(polishSex === null ? { birthDate: date } : { birthDate: date, sex: polishSex }, rng)
}

/**
 * Reads digits and ignores other characters.
 * More than eleven digits is not a PESEL: `valid` stays false.
 * `sum` and `expected` appear once ten digits are present. Date and sex appear once eleven are.
 * `valid` is decided only here.
 */
export function parsePesel(input: string): PeselParse {
  const compact = input.replace(/\D/g, '')
  const digits = compact.length === 0 ? [] : toDigits(compact)
  const parsed: PeselParse = {
    digits,
    complete: digits.length === 11,
    valid: false,
  }
  if (digits.length >= 10) {
    const body = digits.slice(0, 10)
    parsed.sum = weightedSum(body, PESEL_WEIGHTS)
    parsed.expected = peselCheckDigit(body)
  }
  if (!parsed.complete) {
    return parsed
  }

  const decoded = decodePeselDigits(digits)
  parsed.dateOk = decoded !== null
  parsed.sex = toSexCode(sexFromDigit(digits[9] ?? 0))
  if (decoded) {
    parsed.date = decoded.birthDate
  }
  parsed.checksumOk = parsed.expected === digits[10]
  parsed.valid = parsed.dateOk === true && parsed.checksumOk === true
  return parsed
}

export function validatePesel(input: string): PeselValidation {
  const parsed = readDigits(input, 11)
  if (!parsed.ok) {
    return parsed.failure
  }

  const digits = toDigits(parsed.value)
  if (digits[10] !== peselCheckDigit(digits.slice(0, 10))) {
    return invalid('invalid-checksum')
  }

  const decoded = decodePeselDigits(digits)
  if (decoded === null) {
    return invalid('invalid-date')
  }

  return { valid: true, pesel: parsed.value, ...decoded }
}

function decodePeselDigits(digits: readonly number[]): Omit<PeselDetails, 'pesel'> | null {
  const yearWithinCentury = (digits[0] ?? 0) * 10 + (digits[1] ?? 0)
  const encodedMonth = (digits[2] ?? 0) * 10 + (digits[3] ?? 0)
  const day = (digits[4] ?? 0) * 10 + (digits[5] ?? 0)
  const band = MONTH_BANDS.find(
    (candidate) => encodedMonth >= candidate.from && encodedMonth <= candidate.to,
  )
  if (band === undefined) {
    return null
  }

  const birthDate = {
    year: band.baseYear + yearWithinCentury,
    month: encodedMonth - band.shift,
    day,
  }
  if (!isValidDate(birthDate)) {
    return null
  }

  return { birthDate, sex: sexFromDigit(digits[9] ?? 0) }
}

function resolveBirthDate(options: PeselGenerateOptions, rng: RandomInt): CalendarDate {
  if (options.birthDate !== undefined) {
    assertPeselDate(options.birthDate)
    return options.birthDate
  }

  const from = options.from ?? PESEL_DEFAULT_YEAR_RANGE.from
  const to = options.to ?? PESEL_DEFAULT_YEAR_RANGE.to
  assertPeselDate(from)
  assertPeselDate(to)
  if (compareDates(from, to) > 0) {
    throw new RangeError('The end date must not be earlier than the start date')
  }
  return randomDateBetween(from, to, rng)
}

function assertPeselDate(date: CalendarDate): void {
  if (!isValidDate(date) || date.year < MIN_YEAR || date.year > MAX_YEAR) {
    throw new RangeError('PESEL birth date must be a real day between 1800 and 2299')
  }
}

function randomSex(rng: RandomInt): PeselSex {
  return rng(2) === 0 ? 'kobieta' : 'mezczyzna'
}

function randomSexDigit(sex: PeselSex, rng: RandomInt): number {
  const evenDigit = rng(5) * 2
  switch (sex) {
    case 'kobieta':
      return evenDigit
    case 'mezczyzna':
      return evenDigit + 1
    default: {
      const unexpected: never = sex
      throw new RangeError(`Unsupported sex: ${String(unexpected)}`)
    }
  }
}

function assertSex(sex: PeselSex): void {
  switch (sex) {
    case 'kobieta':
    case 'mezczyzna':
      return
    default: {
      const unexpected: never = sex
      throw new RangeError(`Unsupported sex: ${String(unexpected)}`)
    }
  }
}

function appendTwoDigits(target: number[], value: number): void {
  target.push(Math.floor(value / 10), value % 10)
}

function sexFromDigit(digit: number): PeselSex {
  return digit % 2 === 0 ? 'kobieta' : 'mezczyzna'
}

function toSexCode(sex: PeselSex): PeselSexCode {
  switch (sex) {
    case 'kobieta':
      return 'F'
    case 'mezczyzna':
      return 'M'
    default: {
      const unexpected: never = sex
      throw new RangeError(`Unsupported sex: ${String(unexpected)}`)
    }
  }
}

function toPeselSex(sex: PeselSexCode | 'random'): PeselSex | null {
  switch (sex) {
    case 'random':
      return null
    case 'F':
      return 'kobieta'
    case 'M':
      return 'mezczyzna'
    default: {
      const unexpected: never = sex
      throw new RangeError(`Unsupported sex: ${String(unexpected)}`)
    }
  }
}

