import { err, ok, type Result } from './result'

function escapeText(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function escapeAttr(value: string): string {
  return escapeText(value).replaceAll('"', '&quot;')
}

function xmlError(doc: Document): string | null {
  const node = doc.querySelector('parsererror')
  if (!node) return null
  const text = (node.textContent ?? '').replace(/\s+/g, ' ').trim()
  return text ? `Niepoprawny XML. ${text}` : 'Niepoprawny XML.'
}

function parseXml(input: string): Result<Document> {
  if (input.trim() === '') return err('Pusty dokument XML.')
  if (typeof DOMParser === 'undefined') return err('Parser XML jest niedostępny w tym środowisku.')
  const doc = new DOMParser().parseFromString(input, 'application/xml')
  const message = xmlError(doc)
  if (message) return err(message)
  if (!doc.documentElement) return err('Pusty dokument XML.')
  return ok(doc)
}

function isWhitespaceText(node: Node): boolean {
  return node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() === ''
}

function hasElementChild(element: Element): boolean {
  for (const child of element.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE || child.nodeType === Node.COMMENT_NODE) return true
  }
  return false
}

function inlineChildren(element: Element): string {
  let out = ''
  for (const child of element.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) out += escapeText(child.textContent ?? '')
    else if (child.nodeType === Node.CDATA_SECTION_NODE) out += `<![CDATA[${child.textContent ?? ''}]]>`
    else if (child.nodeType === Node.ELEMENT_NODE) out += minifyElement(child as Element)
  }
  return out
}

function minifyElement(element: Element): string {
  const attrs = Array.from(element.attributes)
    .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
    .join('')
  const name = element.tagName
  const significant = Array.from(element.childNodes).filter((child) => !isWhitespaceText(child))
  if (significant.length === 0) return `<${name}${attrs}/>`
  if (!hasElementChild(element)) return `<${name}${attrs}>${inlineChildren(element)}</${name}>`
  let inner = ''
  for (const child of significant) {
    if (child.nodeType === Node.ELEMENT_NODE) inner += minifyElement(child as Element)
    else if (child.nodeType === Node.COMMENT_NODE) inner += `<!--${child.textContent ?? ''}-->`
    else if (child.nodeType === Node.CDATA_SECTION_NODE) inner += `<![CDATA[${child.textContent ?? ''}]]>`
    else if (child.nodeType === Node.TEXT_NODE) inner += escapeText(child.textContent ?? '')
  }
  return `<${name}${attrs}>${inner}</${name}>`
}

function formatNode(node: Node, indent: string, level: number): string {
  if (isWhitespaceText(node)) return ''
  const pad = indent.repeat(level)
  if (node.nodeType === Node.COMMENT_NODE) return `${pad}<!--${node.textContent ?? ''}-->`
  if (node.nodeType === Node.CDATA_SECTION_NODE) return `${pad}<![CDATA[${node.textContent ?? ''}]]>`
  if (node.nodeType === Node.TEXT_NODE) return `${pad}${escapeText(node.textContent ?? '')}`
  if (node.nodeType !== Node.ELEMENT_NODE) return ''
  const element = node as Element
  const attrs = Array.from(element.attributes)
    .map((attr) => ` ${attr.name}="${escapeAttr(attr.value)}"`)
    .join('')
  const name = element.tagName
  const significant = Array.from(element.childNodes).filter((child) => !isWhitespaceText(child))
  if (significant.length === 0) return `${pad}<${name}${attrs}/>`
  if (!hasElementChild(element)) return `${pad}<${name}${attrs}>${inlineChildren(element)}</${name}>`
  const inner = significant
    .map((child) => formatNode(child, indent, level + 1))
    .filter((line) => line !== '')
    .join('\n')
  return `${pad}<${name}${attrs}>\n${inner}\n${pad}</${name}>`
}

function declaration(input: string): string {
  return /^\s*<\?xml[^?]*\?>/i.exec(input)?.[0] ?? ''
}

export function formatXml(input: string, indentSize = 2): Result<string> {
  if (!Number.isInteger(indentSize) || indentSize < 0 || indentSize > 8) return err('Wcięcie XML musi mieć od 0 do 8 spacji.')
  const parsed = parseXml(input)
  if (!parsed.ok) return parsed
  const body = formatNode(parsed.value.documentElement, ' '.repeat(indentSize), 0)
  const header = declaration(input)
  return ok(`${header ? `${header}\n` : ''}${body}\n`)
}

export function minifyXml(input: string): Result<string> {
  const parsed = parseXml(input)
  if (!parsed.ok) return parsed
  const header = declaration(input)
  const body = minifyElement(parsed.value.documentElement)
  return ok(`${header ?? ''}${body}`)
}

export function validateXml(input: string): Result<string> {
  const parsed = parseXml(input)
  if (!parsed.ok) return parsed
  return ok(`Poprawny XML: element główny „${parsed.value.documentElement.tagName}”.`)
}
