export const GENERATED_NUMBER_LABEL =
  'Poprawny format i suma kontrolna – dane fikcyjne (TEST)'

export const VALID_NUMBER_LABEL = 'Poprawny format i suma kontrolna'

export const VALID_NUMBER_CAVEAT = 'Nie potwierdza, że numer istnieje ani do kogo należy.'

export const INVALID_NUMBER_LABEL = 'Niepoprawny format lub suma kontrolna'

export const VAT_VALID_LABEL =
  'Poprawny format numeru VAT UE – nie sprawdzono w VIES (status podatnika nieznany)'

export function vinPassLabel(checkDigitVerified: boolean): string {
  return checkDigitVerified ? 'Poprawny format VIN i cyfra kontrolna' : 'Poprawny format VIN'
}
