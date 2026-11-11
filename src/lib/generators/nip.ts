import { mod11DigitOrNull } from './checksum'
import { cryptoRandomInt, generateUnique, type RandomInt } from './random'
import {
  invalid,
  readDigits,
  toDigits,
  type ValidationResult,
} from './validation'

/**
 * NIP: 10 digits. Weights 6, 5, 7, 2, 3, 4, 5, 6, 7.
 * The check digit is the weighted sum mod 11. A remainder of 10 cannot be issued.
 */
export const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7] as const

export interface NipDetails {
  nip: string
  formatted: string
}

export type NipValidation = ValidationResult<NipDetails>

export function generateNip(rng: RandomInt = cryptoRandomInt): string {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const body = [1 + rng(9)]
    for (let index = 0; index < 8; index += 1) {
      body.push(rng(10))
    }
    const check = mod11DigitOrNull(body, NIP_WEIGHTS)
    if (check !== null) {
      return [...body, check].join('')
    }
  }
  throw new Error('Unable to generate a NIP')
}

export function generateNips(count: number, rng: RandomInt = cryptoRandomInt): string[] {
  return generateUnique(count, () => generateNip(rng))
}

export function formatNip(nip: string): string {
  const parsed = readDigits(nip, 10)
  if (!parsed.ok) {
    throw new RangeError('NIP must contain 10 digits')
  }
  const digits = parsed.value
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`
}

export function validateNip(input: string): NipValidation {
  const parsed = readDigits(input, 10)
  if (!parsed.ok) {
    return parsed.failure
  }

  const digits = toDigits(parsed.value)
  const check = mod11DigitOrNull(digits.slice(0, 9), NIP_WEIGHTS)
  if (check === null || digits[9] !== check) {
    return invalid('invalid-checksum')
  }

  return { valid: true, nip: parsed.value, formatted: formatNip(parsed.value) }
}
