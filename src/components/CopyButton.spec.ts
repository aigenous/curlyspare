// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import CopyButton from './CopyButton.vue'

function mount(text: string) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(CopyButton, { text })
  app.mount(host)
  const button = host.querySelector('button')
  if (!button) throw new Error('Copy button is missing.')
  return { host, app, button }
}

function setClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

describe('CopyButton', () => {
  it('does not copy an empty result and stays on „Kopiuj”', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    setClipboard(writeText)
    const { host, app, button } = mount('')
    expect(button.disabled).toBe(true)
    expect(button.textContent?.trim()).toBe('Kopiuj')
    button.click()
    await nextTick()
    expect(button.textContent?.trim()).toBe('Kopiuj')
    expect(button.textContent).not.toContain('Skopiowano')
    expect(writeText).not.toHaveBeenCalled()
    app.unmount()
    host.remove()
  })

  it('shows success only after writeText resolves', async () => {
    const writeText = vi.fn((value: string) => {
      expect(value).toBe('abc')
      return Promise.resolve()
    })
    setClipboard(writeText)
    const { host, app, button } = mount('abc')
    button.click()
    await vi.waitFor(() => {
      expect(button.textContent?.trim()).toBe('Skopiowano')
    })
    expect(writeText).toHaveBeenCalledOnce()
    app.unmount()
    host.remove()
    await nextTick()
  })

  it('shows the Polish error when writeText rejects, and does not write „Skopiowano”', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('odmowa')))
    const execCommand = vi.fn(() => true)
    document.execCommand = execCommand
    setClipboard(writeText)
    const { host, app, button } = mount('abc')
    button.click()
    await vi.waitFor(() => {
      expect(button.textContent?.trim()).toBe('Nie udało się skopiować')
    })
    expect(button.textContent).not.toContain('Skopiowano')
    expect(execCommand).not.toHaveBeenCalled()
    app.unmount()
    host.remove()
  })
})
