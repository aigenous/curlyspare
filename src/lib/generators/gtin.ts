import { cryptoRandomInt, generateUnique, type RandomInt } from './random'
import { invalid, readDigits, toDigits, type ValidationResult } from './validation'

/**
 * GTIN check digit. Weights alternate 3, 1 from the right, starting with 3
 * on the digit immediately before the check digit. EAN-8, UPC-A, EAN-13 and GTIN-14 share it.
 */
export const GTIN_LENGTHS = [8, 12, 13, 14] as const

export type GtinLength = (typeof GTIN_LENGTHS)[number]
export type GtinGenerateLength = 8 | 13 | 14

export interface GtinDetails {
  gtin: string
  length: GtinLength
  kind: 'EAN-8' | 'UPC-A' | 'EAN-13' | 'GTIN-14'
}

export type GtinValidation = ValidationResult<GtinDetails>

const KINDS: Record<GtinLength, GtinDetails['kind']> = {
  8: 'EAN-8',
  12: 'UPC-A',
  13: 'EAN-13',
  14: 'GTIN-14',
}

export function gtinCheckDigit(body: readonly number[]): number {
  let sum = 0
  for (let index = 0; index < body.length; index += 1) {
    const weight = (body.length - index) % 2 === 0 ? 1 : 3
    sum += (body[index] ?? 0) * weight
  }
  return (10 - (sum % 10)) % 10
}

export function generateGtin(
  length: GtinGenerateLength = 13,
  rng: RandomInt = cryptoRandomInt,
): string {
  switch (length) {
    case 8:
    case 13:
    case 14:
      break
    default: {
      const unexpected: never = length
      throw new RangeError(`Unsupported GTIN length: ${String(unexpected)}`)
    }
  }
  const body = Array.from({ length: length - 1 }, () => rng(10))
  return [...body, gtinCheckDigit(body)].join('')
}

export function generateGtins(
  count: number,
  length: GtinGenerateLength = 13,
  rng: RandomInt = cryptoRandomInt,
): string[] {
  return generateUnique(count, () => generateGtin(length, rng))
}

export function validateGtin(input: string): GtinValidation {
  const parsed = readDigits(input)
  if (!parsed.ok) {
    return parsed.failure
  }
  const length = parsed.value.length
  if (!isGtinLength(length)) {
    return invalid('invalid-length')
  }
  const digits = toDigits(parsed.value)
  if (digits[length - 1] !== gtinCheckDigit(digits.slice(0, -1))) {
    return invalid('invalid-checksum')
  }
  return { valid: true, gtin: parsed.value, length, kind: KINDS[length] }
}

function isGtinLength(length: number): length is GtinLength {
  return length === 8 || length === 12 || length === 13 || length === 14
}
