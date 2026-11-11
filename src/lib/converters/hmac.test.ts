import { describe, expect, it } from 'vitest'
import { hmacBytes, hmacText } from './hmac'

describe('hmac', () => {
  it('matches RFC 4231 case 1 for SHA-256 and SHA-512', async () => {
    const key = Uint8Array.from({ length: 20 }, () => 0x0b)
    const data = new TextEncoder().encode('Hi There')
    const sha256 = await hmacBytes(key, data, 'SHA-256')
    const sha512 = await hmacBytes(key, data, 'SHA-512')
    expect(sha256.ok && sha256.value.hex).toBe('b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7')
    expect(sha512.ok && sha512.value.hex).toBe(
      '87aa7cdea5ef619d4ff0b4241a1d6cb02379f4e2ce4ec2787ad0b30545e17cdeda' +
        'a833b7d6b8a702038b274eaea3f4e4be9d914eeb61f1702e696c203a126854',
    )
  })

  it('hashes UTF-8 text and rejects an empty key', async () => {
    const digest = await hmacText('klucz', 'zażółć', 'SHA-256')
    expect(digest.ok).toBe(true)
    if (!digest.ok) return
    expect(digest.value.hex).toHaveLength(64)
    expect(digest.value.base64).toMatch(/^[A-Za-z0-9+/]+=*$/)
    expect((await hmacText('', 'a', 'SHA-512')).ok).toBe(false)
    const again = await hmacText('klucz', 'zażółć', 'SHA-256')
    expect(again).toEqual(digest)
  })
})
