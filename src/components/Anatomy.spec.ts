// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import Anatomy from './Anatomy.vue'
import { peselAnatomy } from '../tools/anatomy/pesel'

const LABELS = {
  'birth-date': 'data urodzenia',
  'serial-and-sex': 'seria i płeć',
  check: 'kontrolna',
} as const

function mountAnatomy(input: string) {
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(Anatomy, { anatomy: peselAnatomy(input), labels: LABELS })
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
    const source = readFileSync(resolve('src/components/Anatomy.vue'), 'utf8')
    expect(source).not.toMatch(/parsePesel|validatePesel|peselCheckDigit/)
  })

  it('shows an empty PESEL as dotted cells with the caller labels', () => {
    const view = mountAnatomy('')
    expect(view.root.getAttribute('aria-hidden')).toBe('true')
    expect(view.root.querySelectorAll('.anatomy__part')).toHaveLength(3)
    const cells = [...view.root.querySelectorAll('.cell')]
    expect(cells).toHaveLength(11)
    expect(cells.every((cell) => cell.classList.contains('cell--empty') && cell.textContent === '·')).toBe(true)
    expect(view.root.querySelectorAll('.brace i')).toHaveLength(12)
    expect(view.root.querySelector('.brace')?.innerHTML).toBe('<i></i><i></i><i></i><i></i>')
    expect([...view.root.querySelectorAll('.anatomy__label')].map((node) => node.textContent)).toEqual([
      'data urodzenia',
      'seria i płeć',
      'kontrolna',
    ])
    view.unmount()
  })

  it('fills only the digits that have been typed', () => {
    const view = mountAnatomy('44051')
    const cells = [...view.root.querySelectorAll('.cell')]
    expect(cells.slice(0, 5).map((cell) => cell.textContent)).toEqual(['4', '4', '0', '5', '1'])
    expect(cells.slice(0, 5).every((cell) => !cell.classList.contains('cell--empty'))).toBe(true)
    expect(cells.slice(5).every((cell) => cell.classList.contains('cell--empty'))).toBe(true)
    expect(view.root.querySelector('.cell--bad, .cell--mark')).toBeNull()
    view.unmount()
  })

  it('marks the check digit when the number is valid', () => {
    const view = mountAnatomy('44 051-401 359')
    const cells = [...view.root.querySelectorAll('.cell')]
    expect(cells[10]?.classList.contains('cell--mark')).toBe(true)
    expect(cells[10]?.textContent).toBe('9')
    expect(view.root.querySelector('.cell--bad')).toBeNull()
    view.unmount()
  })

  it('marks a wrong check digit and leaves the date cells plain', () => {
    const view = mountAnatomy('44051401358')
    const cells = [...view.root.querySelectorAll('.cell')]
    expect(cells.slice(0, 6).every((cell) => !cell.classList.contains('cell--bad'))).toBe(true)
    expect(cells[10]?.classList.contains('cell--bad')).toBe(true)
    expect(cells[10]?.classList.contains('cell--mark')).toBe(false)
    view.unmount()
  })

  it('marks the birth-date cells when the day cannot exist', () => {
    const view = mountAnatomy('00022900003')
    const cells = [...view.root.querySelectorAll('.cell')]
    expect(cells.slice(0, 6).every((cell) => cell.classList.contains('cell--bad'))).toBe(true)
    expect(cells[10]?.classList.contains('cell--mark')).toBe(true)
    view.unmount()
  })

  it('wraps whole segments and sizes an 11-digit row for a 390px viewport', () => {
    // Manual check: at 390px (about 358px of content after 16px of padding on
    // each side) the three PESEL segments stay on one line and the page does
    // not scroll sideways. A longer segment wraps onto the next line with its
    // brace and label. This test locks the rules that produce that layout.
    const css = readFileSync(resolve('src/styles/anatomy.css'), 'utf8')
    expect(css).toMatch(/\.anatomy\s*\{[^}]*flex-wrap:\s*wrap/)
    expect(css).toContain('min-width: 0')
    expect(css).toContain('max-width: 100%')
    expect(css).toContain('clamp(1.15rem, calc((100cqi - 28px) / 11), 2.5rem)')
    expect(css).not.toMatch(/overflow-x\s*:\s*auto/)

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
    view.unmount()
    sheet.remove()
  })
})
