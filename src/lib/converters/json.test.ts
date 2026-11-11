import { describe, expect, it } from 'vitest'
import { describeJsonValue, formatJson, formatJsonIssue, minifyJson, parseJson } from './json'

const samples = [
  '0',
  '-0',
  '1.5',
  '-12.25',
  '1e-2',
  '1E+10',
  'true',
  'false',
  'null',
  '"zażółć 🙂"',
  '"\\u0041\\n\\t\\"\\\\"',
  '[]',
  '{}',
  '[1, "a", true, null]',
  '{"b":1,"a":{"d":true,"c":[1,2]}}',
  '{"a":1,"a":2}',
  '  \n{"ok": true}\n',
  '"line\\u2028sep"',
]

describe('parseJson', () => {
  it('matches JSON.parse on valid documents', () => {
    for (const sample of samples) {
      const parsed = parseJson(sample)
      expect(parsed.ok).toBe(true)
      if (parsed.ok) expect(JSON.stringify(parsed.value)).toBe(JSON.stringify(JSON.parse(sample)))
    }
  })

  it('rejects documents JSON.parse rejects', () => {
    const invalid = ['', '   ', '{', '[1,2,]', '{"a":1,}', "'hi'", 'undefined', '+1', '01', '1.', 'NaN', 'Infinity', '{"a":1} {}', '{"a" 1}', '[1, x]']
    for (const sample of invalid) {
      expect(parseJson(sample).ok).toBe(false)
      expect(() => JSON.parse(sample)).toThrow()
    }
  })

  it('points at the unexpected character', () => {
    const issue = parseJson('[1, x]')
    expect(issue.ok).toBe(false)
    if (!issue.ok) {
      expect(issue.line).toBe(1)
      expect(issue.column).toBe(5)
      expect(issue.error).toContain('„x”')
    }
  })

  it('reports a multiline location', () => {
    const issue = parseJson('{\n  "a": 1,\n  "b":\n}')
    expect(issue.ok).toBe(false)
    if (!issue.ok) {
      expect(issue.line).toBe(4)
      expect(issue.column).toBe(1)
      expect(formatJsonIssue(issue)).toBe(`Wiersz 4, kolumna 1: ${issue.error}`)
    }
  })

  it('rejects a trailing comma with a precise message', () => {
    const issue = parseJson('{"a":1,}')
    expect(issue.ok).toBe(false)
    if (!issue.ok) expect(issue.error).toContain('Przecinek na końcu obiektu')
  })

  it('strips a leading BOM', () => {
    const parsed = parseJson('\uFEFF{"a":1}')
    expect(parsed.ok && parsed.value).toEqual({ a: 1 })
  })

  it('rejects a too-deep document', () => {
    const deep = `${'['.repeat(101)}0${']'.repeat(101)}`
    expect(parseJson(deep).ok).toBe(false)
    expect(parseJson(`${'['.repeat(20)}0${']'.repeat(20)}`).ok).toBe(true)
  })

  it('keeps the last duplicate key', () => {
    const parsed = parseJson('{"a":1,"a":2}')
    expect(parsed.ok && parsed.value).toEqual({ a: 2 })
  })
})

describe('formatJson and minifyJson', () => {
  it('pretty-prints with two spaces and a trailing newline', () => {
    const formatted = formatJson('{"b":1,"a":2}')
    expect(formatted.ok && formatted.value).toBe('{\n  "b": 1,\n  "a": 2\n}\n')
  })

  it('sorts keys recursively', () => {
    const formatted = formatJson('{"b":1,"a":{"d":1,"c":2}}', { sortKeys: true })
    expect(formatted.ok && formatted.value).toBe('{\n  "a": {\n    "c": 2,\n    "d": 1\n  },\n  "b": 1\n}\n')
  })

  it('indents with tabs', () => {
    const formatted = formatJson('[1]', { indent: 'tab' })
    expect(formatted.ok && formatted.value).toBe('[\n\t1\n]\n')
  })

  it('minifies without a trailing newline', () => {
    expect(minifyJson('{\n  "a": 1\n}\n')).toEqual({ ok: true, value: '{"a":1}' })
  })

  it('is stable when formatted twice', () => {
    const once = formatJson('{"z":1,"a":[true,null]}', { indent: 4, sortKeys: true })
    expect(once.ok).toBe(true)
    if (once.ok) expect(formatJson(once.value, { indent: 4, sortKeys: true })).toEqual(once)
  })

  it('rejects an invalid indent', () => {
    expect(formatJson('1', { indent: 11 }).ok).toBe(false)
  })

  it('describes the value in Polish', () => {
    expect(describeJsonValue({ a: 1, b: 2, c: 3, d: 4, e: 5 })).toBe('Poprawny JSON: obiekt, 5 kluczy.')
    expect(describeJsonValue([1])).toBe('Poprawny JSON: tablica, 1 element.')
    expect(describeJsonValue([1, 2, 3, 4])).toBe('Poprawny JSON: tablica, 4 elementy.')
    expect(describeJsonValue([1, 2, 3, 4, 5])).toBe('Poprawny JSON: tablica, 5 elementów.')
    expect(describeJsonValue(null)).toBe('Poprawny JSON: null.')
    expect(describeJsonValue('a')).toBe('Poprawny JSON: tekst.')
    expect(describeJsonValue(false)).toBe('Poprawny JSON: wartość logiczna.')
  })
})
