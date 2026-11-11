import { err, ok, type Result } from './result'

const STANDARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const URL_SAFE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

export type Base64Variant = 'standard' | 'url' | 'auto'

export interface Base64Options {
  variant?: Base64Variant
  wrap?: boolean
}

function encodeAlphabet(urlSafe: boolean): string {
  return urlSafe ? URL_SAFE : STANDARD
}

function wrapLines(value: string, width: number): string {
  const lines: string[] = []
  for (let index = 0; index < value.length; index += width) lines.push(value.slice(index, index + width))
  return lines.join('\n')
}

export function encodeBase64Bytes(bytes: Uint8Array, options: Base64Options = {}): string {
  const urlSafe = options.variant === 'url'
  const alphabet = encodeAlphabet(urlSafe)
  let out = ''
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0
    const second = index + 1 < bytes.length ? (bytes[index + 1] ?? 0) : 0
    const third = index + 2 < bytes.length ? (bytes[index + 2] ?? 0) : 0
    const chunk = (first << 16) | (second << 8) | third
    out += alphabet[(chunk >> 18) & 63] ?? ''
    out += alphabet[(chunk >> 12) & 63] ?? ''
    out += index + 1 < bytes.length ? (alphabet[(chunk >> 6) & 63] ?? '') : urlSafe ? '' : '='
    out += index + 2 < bytes.length ? (alphabet[chunk & 63] ?? '') : urlSafe ? '' : '='
  }
  return options.wrap ? wrapLines(out, 76) : out
}

export function encodeBase64(text: string, options: Base64Options = {}): string {
  return encodeBase64Bytes(new TextEncoder().encode(text), options)
}

function resolveUrlSafe(cleaned: string, variant: Base64Variant): Result<boolean> {
  const hasStandard = cleaned.includes('+') || cleaned.includes('/')
  const hasUrl = cleaned.includes('-') || cleaned.includes('_')
  if (variant === 'standard') {
    if (hasUrl) return err('To wygląda na Base64 URL-safe (znaki - lub _). Wybierz wariant URL-safe.')
    return ok(false)
  }
  if (variant === 'url') {
    if (hasStandard) return err('Wariant URL-safe nie używa znaków + ani /.')
    return ok(true)
  }
  if (hasStandard && hasUrl) return err('Mieszanka standardowego Base64 i wariantu URL-safe.')
  return ok(hasUrl)
}

const DECODE_TABLE = (() => {
  const table = Array<number>(128).fill(-1)
  for (let index = 0; index < STANDARD.length; index += 1) table[STANDARD.charCodeAt(index)] = index
  return table
})()

function decodeChar(char: string): number {
  const code = char.charCodeAt(0)
  if (code >= DECODE_TABLE.length) return -1
  return DECODE_TABLE[code] ?? -1
}

export function decodeBase64ToBytes(input: string, options: Base64Options = {}): Result<Uint8Array> {
  const cleaned = input.replace(/\s+/g, '')
  if (cleaned === '') return ok(new Uint8Array())
  const urlSafe = resolveUrlSafe(cleaned, options.variant ?? 'auto')
  if (!urlSafe.ok) return urlSafe
  let data = urlSafe.value ? cleaned.replace(/-/g, '+').replace(/_/g, '/') : cleaned
  if (!/^[A-Za-z0-9+/=]*$/.test(data)) return err('Niepoprawny znak w Base64.')
  if (data.includes('=')) {
    if (data.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={1,2}$/.test(data)) {
      return err('Znak „=” w złym miejscu.')
    }
  } else if (data.length % 4 === 1) {
    return err('Niepoprawna długość Base64.')
  } else if (data.length % 4 !== 0) {
    data += '='.repeat(4 - (data.length % 4))
  }
  const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0
  const out = new Uint8Array((data.length / 4) * 3 - padding)
  let written = 0
  for (let index = 0; index < data.length; index += 4) {
    const c0 = decodeChar(data[index] ?? '')
    const c1 = decodeChar(data[index + 1] ?? '')
    const thirdChar = data[index + 2] ?? ''
    const fourthChar = data[index + 3] ?? ''
    const c2 = thirdChar === '=' ? 0 : decodeChar(thirdChar)
    const c3 = fourthChar === '=' ? 0 : decodeChar(fourthChar)
    if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) return err('Niepoprawny znak w Base64.')
    if (thirdChar === '=' && fourthChar !== '=') return err('Znak „=” w złym miejscu.')
    const chunk = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3
    if (written < out.length) out[written++] = (chunk >> 16) & 255
    if (thirdChar !== '=' && written < out.length) out[written++] = (chunk >> 8) & 255
    if (fourthChar !== '=' && written < out.length) out[written++] = chunk & 255
  }
  return ok(out)
}

export function decodeBase64(input: string, options: Base64Options = {}): Result<string> {
  const bytes = decodeBase64ToBytes(input, options)
  if (!bytes.ok) return bytes
  try {
    return ok(new TextDecoder('utf-8', { fatal: true }).decode(bytes.value))
  } catch {
    return err('Dane Base64 nie są poprawnym tekstem UTF-8.')
  }
}
