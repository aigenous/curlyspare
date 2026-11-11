import createDOMPurify from 'dompurify'
import { marked } from 'marked'

export function renderMarkdown(source: string): string {
  const parsed = marked.parse(source, { async: false, gfm: true })
  if (typeof parsed !== 'string' || typeof window === 'undefined') return ''
  return String(createDOMPurify(window).sanitize(parsed))
}
