import { PESEL_WEIGHTS, parsePesel, validatePesel, type PeselParse } from '../../lib/generators/pesel'
import {
  PESEL_ANATOMY_SLUG,
  type AnatomyCell,
  type AnatomyPart,
  type CellState,
  type ChecksumAnatomy,
  type WeightedSumStep,
} from './types'

const LENGTH = 11

/**
 * Birth date, serial with the sex digit, then the check digit.
 * Ranges match the segment prototype: [0,6), [6,10), [10,11).
 */
const PARTS: readonly AnatomyPart[] = [
  { from: 0, to: 6, labelKey: 'birth-date', role: 'data' },
  { from: 6, to: 10, labelKey: 'serial-and-sex', role: 'serial' },
  { from: 10, to: 11, labelKey: 'check', role: 'check' },
]

/**
 * Anatomy for a PESEL, including a partial value.
 * The sum uses `parsePesel`, and a complete number is accepted only when `validatePesel` accepts it.
 */
export function peselAnatomy(input: string): ChecksumAnatomy {
  const parsed = parsePesel(input)
  const verdict = parsed.complete ? validatePesel(parsed.digits.join('')) : null
  return {
    slug: PESEL_ANATOMY_SLUG,
    parts: PARTS,
    cells: cellsOf(parsed),
    complete: parsed.complete,
    valid: verdict?.valid ?? false,
    steps: stepsOf(parsed),
  }
}

function cellsOf(parsed: PeselParse): AnatomyCell[] {
  return Array.from({ length: LENGTH }, (_, index) => {
    const digit = parsed.digits[index]
    if (digit === undefined) {
      return { index, char: '', state: 'empty' }
    }
    return { index, char: String(digit), state: stateAt(index, parsed) }
  })
}

function stateAt(index: number, parsed: PeselParse): CellState {
  if (!parsed.complete) {
    return 'filled'
  }
  if (index < 6 && parsed.dateOk === false) {
    return 'bad'
  }
  if (index === 10) {
    return parsed.checksumOk === true ? 'check-ok' : 'bad'
  }
  return 'filled'
}

function stepsOf(parsed: PeselParse): WeightedSumStep[] {
  if (parsed.sum === undefined || parsed.expected === undefined) {
    return []
  }
  const terms = PESEL_WEIGHTS.map((weight, index) => ({
    weight,
    value: parsed.digits[index] ?? 0,
  }))
  return [
    {
      kind: 'weighted-sum',
      terms,
      sum: parsed.sum,
      modulus: 10,
      formula: 'mod10-complement',
      expected: String(parsed.expected),
      actual: parsed.complete ? String(parsed.digits[10] ?? '') : null,
      matches: parsed.complete ? parsed.checksumOk === true : null,
    },
  ]
}
