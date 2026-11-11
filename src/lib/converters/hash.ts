import { encodeBase64Bytes } from './base64'
import { assertNever } from './result'

export const HASH_ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-512'] as const
export type HashAlgorithm = (typeof HASH_ALGORITHMS)[number]

export const SHA1_NOTICE =
  'SHA-1 jest przestarzały i nie nadaje się do nowych zabezpieczeń. Skrót liczy się lokalnie w przeglądarce i nie szyfruje treści.'

export interface HashDigest {
  hex: string
  base64: string
}

function assertAlgorithm(algorithm: HashAlgorithm): void {
  switch (algorithm) {
    case 'SHA-1':
    case 'SHA-256':
    case 'SHA-512':
      return
    default:
      assertNever(algorithm)
  }
}

export async function hashBytes(bytes: Uint8Array, algorithm: HashAlgorithm): Promise<HashDigest> {
  assertAlgorithm(algorithm)
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  const digest = new Uint8Array(await crypto.subtle.digest(algorithm, copy))
  const hex = Array.from(digest, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return { hex, base64: encodeBase64Bytes(digest) }
}

export function hashUtf8(text: string, algorithm: HashAlgorithm): Promise<HashDigest> {
  return hashBytes(new TextEncoder().encode(text), algorithm)
}
