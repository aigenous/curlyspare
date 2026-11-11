// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createApp, defineComponent, h, nextTick } from 'vue'
import CommandPalette from './CommandPalette.vue'

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn(() => Promise.resolve()),
  }),
}))

function mount(onClose = vi.fn()) {
  const opener = document.createElement('button')
  opener.textContent = 'Szukaj'
  document.body.append(opener)
  opener.focus()
  const host = document.createElement('div')
  document.body.append(host)
  const Harness = defineComponent({
    setup() {
      return () => h(CommandPalette, { onClose })
    },
  })
  const app = createApp(Harness)
  app.mount(host)
  return { host, app, opener, onClose }
}

async function settled(host: HTMLElement) {
  await nextTick()
  await nextTick()
  const input = host.querySelector('input')
  const dialog = host.querySelector('[role="dialog"]')
  if (!(input instanceof HTMLInputElement) || !(dialog instanceof HTMLElement)) {
    throw new Error('Brak palety.')
  }
  return { input, dialog }
}

describe('command palette', () => {
  it('używa wzorca combobox i łapie fokus wewnątrz dialogu', async () => {
    const { host, app, opener } = mount()
    const { input, dialog } = await settled(host)

    expect(document.activeElement).toBe(input)
    expect(input.getAttribute('role')).toBe('combobox')
    expect(input.getAttribute('aria-expanded')).toBe('true')
    expect(input.getAttribute('aria-controls')).toBe('palette-listbox')

    const list = host.querySelector('#palette-listbox')
    const option = list?.querySelector('[role="option"]')
    expect(list?.getAttribute('role')).toBe('listbox')
    expect(option?.getAttribute('role')).toBe('option')
    expect(option?.getAttribute('aria-selected')).toBe('true')
    expect(input.getAttribute('aria-activedescendant')).toBe(option?.id)

    const before = input.getAttribute('aria-activedescendant')
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    expect(input.getAttribute('aria-activedescendant')).toBe(before)

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(input.getAttribute('aria-activedescendant')).not.toBe(before)

    const close = [...dialog.querySelectorAll('button')].find((button) => button.textContent?.includes('Zamknij'))
    if (!close) throw new Error('Brak przycisku zamknięcia.')
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(close)
    expect(document.activeElement?.getAttribute('role')).not.toBe('listbox')
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    expect(document.activeElement).toBe(input)
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true }))
    expect(document.activeElement).toBe(close)

    app.unmount()
    expect(document.activeElement).toBe(opener)
    host.remove()
    opener.remove()
  })

  it('zamyka się klawiszem Escape na dialogu, a nie na oknie', async () => {
    const onClose = vi.fn()
    const { host, app, opener } = mount(onClose)
    const { dialog } = await settled(host)

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onClose).not.toHaveBeenCalled()

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    expect(onClose).toHaveBeenCalledOnce()

    app.unmount()
    host.remove()
    opener.remove()
  })
})
