import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { routes } from '../router'
import { tools } from './index'
import { visibleSlugs } from './published-slugs'
import {
  assertPublishedSlugs,
  missingPublishedSlugs,
  prerenderPaths,
  publicTools,
  publishedSlugs,
  shellPaths,
  sitemapPaths,
} from './published'

const reservedPaths = new Set<string>(['/', '/regulamin', '/polityka-prywatnosci', '/operator', '/404', '/:pathMatch(.*)*'])

describe('publish allowlist', () => {
  it('publishes no tools until the product list lands', () => {
    expect([...publishedSlugs]).toEqual([])
    expect(publicTools({ includeDrafts: false })).toEqual([])
    expect(sitemapPaths({ includeDrafts: false })).toEqual([...shellPaths])
    expect(prerenderPaths({ includeDrafts: false })).toEqual([...shellPaths, '/404'])
  })

  it('accepts only slugs that exist in the registry', () => {
    const registered = tools.map((tool) => tool.slug)
    const sample = registered[0]
    expect(sample).toBeDefined()
    expect(missingPublishedSlugs()).toEqual([])
    expect(missingPublishedSlugs(registered)).toEqual([])
    expect(missingPublishedSlugs([sample ?? ''])).toEqual([])
    expect(() => assertPublishedSlugs(registered)).not.toThrow()
    expect(missingPublishedSlugs(['nie-ma-takiego-narzedzia'])).toEqual(['nie-ma-takiego-narzedzia'])
    expect(() => assertPublishedSlugs(['nie-ma-takiego-narzedzia'])).toThrow(/nie-ma-takiego-narzedzia/)
  })

  it('accepts every slug named in the allowlist comment', () => {
    const registered = new Set(tools.map((tool) => tool.slug))
    const source = readFileSync(new URL('./published-slugs.ts', import.meta.url), 'utf8')
    const header = source.match(/^\/\*\*[\s\S]*?\*\//)?.[0] ?? ''
    const examples = [...header.matchAll(/[a-z0-9]+(?:-[a-z0-9]+)+/g)].map((match) => match[0])
    expect(examples.length).toBeGreaterThan(0)
    expect(examples.every((slug) => registered.has(slug))).toBe(true)
    expect(() => assertPublishedSlugs(examples)).not.toThrow()
  })

  it('keeps sitemap and prerender paths to the allowlist plus static pages', () => {
    const published = publicTools({ includeDrafts: false })
    expect(published.every((tool) => publishedSlugs.has(tool.slug))).toBe(true)
    expect(published).toHaveLength(publishedSlugs.size)
    expect(sitemapPaths({ includeDrafts: false })).toEqual([
      ...shellPaths,
      ...published.map((tool) => `/${tool.slug}`),
    ])
    expect(prerenderPaths({ includeDrafts: false })).toEqual([
      ...sitemapPaths({ includeDrafts: false }),
      '/404',
    ])
  })

  it('filters slugs the same way the production build does', () => {
    const registered = tools.map((tool) => tool.slug)
    expect(visibleSlugs(registered, false)).toEqual(
      publicTools({ includeDrafts: false }).map((tool) => tool.slug),
    )
    expect(visibleSlugs(registered, true)).toEqual(
      publicTools({ includeDrafts: true }).map((tool) => tool.slug),
    )
  })

  it('shows the whole registry when drafts are included', () => {
    expect(publicTools({ includeDrafts: true })).toEqual(tools)
    expect(sitemapPaths({ includeDrafts: true })).toEqual([
      ...shellPaths,
      ...tools.map((tool) => `/${tool.slug}`),
    ])
    expect(prerenderPaths({ includeDrafts: true })).toEqual([
      ...shellPaths,
      ...tools.map((tool) => `/${tool.slug}`),
      '/404',
    ])
  })

  it('registers a route for every tool exposed in this runtime', () => {
    const toolPaths = routes.map((route) => route.path).filter((path) => !reservedPaths.has(path))
    expect(toolPaths).toEqual(publicTools().map((tool) => `/${tool.slug}`))
    expect(publicTools()).toEqual(tools)
  })
})
