import type { PeselSex, ValidationErrorCode } from '../../lib/generators'

export const COUNT_RANGE_ERROR = 'Podaj liczbę od 1 do 100.'

const validationText: Record<ValidationErrorCode, string> = {
  empty: 'Wpisz numer.',
  'invalid-characters': 'Numer zawiera niedozwolone znaki.',
  'invalid-length': 'Nieprawidłowa liczba znaków.',
  'invalid-format': 'Nieprawidłowy format numeru.',
  'invalid-checksum': 'Suma kontrolna się nie zgadza.',
  'invalid-date': 'Numer koduje nieistniejącą datę.',
  'unsupported-country': 'Obsługiwany jest wyłącznie polski IBAN (PL).',
}

export function readCount(value: number): number | null {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    return null
  }
  return value
}

export function validationMessage(code: ValidationErrorCode): string {
  return validationText[code]
}

export function peselSexLabel(sex: PeselSex): string {
  switch (sex) {
    case 'kobieta':
      return 'kobieta'
    case 'mezczyzna':
      return 'mężczyzna'
    default: {
      const unexpected: never = sex
      return String(unexpected)
    }
  }
}
