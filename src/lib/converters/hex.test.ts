import { describe, expect, it } from 'vitest'
import { decodeHex, decodeHexToBytes, encodeHex, encodeHexBytes } from './hex'

describe('hex', () => {
  it('encodes and decodes UTF-8 text', () => {
    expect(encodeHex('foo')).toBe('666f6f')
    expect(encodeHex('foo', true)).toBe('666F6F')
    expect(encodeHex('ą')).toBe('c485')
    expect(decodeHex('66 6F 6F')).toEqual({ ok: true, value: 'foo' })
    expect(decodeHex('0x666F6F')).toEqual({ ok: true, value: 'foo' })
    expect(decodeHex(encodeHex('zażółć'))).toEqual({ ok: true, value: 'zażółć' })
  })

  it('round-trips bytes and rejects odd or invalid input', () => {
    const bytes = Uint8Array.from([0, 255, 16])
    expect(decodeHexToBytes(encodeHexBytes(bytes))).toEqual({ ok: true, value: bytes })
    expect(decodeHex('abc').ok).toBe(false)
    expect(decodeHex('zz').ok).toBe(false)
    expect(decodeHex('ff').ok).toBe(false)
    expect(decodeHexToBytes('ff').ok).toBe(true)
  })
})
