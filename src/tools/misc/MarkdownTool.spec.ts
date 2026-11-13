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

  it('trzyma obrazy zewnętrzne zablokowane, dopóki przełącznik jest wyłączony', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const stored = Object.keys(localStorage)
    const app = createApp(MarkdownTool)
    app.mount(host)
    await nextTick()

    const checkbox = host.querySelector('input[type="checkbox"]')
    expect(checkbox).toBeInstanceOf(HTMLInputElement)
    if (!(checkbox instanceof HTMLInputElement)) return
    expect(checkbox.checked).toBe(false)
    expect(checkbox.closest('label')?.textContent).toContain('Wczytaj obrazy z zewnętrznych adresów')
    expect(host.textContent).toContain('Skrypty i atrybuty zdarzeń są usuwane.')

    const gif = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const textarea = host.querySelector('textarea')
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement)
    if (!(textarea instanceof HTMLTextAreaElement)) return
    textarea.value = `![kot](https://cdn.example/kot.png)\n\n<img alt="piksel" src="${gif}">`
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
    await nextTick()

    const preview = host.querySelector('.preview.md')
    expect(preview?.textContent).toContain('kot')
    expect(preview?.innerHTML).not.toContain('cdn.example')
    expect(preview?.querySelector('img')?.getAttribute('src')).toBe(gif)

    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change', { bubbles: true }))
    await nextTick()
    expect(preview?.innerHTML).toContain('src="https://cdn.example/kot.png"')
    expect(preview?.innerHTML).toContain(gif)
    expect(Object.keys(localStorage)).toEqual(stored)

    app.unmount()
    host.remove()
  })
})
