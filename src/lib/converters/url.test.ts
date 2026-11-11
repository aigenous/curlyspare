import { describe, expect, it } from 'vitest'
import { decodeUrl, encodeUrl } from './url'

describe('url encoding', () => {
  it('encodes a component, a full URI, and a form body', () => {
    expect(encodeUrl('a b/ą', 'component')).toEqual({ ok: true, value: 'a%20b%2F%C4%85' })
    expect(encodeUrl('https://example.com/a b?x=1', 'uri')).toEqual({
      ok: true,
      value: 'https://example.com/a%20b?x=1',
    })
    expect(encodeUrl('a b', 'form')).toEqual({ ok: true, value: 'a+b' })
  })

  it('decodes each mode and reports a broken percent sequence', () => {
    expect(decodeUrl('a%20b%2F%C4%85', 'component')).toEqual({ ok: true, value: 'a b/ą' })
    expect(decodeUrl('https://example.com/a%20b?x=1', 'uri')).toEqual({
      ok: true,
      value: 'https://example.com/a b?x=1',
    })
    expect(decodeUrl('a+b%2B', 'form')).toEqual({ ok: true, value: 'a b+' })
    expect(decodeUrl('%', 'component').ok).toBe(false)
    expect(decodeUrl('%ZZ', 'component').ok).toBe(false)
    expect(decodeUrl('%C4', 'component').ok).toBe(false)
  })
})
