import createDOMPurify from 'dompurify'
import { marked } from 'marked'

export interface MarkdownRenderOptions {
  allowRemoteImages?: boolean
}

const BLOCKED_REMOTE_IMAGE = 'Obraz z zewnętrznego adresu'
const XLINK_NS = 'http://www.w3.org/1999/xlink'

export function renderMarkdown(source: string, options: MarkdownRenderOptions = {}): string {
  const parsed = marked.parse(source, { async: false, gfm: true })
  if (typeof parsed !== 'string' || typeof window === 'undefined') return ''
  const clean = String(createDOMPurify(window).sanitize(parsed))
  if (options.allowRemoteImages) return clean
  return blockRemoteImages(clean)
}

function isRemoteImageUrl(value: string): boolean {
  let normalized = ''
  for (const char of value) {
    if (char === '\\') {
      normalized += '/'
      continue
    }
    const code = char.charCodeAt(0)
    if (code <= 0x20 || code === 0x7f || char.trim() === '') continue
    normalized += char
  }
  return /^https?:/i.test(normalized) || normalized.startsWith('//')
}

function srcsetWithoutRemoteUrls(srcset: string): string {
  const kept: string[] = []
  const input = srcset.trim()
  let index = 0
  while (index < input.length) {
    while (index < input.length && (input[index] === ',' || /\s/.test(input[index] ?? ''))) index += 1
    if (index >= input.length) break
    const urlStart = index
    if (input.slice(index, index + 5).toLowerCase() === 'data:') {
      while (index < input.length && !/\s/.test(input[index] ?? '')) index += 1
    } else {
      while (index < input.length && input[index] !== ',' && !/\s/.test(input[index] ?? '')) index += 1
    }
    const url = input.slice(urlStart, index)
    const descriptorStart = index
    while (index < input.length && input[index] !== ',') index += 1
    const descriptor = input.slice(descriptorStart, index).trim()
    if (url && !isRemoteImageUrl(url)) kept.push(descriptor ? `${url} ${descriptor}` : url)
  }
  return kept.join(', ')
}

function blockedImageNotice(element: Element, label: string): HTMLSpanElement {
  const span = element.ownerDocument.createElement('span')
  span.className = 'blocked-image'
  span.textContent = label.trim() || BLOCKED_REMOTE_IMAGE
  return span
}

function stripSrcset(element: Element): boolean {
  const srcset = element.getAttribute('srcset')
  if (srcset === null) return false
  const safe = srcsetWithoutRemoteUrls(srcset)
  if (safe === srcset.trim()) return false
  if (safe === '') element.removeAttribute('srcset')
  else element.setAttribute('srcset', safe)
  return true
}

function stripRemoteAttribute(element: Element, name: string): boolean {
  const value = element.getAttribute(name)
  if (value === null || !isRemoteImageUrl(value)) return false
  element.removeAttribute(name)
  return true
}

function hasSrcOrSrcset(element: Element): boolean {
  return (element.getAttribute('src')?.trim() ?? '') !== '' || (element.getAttribute('srcset')?.trim() ?? '') !== ''
}

function neutralizeRasterImage(element: Element): boolean {
  const srcsetChanged = stripSrcset(element)
  const srcChanged = stripRemoteAttribute(element, 'src')
  if (!srcsetChanged && !srcChanged) return false
  if (hasSrcOrSrcset(element)) return true
  if (element.localName === 'source') {
    element.remove()
    return true
  }
  const notice = blockedImageNotice(element, element.getAttribute('alt') ?? '')
  const picture = element.parentElement?.localName === 'picture' ? element.parentElement : null
  element.replaceWith(notice)
  if (picture && !picture.querySelector('img, source')) picture.replaceWith(notice)
  return true
}

function svgHasVisibleChild(svg: Element): boolean {
  return [...svg.children].some((child) => child.localName !== 'title' && child.localName !== 'desc')
}

function neutralizeSvgImage(element: Element): boolean {
  let changed = stripRemoteAttribute(element, 'href')
  const xlink = element.getAttributeNS(XLINK_NS, 'href')
  if (xlink !== null && isRemoteImageUrl(xlink)) {
    element.removeAttributeNS(XLINK_NS, 'href')
    changed = true
  }
  if (stripRemoteAttribute(element, 'xlink:href')) changed = true
  if (!changed) return false
  const href = element.getAttribute('href')?.trim() ?? ''
  const prefixed = element.getAttribute('xlink:href')?.trim() ?? ''
  const namespaced = element.getAttributeNS(XLINK_NS, 'href')?.trim() ?? ''
  if (href !== '' || prefixed !== '' || namespaced !== '') return true
  const svg = element.closest('svg')
  const label = element.querySelector('title')?.textContent ?? svg?.querySelector('title')?.textContent ?? ''
  element.remove()
  if (svg && !svgHasVisibleChild(svg)) svg.replaceWith(blockedImageNotice(svg, label))
  return true
}

function blockRemoteImages(html: string): string {
  if (!/<(?:img|image|source)\b/i.test(html)) return html
  const doc = new DOMParser().parseFromString(html, 'text/html')
  let changed = false
  for (const element of doc.body.querySelectorAll('img, source, image')) {
    const neutralized = element.localName === 'image' ? neutralizeSvgImage(element) : neutralizeRasterImage(element)
    if (neutralized) changed = true
  }
  return changed ? doc.body.innerHTML : html
}
