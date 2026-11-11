import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

const INDENT = 2

class YamlParseError extends Error {
  constructor(
    message: string,
    readonly line: number,
  ) {
    super(message)
  }
}

interface YamlLine {
  no: number
  indent: number
  text: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function needsQuotes(value: string): boolean {
  if (value.length === 0 || value !== value.trim()) return true
  if (value.includes('\n') || value.includes('\r') || value.includes('\t')) return true
  if (/^(?:true|false|null|True|False|Null|TRUE|FALSE|NULL|~)$/.test(value)) return true
  if (value === '[]' || value === '{}') return true
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) return true
  if (/[:#&*!|>'"%@`{}[\],?]/.test(value)) return true
  const first = value[0] ?? ''
  if ('-?:*&!'.includes(first)) return true
  if (value.includes(': ') || value.includes(' #') || value.startsWith('#')) return true
  return false
}

function escapeYamlString(value: string): string {
  let out = '"'
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (char === '\\') out += '\\\\'
    else if (char === '"') out += '\\"'
    else if (char === '\n') out += '\\n'
    else if (char === '\r') out += '\\r'
    else if (char === '\t') out += '\\t'
    else if (code < 0x20) out += `\\u${code.toString(16).padStart(4, '0')}`
    else out += char
  }
  return `${out}"`
}

function emitScalar(value: unknown): string {
  if (value === null) return 'null'
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return JSON.stringify(value)
  if (typeof value === 'string') return needsQuotes(value) ? escapeYamlString(value) : value
  if (Array.isArray(value)) return '[]'
  if (isRecord(value)) return '{}'
  return 'null'
}

function isBlock(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0
  if (isRecord(value)) return Object.keys(value).length > 0
  return false
}

function emitLines(value: unknown, level: number): string[] {
  const pad = ' '.repeat(INDENT * level)
  if (!isBlock(value)) return [`${pad}${emitScalar(value)}`]
  if (Array.isArray(value)) {
    const lines: string[] = []
    for (const item of value) {
      if (!isBlock(item)) {
        lines.push(`${pad}- ${emitScalar(item)}`)
        continue
      }
      if (Array.isArray(item)) {
        lines.push(`${pad}-`)
        lines.push(...emitLines(item, level + 1))
        continue
      }
      const child = emitLines(item, level + 1)
      const first = child[0] ?? ''
      lines.push(`${pad}- ${first.slice(pad.length + INDENT)}`)
      for (const line of child.slice(1)) lines.push(line)
    }
    return lines
  }
  const lines: string[] = []
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const renderedKey = needsQuotes(key) ? escapeYamlString(key) : key
    if (!isBlock(child)) {
      lines.push(`${pad}${renderedKey}: ${emitScalar(child)}`)
      continue
    }
    lines.push(`${pad}${renderedKey}:`)
    lines.push(...emitLines(child, level + 1))
  }
  return lines
}

export function jsonToYaml(input: string): Result<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  return ok(`${emitLines(parsed.value, 0).join('\n')}\n`)
}

function hasUnquotedTab(line: string): boolean {
  let quote: '"' | "'" | null = null
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? ''
    if (quote === "'") {
      if (char === "'" && line[index + 1] === "'") {
        index += 1
        continue
      }
      if (char === "'") quote = null
      continue
    }
    if (quote === '"') {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === '"') quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '\t') return true
  }
  return false
}

function stripComment(line: string): string {
  let quote: '"' | "'" | null = null
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index] ?? ''
    if (quote === "'") {
      if (char === "'" && line[index + 1] === "'") {
        index += 1
        continue
      }
      if (char === "'") quote = null
      continue
    }
    if (quote === '"') {
      if (char === '\\') {
        index += 1
        continue
      }
      if (char === '"') quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '#' && (index === 0 || /\s/.test(line[index - 1] ?? ''))) return line.slice(0, index)
  }
  return line
}

function preprocess(input: string): Result<YamlLine[]> {
  const source = input.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const lines: YamlLine[] = []
  for (let index = 0; index < source.length; index += 1) {
    const original = source[index] ?? ''
    if (hasUnquotedTab(original)) return err(`YAML, wiersz ${index + 1}: tabulatory nie są obsługiwane. Użyj spacji.`)
    const stripped = stripComment(original).trimEnd()
    if (stripped.trim() === '') continue
    const indent = stripped.match(/^ */)?.[0].length ?? 0
    const text = stripped.slice(indent)
    if (text === '---') {
      if (lines.length === 0) continue
      return err(`YAML, wiersz ${index + 1}: wiele dokumentów nie jest obsługiwanych.`)
    }
    if (text === '...') continue
    lines.push({ no: index + 1, indent, text })
  }
  return ok(lines)
}

class Cursor {
  index = 0

  constructor(private readonly lines: YamlLine[]) {}

  peek(): YamlLine | undefined {
    return this.lines[this.index]
  }

  advance(): YamlLine {
    const line = this.lines[this.index]
    this.index += 1
    if (!line) throw new YamlParseError('Nieoczekiwany koniec dokumentu YAML.', 1)
    return line
  }
}

function parseDoubleQuoted(value: string, line: number): string {
  if (!value.endsWith('"') || value.length < 2) throw new YamlParseError('Niezakończony cudzysłów.', line)
  let out = ''
  for (let index = 1; index < value.length; index += 1) {
    const char = value[index] ?? ''
    if (char === '"') {
      if (index !== value.length - 1) throw new YamlParseError('Znak po cudzysłowie.', line)
      return out
    }
    if (char !== '\\') {
      out += char
      continue
    }
    const next = value[index + 1]
    if (next === undefined) throw new YamlParseError('Niepoprawna ucieczka.', line)
    if (next === 'n') out += '\n'
    else if (next === 'r') out += '\r'
    else if (next === 't') out += '\t'
    else if (next === '"') out += '"'
    else if (next === '\\') out += '\\'
    else if (next === '/') out += '/'
    else if (next === 'u') {
      const hex = value.slice(index + 2, index + 6)
      if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new YamlParseError('Niepoprawne \\u.', line)
      out += String.fromCharCode(Number.parseInt(hex, 16))
      index += 5
      continue
    } else throw new YamlParseError('Niepoprawna ucieczka.', line)
    index += 1
  }
  throw new YamlParseError('Niezakończony cudzysłów.', line)
}

function parseSingleQuoted(value: string, line: number): string {
  if (!value.endsWith("'") || value.length < 2) throw new YamlParseError('Niezakończony apostrof.', line)
  let out = ''
  for (let index = 1; index < value.length; index += 1) {
    const char = value[index] ?? ''
    if (char === "'") {
      if (value[index + 1] === "'") {
        out += "'"
        index += 1
        continue
      }
      if (index === value.length - 1) return out
      throw new YamlParseError('Znak po apostrofie.', line)
    }
    out += char
  }
  throw new YamlParseError('Niezakończony apostrof.', line)
}

function parseScalar(raw: string, line: number): unknown {
  const value = raw.trim()
  if (value === '' || value === '~' || value === 'null' || value === 'Null' || value === 'NULL') return null
  if (value === 'true' || value === 'True' || value === 'TRUE') return true
  if (value === 'false' || value === 'False' || value === 'FALSE') return false
  if (value === '[]') return []
  if (value === '{}') return {}
  if (value.startsWith('"')) return parseDoubleQuoted(value, line)
  if (value.startsWith("'")) return parseSingleQuoted(value, line)
  if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value)) {
    const numeric = JSON.parse(value) as number
    if (Number.isFinite(numeric)) return numeric
  }
  return value
}

function parseKey(raw: string, line: number): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
    const value = parseScalar(trimmed, line)
    if (typeof value !== 'string') throw new YamlParseError('Klucz musi być tekstem.', line)
    return value
  }
  if (trimmed === '') throw new YamlParseError('Niepoprawny klucz.', line)
  return trimmed
}

function splitMapping(text: string): { keyRaw: string; rest: string } | null {
  if (text.startsWith('"') || text.startsWith("'")) {
    const quote = text[0] ?? ''
    for (let index = 1; index < text.length; index += 1) {
      const char = text[index] ?? ''
      if (quote === '"' && char === '\\') {
        index += 1
        continue
      }
      if (quote === "'" && char === "'" && text[index + 1] === "'") {
        index += 1
        continue
      }
      if (char === quote) {
        const after = text.slice(index + 1)
        if (!after.startsWith(':')) return null
        return { keyRaw: text.slice(0, index + 1), rest: after.slice(1).trim() }
      }
    }
    return null
  }
  const colon = text.indexOf(':')
  if (colon <= 0) return null
  const next = text[colon + 1]
  if (next !== undefined && next !== ' ' && next !== '\t') return null
  return { keyRaw: text.slice(0, colon).trim(), rest: text.slice(colon + 1).trim() }
}

function isSequenceItem(text: string): boolean {
  return text === '-' || text.startsWith('- ')
}

function putMappingEntry(
  target: Record<string, unknown>,
  cursor: Cursor,
  line: YamlLine,
  split: { keyRaw: string; rest: string },
): void {
  const key = parseKey(split.keyRaw, line.no)
  if (Object.prototype.hasOwnProperty.call(target, key)) {
    throw new YamlParseError(`Powtórzony klucz „${key}”.`, line.no)
  }
  if (split.rest === '') {
    const next = cursor.peek()
    target[key] = next && next.indent > line.indent ? parseNode(cursor, line.indent + 1) : null
    return
  }
  if (isSequenceItem(split.rest) || splitMapping(split.rest)) {
    throw new YamlParseError('Zagnieżdżenie w jednej linii nie jest obsługiwane.', line.no)
  }
  target[key] = parseScalar(split.rest, line.no)
}

function parseMapping(cursor: Cursor, indent: number): Record<string, unknown> {
  const target = Object.create(null) as Record<string, unknown>
  for (let guard = 0; guard < 100000; guard += 1) {
    const next = cursor.peek()
    if (!next || next.indent !== indent || isSequenceItem(next.text)) break
    const split = splitMapping(next.text)
    if (!split) break
    putMappingEntry(target, cursor, cursor.advance(), split)
  }
  return target
}

function parseMappingItem(cursor: Cursor, first: YamlLine, rest: string, keyIndent: number): Record<string, unknown> {
  const split = splitMapping(rest)
  if (!split) throw new YamlParseError('Oczekiwano mapy.', first.no)
  const target = Object.create(null) as Record<string, unknown>
  putMappingEntry(target, cursor, { ...first, indent: keyIndent, text: rest }, split)
  for (let guard = 0; guard < 100000; guard += 1) {
    const next = cursor.peek()
    if (!next || next.indent !== keyIndent) break
    const mapped = splitMapping(next.text)
    if (!mapped || isSequenceItem(next.text)) break
    putMappingEntry(target, cursor, cursor.advance(), mapped)
  }
  return target
}

function parseSequence(cursor: Cursor, indent: number): unknown[] {
  const items: unknown[] = []
  for (let guard = 0; guard < 100000; guard += 1) {
    const next = cursor.peek()
    if (!next || next.indent !== indent || !isSequenceItem(next.text)) break
    const line = cursor.advance()
    const rest = line.text === '-' ? '' : line.text.slice(2)
    if (rest === '') {
      const nested = cursor.peek()
      items.push(nested && nested.indent > indent ? parseNode(cursor, indent + 1) : null)
      continue
    }
    if (isSequenceItem(rest)) throw new YamlParseError('Zagnieżdżoną listę zacznij w kolejnym wierszu.', line.no)
    if (splitMapping(rest)) {
      items.push(parseMappingItem(cursor, line, rest, indent + INDENT))
      continue
    }
    const following = cursor.peek()
    if (following && following.indent > indent) {
      throw new YamlParseError('Kontynuacja skalara nie jest obsługiwana.', following.no)
    }
    items.push(parseScalar(rest, line.no))
  }
  return items
}

function parseNode(cursor: Cursor, minIndent: number): unknown {
  const line = cursor.peek()
  if (!line || line.indent < minIndent) return null
  if (isSequenceItem(line.text)) return parseSequence(cursor, line.indent)
  if (splitMapping(line.text)) return parseMapping(cursor, line.indent)
  return parseScalar(cursor.advance().text, line.no)
}

export function parseYaml(input: string): Result<unknown> {
  try {
    const lines = preprocess(input)
    if (!lines.ok) return lines
    if (lines.value.length === 0) return err('Pusty dokument YAML.')
    const cursor = new Cursor(lines.value)
    const value = parseNode(cursor, 0)
    const left = cursor.peek()
    if (left) return err(`YAML, wiersz ${left.no}: nieoczekiwana treść.`)
    return ok(value)
  } catch (error) {
    if (error instanceof YamlParseError) return err(`YAML, wiersz ${error.line}: ${error.message}`)
    return err('Nie udało się odczytać YAML.')
  }
}

export function yamlToJson(input: string): Result<string> {
  const parsed = parseYaml(input)
  if (!parsed.ok) return parsed
  return ok(`${JSON.stringify(parsed.value, null, 2)}\n`)
}
