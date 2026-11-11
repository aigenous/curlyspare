import { parse, stringify, YAMLParseError } from 'yaml'
import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

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
    const value = parse(input, { uniqueKeys: true })
    if (value === undefined) return err('Pusty dokument YAML.')
    return ok(value)
  } catch (error) {
    return err(yamlMessage(error))
  }
}

export function yamlToJson(input: string): Result<string> {
  const parsed = parseYaml(input)
  if (!parsed.ok) return parsed
  return ok(`${JSON.stringify(parsed.value, null, 2)}\n`)
}
