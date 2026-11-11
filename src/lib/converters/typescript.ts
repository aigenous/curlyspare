import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

interface Field {
  name: string
  type: string
  optional: boolean
}

interface InterfaceDecl {
  name: string
  fields: Field[]
}

const NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function propertyName(name: string): string {
  return NAME_PATTERN.test(name) ? name : JSON.stringify(name)
}

function typeName(hint: string, used: Set<string>): string {
  const parts = hint
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((part) => part !== '')
  let base = parts.map((part) => `${part[0]?.toUpperCase() ?? ''}${part.slice(1)}`).join('')
  if (!/^[A-Za-z_]/.test(base)) base = `T${base}`
  if (base === '') base = 'Value'
  let name = base
  let suffix = 2
  while (used.has(name)) {
    name = `${base}${suffix}`
    suffix += 1
  }
  used.add(name)
  return name
}

function union(types: Set<string>): string {
  return [...types].sort().join(' | ')
}

function valueType(value: unknown, hint: string, used: Set<string>, decls: InterfaceDecl[]): string {
  if (value === null) return 'null'
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return typeof value
  if (Array.isArray(value)) return arrayType(value, hint, used, decls)
  if (isRecord(value)) return objectType([value], hint, used, decls)
  return 'unknown'
}

function valuesType(values: unknown[], hint: string, used: Set<string>, decls: InterfaceDecl[]): string {
  const objects = values.filter(isRecord)
  const types = new Set<string>()
  if (objects.length === values.length && objects.length > 0) return objectType(objects, hint, used, decls)
  if (objects.length > 0) types.add(objectType(objects, hint, used, decls))
  for (const value of values) {
    if (isRecord(value)) continue
    types.add(valueType(value, hint, used, decls))
  }
  if (types.size === 0) return 'unknown'
  return union(types)
}

function objectType(
  objects: Record<string, unknown>[],
  hint: string,
  used: Set<string>,
  decls: InterfaceDecl[],
  forceName?: string,
): string {
  const name = forceName ?? typeName(hint, used)
  if (forceName) used.add(forceName)
  const order: string[] = []
  const grouped = new Map<string, unknown[]>()
  for (const object of objects) {
    for (const [key, value] of Object.entries(object)) {
      if (!grouped.has(key)) {
        grouped.set(key, [])
        order.push(key)
      }
      grouped.get(key)?.push(value)
    }
  }
  const decl: InterfaceDecl = { name, fields: [] }
  decls.push(decl)
  decl.fields = order.map((key) => {
    const values = grouped.get(key) ?? []
    return {
      name: key,
      optional: values.length < objects.length,
      type: valuesType(values, key, used, decls),
    }
  })
  return name
}

function arrayType(items: unknown[], hint: string, used: Set<string>, decls: InterfaceDecl[]): string {
  if (items.length === 0) return 'unknown[]'
  const inner = valuesType(items, hint, used, decls)
  return inner.includes('|') ? `(${inner})[]` : `${inner}[]`
}

function emit(decls: InterfaceDecl[]): string {
  return decls
    .map((decl) => {
      const fields = decl.fields
        .map((field) => `  ${propertyName(field.name)}${field.optional ? '?' : ''}: ${field.type}`)
        .join('\n')
      return fields === '' ? `export interface ${decl.name} {\n}` : `export interface ${decl.name} {\n${fields}\n}`
    })
    .join('\n\n')
}

export function jsonToTypeScript(input: string, rootName = 'Root'): Result<string> {
  if (!NAME_PATTERN.test(rootName)) return err('Nazwa typu może zawierać tylko litery, cyfry i podkreślenie.')
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  const used = new Set<string>()
  const decls: InterfaceDecl[] = []
  if (isRecord(parsed.value)) {
    objectType([parsed.value], rootName, used, decls, rootName)
    return ok(`${emit(decls)}\n`)
  }
  const type = valueType(parsed.value, `${rootName}Item`, used, decls)
  const interfaces = emit(decls)
  const alias = `export type ${rootName} = ${type}`
  return ok(interfaces === '' ? `${alias}\n` : `${interfaces}\n\n${alias}\n`)
}
