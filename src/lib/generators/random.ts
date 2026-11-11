/**
 * Returns a uniformly distributed integer in the range [0, maxExclusive).
 * Injected into generators so tests can replay a fixed sequence.
 */
export type RandomInt = (maxExclusive: number) => number

const UINT32_RANGE = 0x1_0000_0000

/**
 * Cryptographically secure integer in [0, maxExclusive).
 * Rejection sampling drops the incomplete residue class so the result has no modulo bias.
 */
export const cryptoRandomInt: RandomInt = (maxExclusive) => {
  if (!Number.isInteger(maxExclusive) || maxExclusive <= 0 || maxExclusive > UINT32_RANGE) {
    throw new RangeError(`maxExclusive must be an integer in 1..${UINT32_RANGE}`)
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive)
  const buffer = new Uint32Array(1)
  for (;;) {
    globalThis.crypto.getRandomValues(buffer)
    const value = buffer[0] ?? 0
    if (value < limit) {
      return value % maxExclusive
    }
  }
}

export function randomDigitChar(rng: RandomInt = cryptoRandomInt): string {
  return String(rng(10))
}

export function randomUppercaseLetter(rng: RandomInt = cryptoRandomInt): string {
  return String.fromCharCode(65 + rng(26))
}

/**
 * Collects `count` distinct values from `generate`.
 * Throws when the generator cannot produce enough distinct values.
 */
export function generateUnique(count: number, generate: () => string): string[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError('count must be a non-negative integer')
  }
  const values = new Set<string>()
  const maxAttempts = count * 50 + 1000
  for (let attempt = 0; values.size < count; attempt += 1) {
    if (attempt >= maxAttempts) {
      throw new RangeError('Unable to generate the requested number of unique values')
    }
    values.add(generate())
  }
  return [...values]
}
