// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import AppFooter from './AppFooter.vue'

const published = vi.hoisted(() => ({ tools: [] as { slug: string }[] }))

vi.mock('../registry/published', () => ({
  publicTools: () => published.tools,
}))

async function mountFooter(): Promise<HTMLElement> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
  })
  const host = document.createElement('div')
  document.body.append(host)
  const app = createApp(AppFooter)
  app.use(router)
  await router.push('/')
  await router.isReady()
  app.mount(host)
  await nextTick()
  return host
}

describe('footer tool links', () => {
  it('shows only legal links when no tools are published', async () => {
    published.tools = []
    const host = await mountFooter()
    const hrefs = [...host.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toEqual(['/', '/regulamin', '/polityka-prywatnosci', '/licencje', '/operator'])
    expect(host.textContent).not.toContain('PESEL')
    host.remove()
  })

  it('links the published shortcuts', async () => {
    published.tools = [
      { slug: 'generator-pesel' },
      { slug: 'walidator-iban' },
      { slug: 'generator-uuid' },
    ]
    const host = await mountFooter()
    const hrefs = [...host.querySelectorAll('a')].map((link) => link.getAttribute('href'))
    expect(hrefs).toContain('/generator-pesel')
    expect(hrefs).toContain('/walidator-iban')
    expect(hrefs).toContain('/generator-uuid')
    expect(hrefs).not.toContain('/generator-nip')
    expect(hrefs).not.toContain('/formatowanie-json')
    host.remove()
  })
})
