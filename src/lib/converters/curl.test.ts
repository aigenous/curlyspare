import { describe, expect, it } from 'vitest'
import { curlToCode } from './curl'

describe('curl to fetch and axios', () => {
  it('converts a JSON POST with headers and basic auth', () => {
    const code = curlToCode(
      "curl -X POST https://example.com/api -H 'Content-Type: application/json' -H 'Accept: application/json' -d '{\"a\":1}' -u 'ala:hasło'",
    )
    expect(code.ok).toBe(true)
    if (!code.ok) return
    expect(code.value.fetch).toContain('method: "POST"')
    expect(code.value.fetch).toContain('"Content-Type": "application/json"')
    expect(code.value.fetch).toContain('"Accept": "application/json"')
    expect(code.value.fetch).toContain('body: "{\\"a\\":1}"')
    expect(code.value.fetch).toContain('"Authorization": "Basic ')
    expect(code.value.axios).toContain('method: "post"')
    expect(code.value.axios).toContain('data: "{\\"a\\":1}"')
  })

  it('appends data to the query when -G is set and keeps a plain GET', () => {
    const query = curlToCode("curl -G 'https://example.com/szukaj' --data 'q=a b'")
    expect(query.ok).toBe(true)
    if (!query.ok) return
    expect(query.value.fetch).toContain('https://example.com/szukaj?q=a b')
    expect(query.value.fetch).toContain('method: "GET"')
    expect(query.value.fetch).not.toContain('body:')
    const simple = curlToCode('curl https://example.com/szukaj?q=zażółć')
    expect(simple.ok && simple.value.fetch).toContain('zażółć')
  })

  it('rejects an empty command, a missing URL, and an unknown option', () => {
    expect(curlToCode('   ').ok).toBe(false)
    expect(curlToCode('curl -X POST').ok).toBe(false)
    expect(curlToCode('curl --upload-file x https://example.com').ok).toBe(false)
  })
})
