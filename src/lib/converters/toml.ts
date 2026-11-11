import { parse, stringify, TomlError } from 'smol-toml'
import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function jsonReady(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((item) => jsonReady(item))
  if (isRecord(value)) {
    const record: Record<string, unknown> = {}
    for (const [key, child] of Object.entries(value)) record[key] = jsonReady(child)
    return record
  }
  return value
}

function tomlMessage(error: unknown): string {
  if (error instanceof TomlError) return `TOML, wiersz ${error.line}: ${error.message}`
  return 'Nie udało się odczytać TOML.'
}

export function tomlToJson(input: string): Result<string> {
  if (input.trim() === '') return err('Pusty dokument TOML.')
  try {
    return ok(`${JSON.stringify(jsonReady(parse(input)), null, 2)}\n`)
  } catch (error) {
    return err(tomlMessage(error))
  }
}

export function jsonToToml(input: string): Result<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  if (!isRecord(parsed.value)) return err('TOML zapisuje obiekt JSON, nie tablicę ani wartość prostą.')
  try {
    const text = stringify(parsed.value)
    return ok(text.endsWith('\n') ? text : `${text}\n`)
  } catch {
    return err('Nie udało się zapisać JSON jako TOML.')
  }
}
