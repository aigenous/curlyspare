// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import AnatomyCalc from './AnatomyCalc.vue'
import { peselAnatomy } from '../tools/anatomy/pesel'

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
    const source = readFileSync(resolve('src/components/AnatomyCalc.vue'), 'utf8')
    expect(source).not.toMatch(/parsePesel|validatePesel|peselCheckDigit/)
  })

  it('prints the weighted sum and the check-digit formula', () => {
    const valid = mountCalc('44051401359')
    expect(valid.host.textContent).toContain('1·')
    expect(valid.host.textContent).toContain('4')
    expect(valid.host.textContent).toContain('101')
    expect(valid.host.textContent).toContain('(10 − 101 mod 10) mod 10 =')
    expect(valid.host.textContent).toContain('9')
    expect(valid.host.textContent).toContain('cyfra zgodna')
    valid.unmount()

    const bad = mountCalc('44051401358')
    expect(bad.host.textContent).toContain('cyfra niezgodna')
    expect(bad.host.textContent).not.toContain('cyfra zgodna')
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
