import { weightedSum } from './validation'

/** GUS-style mod-11 check digit. A remainder of 10 is stored as 0. */
export function mod11CheckDigit(values: readonly number[], weights: readonly number[]): number {
  const remainder = weightedSum(values, weights) % 11
  return remainder === 10 ? 0 : remainder
}

/**
 * Mod-11 digit used by NIP. Returns null when the remainder is 10,
 * because that remainder is not a single decimal digit and the number cannot be issued.
 */
export function mod11DigitOrNull(
  values: readonly number[],
  weights: readonly number[],
): number | null {
  const remainder = weightedSum(values, weights) % 11
  return remainder === 10 ? null : remainder
}

/** Digit value, or A=10 … Z=35. */
export function alphanumericValue(char: string): number {
  const code = char.charCodeAt(0)
  if (code >= 48 && code <= 57) {
    return code - 48
  }
  if (code >= 65 && code <= 90) {
    return code - 55
  }
  throw new RangeError(`Unsupported character: ${char}`)
}

export function mod10Residue(value: string, weights: readonly number[]): number {
  let sum = 0
  for (let index = 0; index < weights.length; index += 1) {
    sum += alphanumericValue(value.charAt(index)) * (weights[index] ?? 0)
  }
  return sum % 10
}

/**
 * Writes the unique digit at `checkIndex` that makes the weighted sum divisible by 10.
 * The weight at that index must be coprime with 10 (the document weights use 9).
 */
export function numberWithMod10CheckDigit(
  chars: readonly string[],
  checkIndex: number,
  weights: readonly number[],
): string {
  const next = [...chars]
  for (let digit = 0; digit <= 9; digit += 1) {
    next[checkIndex] = String(digit)
    if (mod10Residue(next.join(''), weights) === 0) {
      return next.join('')
    }
  }
  throw new Error('Checksum weights do not yield a digit')
}
