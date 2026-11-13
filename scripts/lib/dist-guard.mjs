/* global URL */
// Shared readers for the dist publish guards.
// Counts come from published-slugs.ts and, when present, route-aliases.ts.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'

export const NOT_FOUND_PATH = '/404'

const TOOL_INDEXES = [
  'src/tools/misc/index.ts',
  'src/tools/generators/index.ts',
  'src/tools/converters/index.ts',
]

export function walk(dir, accept, out = []) {
  if (!existsSync(dir)) return out
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, accept, out)
    else if (accept(name, path)) out.push(path)
  }
  return out
}

export function pageUrl(dist, file) {
  let rel = relative(dist, file).split(sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'/index.html'.length)
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length)
  const url = `/${rel}`.replace(/\/+$/, '')
  return url === '' ? '/' : url
}

export function listBuiltPages(dist) {
  const pages = new Map()
  for (const file of walk(dist, (name) => name.endsWith('.html'))) {
    pages.set(pageUrl(dist, file), file)
  }
  return pages
}

/** Drop query, fragment, a trailing .html, and a trailing slash. */
export function normalizeDestination(path) {
  const bare = String(path).split('#')[0]?.split('?')[0] ?? ''
  let value = bare
  if (value.endsWith('.html')) value = value.slice(0, -'.html'.length)
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1)
  if (value === '' || value === '/') return '/'
  if (!value.startsWith('/')) value = `/${value}`
  return value
}

/**
 * Drop query, fragment, and a trailing slash.
 * Keep .html so a compatibility source does not collide with the clean URL.
 */
export function normalizeSource(path) {
  const bare = String(path).split('#')[0]?.split('?')[0] ?? ''
  let value = bare
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1)
  if (value === '') return '/'
  return value
}

export function sitemapPaths(xml) {
  const paths = []
  for (const match of xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)) {
    paths.push(locPath(match[1] ?? ''))
  }
  return paths
}

function locPath(loc) {
  const trimmed = loc.trim()
  let pathname = trimmed
  if (/^https?:\/\//i.test(trimmed)) pathname = new URL(trimmed).pathname
  if (pathname.length > 1 && pathname.endsWith('/')) pathname = pathname.slice(0, -1)
  return pathname || '/'
}

function exportedArray(source, name, label) {
  const match = source.match(new RegExp(`export\\s+const\\s+${name}\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*as\\s+const`))
  if (!match) throw new Error(`Could not read ${name} from ${label}`)
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1] ?? '')
}

export function readPublishList(root) {
  const file = resolve(root, 'src/registry/published-slugs.ts')
  const source = readFileSync(file, 'utf8')
  return {
    publishedSlugs: exportedArray(source, 'publishedSlugList', file),
    shellPaths: exportedArray(source, 'shellPaths', file),
  }
}

function stripComments(source) {
  const withoutBlocks = source.replace(/\/\*[\s\S]*?\*\//g, '')
  return withoutBlocks.split('\n').map((line) => {
    const commentAt = line.indexOf('//')
    if (commentAt < 0) return line
    const quoteAt = line.search(/['"]/)
    if (quoteAt >= 0 && quoteAt < commentAt) return line
    return line.slice(0, commentAt)
  }).join('\n')
}

function readField(object, name) {
  const match = object.match(new RegExp(`\\b${name}\\s*:\\s*(['"])(.*?)\\1`))
  return match ? (match[2] ?? '') : null
}

export function parseRouteAliases(source, label = 'route-aliases.ts') {
  const stripped = stripComments(source)
  const start = stripped.search(/export\s+const\s+ROUTE_ALIASES\b/)
  if (start < 0) throw new Error(`${label} exists but does not export ROUTE_ALIASES`)
  const eq = stripped.indexOf('=', start)
  const open = stripped.indexOf('[', eq)
  if (eq < 0 || open < 0) throw new Error(`${label} does not assign an array to ROUTE_ALIASES`)
  let depth = 0
  let end = -1
  for (let index = open; index < stripped.length; index += 1) {
    const char = stripped[index]
    if (char === '[') depth += 1
    else if (char === ']') {
      depth -= 1
      if (depth === 0) {
        end = index
        break
      }
    }
  }
  if (end < 0) throw new Error(`${label} has an unclosed ROUTE_ALIASES array`)
  const aliases = []
  for (const match of stripped.slice(open + 1, end).matchAll(/\{[^{}]*\}/g)) {
    const object = match[0]
    const alias = readField(object, 'alias')
    const target = readField(object, 'target')
    const initialTab = readField(object, 'initialTab')
    if (!alias || !target) throw new Error(`${label} has a ROUTE_ALIASES entry without alias and target`)
    aliases.push({ alias, target, initialTab: initialTab ?? '' })
  }
  return aliases
}

export function routeAliasFile(root) {
  return resolve(root, 'src/registry/route-aliases.ts')
}

/** Empty when the module has not landed yet. */
export function readRouteAliases(root) {
  const file = routeAliasFile(root)
  if (!existsSync(file)) return []
  return parseRouteAliases(readFileSync(file, 'utf8'), file)
}

export function readRegisteredSlugs(root) {
  const slugs = []
  for (const file of TOOL_INDEXES) {
    const source = readFileSync(resolve(root, file), 'utf8')
    for (const match of source.matchAll(/slug:\s*'([^']+)'/g)) slugs.push(match[1] ?? '')
  }
  return slugs
}

export function readRedirects(file) {
  if (!existsSync(file)) return null
  const parsed = JSON.parse(readFileSync(file, 'utf8'))
  if (Array.isArray(parsed)) return parsed
  if (parsed && Array.isArray(parsed.redirects)) return parsed.redirects
  throw new Error(`${file} must contain a redirects array`)
}

export function redirectSources(redirects) {
  const sources = new Set()
  for (const redirect of redirects ?? []) {
    if (typeof redirect.source !== 'string' || /[()*]/.test(redirect.source)) continue
    sources.add(normalizeSource(redirect.source))
  }
  return sources
}

export function publicContentPaths(publishedSlugs, aliases) {
  return new Set([
    ...publishedSlugs.map((slug) => `/${slug}`),
    ...aliases.map((alias) => `/${alias.alias}`),
  ])
}

export function expectedSitemapPaths(shellPaths, publishedSlugs, aliases) {
  return new Set([...shellPaths, ...publicContentPaths(publishedSlugs, aliases)])
}

export function statedToolCounts(html) {
  const counts = []
  const pattern = /(\d+)\s+(?:darmowych\s+|darmowe\s+)?narz(?:ędzie|ędzia|ędzi)\b/gu
  for (const match of html.matchAll(pattern)) counts.push(Number(match[1]))
  return counts
}

function tagAttribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'))
  return match?.[1] ?? match?.[2] ?? ''
}

/** Slugs linked from the home catalogue, in document order. */
export function catalogueSlugs(html) {
  const slugs = []
  for (const match of html.matchAll(/<a\b[^>]*>/gi)) {
    const tag = match[0]
    const className = tagAttribute(tag, 'class')
    if (!className.split(/\s+/).includes('toc__link')) continue
    const href = tagAttribute(tag, 'href')
    if (!href) continue
    const path = normalizeDestination(href)
    const slug = path.startsWith('/') ? path.slice(1) : path
    if (slug && !slug.includes('/')) slugs.push(slug)
  }
  return slugs
}

export function slugTarget(target) {
  return String(target).replace(/^\/+/, '').replace(/\/+$/, '')
}
