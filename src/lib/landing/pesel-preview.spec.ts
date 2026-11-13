// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import PeselDemo from '../../components/landing/PeselDemo.vue'
import { previewPesel } from './pesel-preview'

describe('PESEL landing preview', () => {
  it('walks a valid example without reading a separate expected digit', () => {
    const preview = previewPesel('44 05-1401359')
    expect(preview.tone).toBe('ok')
    expect(preview.headline).toBe('Poprawny format i suma kontrolna')
    expect(preview.note).toBe('Nie potwierdza, że numer istnieje ani do kogo należy.')
    expect(preview.facts[0]?.detail).toBe('14 maja 1944')
    expect(preview.facts[1]?.detail).toBe('mężczyzna (10. cyfra jest nieparzysta)')
    expect(preview.calc.mode).toBe('match')
    if (preview.calc.mode !== 'match') return
    expect(preview.calc.digit).toBe(9)
    expect(preview.calc.sum).toBeGreaterThan(0)
    expect(Object.hasOwn(preview.calc, 'expected')).toBe(false)
  })

  it('stops an invalid checksum at the sum and the entered digit', () => {
    const preview = previewPesel('44051401358')
    expect(preview.tone).toBe('error')
    expect(preview.note).toBe('Cyfra kontrolna na pozycji 11 nie zgadza się z pozostałymi cyframi.')
    expect(preview.calc.mode).toBe('mismatch')
    if (preview.calc.mode !== 'mismatch') return
    expect(preview.calc.message).toBe('Suma kontrolna się nie zgadza z 11. cyfrą (wpisano 8).')
    const shown = `${preview.calc.message} ${preview.calc.caveat}`
    expect(shown).not.toContain('mod 10')
    expect(shown).not.toContain('powinna')
    expect(shown).not.toMatch(/\(10/)
    expect(Object.hasOwn(preview.calc, 'expected')).toBe(false)
  })

  it('does not compute a check digit for a partial number', () => {
    const preview = previewPesel('4405140135')
    expect(preview.headline).toBe('Wpisano 10 z 11 cyfr.')
    expect(preview.facts).toEqual([])
    expect(preview.calc).toEqual({ mode: 'pending', message: 'Obliczenia pojawią się po wpisaniu 11 cyfr.' })
  })

  it('does not reveal a corrected digit in the demo', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: PeselDemo }],
    })
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(PeselDemo)
    app.use(router)
    await router.push('/')
    await router.isReady()
    app.mount(host)
    await nextTick()

    const input = host.querySelector('input')
    expect(input).toBeInstanceOf(HTMLInputElement)
    if (!(input instanceof HTMLInputElement)) return
    input.value = '44051401358'
    input.dispatchEvent(new Event('input'))
    await nextTick()

    const calc = host.querySelector('.calc')?.textContent ?? ''
    expect(calc).toContain('wpisano 8')
    expect(calc).not.toContain('mod 10')
    expect(calc).not.toContain('powinna')
    expect(calc).not.toMatch(/\(10/)

    input.value = '44051'
    input.dispatchEvent(new Event('input'))
    await nextTick()
    expect(host.querySelector('.calc')?.textContent).toContain('Obliczenia pojawią się po wpisaniu 11 cyfr.')
    expect(host.querySelector('.facts')).toBeNull()

    app.unmount()
    host.remove()
  })
})
