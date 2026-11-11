// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import MarkdownTool from './MarkdownTool.vue'

describe('podgląd markdown', () => {
  it('zaczyna przykładowe nagłówki od h2', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(MarkdownTool)
    app.mount(host)
    await nextTick()

    const preview = host.querySelector('.preview.md')
    expect(preview?.querySelector('h1')).toBeNull()
    expect(preview?.querySelector('h2')?.textContent).toBe('Nagłówek')

    app.unmount()
    host.remove()
  })
})
