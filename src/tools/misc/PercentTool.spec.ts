// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import PercentTool from './PercentTool.vue'

function labeledInput(root: ParentNode, name: string): HTMLInputElement {
  const label = [...root.querySelectorAll('label')].find((element) => element.textContent?.includes(name))
  const input = label?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) throw new Error(`Missing field "${name}".`)
  return input
}

async function setValue(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  await nextTick()
}

describe('percent calculator', () => {
  it('keeps the „Z liczby” and „Całość” fields independent', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(PercentTool)
    app.mount(host)

    const ofWhole = labeledInput(host, 'Z liczby')
    const ratioWhole = labeledInput(host, 'Całość')
    expect(ofWhole.value).toBe('150')
    expect(ratioWhole.value).toBe('150')

    await setValue(ratioWhole, '200')
    expect(ofWhole.value).toBe('150')
    expect(ratioWhole.value).toBe('200')
    expect(host.textContent?.replace(/\s+/g, ' ')).toContain('Wynik: 30')
    expect(host.textContent?.replace(/\s+/g, ' ')).toContain('To jest 15% całości.')

    await setValue(ofWhole, '80')
    expect(ofWhole.value).toBe('80')
    expect(ratioWhole.value).toBe('200')
    expect(host.textContent?.replace(/\s+/g, ' ')).toContain('Wynik: 16')
    expect(host.textContent?.replace(/\s+/g, ' ')).toContain('To jest 15% całości.')

    app.unmount()
    host.remove()
  })
})
