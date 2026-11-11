export interface JsonIssue {
  error: string
  line: number
  column: number
  position: number
}

export type JsonResult<T> = { ok: true; value: T } | ({ ok: false } & JsonIssue)

export interface JsonFormatOptions {
  indent?: number | 'tab'
  sortKeys?: boolean
}

const MAX_DEPTH = 100

class JsonSyntaxError extends Error {
  constructor(
    message: string,
    readonly line: number,
    readonly column: number,
    readonly position: number,
  ) {
    super(message)
  }
}

class JsonReader {
  private index = 0
  private line = 1
  private column = 1
  private depth = 0

  constructor(private readonly input: string) {}

  parse(): unknown {
    this.skipWs()
    if (this.eof()) this.fail('Pusty dokument JSON.')
    const value = this.parseValue()
    this.skipWs()
    if (!this.eof()) this.fail('Nieoczekiwane znaki po wartości JSON.')
    return value
  }

  private parseValue(): unknown {
    this.skipWs()
    this.depth += 1
    if (this.depth > MAX_DEPTH) this.fail('Zbyt głęboko zagnieżdżony JSON.')
    const current = this.peek()
    try {
      if (current === '{') return this.parseObject()
      if (current === '[') return this.parseArray()
      if (current === '"') return this.parseString()
      if (current === 't') return this.parseLiteral('true', true)
      if (current === 'f') return this.parseLiteral('false', false)
      if (current === 'n') return this.parseLiteral('null', null)
      if (current === '-' || this.isDigit(current)) return this.parseNumber()
      if (this.eof()) this.fail('Nieoczekiwany koniec danych JSON.')
      this.fail(`Nieoczekiwany znak „${current}”.`)
    } finally {
      this.depth -= 1
    }
  }

  private parseObject(): Record<string, unknown> {
    this.expect('{')
    this.skipWs()
    const obj = Object.create(null) as Record<string, unknown>
    if (this.peek() === '}') {
      this.advance()
      return obj
    }
    for (let guard = 0; guard <= this.input.length; guard += 1) {
      this.skipWs()
      if (this.peek() !== '"') this.fail('Oczekiwano klucza w cudzysłowie.')
      const key = this.parseString()
      this.skipWs()
      this.expect(':')
      obj[key] = this.parseValue()
      this.skipWs()
      if (this.peek() === ',') {
        this.advance()
        this.skipWs()
        if (this.peek() === '}') this.fail('Przecinek na końcu obiektu JSON jest niedozwolony.')
        continue
      }
      if (this.peek() === '}') {
        this.advance()
        return obj
      }
      this.fail(this.eof() ? 'Nieoczekiwany koniec danych JSON.' : 'Oczekiwano „,” lub „}”.')
    }
    this.fail('Nieoczekiwany koniec danych JSON.')
  }

  private parseArray(): unknown[] {
    this.expect('[')
    this.skipWs()
    const items: unknown[] = []
    if (this.peek() === ']') {
      this.advance()
      return items
    }
    for (let guard = 0; guard <= this.input.length; guard += 1) {
      items.push(this.parseValue())
      this.skipWs()
      if (this.peek() === ',') {
        this.advance()
        this.skipWs()
        if (this.peek() === ']') this.fail('Przecinek na końcu tablicy JSON jest niedozwolony.')
        continue
      }
      if (this.peek() === ']') {
        this.advance()
        return items
      }
      this.fail(this.eof() ? 'Nieoczekiwany koniec danych JSON.' : 'Oczekiwano „,” lub „]”.')
    }
    this.fail('Nieoczekiwany koniec danych JSON.')
  }

  private parseString(): string {
    this.expect('"')
    let out = ''
    for (let guard = 0; guard <= this.input.length; guard += 1) {
      if (this.eof()) this.fail('Niezakończony tekst JSON.')
      const current = this.peek()
      if (current === '"') {
        this.advance()
        return out
      }
      if (current === '\\') {
        this.advance()
        out += this.parseEscape()
        continue
      }
      const code = current.charCodeAt(0)
      if (code <= 0x1f) this.fail('Niedozwolony znak sterujący w tekście JSON.')
      out += this.advance()
    }
    this.fail('Niezakończony tekst JSON.')
  }

  private parseEscape(): string {
    if (this.eof()) this.fail('Niepoprawny znak ucieczki w tekście JSON.')
    const current = this.advance()
    if (current === '"') return '"'
    if (current === '\\') return '\\'
    if (current === '/') return '/'
    if (current === 'b') return '\b'
    if (current === 'f') return '\f'
    if (current === 'n') return '\n'
    if (current === 'r') return '\r'
    if (current === 't') return '\t'
    if (current === 'u') return this.parseUnicodeEscape()
    this.fail('Niepoprawny znak ucieczki w tekście JSON.')
  }

  private parseUnicodeEscape(): string {
    let hex = ''
    for (let i = 0; i < 4; i += 1) {
      if (this.eof() || !/^[0-9a-fA-F]$/.test(this.peek())) {
        this.fail('Niepoprawny kod Unicode \\u w tekście JSON.')
      }
      hex += this.advance()
    }
    return String.fromCharCode(Number.parseInt(hex, 16))
  }

  private parseLiteral(word: string, value: unknown): unknown {
    for (const expected of word) {
      if (this.peek() !== expected) this.fail(`Oczekiwano „${word}”.`)
      this.advance()
    }
    const next = this.peek()
    if (this.isIdentifierPart(next)) this.fail(`Oczekiwano „${word}”.`)
    return value
  }

  private parseNumber(): number | bigint {
    const start = this.index
    if (this.peek() === '-') this.advance()
    if (this.peek() === '0') {
      this.advance()
      if (this.isDigit(this.peek())) this.fail('Liczba JSON nie może mieć wiodącego zera.')
    } else if (this.isDigit(this.peek())) {
      while (this.isDigit(this.peek())) this.advance()
    } else {
      this.fail('Niepoprawna liczba JSON.')
    }
    if (this.peek() === '.') {
      this.advance()
      if (!this.isDigit(this.peek())) this.fail('Niepoprawna liczba JSON.')
      while (this.isDigit(this.peek())) this.advance()
    }
    if (this.peek() === 'e' || this.peek() === 'E') {
      this.advance()
      if (this.peek() === '+' || this.peek() === '-') this.advance()
      if (!this.isDigit(this.peek())) this.fail('Niepoprawna liczba JSON.')
      while (this.isDigit(this.peek())) this.advance()
    }
    const lexeme = this.input.slice(start, this.index)
    const value = JSON.parse(lexeme) as number
    if (!Number.isFinite(value)) {
      this.moveTo(start)
      this.fail('Liczba JSON jest poza zakresem.')
    }
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) {
      if (/^-?(?:0|[1-9]\d*)$/.test(lexeme)) return BigInt(lexeme)
      this.moveTo(start)
      this.fail('Liczba JSON jest poza zakresem.')
    }
    return value
  }

  private skipWs(): void {
    for (let guard = 0; guard <= this.input.length; guard += 1) {
      const current = this.peek()
      if (current !== ' ' && current !== '\t' && current !== '\n' && current !== '\r') return
      this.advance()
    }
  }

  private expect(expected: string): void {
    if (this.peek() !== expected) {
      this.fail(this.eof() ? 'Nieoczekiwany koniec danych JSON.' : `Oczekiwano „${expected}”.`)
    }
    this.advance()
  }

  private advance(): string {
    const current = this.input[this.index] ?? ''
    this.index += 1
    if (current === '\n') {
      this.line += 1
      this.column = 1
      return current
    }
    if (current === '\r') {
      if (this.input[this.index] === '\n') this.index += 1
      this.line += 1
      this.column = 1
      return current
    }
    this.column += 1
    return current
  }

  private moveTo(position: number): void {
    this.index = 0
    this.line = 1
    this.column = 1
    while (this.index < position) this.advance()
  }

  private peek(): string {
    return this.input[this.index] ?? ''
  }

  private eof(): boolean {
    return this.index >= this.input.length
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9'
  }

  private isIdentifierPart(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || this.isDigit(char) || char === '_'
  }

  private fail(message: string): never {
    throw new JsonSyntaxError(message, this.line, this.column, this.index)
  }
}

export function parseJson(input: string): JsonResult<unknown> {
  const source = input.replace(/^\uFEFF/, '')
  if (source.trim() === '') {
    return { ok: false, error: 'Pusty dokument JSON.', line: 1, column: 1, position: 0 }
  }
  try {
    return { ok: true, value: new JsonReader(source).parse() }
  } catch (error) {
    if (error instanceof JsonSyntaxError) {
      return {
        ok: false,
        error: error.message,
        line: error.line,
        column: error.column,
        position: error.position,
      }
    }
    return { ok: false, error: 'Nie udało się odczytać JSON.', line: 1, column: 1, position: 0 }
  }
}

export function validateJson(input: string): JsonResult<unknown> {
  return parseJson(input)
}

export function formatJsonIssue(issue: Pick<JsonIssue, 'error' | 'line' | 'column'>): string {
  return `Wiersz ${issue.line}, kolumna ${issue.column}: ${issue.error}`
}

function plural(count: number, one: string, few: string, many: string): string {
  const abs = Math.abs(count)
  if (abs === 1) return one
  const mod10 = abs % 10
  const mod100 = abs % 100
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function describeJsonValue(value: unknown): string {
  if (value === null) return 'Poprawny JSON: null.'
  if (Array.isArray(value)) {
    return `Poprawny JSON: tablica, ${value.length} ${plural(value.length, 'element', 'elementy', 'elementów')}.`
  }
  switch (typeof value) {
    case 'string':
      return 'Poprawny JSON: tekst.'
    case 'number':
      return 'Poprawny JSON: liczba.'
    case 'boolean':
      return 'Poprawny JSON: wartość logiczna.'
    case 'object': {
      const count = Object.keys(value).length
      return `Poprawny JSON: obiekt, ${count} ${plural(count, 'klucz', 'klucze', 'kluczy')}.`
    }
    case 'undefined':
    case 'function':
    case 'symbol':
    case 'bigint':
      return 'Poprawny JSON.'
    default:
      return 'Poprawny JSON.'
  }
}

function sortKeysDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeysDeep)
  if (value !== null && typeof value === 'object') {
    const source = value as Record<string, unknown>
    const sorted = Object.create(null) as Record<string, unknown>
    for (const key of Object.keys(source).sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))) {
      sorted[key] = sortKeysDeep(source[key])
    }
    return sorted
  }
  return value
}

function resolveIndent(indent: number | 'tab' | undefined): JsonResult<number | '\t' | undefined> {
  if (indent === undefined) return { ok: true, value: 2 }
  if (indent === 'tab') return { ok: true, value: '\t' }
  if (!Number.isInteger(indent) || indent < 0 || indent > 10) {
    return {
      ok: false,
      error: 'Wcięcie JSON musi być liczbą całkowitą od 0 do 10 albo tabulatorem.',
      line: 1,
      column: 1,
      position: 0,
    }
  }
  return { ok: true, value: indent === 0 ? undefined : indent }
}

export function stringifyJson(value: unknown, space?: number | '\t'): string {
  const gap = space === undefined || space === 0 ? '' : space === '\t' ? '\t' : ' '.repeat(space)
  return writeJson(value, gap, 0)
}

export function formatJson(input: string, options: JsonFormatOptions = {}): JsonResult<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return parsed
  const indent = resolveIndent(options.indent)
  if (!indent.ok) return indent
  const value = options.sortKeys ? sortKeysDeep(parsed.value) : parsed.value
  const text = stringifyJson(value, indent.value === '\t' || typeof indent.value === 'number' ? indent.value : undefined)
  return { ok: true, value: indent.value === undefined ? text : `${text}\n` }
}

export function minifyJson(input: string): JsonResult<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return parsed
  return { ok: true, value: stringifyJson(parsed.value) }
}

function writeJson(value: unknown, gap: string, depth: number): string {
  if (typeof value === 'bigint') return value.toString()
  if (value === null || typeof value === 'number' || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value) ?? 'null'
  }
  const nested = gap === '' ? '' : `\n${gap.repeat(depth + 1)}`
  const close = gap === '' ? '' : `\n${gap.repeat(depth)}`
  const separator = gap === '' ? ',' : `,${nested}`
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return `[${nested}${value.map((item) => writeJson(item, gap, depth + 1)).join(separator)}${close}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const body = entries.map(([key, item]) => {
      const rendered = writeJson(item, gap, depth + 1)
      return `${JSON.stringify(key)}:${gap === '' ? '' : ' '}${rendered}`
    })
    return `{${nested}${body.join(separator)}${close}}`
  }
  return 'null'
}
