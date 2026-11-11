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
  if (!button) throw new Error('Brak przycisku generowania.')
  return { host, app, button }
}

describe('generator QR', () => {
  it('pokazuje polski komunikat, gdy generowanie się nie uda', async () => {
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

  it('pokazuje obraz, gdy generowanie się uda', async () => {
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
