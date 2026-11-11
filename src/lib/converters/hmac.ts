import { encodeBase64Bytes } from './base64'
import { assertNever, err, ok, type Result } from './result'
import type { HashDigest } from './hash'

export const HMAC_ALGORITHMS = ['SHA-256', 'SHA-512'] as const
export type HmacAlgorithm = (typeof HMAC_ALGORITHMS)[number]

export function isHmacAlgorithm(value: string): value is HmacAlgorithm {
  return value === 'SHA-256' || value === 'SHA-512'
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return hex
}

function copyBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength))
  copy.set(bytes)
  return copy
}

export async function hmacBytes(
  key: Uint8Array,
  data: Uint8Array,
  algorithm: HmacAlgorithm,
): Promise<Result<HashDigest>> {
  switch (algorithm) {
    case 'SHA-256':
    case 'SHA-512':
      break
    default:
      return assertNever(algorithm)
  }
  if (key.byteLength === 0) return err('Klucz HMAC nie może być pusty.')
  try {
    const cryptoKey = await crypto.subtle.importKey('raw', copyBytes(key), { name: 'HMAC', hash: algorithm }, false, [
      'sign',
    ])
    const signed = new Uint8Array(await crypto.subtle.sign('HMAC', cryptoKey, copyBytes(data)))
    return ok({ hex: bytesToHex(signed), base64: encodeBase64Bytes(signed) })
  } catch {
    return err('Nie udało się policzyć HMAC.')
  }
}

export function hmacText(key: string, message: string, algorithm: HmacAlgorithm): Promise<Result<HashDigest>> {
  const encoder = new TextEncoder()
  return hmacBytes(encoder.encode(key), encoder.encode(message), algorithm)
}
