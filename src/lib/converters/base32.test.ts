import { describe, expect, it } from 'vitest'
import { decodeBase32, decodeBase32ToBytes, encodeBase32, encodeBase32Bytes } from './base32'

describe('base32', () => {
  it('matches the RFC 4648 vectors', () => {
    expect(encodeBase32('')).toBe('')
    expect(encodeBase32('f')).toBe('MY======')
    expect(encodeBase32('fo')).toBe('MZXQ====')
    expect(encodeBase32('foo')).toBe('MZXW6===')
    expect(encodeBase32('foob')).toBe('MZXW6YQ=')
    expect(encodeBase32('fooba')).toBe('MZXW6YTB')
    expect(encodeBase32('foobar')).toBe('MZXW6YTBOI======')
  })

  it('round-trips text, lowercase input, and missing padding', () => {
    expect(decodeBase32('mzxw6ytboi======')).toEqual({ ok: true, value: 'foobar' })
    expect(decodeBase32('MZXW6YTBOI')).toEqual({ ok: true, value: 'foobar' })
    expect(decodeBase32(encodeBase32('zażółć'))).toEqual({ ok: true, value: 'zażółć' })
    const bytes = Uint8Array.from([0, 255, 16])
    expect(decodeBase32ToBytes(encodeBase32Bytes(bytes))).toEqual({ ok: true, value: bytes })
  })

  it('rejects bad characters, bad padding, and non-UTF-8 bytes', () => {
    expect(decodeBase32('MZXW6Y10').ok).toBe(false)
    expect(decodeBase32('MZXW6YQ==').ok).toBe(false)
    expect(decodeBase32(encodeBase32Bytes(Uint8Array.from([0xff]))).ok).toBe(false)
    expect(decodeBase32ToBytes(encodeBase32Bytes(Uint8Array.from([0xff]))).ok).toBe(true)
  })
})
