import { encodeHexBytes } from './hex'
import { err, ok, type Result } from './result'

export type UnicodeEscapeStyle = 'uXXXX' | 'codepoint'

export interface CodePointRow {
  character: string
  hex: string
  decimal: number
  utf8: string
}

export function isUnicodeEscapeStyle(value: string): value is UnicodeEscapeStyle {
  return value === 'uXXXX' || value === 'codepoint'
}

function escapeCodePoint(codePoint: number, style: UnicodeEscapeStyle): string {
  if (style === 'codepoint') return `\\u{${codePoint.toString(16)}}`
  if (codePoint <= 0xffff) return `\\u${codePoint.toString(16).padStart(4, '0')}`
  const high = Math.floor((codePoint - 0x10000) / 0x400) + 0xd800
  const low = ((codePoint - 0x10000) % 0x400) + 0xdc00
  return `\\u${high.toString(16).padStart(4, '0')}\\u${low.toString(16).padStart(4, '0')}`
}

export function escapeUnicode(text: string, style: UnicodeEscapeStyle = 'uXXXX'): string {
  let out = ''
  for (const char of text) {
    const codePoint = char.codePointAt(0) ?? 0
    if (char === '\\' || codePoint < 0x20 || codePoint === 0x7f || codePoint > 0x7e) out += escapeCodePoint(codePoint, style)
    else out += char
  }
  return out
}

export function unescapeUnicode(input: string): Result<string> {
  let out = ''
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index] ?? ''
    if (char !== '\\') {
      out += char
      continue
    }
    const next = input[index + 1]
    if (next === undefined) return err('Ucieczka na końcu tekstu jest niedokończona.')
    if (next === 'u' && input[index + 2] === '{') {
      const end = input.indexOf('}', index + 3)
      const hex = end === -1 ? '' : input.slice(index + 3, end)
      if (!/^[0-9a-fA-F]{1,6}$/.test(hex)) return err('Niepoprawny punkt kodowy \\u{…}.')
      const codePoint = Number.parseInt(hex, 16)
      if (codePoint > 0x10ffff) return err('Punkt kodowy jest poza Unicode.')
      out += String.fromCodePoint(codePoint)
      index = end
      continue
    }
    if (next === 'u') {
      const hex = input.slice(index + 2, index + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) return err('Niepoprawna ucieczka \\uXXXX.')
      out += String.fromCharCode(Number.parseInt(hex, 16))
      index += 5
      continue
    }
    if (next === 'x') {
      const hex = input.slice(index + 2, index + 4)
      if (!/^[0-9a-fA-F]{2}$/.test(hex)) return err('Niepoprawna ucieczka \\xHH.')
      out += String.fromCharCode(Number.parseInt(hex, 16))
      index += 3
      continue
    }
    if (next === 'n') out += '\n'
    else if (next === 'r') out += '\r'
    else if (next === 't') out += '\t'
    else if (next === '\\') out += '\\'
    else return err(`Nieobsługiwana ucieczka \\${next}.`)
    index += 1
  }
  return ok(out)
}

export function inspectUnicode(text: string): CodePointRow[] {
  const rows: CodePointRow[] = []
  for (const character of text) {
    const decimal = character.codePointAt(0) ?? 0
    rows.push({
      character,
      hex: `U+${decimal.toString(16).toUpperCase().padStart(4, '0')}`,
      decimal,
      utf8: encodeHexBytes(new TextEncoder().encode(character)),
    })
  }
  return rows
}

export function formatCodePoints(text: string): string {
  return inspectUnicode(text)
    .map((row) => `${row.hex}  ${row.decimal}  ${row.utf8}  ${row.character}`)
    .join('\n')
}
