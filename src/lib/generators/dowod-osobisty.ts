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
 * Polish identity card number: 3 letters and 6 digits.
 * The 4th character is the check digit. Letters are A=10 … Z=35.
 * Weights 7, 3, 1, 9, 7, 3, 1, 7, 3. The weighted sum must be divisible by 10.
 * Weight 9 is congruent to −1 (mod 10), so the check digit equals the weighted
 * sum of the other characters modulo 10.
 */
export const DOWOD_WEIGHTS = [7, 3, 1, 9, 7, 3, 1, 7, 3] as const
export const DOWOD_CHECK_INDEX = 3

const DOWOD_PATTERN = /^[A-Z]{3}\d{6}$/

export interface DowodDetails {
  number: string
  formatted: string
  series: string
}

export type DowodValidation = ValidationResult<DowodDetails>

export function generateDowodOsobisty(rng: RandomInt = cryptoRandomInt): string {
  const chars = [
    randomUppercaseLetter(rng),
    randomUppercaseLetter(rng),
    randomUppercaseLetter(rng),
    '0',
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
    randomDigitChar(rng),
  ]
  return numberWithMod10CheckDigit(chars, DOWOD_CHECK_INDEX, DOWOD_WEIGHTS)
}

export function generateDowodyOsobiste(
  count: number,
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generateDowodOsobisty(rng))
}

export function formatDowodOsobisty(value: string): string {
  return `${value.slice(0, 3)} ${value.slice(3)}`
}

export function validateDowodOsobisty(input: string): DowodValidation {
  const parsed = readDocument(input, DOWOD_PATTERN, 9)
  if (!parsed.ok) {
    return parsed.failure
  }
  if (mod10Residue(parsed.value, DOWOD_WEIGHTS) !== 0) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    number: parsed.value,
    formatted: formatDowodOsobisty(parsed.value),
    series: parsed.value.slice(0, 3),
  }
}
