// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { toDataURL } from 'qrcode'
import QrTool from './QrTool.vue'

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(),
}))

function mount() {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(QrTool)
  app.mount(host)
  const button = host.querySelector('button')
  if (!button) throw new Error('Generate button is missing.')
  return { host, app, button }
}

describe('QR generator', () => {
  it('inserts sample text that is not an address', () => {
    const { host, app } = mount()
    const textarea = host.querySelector('textarea')
    expect(textarea).toBeInstanceOf(HTMLTextAreaElement)
    if (!(textarea instanceof HTMLTextAreaElement)) return
    expect(textarea.value).toBe('Przykładowy tekst do kodu QR')
    expect(textarea.value).not.toMatch(/https?:\/\//i)
    expect(textarea.value.toLowerCase()).not.toContain('.example')
    expect(textarea.value).not.toMatch(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i)
    app.unmount()
    host.remove()
  })

  it('shows the Polish message when generation fails', async () => {
    vi.mocked(toDataURL).mockRejectedValueOnce(new Error('za dużo danych'))
    const { host, app, button } = mount()
    button.click()
    await vi.waitFor(() => {
      expect(host.querySelector('.message-error')?.textContent).toContain('Nie udało się wygenerować kodu QR.')
    })
    expect(host.querySelector('img')).toBeNull()
    app.unmount()
    host.remove()
  })

  it('shows the image when generation succeeds', async () => {
    vi.mocked(toDataURL).mockResolvedValueOnce('data:image/png;base64,abc')
    const { host, app, button } = mount()
    button.click()
    await vi.waitFor(() => {
      expect(host.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,abc')
    })
    expect(host.querySelector('.message-error')).toBeNull()
    app.unmount()
    host.remove()
  })
})
