import { PESEL_WEIGHTS, parsePesel, type PeselParse } from '../../lib/generators/pesel'
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
 * Anatomy for a PESEL, including a partial value.
 * Validity comes only from `parsePesel`. Digits past the eleventh cell are bad.
 */
export function peselAnatomy(input: string): ChecksumAnatomy {
  const parsed = parsePesel(input)
  return {
    slug: PESEL_ANATOMY_SLUG,
    parts: partsFor(parsed.digits.length),
    cells: cellsOf(parsed),
    complete: parsed.complete,
    valid: parsed.valid,
    steps: stepsOf(parsed),
  }
}

/** Birth date, serial with the sex digit, then the check digit. Extra digits stay in the check group. */
function partsFor(digitCount: number): AnatomyPart[] {
  const end = Math.max(LENGTH, digitCount)
  return [
    { from: 0, to: 6, labelKey: 'birth-date', role: 'data' },
    { from: 6, to: 10, labelKey: 'serial-and-sex', role: 'serial' },
    { from: 10, to: end, labelKey: 'check', role: 'check' },
  ]
}

function cellsOf(parsed: PeselParse): AnatomyCell[] {
  const length = Math.max(LENGTH, parsed.digits.length)
  return Array.from({ length }, (_, index) => {
    const digit = parsed.digits[index]
    if (digit === undefined) {
      return { index, char: '', state: 'empty' }
    }
    if (index >= LENGTH) {
      return { index, char: String(digit), state: 'bad' }
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
  if (parsed.sum === undefined) {
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
      actual: parsed.complete ? String(parsed.digits[10] ?? '') : null,
      matches: parsed.complete ? parsed.checksumOk === true : null,
    },
  ]
}
