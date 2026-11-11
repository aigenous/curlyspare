import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { signJwt } from './jwt-sign'

describe('jwt signer', () => {
  it('matches the well-known HS256 token', async () => {
    const token = await signJwt(
      '{"sub":"1234567890","name":"John Doe","iat":1516239022}',
      'your-256-bit-secret',
      'HS256',
    )
    expect(token).toEqual({
      ok: true,
      value:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    })
  })

  it('signs HS384 and HS512 the same way as an independent HMAC', async () => {
    const payload = '{"sub":"ala"}'
    for (const alg of ['HS384', 'HS512'] as const) {
      const token = await signJwt(payload, 'sekret-zostaje', alg)
      expect(token.ok).toBe(true)
      if (!token.ok) return
      const [header, body, signature] = token.value.split('.')
      const hash = alg === 'HS384' ? 'sha384' : 'sha512'
      const expected = createHmac(hash, 'sekret-zostaje')
        .update(`${header}.${body}`)
        .digest('base64url')
      expect(signature).toBe(expected)
    }
  })

  it('rejects an empty secret and a payload that is not an object', async () => {
    expect((await signJwt('{"a":1}', '', 'HS256')).ok).toBe(false)
    expect((await signJwt('[]', 'sekret', 'HS512')).ok).toBe(false)
    expect((await signJwt('{', 'sekret', 'HS256')).ok).toBe(false)
  })
})
