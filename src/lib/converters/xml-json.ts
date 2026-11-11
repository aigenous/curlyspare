import { formatJsonIssue, parseJson } from './json'
import { err, ok, type Result } from './result'
import { formatXml } from './xml'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isXmlName(name: string): boolean {
  return /^[A-Za-z_\u00C0-\u024F][\w\u00C0-\u024F.-]*$/.test(name)
}

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;')
}

function parseDocument(input: string): Result<Document> {
  if (input.trim() === '') return err('Pusty dokument XML.')
  if (typeof DOMParser === 'undefined') return err('Parser XML jest niedostępny w tym środowisku.')
  const doc = new DOMParser().parseFromString(input, 'application/xml')
  const problem = doc.querySelector('parsererror')
  if (problem) return err('Niepoprawny XML.')
  if (!doc.documentElement) return err('Pusty dokument XML.')
  return ok(doc)
}

function elementValue(element: Element): unknown {
  const result: Record<string, unknown> = {}
  for (const attr of element.attributes) result[`@${attr.name}`] = attr.value
  const groups = new Map<string, unknown[]>()
  let text = ''
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE || child.nodeType === Node.CDATA_SECTION_NODE) {
      text += child.textContent ?? ''
      continue
    }
    if (child.nodeType !== Node.ELEMENT_NODE) continue
    const nested = child as Element
    const list = groups.get(nested.tagName) ?? []
    list.push(elementValue(nested))
    groups.set(nested.tagName, list)
  }
  for (const [name, values] of groups) result[name] = values.length === 1 ? values[0] : values
  const trimmed = text.trim()
  if (trimmed) result['#text'] = trimmed
  if (Object.keys(result).length === 0) return ''
  if (Object.keys(result).length === 1 && trimmed && groups.size === 0 && element.attributes.length === 0) return trimmed
  return result
}

export function xmlToJson(input: string): Result<string> {
  const parsed = parseDocument(input)
  if (!parsed.ok) return parsed
  const root = parsed.value.documentElement
  return ok(`${JSON.stringify({ [root.tagName]: elementValue(root) }, null, 2)}\n`)
}

function emitNode(name: string, value: unknown): Result<string> {
  if (!isXmlName(name)) return err(`Nazwa „${name}” nie jest poprawną nazwą elementu XML.`)
  if (value === null || value === undefined) return ok(`<${name}/>`)
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return ok(`<${name}>${escapeText(String(value))}</${name}>`)
  }
  if (Array.isArray(value)) {
    const parts: string[] = []
    for (const item of value) {
      const emitted = emitNode(name, item)
      if (!emitted.ok) return emitted
      parts.push(emitted.value)
    }
    return ok(parts.join(''))
  }
  if (!isRecord(value)) return err('Wartość JSON nie da się zapisać jako XML.')
  const attrs: string[] = []
  const inner: string[] = []
  for (const [key, child] of Object.entries(value)) {
    if (key.startsWith('@')) {
      const attr = key.slice(1)
      if (!isXmlName(attr)) return err(`Nazwa atrybutu „${attr}” jest niepoprawna.`)
      if (child !== null && typeof child === 'object') return err(`Atrybut „${attr}” musi być wartością prostą.`)
      attrs.push(` ${attr}="${escapeAttr(child === null || child === undefined ? '' : String(child))}"`)
      continue
    }
    if (key === '#text') {
      if (child !== null && typeof child === 'object') return err('Tekst elementu musi być wartością prostą.')
      inner.push(escapeText(child === null || child === undefined ? '' : String(child)))
      continue
    }
    const emitted = emitNode(key, child)
    if (!emitted.ok) return emitted
    inner.push(emitted.value)
  }
  const body = inner.join('')
  if (body === '') return ok(`<${name}${attrs.join('')}/>`)
  return ok(`<${name}${attrs.join('')}>${body}</${name}>`)
}

export function jsonToXml(input: string): Result<string> {
  const parsed = parseJson(input)
  if (!parsed.ok) return err(formatJsonIssue(parsed))
  if (!isRecord(parsed.value)) return err('JSON dla XML musi być obiektem z jednym elementem głównym.')
  const keys = Object.keys(parsed.value)
  if (keys.length !== 1) return err('JSON dla XML musi mieć dokładnie jeden element główny.')
  const root = keys[0] ?? ''
  const emitted = emitNode(root, parsed.value[root])
  if (!emitted.ok) return emitted
  return formatXml(emitted.value)
}
