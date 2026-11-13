/**
 * Calculation-view model for the launch checksum tools.
 * Close to `ChecksumAnatomy` in `src/tools/anatomy/types.ts`. The team
 * contract will replace this shape; keep the arithmetic out of this file.
 *
 * The digit that would make a failing check match is never a field.
 * A full step reports only the character the user typed.
 * Callers must not put that typed value into a URL, query, hash,
 * history entry or any storage. These models do not, and they have no side effects.
 */

export const NIP_ANATOMY_SLUG = 'generator-nip' as const
export const REGON_ANATOMY_SLUG = 'generator-regon' as const
export const IBAN_ANATOMY_SLUG = 'walidator-iban' as const
export const ID_CARD_ANATOMY_SLUG = 'numer-dowodu-osobistego' as const
export const PASSPORT_ANATOMY_SLUG = 'numer-paszportu' as const

export type AnatomySlug =
  | typeof NIP_ANATOMY_SLUG
  | typeof REGON_ANATOMY_SLUG
  | typeof IBAN_ANATOMY_SLUG
  | typeof ID_CARD_ANATOMY_SLUG
  | typeof PASSPORT_ANATOMY_SLUG

/** How much of the walkthrough the view is allowed to render. */
export type RevealLevel = 'full' | 'level3' | 'level2' | 'format-only' | 'n/a'

export type AnatomyRole =
  | 'data'
  | 'serial'
  | 'check'
  | 'country'
  | 'letters'
  | 'check-secondary'

export type CellState = 'empty' | 'filled' | 'bad' | 'check-ok' | 'check2-ok'

export type SumFormula = 'mod11' | 'mod11-ten-is-zero' | 'mod10-zero'

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
  /** A=10 … Z=35. Digit cells omit this. */
  value?: number
  /** Group boundary: NIP 3-3-2-2, or IBAN groups of four. */
  groupEnd?: boolean
}

export interface WeightedTerm {
  weight: number
  value: number
  product: number
}

/** Characters, weights and products. No total. */
export interface ProductsStep {
  kind: 'weighted-sum'
  reveal: 'level2'
  terms: readonly WeightedTerm[]
}

/** Weights, products and the weighted sum. No modulus and no remainder. */
export interface SumStep {
  kind: 'weighted-sum'
  reveal: 'level3'
  terms: readonly WeightedTerm[]
  sum: number
  note?: string
}

/**
 * Full walkthrough. `actual` is the check character the user typed.
 * There is no field for a different "correct" digit.
 */
export interface FullSumStep {
  kind: 'weighted-sum'
  reveal: 'full'
  terms: readonly WeightedTerm[]
  sum: number
  modulus: number
  formula: SumFormula
  actual: string
  matches: true
  note?: string
}

export interface Mod97Chunk {
  digits: string
  /** Empty on the first chunk. Later chunks repeat the previous remainder. */
  carry: string
  remainder: number
}

/**
 * ISO 7064 walk using the check digits the user typed.
 * No zeroed-check form and no 98 − remainder field.
 */
export interface Mod97Step {
  kind: 'mod97'
  reveal: 'full' | 'level3'
  rearranged: string
  expanded: string
  chunks: readonly Mod97Chunk[]
  remainder: number
  matches: boolean
}

export type AnatomyStep = ProductsStep | SumStep | FullSumStep | Mod97Step

export interface AnatomyFact {
  label: string
  value: string
}

export interface AnatomyCopy {
  /** Polish status headline. */
  headline: string
  /** Polish second line. Null when the headline stands alone. */
  detail: string | null
  /** Polish screen-reader summary. It does not say more than the visible result. */
  summary: string
  /** Polish calc lines in display order, already cut to the reveal level. */
  lines: readonly string[]
  /** Lawyer caveat under an invalid checksum. Null otherwise. */
  caveat: string | null
  facts: readonly AnatomyFact[]
}

export interface ChecksumAnatomy {
  slug: AnatomySlug
  revealLevel: RevealLevel
  parts: readonly AnatomyPart[]
  cells: readonly AnatomyCell[]
  complete: boolean
  valid: boolean
  copy: AnatomyCopy
  steps: readonly AnatomyStep[]
}
