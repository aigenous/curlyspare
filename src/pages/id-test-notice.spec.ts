// @vitest-environment jsdom
import { createHead } from '@unhead/vue/client'
import { describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { idDocumentDisclaimer } from '../brand'
import { ID_TEST_NOTICE_LINES } from '../tools/generators/id-document-copy'
import ToolPage from './ToolPage.vue'

const ID_PAGES = ['/numer-dowodu-osobistego', '/numer-paszportu'] as const

describe('ID document test notice', () => {
  it('renders the two-line notice at the top of section.tool on the ID card and passport pages', async () => {
    expect(ID_TEST_NOTICE_LINES[0]).toBe('Numer testowy \u2013 nie jest dokumentem ani jego wzorem.')
    expect(ID_TEST_NOTICE_LINES[1]).toBe('Zastrze\u017cenie poni\u017cej \u2193')
    expect(ID_TEST_NOTICE_LINES[0]?.includes('\u2013')).toBe(true)
    expect(ID_TEST_NOTICE_LINES[1]?.endsWith('\u2193')).toBe(true)

    const host = document.createElement('div')
    document.body.append(host)
    const router = createRouter({
      history: createMemoryHistory(),
      routes: ID_PAGES.map((path) => ({
        path,
        component: ToolPage,
        meta: { slug: path.slice(1) },
      })),
    })
    const app = createApp(ToolPage)
    app.use(router)
    app.use(createHead())
    await router.push(ID_PAGES[0])
    await router.isReady()
    app.mount(host)

    try {
      for (const path of ID_PAGES) {
        await router.push(path)
        await nextTick()
        const section = host.querySelector('section.tool')
        expect(section, path).not.toBeNull()
        expect(section?.querySelector('img'), path).toBeNull()
        const lines = [...(section?.querySelectorAll('.id-test-notice p') ?? [])].map((item) => item.textContent)
        expect(lines, path).toEqual([...ID_TEST_NOTICE_LINES])
        expect(section?.firstElementChild?.classList.contains('id-test-notice'), path).toBe(true)
        const disclaimer = section?.nextElementSibling
        expect(disclaimer?.classList.contains('disclaimer'), path).toBe(true)
        expect(disclaimer?.textContent?.trim(), path).toBe(idDocumentDisclaimer)
      }
    } finally {
      app.unmount()
      host.remove()
    }
  })
})
