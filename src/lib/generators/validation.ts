export type ValidationErrorCode =
  | 'empty'
  | 'invalid-characters'
  | 'invalid-length'
  | 'invalid-format'
  | 'invalid-checksum'
  | 'invalid-date'
  | 'unsupported-country'

export interface ValidationFailure {
  valid: false
  error: ValidationErrorCode
}

export type ValidationSuccess<TDetails extends object> = { valid: true } & TDetails

export type ValidationResult<TDetails extends object> =
  | ValidationSuccess<TDetails>
  | ValidationFailure

export interface ParsedInput {
  ok: true
  value: string
}

export interface RejectedInput {
  ok: false
  failure: ValidationFailure
}

export function invalid(error: ValidationErrorCode): ValidationFailure {
  return { valid: false, error }
}

/** Removes whitespace and dash-like separators. */
export function stripSeparators(input: string): string {
  return input.replace(/[\s\u00A0\u2010-\u2015-]/g, '')
}

export function toDigits(value: string): number[] {
  return Array.from(value, (char) => char.charCodeAt(0) - 48)
}

export function weightedSum(values: readonly number[], weights: readonly number[]): number {
  return weights.reduce((sum, weight, index) => sum + weight * (values[index] ?? 0), 0)
}

export function readDigits(input: string, expectedLength?: number): ParsedInput | RejectedInput {
  const value = stripSeparators(input)
  if (value.length === 0) {
    return { ok: false, failure: invalid('empty') }
  }
  if (!/^\d+$/.test(value)) {
    return { ok: false, failure: invalid('invalid-characters') }
  }
  if (expectedLength !== undefined && value.length !== expectedLength) {
    return { ok: false, failure: invalid('invalid-length') }
  }
  return { ok: true, value }
}

export function readDocument(
  input: string,
  pattern: RegExp,
  expectedLength: number,
): ParsedInput | RejectedInput {
  const value = stripSeparators(input).toUpperCase()
  if (value.length === 0) {
    return { ok: false, failure: invalid('empty') }
  }
  if (!/^[A-Z0-9]+$/.test(value)) {
    return { ok: false, failure: invalid('invalid-characters') }
  }
  if (value.length !== expectedLength) {
    return { ok: false, failure: invalid('invalid-length') }
  }
  if (!pattern.test(value)) {
    return { ok: false, failure: invalid('invalid-format') }
  }
  return { ok: true, value }
}
