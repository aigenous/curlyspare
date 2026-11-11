import { describe, expect, it } from 'vitest'
import { highlightSpans, matchRegex } from './regex'

describe('regex tester', () => {
  it('returns every global match and its numbered and named groups', () => {
    const result = matchRegex('(?<word>[A-Z]+)-(\\d+)', ['g', 'i'], 'ab-12 oraz CD-3')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches.map((match) => match.text)).toEqual(['ab-12', 'CD-3'])
    expect(result.matches[0]?.groups).toEqual([
      { key: '1', value: 'ab' },
      { key: '2', value: '12' },
      { key: 'word', value: 'ab' },
    ])
  })

  it('stops after one match when the global flag is off', () => {
    const result = matchRegex('a', [], 'banana')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0]).toMatchObject({ index: 1, text: 'a' })
  })

  it('rejects a broken pattern and the u+v flag pair', () => {
    expect(matchRegex('(', [], 'a')).toEqual({ ok: false, error: 'Niepoprawne wyrażenie regularne.' })
    expect(matchRegex('a', ['u', 'v'], 'a').ok).toBe(false)
  })

  it('builds highlight spans around the matches', () => {
    expect(
      highlightSpans('banana', [
        { index: 1, length: 1 },
        { index: 3, length: 1 },
        { index: 5, length: 1 },
      ]),
    ).toEqual([
      { text: 'b', match: false },
      { text: 'a', match: true },
      { text: 'n', match: false },
      { text: 'a', match: true },
      { text: 'n', match: false },
      { text: 'a', match: true },
    ])
  })
})
