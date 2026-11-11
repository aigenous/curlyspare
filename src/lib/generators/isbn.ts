import { gtinCheckDigit } from './gtin'
import { invalid, stripSeparators, toDigits, type ValidationResult } from './validation'

/**
 * ISBN-10 uses weights 10…1 and a check digit of X when the remainder is 10.
 * ISBN-13 is an EAN-13 with prefix 978 or 979. Only the 978 range converts back to ISBN-10.
 */
export interface IsbnDetails {
  isbn: string
  kind: 'ISBN-10' | 'ISBN-13'
  isbn10: string | null
  isbn13: string
}

export type IsbnValidation = ValidationResult<IsbnDetails>

export function validateIsbn(input: string): IsbnValidation {
  const compact = stripSeparators(input).toUpperCase()
  if (compact.length === 0) {
    return invalid('empty')
  }
  if (compact.length === 10) {
    return validateIsbn10(compact)
  }
  if (compact.length === 13) {
    return validateIsbn13(compact)
  }
  if (!/^[\dX]+$/.test(compact)) {
    return invalid('invalid-characters')
  }
  return invalid('invalid-length')
}

export function isbn10To13(isbn10: string): string {
  const body = `978${isbn10.slice(0, 9)}`
  return `${body}${gtinCheckDigit(toDigits(body))}`
}

export function isbn13To10(isbn13: string): string | null {
  if (!isbn13.startsWith('978')) {
    return null
  }
  const body = isbn13.slice(3, 12)
  return `${body}${isbn10CheckCharacter(body)}`
}

function validateIsbn10(value: string): IsbnValidation {
  if (!/^\d{9}[\dX]$/.test(value)) {
    return /[^0-9X]/.test(value) ? invalid('invalid-characters') : invalid('invalid-format')
  }
  if (!isbn10Checksum(value)) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    isbn: value,
    kind: 'ISBN-10',
    isbn10: value,
    isbn13: isbn10To13(value),
  }
}

function validateIsbn13(value: string): IsbnValidation {
  if (!/^\d{13}$/.test(value)) {
    return invalid('invalid-characters')
  }
  if (!value.startsWith('978') && !value.startsWith('979')) {
    return invalid('invalid-format')
  }
  const digits = toDigits(value)
  if (digits[12] !== gtinCheckDigit(digits.slice(0, 12))) {
    return invalid('invalid-checksum')
  }
  return {
    valid: true,
    isbn: value,
    kind: 'ISBN-13',
    isbn10: isbn13To10(value),
    isbn13: value,
  }
}

function isbn10Checksum(value: string): boolean {
  let sum = 0
  for (let index = 0; index < 10; index += 1) {
    const char = value.charAt(index)
    sum += (char === 'X' ? 10 : char.charCodeAt(0) - 48) * (10 - index)
  }
  return sum % 11 === 0
}

function isbn10CheckCharacter(body: string): string {
  let sum = 0
  for (let index = 0; index < 9; index += 1) {
    sum += (body.charCodeAt(index) - 48) * (10 - index)
  }
  const check = (11 - (sum % 11)) % 11
  return check === 10 ? 'X' : String(check)
}
