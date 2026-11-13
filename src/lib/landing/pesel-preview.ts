import { PESEL_WEIGHTS, parsePesel, type PeselParse, type PeselSexCode } from '../generators/pesel'

/** Published algorithm example. Checksum-valid. It is not stored or put in the URL. */
export const PESEL_EXAMPLE = '44051401359'
export const PESEL_LENGTH = 11

const CHECKSUM_CAVEAT =
  'Błąd może być w dowolnej cyfrze, nie tylko w cyfrze kontrolnej. Sprawdź cały numer ze źródłem, zamiast poprawiać jedną cyfrę.'

const MONTHS = [
  'stycznia',
  'lutego',
  'marca',
  'kwietnia',
  'maja',
  'czerwca',
  'lipca',
  'sierpnia',
  'września',
  'października',
  'listopada',
  'grudnia',
] as const

export type PeselCellState = 'empty' | 'filled' | 'bad' | 'mark'

export interface PeselPreviewCell {
  text: string
  state: PeselCellState
}

export interface PeselPreviewPart {
  label: string
  cells: readonly PeselPreviewCell[]
}

export interface PeselPreviewFact {
  term: string
  detail: string
}

export interface PeselTerm {
  weight: number
  digit: number
}

export type PeselPreviewCalc =
  | { mode: 'pending'; message: string }
  | { mode: 'match'; terms: readonly PeselTerm[]; sum: number; digit: number }
  | { mode: 'mismatch'; terms: readonly PeselTerm[]; sum: number; message: string; caveat: string }

export interface PeselPreview {
  tone: 'idle' | 'ok' | 'error'
  headline: string
  note: string
  parts: readonly PeselPreviewPart[]
  facts: readonly PeselPreviewFact[]
  calc: PeselPreviewCalc
}

/**
 * Landing-demo view of a PESEL.
 * `parsePesel` may compute an expected digit. This view never reads that field.
 * A matching checksum may show the digit the visitor typed. A failing one stops at the sum.
 */
export function previewPesel(input: string): PeselPreview {
  const compact = input.replace(/\D/g, '').slice(0, PESEL_LENGTH)
  const parsed = parsePesel(compact)
  const cells = cellsFor(parsed)
  return {
    ...statusFor(parsed),
    parts: [
      { label: 'data urodzenia', cells: cells.slice(0, 6) },
      { label: 'seria i płeć', cells: cells.slice(6, 10) },
      { label: 'kontrolna', cells: cells.slice(10, 11) },
    ],
    facts: factsFor(parsed),
    calc: calcFor(parsed),
  }
}

function statusFor(parsed: PeselParse): Pick<PeselPreview, 'tone' | 'headline' | 'note'> {
  if (parsed.digits.length === 0) {
    return { tone: 'idle', headline: 'Wpisz 11 cyfr. Pokażemy budowę numeru i obliczenia.', note: '' }
  }
  if (!parsed.complete) {
    return { tone: 'idle', headline: `Wpisano ${parsed.digits.length} z 11 cyfr.`, note: '' }
  }
  if (parsed.valid) {
    return {
      tone: 'ok',
      headline: 'Poprawny format i suma kontrolna',
      note: 'Nie potwierdza, że numer istnieje ani do kogo należy.',
    }
  }
  return {
    tone: 'error',
    headline: 'Niepoprawny format lub suma kontrolna',
    note:
      parsed.dateOk === false
        ? 'Cyfry 1–6 nie tworzą poprawnej daty.'
        : 'Cyfra kontrolna na pozycji 11 nie zgadza się z pozostałymi cyframi.',
  }
}

function factsFor(parsed: PeselParse): PeselPreviewFact[] {
  if (!parsed.complete) return []
  const digit = parsed.digits[10]
  const sex = parsed.sex
  return [
    {
      term: 'Data urodzenia',
      detail: parsed.dateOk && parsed.date ? polishDate(parsed.date) : 'nie da się odczytać',
    },
    { term: 'Płeć', detail: sex ? sexDetail(sex) : 'nie da się odczytać' },
    {
      term: 'Cyfra kontrolna',
      detail: `${digit ?? ''}, ${parsed.checksumOk ? 'zgodna' : 'niezgodna'} z pozostałymi cyframi`,
    },
  ]
}

function calcFor(parsed: PeselParse): PeselPreviewCalc {
  const pending = 'Obliczenia pojawią się po wpisaniu 11 cyfr.'
  if (!parsed.complete || parsed.sum === undefined) return { mode: 'pending', message: pending }
  const digit = parsed.digits[10]
  if (digit === undefined) return { mode: 'pending', message: pending }
  const terms = PESEL_WEIGHTS.map((weight, index) => ({
    weight,
    digit: parsed.digits[index] ?? 0,
  }))
  if (parsed.checksumOk === true) return { mode: 'match', terms, sum: parsed.sum, digit }
  return {
    mode: 'mismatch',
    terms,
    sum: parsed.sum,
    message: `Suma kontrolna się nie zgadza z 11. cyfrą (wpisano ${digit}).`,
    caveat: CHECKSUM_CAVEAT,
  }
}

function cellsFor(parsed: PeselParse): PeselPreviewCell[] {
  return Array.from({ length: PESEL_LENGTH }, (_, index) => {
    const digit = parsed.digits[index]
    if (digit === undefined) return { text: '·', state: 'empty' }
    const text = String(digit)
    if (!parsed.complete) return { text, state: 'filled' }
    if (index < 6 && parsed.dateOk === false) return { text, state: 'bad' }
    if (index === 10) return { text, state: parsed.checksumOk === true ? 'mark' : 'bad' }
    return { text, state: 'filled' }
  })
}

function polishDate(date: { year: number; month: number; day: number }): string {
  const month = MONTHS[date.month - 1]
  if (month === undefined) return 'nie da się odczytać'
  return `${date.day} ${month} ${date.year}`
}

function sexDetail(sex: PeselSexCode): string {
  switch (sex) {
    case 'F':
      return 'kobieta (10. cyfra jest parzysta)'
    case 'M':
      return 'mężczyzna (10. cyfra jest nieparzysta)'
    default: {
      const unexpected: never = sex
      return unexpected
    }
  }
}
