import { cryptoRandomInt, generateUnique, randomDigitChar, type RandomInt } from './random'
import { readDigits, type ValidationResult } from './validation'

/**
 * KRS number: 10 digits, including leading zeros.
 * The register does not use a check digit, so only the format is validated.
 */
export interface KrsDetails {
  krs: string
}

export type KrsValidation = ValidationResult<KrsDetails>

export function generateKrs(rng: RandomInt = cryptoRandomInt): string {
  return Array.from({ length: 10 }, () => randomDigitChar(rng)).join('')
}

export function generateKrsNumbers(count: number, rng: RandomInt = cryptoRandomInt): string[] {
  return generateUnique(count, () => generateKrs(rng))
}

export function validateKrs(input: string): KrsValidation {
  const parsed = readDigits(input, 10)
  if (!parsed.ok) {
    return parsed.failure
  }
  return { valid: true, krs: parsed.value }
}
