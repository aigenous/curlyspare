// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import Anatomy from './Anatomy.vue'
import { peselAnatomy } from '../tools/anatomy/pesel'

const here = dirname(fileURLToPath(import.meta.url))

const LABELS = {
  'birth-date': 'data urodzenia',
  'serial-and-sex': 'seria i płeć',
  check: 'kontrolna',
} as const

/** Lawyer-approved summaries. The en dashes are U+2013, and the caller supplies the date and sex. */
const SUMMARY = {
  wrongCheck:
    'Niepoprawny format lub suma kontrolna. Cyfra kontrolna na pozycji 11 nie zgadza się z pozostałymi cyframi.',
  wrongLength:
    'Niepoprawny format lub suma kontrolna. PESEL ma 11 cyfr – wpisana wartość ma inną długość lub zawiera znaki inne niż cyfry.',
  badDate: 'Niepoprawny format lub suma kontrolna. Cyfry 1–6 nie tworzą poprawnej daty.',
  validMale:
    'Poprawny format i suma kontrolna. Zakodowana data: 14.05.1944, zakodowana płeć: mężczyzna. Nie potwierdza, że numer istnieje ani do kogo należy.',
  validFemale:
    'Poprawny format i suma kontrolna. Zakodowana data: 29.02.2000, zakodowana płeć: kobieta. Nie potwierdza, że numer istnieje ani do kogo należy.',
} as const

function mountAnatomy(
  input: string,
  labels: Readonly<Record<string, string>> = LABELS,
  summary: string = SUMMARY.wrongLength,
) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(Anatomy, { anatomy: peselAnatomy(input), labels, summary })
  app.mount(host)
  const root = host.querySelector('.anatomy')
  if (!(root instanceof HTMLElement)) {
    throw new Error('Anatomy root was not rendered')
  }
  return {
    host,
    app,
    root,
    unmount() {
      app.unmount()
      host.remove()
    },
  }
}

describe('Anatomy', () => {
  it('stays presentational and does not decode the number', () => {
    const source = readFileSync(resolve(here, 'Anatomy.vue'), 'utf8')
    expect(source).not.toMatch(/parsePesel|validatePesel|peselCheckDigit/)
    expect(source).toMatch(/import\.meta\.env\.DEV/)
    expect(source).not.toMatch(/\?\? part\.labelKey/)
  })

  it('shows an empty PESEL as dotted cells with the caller labels', () => {
    const view = mountAnatomy('')
    expect(view.root.getAttribute('aria-hidden')).toBeNull()
    expect(view.root.querySelector('.anatomy__visual')?.getAttribute('aria-hidden')).toBe('true')
    expect(view.root.querySelector('.anatomy__summary')?.textContent).toBe(SUMMARY.wrongLength)
    expect(view.root.querySelectorAll('.anatomy__part')).toHaveLength(3)
    const cells = [...view.root.querySelectorAll('.anatomy__cell')]
    expect(cells).toHaveLength(11)
    expect(cells.every((cell) => cell.classList.contains('anatomy__cell--empty') && cell.textContent === '·')).toBe(true)
    expect(view.root.querySelectorAll('.anatomy__brace i')).toHaveLength(12)
    expect(view.root.querySelector('.anatomy__brace')?.innerHTML).toBe('<i></i><i></i><i></i><i></i>')
    expect([...view.root.querySelectorAll('.anatomy__label')].map((node) => node.textContent)).toEqual([
      'data urodzenia',
      'seria i płeć',
      'kontrolna',
    ])
    view.unmount()
  })

  it('renders nothing for a missing label and warns only while developing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const view = mountAnatomy('44051', {
      'birth-date': 'data urodzenia',
      'serial-and-sex': 'seria i płeć',
    })
    expect([...view.root.querySelectorAll('.anatomy__label')].map((node) => node.textContent)).toEqual([
      'data urodzenia',
      'seria i płeć',
      '',
    ])
    expect(view.root.textContent).not.toContain('check')
    expect(warn).toHaveBeenCalledWith('Missing anatomy label: check')
    warn.mockRestore()
    view.unmount()
  })

  it('fills only the digits that have been typed', () => {
    const view = mountAnatomy('44051')
    const cells = [...view.root.querySelectorAll('.anatomy__cell')]
    expect(cells.slice(0, 5).map((cell) => cell.textContent)).toEqual(['4', '4', '0', '5', '1'])
    expect(cells.slice(0, 5).every((cell) => !cell.classList.contains('anatomy__cell--empty'))).toBe(true)
    expect(cells.slice(5).every((cell) => cell.classList.contains('anatomy__cell--empty'))).toBe(true)
    expect(view.root.querySelector('.anatomy__cell--bad, .anatomy__cell--mark')).toBeNull()
    view.unmount()
  })

  it('marks the check digit when the number is valid', () => {
    const view = mountAnatomy('44 051-401 359', LABELS, SUMMARY.validMale)
    const cells = [...view.root.querySelectorAll('.anatomy__cell')]
    expect(cells[10]?.classList.contains('anatomy__cell--mark')).toBe(true)
    expect(cells[10]?.textContent).toBe('9')
    expect(view.root.querySelector('.anatomy__cell--bad')).toBeNull()
    expect(view.root.querySelector('.anatomy__summary')?.textContent).toBe(SUMMARY.validMale)
    view.unmount()

    const female = mountAnatomy('00222900009', LABELS, SUMMARY.validFemale)
    expect(female.root.querySelector('.anatomy__summary')?.textContent).toBe(SUMMARY.validFemale)
    female.unmount()
  })

  it('marks a wrong check digit and does not reveal the correct one', () => {
    const view = mountAnatomy('44051401358', LABELS, SUMMARY.wrongCheck)
    const cells = [...view.root.querySelectorAll('.anatomy__cell')]
    expect(cells.slice(0, 6).every((cell) => !cell.classList.contains('anatomy__cell--bad'))).toBe(true)
    expect(cells[10]?.classList.contains('anatomy__cell--bad')).toBe(true)
    expect(cells[10]?.classList.contains('anatomy__cell--mark')).toBe(false)
    expect(cells[10]?.textContent).toBe('8')
    expect(view.root.querySelector('.anatomy__summary')?.textContent).toBe(SUMMARY.wrongCheck)
    expect(view.host.textContent).not.toContain('9')
    expect(view.host.textContent).not.toContain('powinna być')
    for (const element of view.host.querySelectorAll('*')) {
      for (const name of element.getAttributeNames()) {
        expect(name.toLowerCase()).not.toContain('expected')
        expect(element.getAttribute(name) ?? '').not.toContain('9')
      }
    }
    view.unmount()
  })

  it('marks the birth-date cells when the day cannot exist', () => {
    const view = mountAnatomy('00022900003', LABELS, SUMMARY.badDate)
    expect(view.root.querySelector('.anatomy__summary')?.textContent).toBe(SUMMARY.badDate)
    const cells = [...view.root.querySelectorAll('.anatomy__cell')]
    expect(cells.slice(0, 6).every((cell) => cell.classList.contains('anatomy__cell--bad'))).toBe(true)
    expect(cells[10]?.classList.contains('anatomy__cell--mark')).toBe(true)
    view.unmount()
  })

  it('wraps whole segments and keeps eleven digits on one line at 390px and 360px', () => {
    // At 390px the content box is about 358px after 16px of padding on each
    // side, and at 360px it is about 328px. Part floors (including 4rem for
    // "kontrolna") plus the 28px gap budget stay under both widths, so the
    // eleven digits remain on one line and the page does not scroll sideways.
    // The check label wraps instead of clipping to "ko…".
    const css = readFileSync(resolve(here, '../styles/anatomy.css'), 'utf8')
    expect(css).toMatch(/\.anatomy__visual\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(css).toContain('min-width: 0')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('clamp(1.15rem, calc((100cqi - 28px) / 11), 2.5rem)')
    expect(css).toContain('max(calc(var(--n, 1) * 1.15rem), 4rem)')
    expect(css).toMatch(/\.anatomy__label\s*\{[^}]*white-space:\s*normal/)
    expect(css).not.toMatch(/\.anatomy__label\s*\{[^}]*ellipsis/)
    expect(css).not.toMatch(/overflow-x\s*:\s*auto/)
    expect(css).not.toMatch(/:root\s*\{/)
    expect(css).not.toMatch(/var\(--[a-z0-9-]+\)/)
    expect(css).toContain('var(--color-mark, #FFD83D)')
    expect(css).toContain('var(--color-on-mark, #131A3A)')
    expect(css).toContain('var(--color-mark-border, light-dark(#131a3a, #eef1fb))')
    expect(css).toContain('var(--radius-cell, 3px)')
    expect(css).toContain('var(--font-mono, "Atkinson Hyperlegible Mono", ui-monospace, Menlo, Consolas, monospace)')
    expect(css).toContain('var(--dur-slow, 360ms)')
    expect(css).toContain('var(--ease, cubic-bezier(.2, .7, .2, 1))')
    expect(css).toContain('var(--color-border, light-dark(#6e7ba3, #7481b3))')
    expect(css).toContain('var(--color-error, light-dark(#b42318, #ff9a8c))')
    expect(css).toContain('var(--n, 1)')
    expect(css).not.toMatch(/--color-mark\s*:/)
    expect(css).not.toMatch(/--color-mark-border\s*:/)
    expect(css).not.toMatch(/--font-mono\s*:/)
    expect(css).toMatch(/\.anatomy \.anatomy__cell--mark\s*\{[^}]*animation:\s*none/)

    const sheet = document.createElement('style')
    sheet.textContent = css
    document.head.append(sheet)
    const view = mountAnatomy('44051401359')
    const style = getComputedStyle(view.root)
    expect(style.display).toBe('flex')
    expect(style.flexWrap).toBe('wrap')
    expect(style.minWidth === '0px' || style.minWidth === '0').toBe(true)
    expect(style.maxWidth).toBe('100%')
    const part = view.root.querySelector('.anatomy__part')
    if (!(part instanceof HTMLElement)) {
      throw new Error('Missing anatomy part')
    }
    const partStyle = getComputedStyle(part)
    expect(partStyle.maxWidth).toBe('100%')
    expect(partStyle.minWidth === '0px' || partStyle.minWidth.includes('min')).toBe(true)
    const label = view.root.querySelector('.anatomy__label')
    if (!(label instanceof HTMLElement)) {
      throw new Error('Missing anatomy label')
    }
    expect(getComputedStyle(label).whiteSpace).toBe('normal')
    view.unmount()
    sheet.remove()
  })
})
