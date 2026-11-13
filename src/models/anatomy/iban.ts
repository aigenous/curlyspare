import { alphanumericValue, mod97Numeric } from '../../lib/generators/checksum'
import { formatIban, validateIbanPl } from '../../lib/generators/iban'
import { SORT_CODE_WEIGHTS, formatNrb, validateNrb } from '../../lib/generators/nrb'
import type {
  AnatomyCell,
  AnatomyPart,
  CellState,
  ChecksumAnatomy,
  Mod97Step,
  RevealLevel,
} from './types'
import { IBAN_ANATOMY_SLUG } from './types'
import {
  CHECKSUM_CAVEAT,
  IBAN_DETAIL,
  INVALID_HEADLINE,
  SORT_CODE_DETAIL,
  VALID_HEADLINE,
  VALID_NOTE,
  anatomyCopy,
  ibanCheckFact,
  invalidSummary,
  mod10Agree,
  partialLine,
  sumExpression,
  validSummary,
  weightedMismatch,
} from './copy'
import { mod97Chunks } from './mod97'
import { compact, digitsOf, type InputShape } from './parse'
import { toWeightedStep, weightedCalculation } from './weighted'

const IBAN_LENGTH = 28
const NRB_LENGTH = 26
const GROUP_ENDS = new Set([3, 7, 11, 15, 19, 23, 27])
const IBAN_PROMPT = partialLine(IBAN_LENGTH, 'znaków')
const NRB_PROMPT = partialLine(NRB_LENGTH, 'cyfr')

export interface IbanRevealInput {
  shape: InputShape
  country: 'pl' | 'nrb' | 'other' | 'unknown'
  mod97Matches: boolean
  sortMatches: boolean
}

/** Headline level. Either failed check keeps the number invalid. */
export function ibanRevealLevel(input: IbanRevealInput): RevealLevel {
  if (input.country === 'other') return 'n/a'
  switch (input.shape) {
    case 'empty':
    case 'partial':
      return 'format-only'
    case 'unusable':
      return 'n/a'
    case 'complete':
      return input.mod97Matches && input.sortMatches ? 'full' : 'level3'
    default: {
      const unexpected: never = input.shape
      return unexpected
    }
  }
}

export function ibanMod97Reveal(matches: boolean): 'full' | 'level3' {
  return matches ? 'full' : 'level3'
}

/** A failed sort-code check stops at the weighted sum. */
export function sortCodeReveal(matches: boolean): 'full' | 'level3' {
  return matches ? 'full' : 'level3'
}

export function ibanAnatomy(input: string): ChecksumAnatomy {
  const prepared = prepare(compact(input))
  if (prepared.iban === null) {
    return unfinished(prepared)
  }

  const iban = prepared.iban
  const nrb = iban.slice(2)
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`
  const expanded = expand(rearranged)
  const chunks = mod97Chunks(expanded)
  const remainder = mod97Numeric(expanded)
  const lastChunk = chunks[chunks.length - 1]
  if (lastChunk === undefined || lastChunk.remainder !== remainder) {
    throw new Error('Mod 97 chunks disagree with mod97Numeric')
  }
  const mod97Matches = remainder === 1
  const sortCode = iban.slice(4, 12)
  const sortCalculation = weightedCalculation(digitsOf(sortCode.slice(0, 7)), SORT_CODE_WEIGHTS)
  const sortDigit = sortCode.charAt(7)
  const sortMatches = sortCalculation.sum % 10 === Number(sortDigit)

  if (validateIbanPl(iban).valid !== mod97Matches) {
    throw new Error('IBAN walkthrough disagrees with validateIbanPl')
  }
  if ((mod97Matches && sortMatches) !== validateNrb(nrb).valid) {
    throw new Error('NRB walkthrough disagrees with validateNrb')
  }

  const revealLevel = ibanRevealLevel({
    shape: 'complete',
    country: prepared.country,
    mod97Matches,
    sortMatches,
  })
  const mod97Step: Mod97Step = {
    kind: 'mod97',
    reveal: ibanMod97Reveal(mod97Matches),
    rearranged,
    expanded,
    chunks,
    remainder,
    matches: mod97Matches,
  }
  const sortReveal = sortCodeReveal(sortMatches)
  const sortStep = toWeightedStep({
    calculation: sortCalculation,
    reveal: sortReveal,
    formula: sortReveal === 'full' ? 'mod10-zero' : undefined,
    actual: sortReveal === 'full' ? sortDigit : undefined,
  })

  const lines = [
    `Przenieś 4 pierwsze znaki na koniec: ${groupedRearrangement(rearranged)}`,
    prepared.country === 'nrb'
      ? 'Dla NRB dopisujemy PL. Zamień litery na liczby (A = 10 … Z = 35): P = 25, L = 21'
      : 'Zamień litery na liczby (A = 10 … Z = 35): P = 25, L = 21',
    ...chunks.map((chunk) => chunkLine(chunk.carry, chunk.digits, chunk.remainder)),
  ]
  if (mod97Matches) {
    lines.push(`${expanded} mod 97 = 1 ✓ Poprawny IBAN daje resztę 1.`)
  } else {
    lines.push(
      `Po przeniesieniu 4 pierwszych znaków na koniec i zamianie liter na liczby: ${expanded}. ${expanded} mod 97 = ${remainder}. Poprawny IBAN daje resztę 1 – ten numer się nie zgadza.`,
    )
  }
  lines.push(sumExpression(sortCalculation.terms, sortCalculation.sum))
  if (sortMatches) {
    lines.push(mod10Agree(sortCalculation.sum, sortDigit, '8. cyfrą numeru rozliczeniowego'))
  } else {
    lines.push(weightedMismatch('8. cyfrą numeru rozliczeniowego', sortDigit))
  }

  const detail = !mod97Matches ? IBAN_DETAIL : !sortMatches ? SORT_CODE_DETAIL : null
  const checkDigits = iban.slice(2, 4)
  const sortSpaced = `${sortCode.slice(0, 4)} ${sortCode.slice(4)}`
  const countrySentence =
    prepared.country === 'nrb'
      ? `Kraj: PL (dopisany), cyfry kontrolne: ${checkDigits}, numer rozliczeniowy: ${sortSpaced}.`
      : `Kraj: PL, cyfry kontrolne: ${checkDigits}, numer rozliczeniowy: ${sortSpaced}.`

  return {
    slug: IBAN_ANATOMY_SLUG,
    revealLevel,
    parts: ibanParts(prepared.grid.length, prepared.country === 'nrb' ? 'country-assumed' : 'country'),
    cells: ibanCells(prepared.grid, {
      mod97: mod97Matches ? 'check-ok' : 'bad',
      sort: sortMatches ? 'check2-ok' : 'bad',
    }),
    complete: true,
    valid: revealLevel === 'full',
    copy: anatomyCopy({
      headline: revealLevel === 'full' ? VALID_HEADLINE : INVALID_HEADLINE,
      detail: revealLevel === 'full' ? VALID_NOTE : detail,
      summary:
        revealLevel === 'full'
          ? validSummary(countrySentence)
          : invalidSummary(detail ?? IBAN_DETAIL),
      lines,
      caveat: revealLevel === 'full' ? null : CHECKSUM_CAVEAT,
      facts: [
        { label: 'Zapis IBAN', value: formatIban(iban) },
        { label: 'Zapis NRB', value: formatNrb(nrb) },
        { label: 'Cyfry kontrolne', value: ibanCheckFact(checkDigits, mod97Matches) },
      ],
    }),
    steps: [mod97Step, sortStep],
  }
}

interface Prepared {
  shape: InputShape
  country: 'pl' | 'nrb' | 'other' | 'unknown'
  grid: string[]
  iban: string | null
  prompt: string
}

function prepare(value: string): Prepared {
  if (value.length === 0) {
    return { shape: 'empty', country: 'unknown', grid: blanks(IBAN_LENGTH), iban: null, prompt: IBAN_PROMPT }
  }
  if (/^\d+$/.test(value)) {
    const grid = ['', '', ...value.split('')]
    if (value.length < NRB_LENGTH) {
      return {
        shape: 'partial',
        country: 'nrb',
        grid: pad(grid, IBAN_LENGTH),
        iban: null,
        prompt: NRB_PROMPT,
      }
    }
    if (value.length > NRB_LENGTH) {
      return { shape: 'unusable', country: 'nrb', grid, iban: null, prompt: NRB_PROMPT }
    }
    return { shape: 'complete', country: 'nrb', grid, iban: `PL${value}`, prompt: NRB_PROMPT }
  }
  if (/^[A-Z]{2}/.test(value) && !value.startsWith('PL')) {
    return { shape: 'unusable', country: 'other', grid: [...value], iban: null, prompt: IBAN_PROMPT }
  }
  if (!/^PL\d*$/.test(value) && !/^[A-Z]$/.test(value)) {
    return { shape: 'unusable', country: 'unknown', grid: [...value], iban: null, prompt: IBAN_PROMPT }
  }
  if (value.length < IBAN_LENGTH) {
    return {
      shape: 'partial',
      country: 'pl',
      grid: pad([...value], IBAN_LENGTH),
      iban: null,
      prompt: IBAN_PROMPT,
    }
  }
  if (value.length > IBAN_LENGTH || !/^PL\d{26}$/.test(value)) {
    return { shape: 'unusable', country: 'pl', grid: [...value], iban: null, prompt: IBAN_PROMPT }
  }
  return { shape: 'complete', country: 'pl', grid: [...value], iban: value, prompt: IBAN_PROMPT }
}

function unfinished(prepared: Prepared): ChecksumAnatomy {
  const revealLevel = ibanRevealLevel({
    shape: prepared.shape,
    country: prepared.country,
    mod97Matches: false,
    sortMatches: false,
  })
  const countryKey = prepared.country === 'nrb' ? 'country-assumed' : 'country'
  const lines = revealLevel === 'format-only' ? [prepared.prompt] : []
  return {
    slug: IBAN_ANATOMY_SLUG,
    revealLevel,
    parts: ibanParts(prepared.grid.length, countryKey),
    cells: ibanCells(prepared.grid, null),
    complete: false,
    valid: false,
    copy: anatomyCopy({
      headline: revealLevel === 'format-only' ? prepared.prompt : INVALID_HEADLINE,
      detail: null,
      summary: revealLevel === 'format-only' ? prepared.prompt : `${INVALID_HEADLINE}.`,
      lines,
      caveat: null,
    }),
    steps: [],
  }
}

function ibanParts(cellCount: number, countryKey: string): AnatomyPart[] {
  const end = Math.max(cellCount, 1)
  const parts: AnatomyPart[] = [
    { from: 0, to: Math.min(2, end), labelKey: countryKey, role: 'country' },
    { from: 2, to: Math.min(4, end), labelKey: 'check', role: 'check' },
    { from: 4, to: Math.min(12, end), labelKey: 'sort-code', role: 'data' },
    { from: 12, to: Math.max(cellCount, 12), labelKey: 'account', role: 'serial' },
  ]
  return parts.filter((part) => part.to > part.from)
}

function ibanCells(
  grid: readonly string[],
  judged: { mod97: CellState; sort: CellState } | null,
): AnatomyCell[] {
  return grid.map((char, index) => {
    const groupEnd = GROUP_ENDS.has(index) && index < grid.length ? true : undefined
    if (char === '') {
      return groupEnd === undefined
        ? { index, char: '', state: 'empty' as const }
        : { index, char: '', state: 'empty' as const, groupEnd }
    }
    const letter = char >= 'A' && char <= 'Z'
    const digit = char >= '0' && char <= '9'
    const countrySlot = index < 2
    const wellTyped = countrySlot ? letter : digit
    let state: CellState = wellTyped ? 'filled' : 'bad'
    if (judged !== null && wellTyped && (index === 2 || index === 3)) state = judged.mod97
    if (judged !== null && wellTyped && index === 11) state = judged.sort
    const cell: AnatomyCell = letter
      ? { index, char, state, value: alphanumericValue(char) }
      : { index, char, state }
    if (groupEnd === true) cell.groupEnd = true
    return cell
  })
}

function expand(rearranged: string): string {
  let expanded = ''
  for (const char of rearranged) {
    expanded += char >= 'A' && char <= 'Z' ? String(alphanumericValue(char)) : char
  }
  return expanded
}

function groupedRearrangement(rearranged: string): string {
  const digits = rearranged.slice(0, -4).replace(/(.{4})/g, '$1 ').trim()
  return `${digits} ${rearranged.slice(-4)}`
}

function chunkLine(carry: string, digits: string, remainder: number): string {
  const head = carry === '' ? digits : `${carry}|${digits}`
  return `${head} mod 97 = ${String(remainder).padStart(2, '0')}`
}

function blanks(length: number): string[] {
  return Array.from({ length }, () => '')
}

function pad(chars: string[], length: number): string[] {
  const next = chars.slice()
  while (next.length < length) next.push('')
  return next
}
