import { JSONPath } from 'jsonpath-plus'
import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'

function validatePath(path: string): Result<void> {
  const stack: string[] = []
  for (let index = 0; index < path.length; index += 1) {
    const char = path[index] ?? ''
    if (char === '"' || char === "'") {
      const quote = char
      index += 1
      while (index < path.length && path[index] !== quote) {
        if (path[index] === '\\') index += 1
        index += 1
      }
      if (path[index] !== quote) return err('Niezamknięty cudzysłów w JSONPath.')
      continue
    }
    if (char === '[') stack.push(']')
    else if (char === '(') stack.push(')')
    else if (char === ']' || char === ')') {
      if (stack.pop() !== char) return err('Niepoprawne nawiasy w JSONPath.')
    }
  }
  if (stack.length > 0) return err('Niepoprawne nawiasy w JSONPath.')
  for (const filter of path.matchAll(/\?\(([^)]*)\)/g)) {
    const expression = (filter[1] ?? '').trim()
    if (expression === '' || /(?:==|!=|<=|>=|<|>|&&|\|\|)$/.test(expression)) {
      return err('Niepoprawny filtr JSONPath.')
    }
  }
  return ok(undefined)
}

export function queryJsonPath(dataText: string, path: string): Result<string> {
  const trimmed = path.trim()
  if (trimmed === '') return err('Wpisz zapytanie JSONPath, na przykład $.store.book[*].title.')
  if (!trimmed.startsWith('$')) return err('Zapytanie JSONPath musi zaczynać się od $.')
  const syntax = validatePath(trimmed)
  if (!syntax.ok) return syntax
  const data = parseJson(dataText)
  if (!data.ok) return err(`Dane: ${formatJsonIssue(data)}`)
  try {
    const found = JSONPath({ path: trimmed, json: data.value as object, wrap: true })
    const matches = Array.isArray(found) ? found : [found]
    return ok(`${JSON.stringify(matches, null, 2)}\n`)
  } catch {
    return err('Niepoprawne zapytanie JSONPath.')
  }
}
