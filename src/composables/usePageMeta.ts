import { useHead } from '@unhead/vue'
import { brand } from '../brand'

export function usePageMeta(input: {
  title: string
  description: string
  path: string
  robots?: string
}) {
  const url = `${brand.siteUrl}${input.path === '/' ? '/' : input.path}`
  useHead({
    title: input.title,
    htmlAttrs: { lang: 'pl' },
    meta: [
      { name: 'description', content: input.description },
      { property: 'og:title', content: input.title },
      { property: 'og:description', content: input.description },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: url },
      { property: 'og:locale', content: 'pl_PL' },
      { name: 'robots', content: input.robots ?? 'index,follow' },
    ],
    link: [{ rel: 'canonical', href: url }],
  })
}
