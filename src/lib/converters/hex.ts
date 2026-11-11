import { err, ok, type Result } from './result'

export function encodeHexBytes(bytes: Uint8Array, uppercase = false): string {
  let hex = ''
  for (const byte of bytes) hex += byte.toString(16).padStart(2, '0')
  return uppercase ? hex.toUpperCase() : hex
}

export function encodeHex(text: string, uppercase = false): string {
  return encodeHexBytes(new TextEncoder().encode(text), uppercase)
}

export function decodeHexToBytes(input: string): Result<Uint8Array> {
  const cleaned = input.trim().replace(/^0x/i, '').replace(/\s+/g, '')
  if (cleaned === '') return ok(new Uint8Array())
  if (cleaned.length % 2 !== 0) return err('Hex musi mieć parzystą liczbę znaków.')
  if (!/^[0-9a-f]+$/i.test(cleaned)) return err('Niepoprawny znak w hex.')
  const out = new Uint8Array(cleaned.length / 2)
  for (let index = 0; index < out.length; index += 1) {
    out[index] = Number.parseInt(cleaned.slice(index * 2, index * 2 + 2), 16)
  }
  return ok(out)
}

export function decodeHex(input: string): Result<string> {
  const bytes = decodeHexToBytes(input)
  if (!bytes.ok) return bytes
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes.value))
  } catch {
    return err('Dane hex nie są poprawnym tekstem UTF-8.')
  }
}
