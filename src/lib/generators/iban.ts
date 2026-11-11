import { invalid, stripSeparators, type ValidationResult } from './validation'

/**
 * Polish IBAN (ISO 13616): `PL` and 26 digits.
 * Valid when the rearranged numeric form modulo 97 equals 1.
 * This checks the checksum only and does not look the account up.
 */
export const IBAN_PL_LENGTH = 28

export interface IbanDetails {
  iban: string
  formatted: string
  nrb: string
}

export type IbanValidation = ValidationResult<IbanDetails>

export function formatIban(iban: string): string {
  return iban.replace(/(.{4})/g, '$1 ').trim()
}

export function validateIbanPl(input: string): IbanValidation {
  const compact = stripSeparators(input).toUpperCase()
  if (compact.length === 0) {
    return invalid('empty')
  }
  if (!/^[A-Z0-9]+$/.test(compact)) {
    return invalid('invalid-characters')
  }
  if (!/^[A-Z]{2}/.test(compact)) {
    return invalid('invalid-format')
  }
  if (!compact.startsWith('PL')) {
    return invalid('unsupported-country')
  }
  if (compact.length !== IBAN_PL_LENGTH) {
    return invalid('invalid-length')
  }
  if (!/^PL\d{26}$/.test(compact)) {
    return invalid('invalid-characters')
  }
  if (ibanMod97(compact) !== 1) {
    return invalid('invalid-checksum')
  }

  return {
    valid: true,
    iban: compact,
    formatted: formatIban(compact),
    nrb: compact.slice(2),
  }
}

function ibanMod97(iban: string): number {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`
  let expanded = ''
  for (const char of rearranged) {
    const code = char.charCodeAt(0)
    expanded += code >= 65 ? String(code - 55) : char
  }

  let remainder = 0
  for (const char of expanded) {
    remainder = (remainder * 10 + (char.charCodeAt(0) - 48)) % 97
  }
  return remainder
}
