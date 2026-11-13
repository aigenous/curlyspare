// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { validateIbanPl } from '../../../lib/generators'
import IbanValidator from './IbanValidator.vue'

const SAMPLE_IBAN = 'PL61109010140000071219812874'
const BROKEN_IBAN = 'PL61109010140000071219812875'

async function mountTool(): Promise<{ host: HTMLElement; unmount: () => void }> {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(IbanValidator)
  app.mount(host)
  await nextTick()
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

function buttonNamed(host: HTMLElement, name: string): HTMLButtonElement {
  const found = [...host.querySelectorAll('button')].find((item) => item.textContent?.trim() === name)
  if (!(found instanceof HTMLButtonElement)) {
    throw new Error(`missing button ${name}`)
  }
  return found
}

function inputNamed(host: HTMLElement, label: string): HTMLInputElement {
  const found = [...host.querySelectorAll('label')].find((item) => item.textContent?.includes(label))
  const input = found?.querySelector('input')
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`missing input ${label}`)
  }
  return input
}

async function verdictFor(host: HTMLElement, value: string): Promise<{ status: string; detail: string }> {
  const input = inputNamed(host, 'IBAN lub NRB')
  input.value = value
  input.dispatchEvent(new Event('input'))
  await nextTick()
  buttonNamed(host, 'Sprawdź').click()
  await nextTick()
  const status = host.querySelector('[role="status"], [role="alert"]')
  const detail = [...host.querySelectorAll('p')].find((item) => item.textContent?.startsWith('Zapis:'))
  return {
    status: status?.textContent?.trim() ?? '',
    detail: detail?.textContent?.trim() ?? '',
  }
}

describe('IBAN validator', () => {
  it('prefixes a generated value with [TEST] on display and copy', async () => {
    const copied: string[] = []
    const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          copied.push(text)
        },
      },
    })
    const { host, unmount } = await mountTool()
    try {
      buttonNamed(host, 'Generuj').click()
      await nextTick()
      const field = host.querySelector('textarea')
      expect(field).toBeInstanceOf(HTMLTextAreaElement)
      if (!(field instanceof HTMLTextAreaElement)) return
      expect(field.value.startsWith('[TEST] ')).toBe(true)
      expect(field.value).toMatch(/^\[TEST\] \d{2}(?: \d{4}){6}$/)
      buttonNamed(host, 'Kopiuj').click()
      await nextTick()
      await Promise.resolve()
      expect(copied).toEqual([field.value])
      expect(copied[0]?.startsWith('[TEST] ')).toBe(true)
    } finally {
      unmount()
      if (clipboard) {
        Object.defineProperty(navigator, 'clipboard', clipboard)
      }
    }
  })

  it('validates a [TEST] PL value the same way as the bare number', async () => {
    const { host, unmount } = await mountTool()
    try {
      const bare = await verdictFor(host, SAMPLE_IBAN)
      const prefixed = await verdictFor(host, `[TEST] ${SAMPLE_IBAN}`)
      const padded = await verdictFor(host, `  [TEST]  ${SAMPLE_IBAN}  `)
      expect(validateIbanPl(SAMPLE_IBAN).valid).toBe(true)
      expect(bare.status).toBe('Poprawny format i suma kontrolna')
      expect(prefixed).toEqual(bare)
      expect(padded).toEqual(bare)

      const bareBroken = await verdictFor(host, BROKEN_IBAN)
      const prefixedBroken = await verdictFor(host, `[TEST] ${BROKEN_IBAN}`)
      expect(validateIbanPl(BROKEN_IBAN).valid).toBe(false)
      expect(bareBroken.status).toBe('Niepoprawny format lub suma kontrolna')
      expect(prefixedBroken).toEqual(bareBroken)
    } finally {
      unmount()
    }
  })
})
