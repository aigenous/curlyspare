// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppHeader from './AppHeader.vue'

async function mountHeader(): Promise<HTMLElement> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(AppHeader)
  app.use(router)
  await router.push('/')
  await router.isReady()
  app.mount(host)
  await nextTick()
  return host
}

function accessibleName(button: HTMLButtonElement): string {
  const copy = button.cloneNode(true) as HTMLButtonElement
  for (const hidden of copy.querySelectorAll('[aria-hidden="true"]')) hidden.remove()
  return (copy.textContent ?? '').replace(/\s+/g, ' ').trim()
}

describe('header search button', () => {
  it('names the button Szukaj from its text, with the shortcut hidden', async () => {
    const host = await mountHeader()
    const button = host.querySelector('button.search-trigger')
    expect(button).toBeInstanceOf(HTMLButtonElement)
    const search = button as HTMLButtonElement
    expect(search.hasAttribute('aria-label')).toBe(false)
    expect(search.querySelector('.header-search-label')?.classList.contains('sr-only')).toBe(true)
    expect(search.querySelector('.header-search-label')?.textContent).toBe('Szukaj')
    expect(search.querySelector('kbd')?.getAttribute('aria-hidden')).toBe('true')
    expect(accessibleName(search)).toBe('Szukaj')
    host.remove()
  })
})
