// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import AnatomyCalc from './AnatomyCalc.vue'
import { peselAnatomy } from '../tools/anatomy/pesel'

const here = dirname(fileURLToPath(import.meta.url))

const COPY = {
  match: 'cyfra zgodna',
  mismatch: 'cyfra niezgodna',
} as const

function mountCalc(input: string) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(AnatomyCalc, { steps: peselAnatomy(input).steps, copy: COPY })
  app.mount(host)
  return {
    host,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('AnatomyCalc', () => {
  it('does not decode the number', () => {
    const source = readFileSync(resolve(here, 'AnatomyCalc.vue'), 'utf8')
    expect(source).not.toMatch(/parsePesel|validatePesel|peselCheckDigit/)
    expect(source).not.toMatch(/\.expected|powinna być/)
  })

  it('prints the weighted sum and the check-digit formula', () => {
    const valid = mountCalc('44051401359')
    expect(valid.host.textContent).toContain('1·')
    expect(valid.host.textContent).toContain('4')
    expect(valid.host.textContent).toContain('101')
    expect(valid.host.textContent).toContain('(10 − 101 mod 10) mod 10')
    expect(valid.host.textContent).not.toContain('mod 10 =')
    expect(valid.host.textContent).toContain('cyfra zgodna')
    valid.unmount()

    const bad = mountCalc('44051401358')
    expect(bad.host.textContent).toContain('cyfra niezgodna')
    expect(bad.host.textContent).not.toContain('cyfra zgodna')
    expect(bad.host.textContent).not.toContain('powinna być')
    const walker = document.createTreeWalker(bad.host, NodeFilter.SHOW_TEXT)
    const texts: string[] = []
    while (walker.nextNode()) {
      texts.push((walker.currentNode.textContent ?? '').trim())
    }
    expect(texts).not.toContain('9')
    for (const element of bad.host.querySelectorAll('*')) {
      for (const name of element.getAttributeNames()) {
        expect(name.toLowerCase()).not.toContain('expected')
        expect(element.getAttribute(name) ?? '').not.toMatch(/(^|[^0-9])9([^0-9]|$)/)
      }
    }
    bad.unmount()
  })

  it('omits the match text until the check digit is typed', () => {
    const view = mountCalc('4405140135')
    expect(view.host.textContent).toContain('101')
    expect(view.host.textContent).not.toContain('cyfra zgodna')
    expect(view.host.textContent).not.toContain('cyfra niezgodna')
    view.unmount()
  })
})
