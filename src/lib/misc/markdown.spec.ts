// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { renderMarkdown } from './markdown'

describe('markdown preview', () => {
  it('renders GFM and strips active content', () => {
    const html = renderMarkdown('# Tytuł\n\n**grube** i `kod`\n\n- punkt\n')
    expect(html).toContain('<h1>Tytuł</h1>')
    expect(html).toContain('<strong>grube</strong>')
    expect(html).toContain('<code>kod</code>')
    expect(html).toContain('<li>punkt</li>')
  })

  it('removes scripts, event handlers, and javascript links', () => {
    const html = renderMarkdown(
      '<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>',
    )
    expect(html.toLowerCase()).not.toContain('<script')
    expect(html.toLowerCase()).not.toContain('onerror')
    expect(html.toLowerCase()).not.toContain('javascript:')
    expect(html).toContain('link')
  })
})
