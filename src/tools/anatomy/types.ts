/**
 * Presentational breakdown of a checksum.
 * Label keys are stable English ids. The screen supplies the translated copy.
 * Cell state is already decided; a component must not validate the number again.
 */

/** Tool slug after the registry renames on main. PESEL is the first consumer. */
export const PESEL_ANATOMY_SLUG = 'generator-pesel' as const

export type AnatomySlug = typeof PESEL_ANATOMY_SLUG

export type AnatomyRole = 'data' | 'serial' | 'check'

export type CellState = 'empty' | 'filled' | 'bad' | 'check-ok'

export interface AnatomyPart {
  from: number
  to: number
  labelKey: string
  role: AnatomyRole
}

export interface AnatomyCell {
  index: number
  char: string
  state: CellState
}

export interface WeightedTerm {
  weight: number
  value: number
}

/** One weighted-sum line. `expected` is null when a remainder cannot be issued as a digit. */
export interface WeightedSumStep {
  kind: 'weighted-sum'
  terms: readonly WeightedTerm[]
  sum: number
  modulus: number
  formula: 'mod10-complement'
  expected: string | null
  actual: string | null
  /** Null while the check digit has not been typed. */
  matches: boolean | null
}

export type AnatomyStep = WeightedSumStep

export interface ChecksumAnatomy {
  slug: AnatomySlug
  parts: readonly AnatomyPart[]
  cells: readonly AnatomyCell[]
  complete: boolean
  valid: boolean
  steps: readonly AnatomyStep[]
}
