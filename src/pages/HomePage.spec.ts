// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { t } from '../i18n'
import HomePage from './HomePage.vue'

vi.mock('../composables/usePageMeta', () => ({
  usePageMeta: () => undefined,
}))

vi.mock('../registry/published', () => ({
  publishedSlugs: new Set<string>(),
  publicTools: () => [],
}))

describe('home with an empty allowlist', () => {
  it('shows an empty state instead of a tool grid', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: HomePage }],
    })
    const host = document.createElement('div')
    document.body.append(host)
    const app = createApp(HomePage)
    app.use(router)
    await router.push('/')
    await router.isReady()
    app.mount(host)
    await nextTick()

    expect(host.querySelector('h1')?.textContent).toContain('Narzędzia, które')
    expect(host.textContent).toContain(t('homeEmpty'))
    expect(host.querySelectorAll('.toc__link')).toHaveLength(0)
    expect(host.querySelector('.tool-grid')).toBeNull()

    app.unmount()
    host.remove()
  })
})
