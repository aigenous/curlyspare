import type { RandomInt } from './random'

/** Deterministic RNG for tests. Each value must fall inside the requested range. */
export function sequenceRng(values: readonly number[]): RandomInt {
  let index = 0
  return (maxExclusive) => {
    const value = values[index]
    index += 1
    if (value === undefined) {
      throw new Error('sequenceRng ran out of values')
    }
    if (!Number.isInteger(value) || value < 0 || value >= maxExclusive) {
      throw new Error(`sequenceRng value ${value} is outside 0..${maxExclusive - 1}`)
    }
    return value
  }
}
