import { tools } from './index'
import { publishedSlugList, shellPaths, visibleSlugs } from './published-slugs'
import type { ToolDefinition } from './types'

export { publishedSlugList, shellPaths }

export const publishedSlugs: ReadonlySet<string> = new Set<string>(publishedSlugList)

const notFoundPath = '/404'

export interface PublicToolsOptions {
  includeDrafts?: boolean
}

function showingDrafts(): boolean {
  if (import.meta.env.DEV) return true
  return import.meta.env.VITE_SHOW_DRAFTS === '1'
}

function includeDrafts(options?: PublicToolsOptions): boolean {
  return options?.includeDrafts ?? showingDrafts()
}

export function publicTools(options?: PublicToolsOptions): readonly ToolDefinition[] {
  const allowed = new Set(visibleSlugs(tools.map((tool) => tool.slug), includeDrafts(options)))
  return tools.filter((tool) => allowed.has(tool.slug))
}

export function missingPublishedSlugs(slugs: Iterable<string> = publishedSlugs): string[] {
  const known = new Set(tools.map((tool) => tool.slug))
  return [...slugs].filter((slug) => !known.has(slug))
}

export function assertPublishedSlugs(slugs: Iterable<string> = publishedSlugs): void {
  const missing = missingPublishedSlugs(slugs)
  if (missing.length > 0) {
    throw new Error(`Published slug is not in the registry: ${missing.join(', ')}`)
  }
}

export function sitemapPaths(options?: PublicToolsOptions): string[] {
  return [...shellPaths, ...publicTools(options).map((tool) => `/${tool.slug}`)]
}

export function prerenderPaths(options?: PublicToolsOptions): string[] {
  return [...sitemapPaths(options), notFoundPath]
}
