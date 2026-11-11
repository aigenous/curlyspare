import { encodeBase64Bytes } from './base64'
import { formatJsonIssue, parseJson } from './json'
import { assertNever, err, ok, type Result } from './result'

export const JWT_SIGN_NOTICE =
  'Sekret zostaje w przeglądarce. Token jest podpisywany lokalnie i nie jest nigdzie wysyłany.'

export const JWT_SIGN_ALGS = ['HS256', 'HS384', 'HS512'] as const
export type JwtSignAlg = (typeof JWT_SIGN_ALGS)[number]

export function isJwtSignAlg(value: string): value is JwtSignAlg {
  return value === 'HS256' || value === 'HS384' || value === 'HS512'
}

function hashName(alg: JwtSignAlg): 'SHA-256' | 'SHA-384' | 'SHA-512' {
  switch (alg) {
    case 'HS256':
      return 'SHA-256'
    case 'HS384':
      return 'SHA-384'
    case 'HS512':
      return 'SHA-512'
    default:
      return assertNever(alg)
  }
}

function utf8(text: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(text)
  const buffer = new ArrayBuffer(encoded.byteLength)
  const copy = new Uint8Array(buffer)
  copy.set(encoded)
  return copy
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function base64Url(text: string): string {
  return encodeBase64Bytes(utf8(text), { variant: 'url' })
}

export async function signJwt(
  payloadText: string,
  secret: string,
  alg: JwtSignAlg,
  headerText = '',
): Promise<Result<string>> {
  if (secret === '') return err('Sekret JWT nie może być pusty.')
  const payload = parseJson(payloadText)
  if (!payload.ok) return err(`Payload: ${formatJsonIssue(payload)}`)
  if (!isObject(payload.value)) return err('Payload JWT musi być obiektem JSON.')
  const headerValue: Record<string, unknown> = {}
  if (headerText.trim() !== '') {
    const header = parseJson(headerText)
    if (!header.ok) return err(`Nagłówek: ${formatJsonIssue(header)}`)
    if (!isObject(header.value)) return err('Nagłówek JWT musi być obiektem JSON.')
    Object.assign(headerValue, header.value)
  }
  headerValue.alg = alg
  if (typeof headerValue.typ !== 'string') headerValue.typ = 'JWT'
  const signingInput = `${base64Url(JSON.stringify(headerValue))}.${base64Url(JSON.stringify(payload.value))}`
  try {
    const key = await crypto.subtle.importKey('raw', utf8(secret), { name: 'HMAC', hash: hashName(alg) }, false, ['sign'])
    const signed = new Uint8Array(await crypto.subtle.sign('HMAC', key, utf8(signingInput)))
    return ok(`${signingInput}.${encodeBase64Bytes(signed, { variant: 'url' })}`)
  } catch {
    return err('Nie udało się podpisać tokenu JWT.')
  }
}
