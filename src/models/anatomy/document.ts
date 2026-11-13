import { alphanumericValue } from '../../lib/generators/checksum'
import type {
  AnatomyCell,
  AnatomyPart,
  AnatomySlug,
  CellState,
  ChecksumAnatomy,
  RevealLevel,
} from './types'
import {
  CHECKSUM_CAVEAT,
  INVALID_HEADLINE,
  VALID_HEADLINE,
  VALID_NOTE,
  anatomyCopy,
  checkFact,
  divisibleByTen,
  invalidSummary,
  partialLine,
  productExpression,
  sumExpression,
  validSummary,
} from './copy'
import { compact, type InputShape } from './parse'
import { toWeightedStep, weightedCalculation, type WeightedCalculation } from './weighted'

const PROMPT = partialLine(9, 'znaków')

export interface DocumentModelSpec {
  slug: AnatomySlug
  seriesLength: number
  checkIndex: number
  weights: readonly number[]
  pattern: RegExp
  mismatch: string
  detail: string
  reveal: (input: { shape: InputShape; checksumMatches: boolean }) => RevealLevel
  agrees: (value: string) => boolean
}

/** Shared builder for the ID card and the passport. Each tool supplies its own reveal function. */
export function documentAnatomy(input: string, spec: DocumentModelSpec): ChecksumAnatomy {
  const value = compact(input)
  const shape = documentShape(value, spec.pattern)
  const chars = [...value]
  const calculation = shape === 'complete' ? documentCalculation(value, spec.weights) : null

  if (calculation !== null) {
    const calculated = calculation.sum % 10 === 0
    if (calculated !== spec.agrees(value)) {
      throw new Error('Document walkthrough disagrees with the validator')
    }
  }

  const checksumMatches = calculation !== null && calculation.sum % 10 === 0
  const revealLevel = spec.reveal({ shape, checksumMatches })
  const lines: string[] = []
  const steps = []
  let detail: string | null = null
  let caveat: string | null = null

  if (revealLevel === 'format-only') {
    lines.push(PROMPT)
  } else if (calculation !== null && revealLevel === 'full') {
    lines.push(sumExpression(calculation.terms, calculation.sum))
    lines.push(divisibleByTen(calculation.sum))
    steps.push(
      toWeightedStep({
        calculation,
        reveal: 'full',
        formula: 'mod10-zero',
        actual: chars[spec.checkIndex] ?? '',
      }),
    )
  } else if (calculation !== null && revealLevel === 'level2') {
    lines.push(productExpression(calculation.terms))
    lines.push(spec.mismatch)
    detail = spec.detail
    caveat = CHECKSUM_CAVEAT
    steps.push(toWeightedStep({ calculation, reveal: 'level2' }))
  }

  const typedCheck = chars[spec.checkIndex] ?? ''
  const facts =
    shape === 'complete'
      ? [
          { label: 'Seria', value: value.slice(0, spec.seriesLength) },
          { label: 'Numer', value: value.slice(spec.checkIndex + 1) },
          {
            label: 'Cyfra kontrolna',
            value: checkFact(typedCheck, revealLevel === 'full', 'znakami'),
          },
        ]
      : []

  return {
    slug: spec.slug,
    revealLevel,
    parts: documentParts(spec.seriesLength, Math.max(9, chars.length)),
    cells: documentCells(chars, spec, judged(revealLevel)),
    complete: shape === 'complete',
    valid: revealLevel === 'full',
    copy: anatomyCopy({
      headline: headlineFor(revealLevel),
      detail: revealLevel === 'full' ? VALID_NOTE : detail,
      summary: summaryFor(revealLevel, spec, value, typedCheck),
      lines,
      caveat,
      facts,
    }),
    steps,
  }
}

export function documentCalculation(
  value: string,
  weights: readonly number[],
): WeightedCalculation {
  const values = [...value].map((char) => alphanumericValue(char))
  return weightedCalculation(values, weights)
}

function documentShape(value: string, pattern: RegExp): InputShape {
  if (value.length === 0) return 'empty'
  if (!/^[A-Z0-9]+$/.test(value)) return 'unusable'
  if (value.length < 9) return 'partial'
  if (value.length > 9 || !pattern.test(value)) return 'unusable'
  return 'complete'
}

function documentParts(seriesLength: number, cellCount: number): AnatomyPart[] {
  const end = Math.max(9, cellCount)
  return [
    { from: 0, to: seriesLength, labelKey: 'series', role: 'letters' },
    { from: seriesLength, to: seriesLength + 1, labelKey: 'check', role: 'check' },
    { from: seriesLength + 1, to: end, labelKey: 'number', role: 'serial' },
  ]
}

function documentCells(
  chars: readonly string[],
  spec: DocumentModelSpec,
  check: 'none' | 'ok' | 'bad',
): AnatomyCell[] {
  const length = Math.max(9, chars.length)
  return Array.from({ length }, (_, index) => {
    const char = chars[index] ?? ''
    if (char === '') return { index, char: '', state: 'empty' as const }
    const letter = char >= 'A' && char <= 'Z'
    const digit = char >= '0' && char <= '9'
    const letterSlot = index < spec.seriesLength
    const wellTyped = index >= 9 ? false : letterSlot ? letter : digit
    let state: CellState = wellTyped ? 'filled' : 'bad'
    if (wellTyped && index === spec.checkIndex && check === 'ok') state = 'check-ok'
    if (wellTyped && index === spec.checkIndex && check === 'bad') state = 'bad'
    return letter ? { index, char, state, value: alphanumericValue(char) } : { index, char, state }
  })
}

function judged(revealLevel: RevealLevel): 'none' | 'ok' | 'bad' {
  switch (revealLevel) {
    case 'full':
      return 'ok'
    case 'level2':
      return 'bad'
    case 'level3':
    case 'format-only':
    case 'n/a':
      return 'none'
    default: {
      const unexpected: never = revealLevel
      return unexpected
    }
  }
}

function headlineFor(revealLevel: RevealLevel): string {
  switch (revealLevel) {
    case 'format-only':
      return PROMPT
    case 'full':
      return VALID_HEADLINE
    case 'level2':
    case 'level3':
    case 'n/a':
      return INVALID_HEADLINE
    default: {
      const unexpected: never = revealLevel
      return unexpected
    }
  }
}

function summaryFor(
  revealLevel: RevealLevel,
  spec: DocumentModelSpec,
  value: string,
  typedCheck: string,
): string {
  switch (revealLevel) {
    case 'format-only':
      return PROMPT
    case 'full':
      return validSummary(
        `Seria: ${value.slice(0, spec.seriesLength)}, cyfra kontrolna: ${typedCheck}, numer: ${value.slice(spec.checkIndex + 1)}.`,
      )
    case 'level2':
      return invalidSummary(spec.detail)
    case 'level3':
    case 'n/a':
      return `${INVALID_HEADLINE}.`
    default: {
      const unexpected: never = revealLevel
      return unexpected
    }
  }
}
