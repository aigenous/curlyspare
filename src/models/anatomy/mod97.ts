import type { Mod97Chunk } from './types'

/**
 * Piecewise mod 97, nine digits then carry plus seven, using the digits given.
 * The caller passes the expanded number built from the check digits the user typed.
 */
export function mod97Chunks(expanded: string): readonly Mod97Chunk[] {
  if (expanded.length === 0) return []
  const chunks: Mod97Chunk[] = []
  const firstDigits = expanded.slice(0, Math.min(9, expanded.length))
  let remainder = Number(firstDigits) % 97
  chunks.push({ digits: firstDigits, carry: '', remainder })
  let offset = firstDigits.length
  while (offset < expanded.length) {
    const digits = expanded.slice(offset, offset + 7)
    const carry = String(remainder)
    remainder = Number(`${carry}${digits}`) % 97
    chunks.push({ digits, carry, remainder })
    offset += digits.length
  }
  return chunks
}
