import type { AnatomyCopy, AnatomyFact, WeightedTerm } from './types'

/** Same words as `verdicts.ts`. Duplicated so this folder does not import the tool tree. */
export const VALID_HEADLINE = 'Poprawny format i suma kontrolna'
export const VALID_NOTE = 'Nie potwierdza, że numer istnieje ani do kogo należy.'
export const INVALID_HEADLINE = 'Niepoprawny format lub suma kontrolna'

export const CHECKSUM_CAVEAT =
  'Błąd może być w dowolnej cyfrze, nie tylko w cyfrze kontrolnej. Sprawdź cały numer ze źródłem, zamiast poprawiać jedną cyfrę.'

/** Not in the approved string list. Neutral, and it does not name a replacement digit. */
export const ALL_ZERO_DETAIL = 'Numer złożony z samych zer nie jest nadawany.'

export const REMAINDER_TEN_NOTE = 'Reszta 10 zapisuje się jako 0.'
export const ZERO_WEIGHT_NOTE = 'Waga 0: piąta cyfra nie wpływa na tę sumę.'

export const ID_CARD_MISMATCH = 'Suma kontrolna się nie zgadza z cyfrą kontrolną (pozycja 4).'
export const PASSPORT_MISMATCH = 'Suma kontrolna się nie zgadza z cyfrą kontrolną (pozycja 3).'
export const ID_CARD_DETAIL = 'Cyfra kontrolna na pozycji 4 nie zgadza się z pozostałymi znakami.'
export const PASSPORT_DETAIL = 'Cyfra kontrolna na pozycji 3 nie zgadza się z pozostałymi znakami.'
export const IBAN_DETAIL = 'Cyfry kontrolne na pozycjach 3–4 nie zgadzają się z resztą numeru.'

/**
 * The approved list has no sentence for a sort-code failure whose IBAN check matches.
 * This one names the check and does not name a replacement digit.
 */
export const SORT_CODE_DETAIL =
  'Cyfra kontrolna numeru rozliczeniowego nie zgadza się z pozostałymi cyframi.'

export function partialLine(count: number, unit: 'cyfr' | 'znaków'): string {
  return `Obliczenia pojawią się po wpisaniu ${count} ${unit}.`
}

export function positionDetail(position: number, rest: 'cyframi' | 'znakami'): string {
  return `Cyfra kontrolna na pozycji ${position} nie zgadza się z pozostałymi ${rest}.`
}

export function weightedMismatch(place: string, typed: string): string {
  return `Suma kontrolna się nie zgadza z ${place} (wpisano ${typed}).`
}

export function sumExpression(terms: readonly WeightedTerm[], sum: number): string {
  return `${terms.map((term) => `${term.weight}·${term.value}`).join(' + ')} = ${sum}`
}

export function productExpression(terms: readonly WeightedTerm[]): string {
  return terms.map((term) => `${term.weight}·${term.value} = ${term.product}`).join(', ')
}

export function mod11Agree(sum: number, actual: string, place: string): string {
  return `${sum} mod 11 = ${actual} ✓ zgadza się z ${place}`
}

export function mod11TenAgree(sum: number, place: string): string {
  return `${sum} mod 11 = 10 → 0 ✓ zgadza się z ${place}`
}

export function mod10Agree(sum: number, actual: string, place: string): string {
  return `${sum} mod 10 = ${actual} ✓ zgadza się z ${place}`
}

export function divisibleByTen(sum: number): string {
  return `${sum} mod 10 = 0 ✓ suma jest podzielna przez 10`
}

export function checkFact(typed: string, agrees: boolean, rest: 'cyframi' | 'znakami'): string {
  return `${typed}, ${agrees ? 'zgodna' : 'niezgodna'} z pozostałymi ${rest}`
}

export function ibanCheckFact(typed: string, agrees: boolean): string {
  return `${typed}, ${agrees ? 'zgodne' : 'niezgodne'} z resztą numeru`
}

export function invalidSummary(detail: string): string {
  return `${INVALID_HEADLINE}. ${detail}`
}

export function validSummary(sentence: string): string {
  return `${VALID_HEADLINE}. ${sentence} ${VALID_NOTE}`
}

export function anatomyCopy(input: {
  headline: string
  detail: string | null
  summary: string
  lines: readonly string[]
  caveat: string | null
  facts?: readonly AnatomyFact[]
}): AnatomyCopy {
  return {
    headline: input.headline,
    detail: input.detail,
    summary: input.summary,
    lines: input.lines,
    caveat: input.caveat,
    facts: input.facts ?? [],
  }
}
