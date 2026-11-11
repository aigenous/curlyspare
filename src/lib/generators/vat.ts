import { validateNip } from './nip'
import { invalid, stripSeparators, type ValidationFailure, type ValidationResult } from './validation'

/**
 * EU VAT number format check. Checksums are applied for the countries whose
 * algorithm is public and verified here. Nothing is sent to VIES or any register.
 * Greece is accepted as EL; a GR prefix is normalised to EL.
 */
export const EU_VAT_COUNTRIES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR',
  'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const

export type EuVatCountry = (typeof EU_VAT_COUNTRIES)[number]

export interface EuVatDetails {
  vat: string
  country: EuVatCountry
}

export type EuVatValidation = ValidationResult<EuVatDetails>

const COUNTRY_SET = new Set<string>(EU_VAT_COUNTRIES)

export function validateEuVat(input: string): EuVatValidation {
  const compact = stripSeparators(input).replace(/[./]/g, '').toUpperCase()
  if (compact.length === 0) {
    return invalid('empty')
  }
  if (compact.length < 3) {
    return invalid('invalid-length')
  }
  const prefix = compact.startsWith('GR') ? 'EL' : compact.slice(0, 2)
  const body = compact.slice(2)
  if (!/^[A-Z]{2}/.test(prefix)) {
    return invalid('invalid-format')
  }
  if (!COUNTRY_SET.has(prefix)) {
    return invalid('unsupported-country')
  }
  if (/[^A-Z0-9]/.test(body)) {
    return invalid('invalid-characters')
  }
  const country = prefix as EuVatCountry
  const failure = checkBody(country, body)
  if (failure) {
    return failure
  }
  return { valid: true, vat: `${country}${body}`, country }
}

function checkBody(country: EuVatCountry, body: string): ValidationFailure | null {
  switch (country) {
    case 'AT':
      return /^U\d{8}$/.test(body) ? null : invalid('invalid-format')
    case 'BE':
      return belgian(body)
    case 'BG':
      return digits(body, [9, 10])
    case 'CY':
      return /^\d{8}[A-Z]$/.test(body) ? null : invalid('invalid-format')
    case 'CZ':
      return digits(body, [8, 9, 10])
    case 'DE':
      return digits(body, [9])
    case 'DK':
      return danish(body)
    case 'EE':
      return digits(body, [9])
    case 'EL':
      return digits(body, [9])
    case 'ES':
      return /^[A-Z0-9]\d{7}[A-Z0-9]$/.test(body) ? null : invalid('invalid-format')
    case 'FI':
      return finnish(body)
    case 'FR':
      return french(body)
    case 'HR':
      return digits(body, [11])
    case 'HU':
      return digits(body, [8])
    case 'IE':
      return /^(\d{7}[A-Z]{1,2}|\d[A-Z]\d{5}[A-Z])$/.test(body) ? null : invalid('invalid-format')
    case 'IT':
      return italian(body)
    case 'LT':
      return digits(body, [9, 12])
    case 'LU':
      return digits(body, [8])
    case 'LV':
      return digits(body, [11])
    case 'MT':
      return digits(body, [8])
    case 'NL':
      return /^\d{9}B\d{2}$/.test(body) ? null : invalid('invalid-format')
    case 'PL':
      return polish(body)
    case 'PT':
      return portuguese(body)
    case 'RO':
      return digits(body, range(2, 10))
    case 'SE':
      return swedish(body)
    case 'SI':
      return slovenian(body)
    case 'SK':
      return slovak(body)
    default: {
      const exhaustive: never = country
      return exhaustive
    }
  }
}

function digits(body: string, lengths: number[]): ValidationFailure | null {
  if (!/^\d+$/.test(body)) {
    return invalid('invalid-characters')
  }
  return lengths.includes(body.length) ? null : invalid('invalid-length')
}

function range(from: number, to: number): number[] {
  const lengths: number[] = []
  for (let length = from; length <= to; length += 1) {
    lengths.push(length)
  }
  return lengths
}

function mod(digitsValue: string, divisor: number): number {
  let remainder = 0
  for (const char of digitsValue) {
    remainder = (remainder * 10 + (char.charCodeAt(0) - 48)) % divisor
  }
  return remainder
}

/** BE: the last two digits are 97 minus the first eight modulo 97 (0 becomes 97). */
function belgian(body: string): ValidationFailure | null {
  const lengthError = digits(body, [10])
  if (lengthError) {
    return lengthError
  }
  const remainder = mod(body.slice(0, 8), 97)
  const expected = remainder === 0 ? 97 : 97 - remainder
  return Number(body.slice(8)) === expected ? null : invalid('invalid-checksum')
}

/** DK: weights 2, 7, 6, 5, 4, 3, 2, 1. The weighted sum is divisible by 11. */
function danish(body: string): ValidationFailure | null {
  const lengthError = digits(body, [8])
  if (lengthError) {
    return lengthError
  }
  const weights = [2, 7, 6, 5, 4, 3, 2, 1]
  const sum = [...body].reduce((total, char, index) => total + Number(char) * (weights[index] ?? 0), 0)
  return sum % 11 === 0 ? null : invalid('invalid-checksum')
}

/** FI: weights 7, 9, 10, 5, 8, 4, 2. Check digit 11 becomes 0; 10 cannot be issued. */
function finnish(body: string): ValidationFailure | null {
  return weightedCheck(body, [7, 9, 10, 5, 8, 4, 2], 'eleven-to-zero')
}

/** FR: a numeric key is (12 + 3 × (SIREN mod 97)) mod 97. Letter keys are format-only. */
function french(body: string): ValidationFailure | null {
  if (!/^[A-HJ-NP-Z0-9]{2}\d{9}$/.test(body)) {
    return invalid('invalid-format')
  }
  if (!/^\d{2}/.test(body)) {
    return null
  }
  const expected = (12 + 3 * mod(body.slice(2), 97)) % 97
  return Number(body.slice(0, 2)) === expected ? null : invalid('invalid-checksum')
}

/** IT: even positions (2, 4, …) are doubled, then reduced by 9 when above 9. */
function italian(body: string): ValidationFailure | null {
  const lengthError = digits(body, [11])
  if (lengthError) {
    return lengthError
  }
  let sum = 0
  for (let index = 0; index < 10; index += 1) {
    let value = body.charCodeAt(index) - 48
    if (index % 2 === 1) {
      value *= 2
      if (value > 9) {
        value -= 9
      }
    }
    sum += value
  }
  const expected = (10 - (sum % 10)) % 10
  return body.charCodeAt(10) - 48 === expected ? null : invalid('invalid-checksum')
}

function polish(body: string): ValidationFailure | null {
  const result = validateNip(body)
  return result.valid ? null : result
}

/** PT: weights 9…2. A remainder of 0 or 1 gives check digit 0. */
function portuguese(body: string): ValidationFailure | null {
  return weightedCheck(body, [9, 8, 7, 6, 5, 4, 3, 2], 'ten-or-eleven-to-zero')
}

/** SE: Luhn on the first 10 digits and a fixed suffix of 01. */
function swedish(body: string): ValidationFailure | null {
  const lengthError = digits(body, [12])
  if (lengthError) {
    return lengthError
  }
  if (!luhn(body.slice(0, 10))) {
    return invalid('invalid-checksum')
  }
  return body.endsWith('01') ? null : invalid('invalid-format')
}

/** SI: weights 8…2. Check digit 11 becomes 0; 10 cannot be issued. */
function slovenian(body: string): ValidationFailure | null {
  return weightedCheck(body, [8, 7, 6, 5, 4, 3, 2], 'eleven-to-zero')
}

/** SK: the ten-digit number is divisible by 11. */
function slovak(body: string): ValidationFailure | null {
  const lengthError = digits(body, [10])
  if (lengthError) {
    return lengthError
  }
  return mod(body, 11) === 0 ? null : invalid('invalid-checksum')
}

function weightedCheck(
  body: string,
  weights: number[],
  tenRule: 'eleven-to-zero' | 'ten-or-eleven-to-zero',
): ValidationFailure | null {
  const lengthError = digits(body, [weights.length + 1])
  if (lengthError) {
    return lengthError
  }
  const sum = weights.reduce((total, weight, index) => total + (body.charCodeAt(index) - 48) * weight, 0)
  let expected = 11 - (sum % 11)
  if (tenRule === 'eleven-to-zero') {
    if (expected === 10) {
      return invalid('invalid-checksum')
    }
    if (expected === 11) {
      expected = 0
    }
  } else if (expected >= 10) {
    expected = 0
  }
  return body.charCodeAt(weights.length) - 48 === expected ? null : invalid('invalid-checksum')
}

function luhn(value: string): boolean {
  let sum = 0
  for (let index = 0; index < value.length; index += 1) {
    let digit = value.charCodeAt(index) - 48
    if ((value.length - 1 - index) % 2 === 1) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    sum += digit
  }
  return sum % 10 === 0
}
