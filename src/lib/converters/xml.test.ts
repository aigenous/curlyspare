/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { formatXml, minifyXml, validateXml } from './xml'

const sample = '<root><child a="1">zażółć</child><empty/></root>'

describe('xml', () => {
  it('formats, minifies, and validates a document', () => {
    expect(formatXml(sample)).toEqual({
      ok: true,
      value: '<root>\n  <child a="1">zażółć</child>\n  <empty/>\n</root>\n',
    })
    const formatted = formatXml(sample)
    expect(formatted.ok).toBe(true)
    if (!formatted.ok) return
    expect(minifyXml(formatted.value)).toEqual({
      ok: true,
      value: '<root><child a="1">zażółć</child><empty/></root>',
    })
    expect(validateXml(sample)).toEqual({ ok: true, value: 'Poprawny XML: element główny „root”.' })
  })

  it('keeps the XML declaration and escapes text', () => {
    const formatted = formatXml('<?xml version="1.0" encoding="UTF-8"?><p>a &amp; b</p>')
    expect(formatted.ok && formatted.value.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true)
    expect(formatted.ok && formatted.value).toContain('a &amp; b')
  })

  it('reports an invalid document', () => {
    expect(validateXml('<a></b>').ok).toBe(false)
    expect(validateXml('').ok).toBe(false)
    expect(formatXml('<a>').ok).toBe(false)
  })
})
