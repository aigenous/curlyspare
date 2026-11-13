import { describe, expect, it } from 'vitest'
import { renderLegal } from './LegalPage.vue'

describe('renderLegal', () => {
  it('renders a legal source without an HTML comment', () => {
    const html = renderLegal('Widoczny tekst. <!-- [TEST-KOMENTARZ] -->')
    expect(html).not.toContain('<!--')
    expect(html).not.toContain('TEST-KOMENTARZ')
    expect(html).toContain('Widoczny tekst')
  })
})
