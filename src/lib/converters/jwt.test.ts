import { describe, expect, it } from 'vitest'
import { encodeBase64 } from './base64'
import { decodeJwt, JWT_NOTICE } from './jwt'

function part(value: unknown): string {
  return encodeBase64(JSON.stringify(value), { variant: 'url' })
}

function token(header: unknown, payload: unknown, signature = 'c2ln'): string {
  return `${part(header)}.${part(payload)}.${signature}`
}

describe('decodeJwt', () => {
  const now = Date.parse('2024-06-01T00:00:00Z')

  it('decodes header, payload, and dates without verifying the signature', () => {
    const decoded = decodeJwt(
      token({ alg: 'HS256', typ: 'JWT' }, { sub: 'ala', exp: 1893456000, iat: 1700000000, nbf: 1700000000 }),
      now,
    )
    expect(decoded.ok).toBe(true)
    if (!decoded.ok) return
    expect(decoded.value.signatureVerified).toBe(false)
    expect(decoded.value.notice).toBe(JWT_NOTICE)
    expect(decoded.value.algorithm).toBe('HS256')
    expect(decoded.value.type).toBe('JWT')
    expect(decoded.value.payload).toMatchObject({ sub: 'ala' })
    expect(decoded.value.exp?.isoUtc).toBe('2030-01-01T00:00:00.000Z')
    expect(decoded.value.iat?.isoUtc).toBe('2023-11-14T22:13:20.000Z')
    expect(decoded.value.exp?.warsaw).toContain('2030')
    expect(decoded.value.expired).toBe(false)
    expect(decoded.value.notYetValid).toBe(false)
    expect(decoded.value.signature).toBe('c2ln')
  })

  it('marks an expired token and a token that is not valid yet', () => {
    const expired = decodeJwt(token({ alg: 'none' }, { exp: 10 }), now)
    const early = decodeJwt(token({ alg: 'none' }, { nbf: 1893456000 }), now)
    expect(expired.ok && expired.value.expired).toBe(true)
    expect(early.ok && early.value.notYetValid).toBe(true)
  })

  it('strips a Bearer prefix and surrounding whitespace', () => {
    const raw = token({ alg: 'HS256' }, { name: 'Ola' })
    const decoded = decodeJwt(`  Bearer\n${raw}  `, now)
    expect(decoded.ok && decoded.value.payload).toEqual({ name: 'Ola' })
  })

  it('rejects malformed tokens and does not treat the signature as verified', () => {
    expect(decodeJwt('abc', now).ok).toBe(false)
    expect(decodeJwt('a.b', now).ok).toBe(false)
    expect(decodeJwt(`${part({ alg: 'HS256' })}.not-json.sig`, now).ok).toBe(false)
    const decoded = decodeJwt(token({ alg: 'none' }, { sub: 'x' }, ''), now)
    expect(decoded.ok && decoded.value.signatureVerified).toBe(false)
    expect(decoded.ok && decoded.value.signature).toBe('')
  })
})
