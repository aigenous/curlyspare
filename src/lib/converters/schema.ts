import Ajv, { type ErrorObject } from 'ajv'
import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

function isSchema(value: unknown): value is Record<string, unknown> | boolean {
  if (typeof value === 'boolean') return true
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function param(error: ErrorObject, key: string): string {
  const value = error.params[key]
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map((item) => String(item)).join(', ')
  return ''
}

function describeIssue(error: ErrorObject): string {
  const path = error.instancePath === '' ? '(dokument)' : error.instancePath
  switch (error.keyword) {
    case 'type':
      return `${path}: oczekiwano typu ${param(error, 'type')}.`
    case 'required':
      return `${path}: brakuje pola „${param(error, 'missingProperty')}”.`
    case 'additionalProperties':
      return `${path}: niedozwolone pole „${param(error, 'additionalProperty')}”.`
    case 'enum':
      return `${path}: wartość spoza dozwolonej listy.`
    case 'const':
      return `${path}: wartość różni się od wymaganej stałej.`
    case 'minimum':
    case 'maximum':
    case 'exclusiveMinimum':
    case 'exclusiveMaximum':
    case 'minLength':
    case 'maxLength':
    case 'minItems':
    case 'maxItems':
    case 'minProperties':
    case 'maxProperties':
    case 'multipleOf':
    case 'pattern':
    case 'format':
      return `${path}: ${error.message ?? 'nie spełnia ograniczenia'}.`
    default:
      return `${path}: ${error.message ?? error.keyword}.`
  }
}

export function validateJsonSchema(dataText: string, schemaText: string): Result<string> {
  const data = parseJson(dataText)
  if (!data.ok) return err(`Dane: ${formatJsonIssue(data)}`)
  const schema = parseJson(schemaText)
  if (!schema.ok) return err(`Schemat: ${formatJsonIssue(schema)}`)
  if (!isSchema(schema.value)) return err('Schemat JSON Schema musi być obiektem albo wartością logiczną.')
  try {
    const ajv = new Ajv({ allErrors: true, strict: false })
    const validate = ajv.compile(schema.value)
    if (validate(data.value)) return ok('Dane pasują do schematu.')
    const issues = (validate.errors ?? []).map(describeIssue)
    return err(issues.length > 0 ? issues.join('\n') : 'Dane nie pasują do schematu.')
  } catch {
    return err('Niepoprawny schemat JSON Schema.')
  }
}
