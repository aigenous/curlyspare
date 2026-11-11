import type { PeselSex, ValidationErrorCode } from '../../lib/generators'
import { INVALID_NUMBER_LABEL } from './verdicts'

export const COUNT_RANGE_ERROR = 'Podaj liczbę od 1 do 100.'

const validationText: Record<ValidationErrorCode, string> = {
  empty: 'Wpisz numer.',
  'invalid-characters': INVALID_NUMBER_LABEL,
  'invalid-length': INVALID_NUMBER_LABEL,
  'invalid-format': INVALID_NUMBER_LABEL,
  'invalid-checksum': INVALID_NUMBER_LABEL,
  'invalid-date': INVALID_NUMBER_LABEL,
  'unsupported-country': 'Ten kraj nie jest obsługiwany.',
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
