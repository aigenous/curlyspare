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
  if (!button) throw new Error('Brak przycisku kopiowania.')
  return { host, app, button }
}

function setClipboard(writeText: (value: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true,
    value: { writeText },
  })
}

describe('CopyButton', () => {
  it('pokazuje sukces dopiero, gdy writeText się powiedzie', async () => {
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

  it('pokazuje polski błąd, gdy writeText się nie powiedzie, i nie pisze „Skopiowano”', async () => {
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
