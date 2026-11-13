import { stripSeparators } from '../../lib/generators/validation'

export type InputShape = 'empty' | 'partial' | 'unusable' | 'complete'

/** Separators out, letters uppercased. The typed value is not stored anywhere. */
export function compact(input: string): string {
  return stripSeparators(input).toUpperCase()
}

export function digitsOf(value: string): number[] {
  return [...value].map((char) => char.charCodeAt(0) - 48)
}

export function isAllZero(value: string): boolean {
  return value.length > 0 && [...value].every((char) => char === '0')
}
