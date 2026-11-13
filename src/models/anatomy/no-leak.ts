import type { ChecksumAnatomy } from './types'

/**
 * JSON of the model with typed cells and structural indexes removed.
 * Letter values, products, sums, remainders and Polish lines stay.
 * Weight constants can be dropped for REGON-14, whose weight table contains every digit.
 */
export function computedView(
  model: ChecksumAnatomy,
  options?: { ignoreWeights?: boolean },
): string {
  const copy = JSON.parse(JSON.stringify(model)) as {
    cells: Array<{ char?: string; index?: number }>
    parts: Array<{ from?: number; to?: number }>
    steps: Array<{ terms?: Array<{ weight?: number }> }>
  }
  for (const cell of copy.cells) {
    delete cell.char
    delete cell.index
  }
  for (const part of copy.parts) {
    delete part.from
    delete part.to
  }
  if (options?.ignoreWeights === true) {
    for (const step of copy.steps) {
      for (const term of step.terms ?? []) {
        delete term.weight
      }
    }
  }
  return JSON.stringify(copy)
}

/** True when `digit` stands alone, not as part of a longer number. */
export function hasBareDigit(text: string, digit: string): boolean {
  return new RegExp(`(^|[^0-9])${digit}([^0-9]|$)`).test(text)
}
