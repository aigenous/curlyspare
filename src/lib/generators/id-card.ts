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
export const ID_CARD_WEIGHTS = [7, 3, 1, 9, 7, 3, 1, 7, 3] as const
export const ID_CARD_CHECK_INDEX = 3

const ID_CARD_PATTERN = /^[A-Z]{3}\d{6}$/

export interface IdCardDetails {
  number: string
  formatted: string
  series: string
}

export type IdCardValidation = ValidationResult<IdCardDetails>

export function generateIdCardNumber(rng: RandomInt = cryptoRandomInt): string {
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
  return numberWithMod10CheckDigit(chars, ID_CARD_CHECK_INDEX, ID_CARD_WEIGHTS)
}

export function generateIdCardNumbers(
  count: number,
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generateIdCardNumber(rng))
}

export function formatIdCardNumber(value: string): string {
  return `${value.slice(0, 3)} ${value.slice(3)}`
}

export function validateIdCardNumber(input: string): IdCardValidation {
  const parsed = readDocument(input, ID_CARD_PATTERN, 9)
  if (!parsed.ok) {
    return parsed.failure
  }
  if (mod10Residue(parsed.value, ID_CARD_WEIGHTS) !== 0) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    number: parsed.value,
    formatted: formatIdCardNumber(parsed.value),
    series: parsed.value.slice(0, 3),
  }
}
