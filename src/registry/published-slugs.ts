/**
 * Public tool slugs. Navigation, search, prerender and the sitemap omit a
 * tool until its slug is listed here.
 *
 * TODO: Product Manager provides this list in a separate PR.
 * Keep the list empty until that list lands. The examples below are copied
 * from the tool registry:
 * walidator-iban, numer-dowodu-osobistego, numer-paszportu.
 *
 * This module stays free of Vue imports so the Vite config can read it.
 */
export const publishedSlugList = [] as const

export const shellPaths = ['/', '/regulamin', '/polityka-prywatnosci', '/operator'] as const

export function visibleSlugs(registered: readonly string[], includeDrafts: boolean): string[] {
  if (includeDrafts) return [...registered]
  const allowed = new Set<string>(publishedSlugList)
  return registered.filter((slug) => allowed.has(slug))
}
