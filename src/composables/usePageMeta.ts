import { useHead } from '@unhead/vue'
import { brand } from '../brand'

export interface PageMetaInput {
  title: string
  description: string
  path: string
  robots?: string
  ogTitle?: string
}

export function pageHead(input: PageMetaInput) {
  const url = `${brand.siteUrl}${input.path === '/' ? '/' : input.path}`
  return {
    title: input.title,
    htmlAttrs: { lang: 'pl' },
    meta: [
      { name: 'description', content: input.description },
      { property: 'og:title', content: input.ogTitle ?? input.title },
      { property: 'og:description', content: input.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: 'pl_PL' },
      { name: 'robots', content: input.robots ?? 'index,follow' },
    ],
    link: [{ rel: 'canonical', href: url }],
  }
}

export function usePageMeta(input: PageMetaInput) {
  useHead(pageHead(input))
}
