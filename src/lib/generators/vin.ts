import { invalid, stripSeparators, type ValidationResult } from './validation'

/**
 * ISO 3779 check digit. The ninth character has weight 0 and holds the check digit.
 * I, O and Q are excluded so they cannot be confused with digits.
 */
const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4,
  '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
}

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2]

export interface VinDetails {
  vin: string
}

export type VinValidation = ValidationResult<VinDetails>

export function validateVin(input: string): VinValidation {
  const vin = stripSeparators(input).toUpperCase()
  if (vin.length === 0) {
    return invalid('empty')
  }
  if (/[^A-Z0-9]/.test(vin)) {
    return invalid('invalid-characters')
  }
  if (vin.length !== 17) {
    return invalid('invalid-length')
  }
  if (/[IOQ]/.test(vin)) {
    return invalid('invalid-format')
  }
  if (vin.charAt(8) !== vinCheckCharacter(vin)) {
    return invalid('invalid-checksum')
  }
  return { valid: true, vin }
}

function vinCheckCharacter(vin: string): string {
  let sum = 0
  for (let index = 0; index < 17; index += 1) {
    if (index === 8) {
      continue
    }
    const value = TRANSLITERATION[vin.charAt(index)]
    if (value === undefined) {
      return ''
    }
    sum += value * (WEIGHTS[index] ?? 0)
  }
  const remainder = sum % 11
  return remainder === 10 ? 'X' : String(remainder)
}
