import { decodeBase64 } from './base64'
import { err, ok, type Result } from './result'

export const JWT_NOTICE =
  'Podpis nie został zweryfikowany. Narzędzie tylko odczytuje nagłówek i payload — nie potwierdza wystawcy ani integralności tokenu.'

export interface JwtDate {
  unix: number
  isoUtc: string
  warsaw: string
}

export interface DecodedJwt {
  header: unknown
  payload: unknown
  headerText: string
  payloadText: string
  signature: string
  algorithm: string | null
  type: string | null
  exp: JwtDate | null
  iat: JwtDate | null
  nbf: JwtDate | null
  expired: boolean | null
  notYetValid: boolean | null
  signatureVerified: false
  notice: typeof JWT_NOTICE
}

function formatUnix(unix: number): JwtDate | null {
  if (!Number.isFinite(unix)) return null
  const date = new Date(unix * 1000)
  if (Number.isNaN(date.getTime())) return null
  try {
    return {
      unix,
      isoUtc: date.toISOString(),
      warsaw: new Intl.DateTimeFormat('pl-PL', {
        timeZone: 'Europe/Warsaw',
        dateStyle: 'long',
        timeStyle: 'medium',
        hourCycle: 'h23',
      }).format(date),
    }
  } catch {
    return null
  }
}

function readNumericClaim(payload: unknown, name: string): number | undefined {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) return undefined
  const value = (payload as Record<string, unknown>)[name]
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined
  return value
}

function readStringField(value: unknown, name: string): string | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null
  const field = (value as Record<string, unknown>)[name]
  return typeof field === 'string' ? field : null
}

function decodePart(part: string, label: string): Result<unknown> {
  if (part === '') return err(`Brakuje części „${label}” tokenu JWT.`)
  const decoded = decodeBase64(part, { variant: 'url' })
  if (!decoded.ok) return err(`${label} JWT nie jest poprawnym Base64URL.`)
  try {
    return ok(JSON.parse(decoded.value) as unknown)
  } catch {
    return err(`${label} JWT nie jest poprawnym JSON.`)
  }
}

export function decodeJwt(token: string, nowMs = Date.now()): Result<DecodedJwt> {
  const compact = token.trim().replace(/^(?:bearer\s+)/i, '').replace(/\s+/g, '')
  if (compact === '') return err('Wklej token JWT.')
  const parts = compact.split('.')
  if (parts.length !== 3) return err('Token JWT powinien mieć trzy części rozdzielone kropkami.')
  const headerPart = parts[0] ?? ''
  const payloadPart = parts[1] ?? ''
  const signature = parts[2] ?? ''
  const header = decodePart(headerPart, 'Nagłówek')
  if (!header.ok) return header
  const payload = decodePart(payloadPart, 'Payload')
  if (!payload.ok) return payload
  const exp = formatUnix(readNumericClaim(payload.value, 'exp') ?? Number.NaN)
  const iat = formatUnix(readNumericClaim(payload.value, 'iat') ?? Number.NaN)
  const nbf = formatUnix(readNumericClaim(payload.value, 'nbf') ?? Number.NaN)
  return ok({
    header: header.value,
    payload: payload.value,
    headerText: JSON.stringify(header.value, null, 2),
    payloadText: JSON.stringify(payload.value, null, 2),
    signature,
    algorithm: readStringField(header.value, 'alg'),
    type: readStringField(header.value, 'typ'),
    exp,
    iat,
    nbf,
    expired: exp ? exp.unix * 1000 <= nowMs : null,
    notYetValid: nbf ? nbf.unix * 1000 > nowMs : null,
    signatureVerified: false,
    notice: JWT_NOTICE,
  })
}
