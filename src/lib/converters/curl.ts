import { encodeBase64 } from './base64'
import { err, ok, type Result } from './result'

export interface CurlCode {
  fetch: string
  axios: string
}

const VALUE_SHORT = new Set(['X', 'H', 'd', 'u', 'A', 'b'])
const BOOL_SHORT = new Set(['G', 'I', 'k', 'L', 's', 'S', 'v', 'i', 'f', '4', '6'])

interface CurlRequest {
  method: string
  url: string
  headers: [string, string][]
  body: string[]
  get: boolean
  head: boolean
  json: boolean
}

function tokenize(input: string): Result<string[]> {
  const tokens: string[] = []
  let index = 0
  while (index < input.length) {
    const char = input[index] ?? ''
    if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
      index += 1
      continue
    }
    if (char === '\\' && (input[index + 1] === '\n' || input[index + 1] === '\r')) {
      index += input[index + 1] === '\r' && input[index + 2] === '\n' ? 3 : 2
      continue
    }
    if (char === "'") {
      const end = input.indexOf("'", index + 1)
      if (end === -1) return err('Niezamknięty apostrof w poleceniu curl.')
      tokens.push(input.slice(index + 1, end))
      index = end + 1
      continue
    }
    if (char === '"') {
      let value = ''
      index += 1
      while (index < input.length && input[index] !== '"') {
        if (input[index] === '\\') {
          const next = input[index + 1]
          if (next === undefined) return err('Ucieczka na końcu polecenia curl.')
          if (next === 'n') value += '\n'
          else if (next === 'r') value += '\r'
          else if (next === 't') value += '\t'
          else value += next
          index += 2
          continue
        }
        value += input[index] ?? ''
        index += 1
      }
      if (input[index] !== '"') return err('Niezamknięty cudzysłów w poleceniu curl.')
      tokens.push(value)
      index += 1
      continue
    }
    let value = ''
    while (index < input.length) {
      const current = input[index] ?? ''
      if (current === ' ' || current === '\t' || current === '\n' || current === '\r') break
      if (current === '\\') {
        const next = input[index + 1]
        if (next === undefined) return err('Ucieczka na końcu polecenia curl.')
        if (next === '\n' || next === '\r') break
        value += next
        index += 2
        continue
      }
      value += current
      index += 1
    }
    if (value !== '') tokens.push(value)
  }
  return ok(tokens)
}

function headerPair(raw: string): Result<[string, string]> {
  const split = raw.indexOf(':')
  if (split <= 0) return err(`Nagłówek „${raw}” nie zawiera nazwy i wartości.`)
  return ok([raw.slice(0, split).trim(), raw.slice(split + 1).trim()])
}

function takeValue(tokens: string[], index: number, inline: string | null): Result<{ value: string; next: number }> {
  if (inline !== null) return ok({ value: inline, next: index })
  const value = tokens[index]
  if (value === undefined || value.startsWith('-')) return err('Opcji curl brakuje wartości.')
  return ok({ value, next: index + 1 })
}

function applyLong(request: CurlRequest, name: string, value: string | null, tokens: string[], index: number): Result<number> {
  const needsValue = name === '--request' || name === '--header' || name === '--data' || name === '--data-raw' ||
    name === '--data-ascii' || name === '--data-binary' || name === '--data-urlencode' || name === '--user' ||
    name === '--user-agent' || name === '--url' || name === '--json' || name === '--cookie'
  if (!needsValue) {
    if (name === '--get') request.get = true
    else if (name === '--head') request.head = true
    else if (
      name === '--insecure' || name === '--location' || name === '--silent' || name === '--show-error' ||
      name === '--verbose' || name === '--include' || name === '--compressed' || name === '--fail'
    ) {
      return ok(index)
    } else return err(`Nieobsługiwana opcja curl: ${name}.`)
    return ok(index)
  }
  const taken = takeValue(tokens, index, value)
  if (!taken.ok) return taken
  const next = applyValue(request, name, taken.value.value)
  if (!next.ok) return next
  return ok(taken.value.next)
}

function applyValue(request: CurlRequest, flag: string, value: string): Result<void> {
  if (flag === '-X' || flag === '--request') {
    request.method = value.toUpperCase()
    return ok(undefined)
  }
  if (flag === '-H' || flag === '--header') {
    const header = headerPair(value)
    if (!header.ok) return header
    request.headers.push(header.value)
    return ok(undefined)
  }
  if (flag === '-A' || flag === '--user-agent') {
    request.headers.push(['User-Agent', value])
    return ok(undefined)
  }
  if (flag === '-b' || flag === '--cookie') {
    request.headers.push(['Cookie', value])
    return ok(undefined)
  }
  if (flag === '-u' || flag === '--user') {
    if (!value.includes(':')) return err('Podaj użytkownika i hasło jako użytkownik:hasło.')
    request.headers.push(['Authorization', `Basic ${encodeBase64(value)}`])
    return ok(undefined)
  }
  if (flag === '--url') {
    request.url = value
    return ok(undefined)
  }
  if (flag === '--json') {
    request.json = true
    request.body.push(value)
    return ok(undefined)
  }
  if (
    flag === '-d' || flag === '--data' || flag === '--data-raw' || flag === '--data-ascii' ||
    flag === '--data-binary' || flag === '--data-urlencode'
  ) {
    request.body.push(flag === '--data-urlencode' ? new URLSearchParams({ [value.split('=')[0] ?? '']: value.slice(value.indexOf('=') + 1) }).toString() : value)
    return ok(undefined)
  }
  return err(`Nieobsługiwana opcja curl: ${flag}.`)
}

function applyShort(request: CurlRequest, token: string, tokens: string[], index: number): Result<number> {
  const letters = token.slice(1)
  if (letters.length === 1 && VALUE_SHORT.has(letters)) {
    const taken = takeValue(tokens, index, null)
    if (!taken.ok) return taken
    const applied = applyValue(request, `-${letters}`, taken.value.value)
    if (!applied.ok) return applied
    return ok(taken.value.next)
  }
  if (VALUE_SHORT.has(letters[0] ?? '') && letters.length > 1) {
    const applied = applyValue(request, `-${letters[0]}`, letters.slice(1))
    if (!applied.ok) return applied
    return ok(index)
  }
  for (const letter of letters) {
    if (!BOOL_SHORT.has(letter)) return err(`Nieobsługiwana opcja curl: -${letter}.`)
    if (letter === 'G') request.get = true
    if (letter === 'I') request.head = true
  }
  return ok(index)
}

function parseRequest(tokens: string[]): Result<CurlRequest> {
  const request: CurlRequest = { method: '', url: '', headers: [], body: [], get: false, head: false, json: false }
  let index = 0
  if ((tokens[0] ?? '').split(/[/\\]/).at(-1) === 'curl') index = 1
  while (index < tokens.length) {
    const token = tokens[index] ?? ''
    index += 1
    if (token === '--') {
      const url = tokens[index]
      if (url === undefined) return err('Polecenie curl nie zawiera adresu URL.')
      request.url = url
      index += 1
      continue
    }
    if (token.startsWith('--')) {
      const equals = token.indexOf('=')
      const name = equals === -1 ? token : token.slice(0, equals)
      const inline = equals === -1 ? null : token.slice(equals + 1)
      const next = applyLong(request, name, inline, tokens, index)
      if (!next.ok) return next
      index = next.value
      continue
    }
    if (token.startsWith('-') && token !== '-') {
      const next = applyShort(request, token, tokens, index)
      if (!next.ok) return next
      index = next.value
      continue
    }
    if (request.url !== '') return err('Polecenie curl zawiera więcej niż jeden adres URL.')
    request.url = token
  }
  if (request.url === '') return err('Polecenie curl nie zawiera adresu URL.')
  try {
    void new URL(request.url)
  } catch {
    return err('Niepoprawny adres URL w poleceniu curl.')
  }
  if (request.head) request.method = request.method || 'HEAD'
  else if (request.method === '' && request.body.length > 0 && !request.get) request.method = 'POST'
  else if (request.method === '') request.method = 'GET'
  if (request.get && request.body.length > 0) {
    const query = request.body.join('&')
    request.url += `${request.url.includes('?') ? '&' : '?'}${query}`
    request.body = []
  }
  if (request.json) {
    const names = new Set(request.headers.map(([name]) => name.toLowerCase()))
    if (!names.has('content-type')) request.headers.push(['Content-Type', 'application/json'])
    if (!names.has('accept')) request.headers.push(['Accept', 'application/json'])
  }
  return ok(request)
}

function headerObject(headers: [string, string][]): [string, string][] {
  const seen = new Map<string, number>()
  const unique: [string, string][] = []
  for (const header of headers) {
    const key = header[0].toLowerCase()
    const previous = seen.get(key)
    if (previous === undefined) {
      seen.set(key, unique.length)
      unique.push(header)
      continue
    }
    unique[previous] = header
  }
  return unique
}

function codeBlock(lines: string[]): string {
  return `${lines.join('\n')}\n`
}

function render(request: CurlRequest): CurlCode {
  const headers = headerObject(request.headers)
  const body = request.body.join('&')
  const headerLines = headers.map(([name, value]) => `    ${JSON.stringify(name)}: ${JSON.stringify(value)},`)
  const fetchLines = [`const response = await fetch(${JSON.stringify(request.url)}, {`, `  method: ${JSON.stringify(request.method)},`]
  if (headerLines.length > 0) fetchLines.push('  headers: {', ...headerLines, '  },')
  if (body !== '') fetchLines.push(`  body: ${JSON.stringify(body)},`)
  fetchLines.push('})')
  const axiosLines = [
    'const response = await axios({',
    `  url: ${JSON.stringify(request.url)},`,
    `  method: ${JSON.stringify(request.method.toLowerCase())},`,
  ]
  if (headerLines.length > 0) axiosLines.push('  headers: {', ...headerLines, '  },')
  if (body !== '') axiosLines.push(`  data: ${JSON.stringify(body)},`)
  axiosLines.push('})')
  return { fetch: codeBlock(fetchLines), axios: codeBlock(axiosLines) }
}

export function curlToCode(input: string): Result<CurlCode> {
  if (input.trim() === '') return err('Wklej polecenie curl.')
  const tokens = tokenize(input)
  if (!tokens.ok) return tokens
  const request = parseRequest(tokens.value)
  if (!request.ok) return request
  return ok(render(request.value))
}
