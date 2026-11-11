import { parse, stringify, YAMLParseError } from 'yaml'
import { formatJsonIssue, parseJson, stringifyJson } from './json'
import { err, ok, type Result } from './result'

const MIN_SAFE = BigInt(Number.MIN_SAFE_INTEGER)
const MAX_SAFE = BigInt(Number.MAX_SAFE_INTEGER)

function yamlMessage(error: unknown): string {
  if (error instanceof YAMLParseError) {
    const line = error.linePos?.[0]?.line
    const detail = error.message.split('\n')[0] ?? 'niepoprawna składnia'
    return line ? `YAML, wiersz ${line}: ${detail}` : `Niepoprawny YAML. ${detail}`
  }
  return 'Nie udało się odczytać YAML.'
}

function isEmptyDocument(input: string): boolean {
  const withoutComments = input
    .split('\n')
    .map((line) => line.replace(/#.*$/, ''))
    .join('\n')
    .replace(/^\uFEFF/, '')
    .replace(/^---\s*$/m, '')
  return withoutComments.trim() === ''
}

export function jsonToYaml(input: string): Result<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  return ok(stringify(parsed.value, { indent: 2 }))
}

export function parseYaml(input: string): Result<unknown> {
  if (isEmptyDocument(input)) return err('Pusty dokument YAML.')
  try {
    const value = parse(input, { uniqueKeys: true, intAsBigInt: true })
    if (value === undefined) return err('Pusty dokument YAML.')
    return ok(narrowSafeInts(value))
  } catch (error) {
    return err(yamlMessage(error))
  }
}

export function yamlToJson(input: string): Result<string> {
  const parsed = parseYaml(input)
  if (!parsed.ok) return parsed
  return ok(`${stringifyJson(parsed.value, 2)}\n`)
}

function narrowSafeInts(value: unknown): unknown {
  if (typeof value === 'bigint') return value >= MIN_SAFE && value <= MAX_SAFE ? Number(value) : value
  if (Array.isArray(value)) return value.map(narrowSafeInts)
  if (isPlainObject(value)) {
    const copy: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(value)) copy[key] = narrowSafeInts(item)
    return copy
  }
  return value
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}
