import { describe, expect, it } from 'vitest'
import { buildUrl, encodeParams, parseAddress } from './url-parts'

describe('url parts', () => {
  it('splits a URL and keeps repeated parameters', () => {
    const parsed = parseAddress('https://ala:hasło@example.com:8443/a/b?x=1&x=2&q=zażółć#sekcja')
    expect(parsed.ok).toBe(true)
    if (!parsed.ok || !parsed.value.url) return
    expect(parsed.value.kind).toBe('url')
    expect(parsed.value.url).toMatchObject({
      protocol: 'https:',
      username: 'ala',
      hostname: 'example.com',
      port: '8443',
      pathname: '/a/b',
      hash: '#sekcja',
    })
    expect(parsed.value.params).toEqual([
      { key: 'x', value: '1' },
      { key: 'x', value: '2' },
      { key: 'q', value: 'zażółć' },
    ])
  })

  it('reads a bare query string and rebuilds an edited URL', () => {
    const query = parseAddress('a=1&b=dwa')
    expect(query.ok && query.value.kind).toBe('query')
    expect(query.ok && query.value.params).toEqual([
      { key: 'a', value: '1' },
      { key: 'b', value: 'dwa' },
    ])
    expect(encodeParams([{ key: 'q', value: 'a b' }])).toBe('q=a+b')
    const built = buildUrl({
      protocol: 'https',
      username: '',
      password: '',
      hostname: 'example.com',
      port: '',
      pathname: '/szukaj',
      hash: 'góra',
      params: [{ key: 'q', value: 'a b' }],
    })
    expect(built).toEqual({ ok: true, value: 'https://example.com/szukaj?q=a+b#g%C3%B3ra' })
  })

  it('rejects an empty value and a broken URL', () => {
    expect(parseAddress('   ').ok).toBe(false)
    expect(parseAddress('http://').ok).toBe(false)
  })
})
