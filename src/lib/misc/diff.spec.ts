import { describe, expect, it } from 'vitest'
import { diffText } from './diff'

describe('text diff', () => {
  it('marks changed lines', () => {
    expect(diffText('ala\nma\nkota\n', 'ala\nnie ma\nkota\n', 'line')).toEqual([
      { kind: 'equal', value: 'ala\n' },
      { kind: 'removed', value: 'ma\n' },
      { kind: 'added', value: 'nie ma\n' },
      { kind: 'equal', value: 'kota\n' },
    ])
  })

  it('marks changed words and keeps the surrounding text', () => {
    const chunks = diffText('kot siedzi', 'kot leży', 'word')
    expect(chunks.some((chunk) => chunk.kind === 'removed' && chunk.value.includes('siedzi'))).toBe(true)
    expect(chunks.some((chunk) => chunk.kind === 'added' && chunk.value.includes('leży'))).toBe(true)
    expect(chunks.some((chunk) => chunk.kind === 'equal' && chunk.value.includes('kot'))).toBe(true)
  })
})
