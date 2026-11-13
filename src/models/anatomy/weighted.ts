import type {
  FullSumStep,
  ProductsStep,
  SumFormula,
  SumStep,
  WeightedTerm,
} from './types'

export interface WeightedCalculation {
  terms: readonly WeightedTerm[]
  sum: number
}

export function weightedCalculation(
  values: readonly number[],
  weights: readonly number[],
): WeightedCalculation {
  const terms = weights.map((weight, index) => {
    const value = values[index] ?? 0
    return { weight, value, product: weight * value }
  })
  const sum = terms.reduce((total, term) => total + term.product, 0)
  return { terms, sum }
}

/** Mod-11 remainder. A remainder of 10 is stored as 0 for REGON and rejected for NIP. */
export function mod11Remainder(sum: number): number {
  return sum % 11
}

export function regonDigitMatches(sum: number, digit: number): boolean {
  const remainder = mod11Remainder(sum)
  return remainder === 10 ? digit === 0 : digit === remainder
}

export function nipDigitMatches(sum: number, digit: number): boolean {
  const remainder = mod11Remainder(sum)
  if (remainder === 10) return false
  return digit === remainder
}

export function toWeightedStep(input: {
  calculation: WeightedCalculation
  reveal: 'full' | 'level3' | 'level2'
  formula?: SumFormula
  actual?: string
  note?: string
}): ProductsStep | SumStep | FullSumStep {
  const { calculation, reveal, note } = input
  switch (reveal) {
    case 'level2':
      return { kind: 'weighted-sum', reveal, terms: calculation.terms }
    case 'level3':
      return note === undefined
        ? { kind: 'weighted-sum', reveal, terms: calculation.terms, sum: calculation.sum }
        : { kind: 'weighted-sum', reveal, terms: calculation.terms, sum: calculation.sum, note }
    case 'full': {
      if (input.formula === undefined || input.actual === undefined) {
        throw new Error('Full weighted step requires a formula and the typed check character')
      }
      const step: FullSumStep = {
        kind: 'weighted-sum',
        reveal,
        terms: calculation.terms,
        sum: calculation.sum,
        modulus: modulusFor(input.formula),
        formula: input.formula,
        actual: input.actual,
        matches: true,
      }
      return note === undefined ? step : { ...step, note }
    }
    default: {
      const unexpected: never = reveal
      return unexpected
    }
  }
}

function modulusFor(formula: SumFormula): number {
  switch (formula) {
    case 'mod11':
    case 'mod11-ten-is-zero':
      return 11
    case 'mod10-zero':
      return 10
    default: {
      const unexpected: never = formula
      return unexpected
    }
  }
}
