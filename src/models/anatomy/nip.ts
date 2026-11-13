import { NIP_WEIGHTS, formatNip, validateNip } from '../../lib/generators/nip'
import type { AnatomyCell, AnatomyPart, CellState, ChecksumAnatomy } from './types'
import { NIP_ANATOMY_SLUG } from './types'
import {
  ALL_ZERO_DETAIL,
  CHECKSUM_CAVEAT,
  INVALID_HEADLINE,
  VALID_HEADLINE,
  VALID_NOTE,
  anatomyCopy,
  checkFact,
  invalidSummary,
  mod11Agree,
  partialLine,
  positionDetail,
  sumExpression,
  validSummary,
  weightedMismatch,
} from './copy'
import { compact, digitsOf, isAllZero, type InputShape } from './parse'
import { nipDigitMatches, toWeightedStep, weightedCalculation } from './weighted'

const LENGTH = 10
const GROUP_ENDS = new Set([2, 5, 7])
const PROMPT = partialLine(LENGTH, 'cyfr')

export interface NipRevealInput {
  shape: InputShape
  checksumMatches: boolean
  allZero: boolean
}

/**
 * NIP is a level-3 tool. All zeros stay invalid even when the sum is 0,
 * and that case still stops before the modulus.
 */
export function nipRevealLevel(input: NipRevealInput): ChecksumAnatomy['revealLevel'] {
  switch (input.shape) {
    case 'empty':
    case 'partial':
      return 'format-only'
    case 'unusable':
      return 'n/a'
    case 'complete':
      if (input.allZero || !input.checksumMatches) return 'level3'
      return 'full'
    default: {
      const unexpected: never = input.shape
      return unexpected
    }
  }
}

export function nipAnatomy(input: string): ChecksumAnatomy {
  const value = compact(input)
  const shape = nipShape(value)
  const chars = [...value]
  const allZero = shape === 'complete' && isAllZero(value)
  const calculation =
    shape === 'complete' ? weightedCalculation(digitsOf(value).slice(0, 9), NIP_WEIGHTS) : null
  const typedCheck = chars[9] ?? ''
  const checksumMatches =
    calculation !== null && nipDigitMatches(calculation.sum, Number(typedCheck))

  if (shape === 'complete' && calculation !== null) {
    if (checksumMatches !== validateNip(value).valid) {
      throw new Error('NIP walkthrough disagrees with validateNip')
    }
  }

  const revealLevel = nipRevealLevel({ shape, checksumMatches, allZero })
  const check: 'none' | 'ok' | 'bad' | 'neutral' =
    revealLevel === 'full' ? 'ok' : revealLevel === 'level3' && !allZero ? 'bad' : 'neutral'

  const lines: string[] = []
  let detail: string | null = null
  let caveat: string | null = null
  const facts = []
  const steps = []

  if (revealLevel === 'format-only') {
    lines.push(PROMPT)
  } else if (calculation !== null && revealLevel === 'full') {
    lines.push(sumExpression(calculation.terms, calculation.sum))
    lines.push(mod11Agree(calculation.sum, typedCheck, '10. cyfrą'))
    steps.push(
      toWeightedStep({
        calculation,
        reveal: 'full',
        formula: 'mod11',
        actual: typedCheck,
      }),
    )
  } else if (calculation !== null && revealLevel === 'level3') {
    lines.push(sumExpression(calculation.terms, calculation.sum))
    steps.push(toWeightedStep({ calculation, reveal: 'level3' }))
    if (allZero) {
      detail = ALL_ZERO_DETAIL
    } else {
      lines.push(weightedMismatch('10. cyfrą', typedCheck))
      detail = positionDetail(10, 'cyframi')
      caveat = CHECKSUM_CAVEAT
    }
  }

  if (shape === 'complete') {
    facts.push({ label: 'Zapis z myślnikami', value: formatNip(value) })
    if (!allZero) {
      facts.push({
        label: 'Cyfra kontrolna',
        value: checkFact(typedCheck, revealLevel === 'full', 'cyframi'),
      })
    }
  }

  const headline = headlineFor(revealLevel, lines[0] ?? '')
  const summary = summaryFor(revealLevel, value, typedCheck, detail)

  return {
    slug: NIP_ANATOMY_SLUG,
    revealLevel,
    parts: nipParts(Math.max(LENGTH, chars.length)),
    cells: nipCells(chars, check),
    complete: shape === 'complete',
    valid: revealLevel === 'full',
    copy: anatomyCopy({
      headline,
      detail: revealLevel === 'full' ? VALID_NOTE : detail,
      summary,
      lines,
      caveat,
      facts,
    }),
    steps,
  }
}

function nipShape(value: string): InputShape {
  if (value.length === 0) return 'empty'
  if (!/^\d+$/.test(value)) return 'unusable'
  if (value.length < LENGTH) return 'partial'
  if (value.length > LENGTH) return 'unusable'
  return 'complete'
}

function nipParts(cellCount: number): AnatomyPart[] {
  const end = Math.max(LENGTH, cellCount)
  return [
    { from: 0, to: 9, labelKey: 'number', role: 'data' },
    { from: 9, to: end, labelKey: 'check', role: 'check' },
  ]
}

function nipCells(chars: readonly string[], check: 'none' | 'ok' | 'bad' | 'neutral'): AnatomyCell[] {
  const length = Math.max(LENGTH, chars.length)
  return Array.from({ length }, (_, index) => {
    const char = chars[index] ?? ''
    const groupEnd = GROUP_ENDS.has(index)
    if (char === '') {
      return groupEnd
        ? { index, char: '', state: 'empty' as const, groupEnd: true as const }
        : { index, char: '', state: 'empty' as const }
    }
    let state: CellState = 'filled'
    const digit = char >= '0' && char <= '9'
    if (!digit || index >= LENGTH) state = 'bad'
    else if (index === 9 && check === 'ok') state = 'check-ok'
    else if (index === 9 && check === 'bad') state = 'bad'
    return groupEnd ? { index, char, state, groupEnd: true } : { index, char, state }
  })
}

function headlineFor(revealLevel: ChecksumAnatomy['revealLevel'], firstLine: string): string {
  switch (revealLevel) {
    case 'format-only':
      return firstLine
    case 'full':
      return VALID_HEADLINE
    case 'level3':
    case 'level2':
    case 'n/a':
      return INVALID_HEADLINE
    default: {
      const unexpected: never = revealLevel
      return unexpected
    }
  }
}

function summaryFor(
  revealLevel: ChecksumAnatomy['revealLevel'],
  value: string,
  typedCheck: string,
  detail: string | null,
): string {
  switch (revealLevel) {
    case 'format-only':
      return PROMPT
    case 'full':
      return validSummary(
        `Zapis z myślnikami: ${formatNip(value)}, cyfra kontrolna: ${typedCheck}.`,
      )
    case 'level3':
      return invalidSummary(detail ?? ALL_ZERO_DETAIL)
    case 'level2':
    case 'n/a':
      return detail === null ? `${INVALID_HEADLINE}.` : invalidSummary(detail)
    default: {
      const unexpected: never = revealLevel
      return unexpected
    }
  }
}
