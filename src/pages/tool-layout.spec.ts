// @vitest-environment jsdom
import { createHead } from '@unhead/vue/client'
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { generatorDisclaimer } from '../brand'
import { browserPrivacy } from '../lib/landing/copy'
import ToolPage from './ToolPage.vue'

describe('tool page frame', () => {
  it('renders the shared chrome and the PESEL structure table', async () => {
    const host = document.createElement('div')
    document.body.append(host)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/generator-pesel', component: ToolPage, meta: { slug: 'generator-pesel' } },
        { path: '/generator-nip', component: ToolPage, meta: { slug: 'generator-nip' } },
      ],
    })
    const app = createApp(ToolPage)
    app.use(router)
    app.use(createHead())
    await router.push('/generator-pesel')
    await router.isReady()
    app.mount(host)
    await nextTick()

    try {
      expect(host.querySelector('h1')?.textContent?.trim()).toBe('Generator PESEL')
      expect(host.querySelector('.tool-head .lead')?.textContent?.trim()).toContain('Generuje i sprawdza numer PESEL')
      expect(host.querySelector('nav[aria-label="Okruszki"] a[href="/#identyfikatory"]')).not.toBeNull()
      expect(host.querySelector('section.tool')).not.toBeNull()
      expect(host.querySelector('section.tool')?.nextElementSibling?.classList.contains('disclaimer')).toBe(true)
      expect(host.querySelector('.disclaimer')?.textContent?.trim()).toBe(generatorDisclaimer)
      expect(host.textContent).toContain('Budowa numeru PESEL')
      expect(host.textContent).toContain(
        'Jeśli suma się nie zgadza, walidator nie wskazuje, która cyfra jest błędna, i nie podaje poprawionego numeru – błąd może być w każdej z cyfr.',
      )
      expect(host.textContent).not.toContain('Pokaż obliczenia')
      expect(host.textContent).toContain(browserPrivacy)
      expect(host.querySelector('a[href="/generator-nip"]')?.textContent).toBe('Walidator NIP')
      const labels = [...host.querySelectorAll('.responsive-table tbody [data-label]')].map(
        (cell) => cell.getAttribute('data-label'),
      )
      expect(labels).toContain('Cyfry')
      expect(labels).toContain('Znaczenie')
    } finally {
      app.unmount()
      host.remove()
    }
  })
})
