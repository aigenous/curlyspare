import { mod97Numeric } from './checksum'
import { cryptoRandomInt, generateUnique, randomDigitChar, type RandomInt } from './random'
import { invalid, stripSeparators, toDigits, weightedSum, type ValidationResult } from './validation'

/**
 * Polish NRB: 26 digits. The first two are the IBAN check digits (ISO 13616, country PL).
 * Digits 3–10 are the settlement number; its 8th digit is a check digit with weights 7, 1, 3, 9, 7, 1, 3.
 * The settlement number is checksum-valid and fictional. It is not taken from the NBP register.
 */
export const SORT_CODE_WEIGHTS = [7, 1, 3, 9, 7, 1, 3] as const

export interface NrbDetails {
  nrb: string
  formatted: string
  iban: string
  bank: string
}

export type NrbValidation = ValidationResult<NrbDetails>

export interface NrbGenerateOptions {
  /** Eight-digit settlement number that already has a valid check digit. */
  bank?: string
}

export function generateNrb(
  options: NrbGenerateOptions = {},
  rng: RandomInt = cryptoRandomInt,
): string {
  const bank = options.bank === undefined ? randomSortCode(rng) : requireSortCode(options.bank)
  const account = Array.from({ length: 16 }, () => randomDigitChar(rng)).join('')
  const bban = `${bank}${account}`
  return `${nrbCheckDigits(bban)}${bban}`
}

export function generateNrbs(
  count: number,
  options: NrbGenerateOptions = {},
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generateNrb(options, rng))
}

export function formatNrb(nrb: string): string {
  return `${nrb.slice(0, 2)} ${nrb.slice(2).replace(/(.{4})/g, '$1 ').trim()}`
}

export function validateNrb(input: string): NrbValidation {
  const compact = stripSeparators(input).toUpperCase()
  if (compact.length === 0) {
    return invalid('empty')
  }
  const body = compact.startsWith('PL') ? compact.slice(2) : compact
  if (body.length === 0) {
    return invalid('empty')
  }
  if (!/^\d+$/.test(body)) {
    return invalid('invalid-characters')
  }
  if (body.length !== 26) {
    return invalid('invalid-length')
  }
  if (mod97Numeric(`${body.slice(2)}2521${body.slice(0, 2)}`) !== 1) {
    return invalid('invalid-checksum')
  }
  if (!sortCodeIsValid(body.slice(2, 10))) {
    return invalid('invalid-checksum')
  }

  return {
    valid: true,
    nrb: body,
    formatted: formatNrb(body),
    iban: `PL${body}`,
    bank: body.slice(2, 10),
  }
}

function randomSortCode(rng: RandomInt): string {
  const body = Array.from({ length: 7 }, () => rng(10))
  return `${body.join('')}${sortCodeCheckDigit(body)}`
}

function requireSortCode(input: string): string {
  const digits = stripSeparators(input)
  if (!/^\d{8}$/.test(digits) || !sortCodeIsValid(digits)) {
    throw new RangeError('Settlement number must be 8 digits with a valid check digit')
  }
  return digits
}

function sortCodeCheckDigit(body: readonly number[]): number {
  return weightedSum(body, SORT_CODE_WEIGHTS) % 10
}

function sortCodeIsValid(digits: string): boolean {
  const values = toDigits(digits)
  return values[7] === sortCodeCheckDigit(values.slice(0, 7))
}

function nrbCheckDigits(bban: string): string {
  return String(98 - mod97Numeric(`${bban}252100`)).padStart(2, '0')
}
