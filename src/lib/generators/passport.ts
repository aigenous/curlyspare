import { mod10Residue, numberWithMod10CheckDigit } from './checksum'
import {
  cryptoRandomInt,
  generateUnique,
  randomDigitChar,
  randomUppercaseLetter,
  type RandomInt,
} from './random'
import { invalid, readDocument, type ValidationResult } from './validation'

/**
 * Polish passport number: 2 letters and 7 digits.
 * The 3rd character is the check digit. Letters are A=10 … Z=35.
 * Weights 7, 3, 9, 1, 7, 3, 1, 7, 3. The weighted sum must be divisible by 10.
 */
export const PASSPORT_WEIGHTS = [7, 3, 9, 1, 7, 3, 1, 7, 3] as const
export const PASSPORT_CHECK_INDEX = 2

const PASSPORT_PATTERN = /^[A-Z]{2}\d{7}$/

export interface PassportDetails {
  number: string
  formatted: string
  series: string
}

export type PassportValidation = ValidationResult<PassportDetails>

export function generatePassport(rng: RandomInt = cryptoRandomInt): string {
  const chars = [
    randomUppercaseLetter(rng),
    randomUppercaseLetter(rng),
    '0',
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
  ]
  return numberWithMod10CheckDigit(chars, PASSPORT_CHECK_INDEX, PASSPORT_WEIGHTS)
}

export function generatePassports(count: number, rng: RandomInt = cryptoRandomInt): string[] {
  return generateUnique(count, () => generatePassport(rng))
}

export function formatPassport(value: string): string {
  return `${value.slice(0, 2)} ${value.slice(2)}`
}

export function validatePassport(input: string): PassportValidation {
  const parsed = readDocument(input, PASSPORT_PATTERN, 9)
  if (!parsed.ok) {
    return parsed.failure
  }
  if (mod10Residue(parsed.value, PASSPORT_WEIGHTS) !== 0) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    number: parsed.value,
    formatted: formatPassport(parsed.value),
    series: parsed.value.slice(0, 2),
  }
}
