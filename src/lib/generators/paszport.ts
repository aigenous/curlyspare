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
export const PASZPORT_WEIGHTS = [7, 3, 9, 1, 7, 3, 1, 7, 3] as const
export const PASZPORT_CHECK_INDEX = 2

const PASZPORT_PATTERN = /^[A-Z]{2}\d{7}$/

export interface PaszportDetails {
  number: string
  formatted: string
  series: string
}

export type PaszportValidation = ValidationResult<PaszportDetails>

export function generatePaszport(rng: RandomInt = cryptoRandomInt): string {
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
  return numberWithMod10CheckDigit(chars, PASZPORT_CHECK_INDEX, PASZPORT_WEIGHTS)
}

export function generatePaszporty(count: number, rng: RandomInt = cryptoRandomInt): string[] {
  return generateUnique(count, () => generatePaszport(rng))
}

export function formatPaszport(value: string): string {
  return `${value.slice(0, 2)} ${value.slice(2)}`
}

export function validatePaszport(input: string): PaszportValidation {
  const parsed = readDocument(input, PASZPORT_PATTERN, 9)
  if (!parsed.ok) {
    return parsed.failure
  }
  if (mod10Residue(parsed.value, PASZPORT_WEIGHTS) !== 0) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    number: parsed.value,
    formatted: formatPaszport(parsed.value),
    series: parsed.value.slice(0, 2),
  }
}
