import { mod11CheckDigit } from './checksum'
import { cryptoRandomInt, generateUnique, type RandomInt } from './random'
import {
  invalid,
  readDigits,
  toDigits,
  type ValidationResult,
} from './validation'

/**
 * REGON. Nine digits identify an entity; fourteen identify a local unit of that entity.
 * Check digit = weighted sum mod 11, and a remainder of 10 is written as 0.
 * A 14-digit number must start with a valid 9-digit REGON. The 14-digit weights
 * ignore the 5th digit, so the embedded 9-digit checksum is checked as well.
 */
export const REGON9_WEIGHTS = [8, 9, 2, 3, 4, 5, 6, 7] as const
export const REGON14_WEIGHTS = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8] as const

export type RegonLength = 9 | 14

export interface RegonDetails {
  regon: string
  length: RegonLength
  entityRegon: string
}

export type RegonValidation = ValidationResult<RegonDetails>

export function generateRegon(
  length: RegonLength = 9,
  rng: RandomInt = cryptoRandomInt,
): string {
  switch (length) {
    case 9:
      return generateRegon9(rng)
    case 14:
      return generateRegon14(rng)
    default: {
      const unexpected: never = length
      throw new RangeError(`Unsupported REGON length: ${String(unexpected)}`)
    }
  }
}

export function generateRegons(
  count: number,
  length: RegonLength = 9,
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generateRegon(length, rng))
}

export function validateRegon(input: string): RegonValidation {
  const parsed = readDigits(input)
  if (!parsed.ok) {
    return parsed.failure
  }
  if (parsed.value.length !== 9 && parsed.value.length !== 14) {
    return invalid('invalid-length')
  }

  const digits = toDigits(parsed.value)
  const entityCheck = mod11CheckDigit(digits.slice(0, 8), REGON9_WEIGHTS)
  if (digits[8] !== entityCheck) {
    return invalid('invalid-checksum')
  }

  if (parsed.value.length === 14) {
    const localCheck = mod11CheckDigit(digits.slice(0, 13), REGON14_WEIGHTS)
    if (digits[13] !== localCheck) {
      return invalid('invalid-checksum')
    }
  }

  const length: RegonLength = parsed.value.length === 14 ? 14 : 9
  return {
    valid: true,
    regon: parsed.value,
    length,
    entityRegon: parsed.value.slice(0, 9),
  }
}

function generateRegon9(rng: RandomInt): string {
  const body = Array.from({ length: 8 }, () => rng(10))
  return [...body, mod11CheckDigit(body, REGON9_WEIGHTS)].join('')
}

function generateRegon14(rng: RandomInt): string {
  const entity = toDigits(generateRegon9(rng))
  const localUnit = Array.from({ length: 4 }, () => rng(10))
  const body = [...entity, ...localUnit]
  return [...body, mod11CheckDigit(body, REGON14_WEIGHTS)].join('')
}
