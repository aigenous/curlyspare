import { describe, expect, it } from 'vitest'
import { decodeBase64, decodeBase64ToBytes, encodeBase64, encodeBase64Bytes } from './base64'

describe('base64', () => {
  it('matches the standard and URL-safe encodings', () => {
    const samples = ['', 'a', 'ab', 'abc', 'zażółć', '🙂', 'hello world']
    for (const sample of samples) {
      const bytes = new TextEncoder().encode(sample)
      expect(encodeBase64(sample)).toBe(Buffer.from(bytes).toString('base64'))
      expect(encodeBase64(sample, { variant: 'url' })).toBe(Buffer.from(bytes).toString('base64url'))
      expect(decodeBase64(encodeBase64(sample))).toEqual({ ok: true, value: sample })
      expect(decodeBase64(encodeBase64(sample, { variant: 'url' }), { variant: 'url' })).toEqual({
        ok: true,
        value: sample,
      })
    }
  })

  it('round-trips arbitrary bytes', () => {
    const bytes = Uint8Array.from([0, 1, 255, 128, 10, 32])
    const encoded = encodeBase64Bytes(bytes)
    expect(encoded).toBe(Buffer.from(bytes).toString('base64'))
    expect(decodeBase64ToBytes(encoded)).toEqual({ ok: true, value: bytes })
  })

  it('accepts missing padding and whitespace', () => {
    expect(decodeBase64('YQ')).toEqual({ ok: true, value: 'a' })
    expect(decodeBase64('Y Q =\n=')).toEqual({ ok: true, value: 'a' })
  })

  it('wraps standard output at 76 characters', () => {
    const encoded = encodeBase64('a'.repeat(80), { wrap: true })
    expect(encoded.split('\n').every((line) => line.length <= 76)).toBe(true)
    expect(decodeBase64(encoded)).toEqual({ ok: true, value: 'a'.repeat(80) })
  })

  it('rejects a single leftover character, bad padding, and mixed alphabets', () => {
    expect(decodeBase64('a').ok).toBe(false)
    expect(decodeBase64('YQ=').ok).toBe(false)
    expect(decodeBase64('****').ok).toBe(false)
    expect(decodeBase64('YQ-_').ok).toBe(false)
    const mixed = encodeBase64Bytes(Uint8Array.from([251, 255, 191]), { variant: 'url' })
    expect(mixed).toMatch(/[-_]/)
    expect(decodeBase64(mixed, { variant: 'standard' }).ok).toBe(false)
  })

  it('rejects bytes that are not UTF-8 text', () => {
    const encoded = encodeBase64Bytes(Uint8Array.from([0xff, 0xfe]))
    expect(decodeBase64(encoded).ok).toBe(false)
    expect(decodeBase64ToBytes(encoded).ok).toBe(true)
  })
})
