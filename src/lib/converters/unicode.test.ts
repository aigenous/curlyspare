import { describe, expect, it } from 'vitest'
import { escapeUnicode, formatCodePoints, unescapeUnicode } from './unicode'

describe('unicode escapes', () => {
  it('escapes non-ASCII as \\uXXXX and round-trips', () => {
    const escaped = escapeUnicode('A zażółć \\')
    expect(escaped.startsWith('A za')).toBe(true)
    expect(escaped).toContain('\\u017c')
    expect(escaped.endsWith('\\u005c')).toBe(true)
    expect(unescapeUnicode(escaped)).toEqual({ ok: true, value: 'A zażółć \\' })
  })

  it('writes astral characters as surrogate pairs or code points', () => {
    expect(escapeUnicode('🙂')).toBe('\\ud83d\\ude42')
    expect(escapeUnicode('🙂', 'codepoint')).toBe('\\u{1f642}')
    expect(unescapeUnicode('\\u{1F642}')).toEqual({ ok: true, value: '🙂' })
    expect(unescapeUnicode('\\uD83D\\uDE42')).toEqual({ ok: true, value: '🙂' })
    expect(unescapeUnicode('\\x41\\n')).toEqual({ ok: true, value: 'A\n' })
  })

  it('lists code points and UTF-8 bytes', () => {
    expect(formatCodePoints('ą')).toBe('U+0105  261  c485  ą')
  })

  it('rejects a broken escape', () => {
    expect(unescapeUnicode('\\u12').ok).toBe(false)
    expect(unescapeUnicode('\\u{110000}').ok).toBe(false)
    expect(unescapeUnicode('\\q').ok).toBe(false)
  })
})
