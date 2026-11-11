import { err, ok, type Result } from './result'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function encodeBase32Bytes(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      out += ALPHABET[(value >> bits) & 31] ?? ''
    }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31] ?? ''
  while (out.length % 8 !== 0) out += '='
  return out
}

export function encodeBase32(text: string): string {
  return encodeBase32Bytes(new TextEncoder().encode(text))
}

export function decodeBase32ToBytes(input: string): Result<Uint8Array> {
  const compact = input.replace(/\s+/g, '').toUpperCase()
  if (compact === '') return ok(new Uint8Array())
  if (!/^[A-Z2-7]+=*$/.test(compact)) return err('Niepoprawny znak w Base32.')
  if (compact.includes('=')) {
    const padding = compact.match(/=*$/)?.[0].length ?? 0
    if (compact.length % 8 !== 0 || padding > 6 || compact.slice(0, -padding).includes('=')) {
      return err('Niepoprawne dopełnienie Base32.')
    }
  }
  const data = compact.replace(/=+$/, '')
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of data) {
    value = (value << 5) | ALPHABET.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((value >> bits) & 255)
    }
  }
  return ok(Uint8Array.from(out))
}

export function decodeBase32(input: string): Result<string> {
  const bytes = decodeBase32ToBytes(input)
  if (!bytes.ok) return bytes
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes.value))
  } catch {
    return err('Dane Base32 nie są poprawnym tekstem UTF-8.')
  }
}
