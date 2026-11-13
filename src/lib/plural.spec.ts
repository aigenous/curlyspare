import { describe, expect, it } from 'vitest'
import { toolCountPhrase, toolNoun, publishedToolLeadStart, publishedToolSearchLabel } from './plural'

describe('toolNoun', () => {
  it.each([
    [0, 'narzędzi'],
    [1, 'narzędzie'],
    [2, 'narzędzia'],
    [5, 'narzędzi'],
    [12, 'narzędzi'],
    [22, 'narzędzia'],
    [45, 'narzędzi'],
  ] as const)('uses the Polish plural for %i', (count, word) => {
    expect(toolNoun(count)).toBe(word)
  })

  it('hides the number when the count is 0', () => {
    expect(toolCountPhrase(0)).toBe('')
    expect(publishedToolLeadStart(0)).toBe('Darmowe narzędzia')
    expect(publishedToolLeadStart(0)).not.toContain('0')
    expect(publishedToolSearchLabel(0)).toBe('Szukaj narzędzia')
    expect(publishedToolSearchLabel(0)).not.toContain('0')
    expect(publishedToolSearchLabel(45)).toBe('Szukaj wśród 45 narzędzi')
  })
})
