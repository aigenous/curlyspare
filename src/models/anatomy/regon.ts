import { REGON14_WEIGHTS, REGON9_WEIGHTS, validateRegon } from '../../lib/generators/regon'
import type { AnatomyCell, AnatomyPart, CellState, ChecksumAnatomy, RevealLevel } from './types'
import { REGON_ANATOMY_SLUG } from './types'
import {
  ALL_ZERO_DETAIL,
  CHECKSUM_CAVEAT,
  INVALID_HEADLINE,
  REMAINDER_TEN_NOTE,
  VALID_HEADLINE,
  VALID_NOTE,
  ZERO_WEIGHT_NOTE,
  anatomyCopy,
  checkFact,
  invalidSummary,
  mod11Agree,
  mod11TenAgree,
  partialLine,
  positionDetail,
  sumExpression,
  validSummary,
  weightedMismatch,
} from './copy'
import { compact, digitsOf, isAllZero, type InputShape } from './parse'
import {
  mod11Remainder,
  regonDigitMatches,
  toWeightedStep,
  weightedCalculation,
  type WeightedCalculation,
} from './weighted'

export type RegonViewLength = 9 | 14 | 'auto'

export interface RegonRevealInput {
  shape: InputShape
  allZero: boolean
  check9: 'absent' | 'match' | 'fail'
  check14: 'absent' | 'match' | 'fail'
}

/** Headline level. A 14-digit number with one failing check stays level3, not full. */
export function regonRevealLevel(input: RegonRevealInput): RevealLevel {
  switch (input.shape) {
    case 'empty':
    case 'partial':
      return 'format-only'
    case 'unusable':
      return 'n/a'
    case 'complete': {
      if (input.allZero) return 'level3'
      const failed = input.check9 === 'fail' || input.check14 === 'fail'
      return failed ? 'level3' : 'full'
    }
    default: {
      const unexpected: never = input.shape
      return unexpected
    }
  }
}

/** The passing check is shown in full. The failing check stops at the sum. */
export function regonCheckReveal(matches: boolean, suppressMatch: boolean): 'full' | 'level3' {
  if (suppressMatch || !matches) return 'level3'
  return 'full'
}

export function regonAnatomy(input: string, length: RegonViewLength = 'auto'): ChecksumAnatomy {
  const value = compact(input)
  const target = targetLength(value, length)
  const shape = regonShape(value, target)
  const chars = [...value]
  const digits = shape === 'complete' ? digitsOf(value) : []
  const allZero = shape === 'complete' && isAllZero(value)
  const check9 = shape === 'complete' ? weightedCalculation(digits.slice(0, 8), REGON9_WEIGHTS) : null
  const check14 =
    shape === 'complete' && target === 14
      ? weightedCalculation(digits.slice(0, 13), REGON14_WEIGHTS)
      : null
  const match9 = check9 !== null && regonDigitMatches(check9.sum, digits[8] ?? -1)
  const match14 = check14 === null ? true : regonDigitMatches(check14.sum, digits[13] ?? -1)

  if (shape === 'complete' && (match9 && match14) !== validateRegon(value).valid) {
    throw new Error('REGON walkthrough disagrees with validateRegon')
  }

  const check9State: 'absent' | 'match' | 'fail' =
    check9 === null ? 'absent' : match9 ? 'match' : 'fail'
  const check14State: 'absent' | 'match' | 'fail' =
    check14 === null ? 'absent' : match14 ? 'match' : 'fail'
  const revealLevel = regonRevealLevel({
    shape,
    allZero,
    check9: check9State,
    check14: check14State,
  })

  const lines: string[] = []
  const steps: ChecksumAnatomy['steps'][number][] = []
  if (revealLevel === 'format-only') {
    lines.push(partialLine(target, 'cyfr'))
  }
  if (check9 !== null) {
    pushCheck({
      lines,
      steps,
      calculation: check9,
      matches: match9,
      suppressMatch: allZero,
      place: '9. cyfrą',
      typed: chars[8] ?? '',
      note: undefined,
    })
  }
  if (check14 !== null) {
    pushCheck({
      lines,
      steps,
      calculation: check14,
      matches: match14,
      suppressMatch: allZero,
      place: '14. cyfrą',
      typed: chars[13] ?? '',
      note: ZERO_WEIGHT_NOTE,
    })
  }

  const failed9 = check9State === 'fail'
  const failed14 = check14State === 'fail'
  const detail = allZero
    ? ALL_ZERO_DETAIL
    : failed9
      ? positionDetail(9, 'cyframi')
      : failed14
        ? positionDetail(14, 'cyframi')
        : null
  const caveat = (failed9 || failed14) && !allZero ? CHECKSUM_CAVEAT : null
  const prompt = partialLine(target, 'cyfr')

  return {
    slug: REGON_ANATOMY_SLUG,
    revealLevel,
    parts: regonParts(target, Math.max(target, chars.length)),
    cells: regonCells(chars, target, {
      nine: cellMark(match9, check9 !== null, allZero, target === 14 ? 'secondary' : 'primary'),
      fourteen: cellMark(match14, check14 !== null, allZero, 'primary'),
    }),
    complete: shape === 'complete',
    valid: revealLevel === 'full',
    copy: anatomyCopy({
      headline: headlineFor(revealLevel, prompt),
      detail: revealLevel === 'full' ? VALID_NOTE : detail,
      summary: summaryFor(revealLevel, prompt, detail, chars, target),
      lines,
      caveat,
      facts: shape === 'complete' ? regonFacts(chars, target, match9, match14, allZero) : [],
    }),
    steps,
  }
}

function pushCheck(input: {
  lines: string[]
  steps: ChecksumAnatomy['steps'][number][]
  calculation: WeightedCalculation
  matches: boolean
  suppressMatch: boolean
  place: string
  typed: string
  note: string | undefined
}): void {
  const reveal = regonCheckReveal(input.matches, input.suppressMatch)
  input.lines.push(sumExpression(input.calculation.terms, input.calculation.sum))
  if (input.note !== undefined) input.lines.push(input.note)
  if (reveal === 'full') {
    const remainder = mod11Remainder(input.calculation.sum)
    input.lines.push(
      remainder === 10
        ? mod11TenAgree(input.calculation.sum, input.place)
        : mod11Agree(input.calculation.sum, input.typed, input.place),
    )
    if (remainder === 10) input.lines.push(REMAINDER_TEN_NOTE)
    input.steps.push(
      toWeightedStep({
        calculation: input.calculation,
        reveal,
        formula: remainder === 10 ? 'mod11-ten-is-zero' : 'mod11',
        actual: input.typed,
        note: input.note,
      }),
    )
    return
  }
  if (!input.suppressMatch) {
    input.lines.push(weightedMismatch(input.place, input.typed))
  }
  input.steps.push(
    toWeightedStep({
      calculation: input.calculation,
      reveal: 'level3',
      note: input.note,
    }),
  )
}

function targetLength(value: string, mode: RegonViewLength): 9 | 14 {
  switch (mode) {
    case 9:
      return 9
    case 14:
      return 14
    case 'auto':
      return value.length > 9 ? 14 : 9
    default: {
      const unexpected: never = mode
      return unexpected
    }
  }
}

function regonShape(value: string, target: 9 | 14): InputShape {
  if (value.length === 0) return 'empty'
  if (!/^\d+$/.test(value)) return 'unusable'
  if (value.length < target) return 'partial'
  if (value.length > target) return 'unusable'
  return 'complete'
}

function regonParts(target: 9 | 14, cellCount: number): AnatomyPart[] {
  const end = Math.max(target, cellCount)
  if (target === 9) {
    return [
      { from: 0, to: 8, labelKey: 'number', role: 'data' },
      { from: 8, to: end, labelKey: 'check', role: 'check' },
    ]
  }
  return [
    { from: 0, to: 8, labelKey: 'number', role: 'data' },
    { from: 8, to: 9, labelKey: 'check-9', role: 'check-secondary' },
    { from: 9, to: 13, labelKey: 'local-unit', role: 'serial' },
    { from: 13, to: end, labelKey: 'check', role: 'check' },
  ]
}

function cellMark(
  matches: boolean,
  present: boolean,
  allZero: boolean,
  kind: 'primary' | 'secondary',
): CellState | null {
  if (!present || allZero) return null
  if (!matches) return 'bad'
  return kind === 'primary' ? 'check-ok' : 'check2-ok'
}

function regonCells(
  chars: readonly string[],
  target: 9 | 14,
  marks: { nine: CellState | null; fourteen: CellState | null },
): AnatomyCell[] {
  const length = Math.max(target, chars.length)
  const nineIndex = 8
  const fourteenIndex = target === 14 ? 13 : -1
  return Array.from({ length }, (_, index) => {
    const char = chars[index] ?? ''
    if (char === '') return { index, char: '', state: 'empty' as const }
    const digit = char >= '0' && char <= '9'
    if (!digit || index >= target) return { index, char, state: 'bad' as const }
    if (index === nineIndex && marks.nine !== null) return { index, char, state: marks.nine }
    if (index === fourteenIndex && marks.fourteen !== null) {
      return { index, char, state: marks.fourteen }
    }
    return { index, char, state: 'filled' as const }
  })
}

function regonFacts(
  chars: readonly string[],
  target: 9 | 14,
  match9: boolean,
  match14: boolean,
  allZero: boolean,
): { label: string; value: string }[] {
  if (allZero) return []
  const facts = [
    {
      label: 'Cyfra kontrolna',
      value: checkFact(chars[target === 14 ? 13 : 8] ?? '', target === 14 ? match14 : match9, 'cyframi'),
    },
  ]
  if (target === 14) {
    facts.unshift({
      label: 'Cyfra kontrolna 9',
      value: checkFact(chars[8] ?? '', match9, 'cyframi'),
    })
  }
  return facts
}

function headlineFor(revealLevel: RevealLevel, prompt: string): string {
  switch (revealLevel) {
    case 'format-only':
      return prompt
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
  revealLevel: RevealLevel,
  prompt: string,
  detail: string | null,
  chars: readonly string[],
  target: 9 | 14,
): string {
  switch (revealLevel) {
    case 'format-only':
      return prompt
    case 'full':
      return validSummary(
        target === 14
          ? `Cyfra kontrolna na pozycji 9: ${chars[8] ?? ''}, cyfra kontrolna na pozycji 14: ${chars[13] ?? ''}.`
          : `Cyfra kontrolna: ${chars[8] ?? ''}.`,
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
