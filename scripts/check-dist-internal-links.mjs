/* global console, process, URL */
// An internal href is valid when it hits a built page, an anchor on that page,
// or a published redirect source. Links to 404.html and to registered slugs
// that are not published fail. Pending redirects are not live targets.
//
// Usage:
//   node scripts/check-dist-internal-links.mjs [dist]
//   node scripts/check-dist-internal-links.mjs --self-test
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import {
  NOT_FOUND_PATH,
  listBuiltPages,
  normalizeDestination,
  normalizeSource,
  pageUrl,
  readPublishList,
  readRedirects,
  readRegisteredSlugs,
  readRouteAliases,
  redirectSources,
  walk,
} from './lib/dist-guard.mjs'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const hrefPattern = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi

function ignore(href) {
  const value = href.trim()
  if (value === '') return true
  const hashAt = value.indexOf('#')
  const before = (hashAt < 0 ? value : value.slice(0, hashAt)).trim()
  if (before === '') return false
  return (
    before.startsWith('mailto:') ||
    before.startsWith('tel:') ||
    before.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(before)
  )
}

function decodeHash(hash) {
  try {
    return decodeURIComponent(hash)
  } catch {
    return hash
  }
}

function splitHash(href) {
  const hashAt = href.indexOf('#')
  if (hashAt < 0) return { bare: href, hash: '' }
  return { bare: href.slice(0, hashAt), hash: decodeHash(href.slice(hashAt + 1)) }
}

function normalize(page, href) {
  const bare = href.split('?')[0] ?? ''
  if (bare === '') return null
  const pathname = bare.startsWith('/')
    ? bare
    : new URL(bare, `http://local${page.endsWith('/') ? page : `${page}`}`).pathname
  let decoded = pathname
  try {
    decoded = decodeURI(pathname)
  } catch {
    // Keep the raw path when the percent-encoding is invalid.
  }
  if (decoded.length > 1 && decoded.endsWith('/')) decoded = decoded.slice(0, -1)
  return decoded || '/'
}

function anchorsIn(html) {
  const found = new Set()
  for (const match of html.matchAll(/\s(?:id|name)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi)) {
    const value = (match[1] ?? match[2] ?? '').trim()
    if (value) found.add(value)
  }
  return found
}

function hasFile(dist, pathname) {
  if (pathname === '/') return existsSync(join(dist, 'index.html'))
  const rel = pathname.replace(/^\//, '')
  return (
    existsSync(join(dist, `${rel}.html`)) ||
    existsSync(join(dist, rel, 'index.html')) ||
    existsSync(join(dist, rel))
  )
}

export function checkInternalLinks(dist, vercelFile, options = {}) {
  const redirects = redirectSources(readRedirects(vercelFile) ?? [])
  const enforcePublished = Array.isArray(options.publishedSlugs)
  const published = new Set(options.publishedSlugs ?? [])
  const aliases = new Set((options.aliases ?? []).map((item) => (typeof item === 'string' ? item : item.alias)))
  const registered = new Set(options.registeredSlugs ?? [])
  const pages = listBuiltPages(dist)
  const anchors = new Map()
  for (const [path, file] of pages) anchors.set(path, anchorsIn(readFileSync(file, 'utf8')))

  const errors = []
  for (const file of walk(dist, (name) => name.endsWith('.html'))) {
    const page = pageUrl(dist, file)
    const html = readFileSync(file, 'utf8')
    for (const match of html.matchAll(hrefPattern)) {
      const href = match[1] ?? match[2] ?? ''
      if (ignore(href)) continue
      const { bare, hash } = splitHash(href)
      const bareTrimmed = bare.trim()
      const pathname = bareTrimmed === '' ? page : normalize(page, bare)
      if (pathname == null) continue
      if (redirects.has(normalizeSource(pathname))) continue
      const canonical = normalizeDestination(pathname)
      if (bareTrimmed !== '' && canonical === NOT_FOUND_PATH) {
        errors.push(`${page} -> ${href} (404)`)
        continue
      }
      const slug = canonical.startsWith('/') ? canonical.slice(1) : canonical
      if (enforcePublished && SLUG.test(slug) && registered.has(slug) && !published.has(slug) && !aliases.has(slug)) {
        errors.push(`${page} -> ${href} (unpublished slug)`)
        continue
      }
      if (!hasFile(dist, canonical)) {
        errors.push(`${page} -> ${href}`)
        continue
      }
      if (hash && !anchors.get(canonical)?.has(hash)) errors.push(`${page} -> ${href} (missing anchor)`)
    }
  }
  return errors
}

function vercelBeside(dist) {
  return join(dirname(dist), 'vercel.json')
}

function expectClean(name, errors) {
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`FAIL: ${name}`)
    process.exit(1)
  }
  console.log(`ok: ${name}`)
}

function expectHit(name, errors, needle) {
  if (!errors.some((error) => error.includes(needle))) {
    console.error(errors.join('\n') || '(no errors)')
    console.error(`FAIL: ${name}`)
    process.exit(1)
  }
  console.log(`ok: ${name}`)
}

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'links-'))
  const dist = join(root, 'dist')
  mkdirSync(dist)
  writeFileSync(join(dist, 'index.html'), '<div id="top"></div><a href="/ok">ok</a><a href="/old">old</a><a href="https://example.com">ext</a><a href="#top">hash</a><a href="mailto:a@b.c">mail</a><a href="/notes.txt">file</a>')
  writeFileSync(join(dist, 'ok.html'), '<main id="tresc"><a href="/">home</a></main>')
  writeFileSync(join(dist, 'notes.txt'), 'notes')
  writeFileSync(join(root, 'vercel.json'), JSON.stringify({ redirects: [{ source: '/old', destination: '/ok', statusCode: 301 }] }))
  expectClean('built pages, redirect source, anchor, and external link', checkInternalLinks(dist, vercelBeside(dist)))

  writeFileSync(join(dist, 'ok.html'), '<main id="tresc"><a href="/">home</a><a href="/missing-page">broken</a></main>')
  expectHit('planted broken link', checkInternalLinks(dist, vercelBeside(dist)), '/missing-page')

  const rich = join(root, 'rich')
  mkdirSync(rich)
  writeFileSync(join(rich, 'index.html'), '<main id="tresc"></main><div id="narzedzia"></div><a href="/#narzedzia">tools</a><a href="/page#exists">section</a><a href="/page#missing">nope</a><a href="/404">missing page</a><a href="/404.html">file</a><a href="/draft">draft</a><a href="/alias-page">alias</a><a href="/old#unused">redirect</a>')
  writeFileSync(join(rich, 'page.html'), '<section id="exists"></section>')
  writeFileSync(join(rich, '404.html'), '<a href="#tresc">skip</a><main id="tresc"></main>')
  writeFileSync(join(rich, 'draft.html'), '<main id="tresc"></main>')
  writeFileSync(join(rich, 'alias-page.html'), '<main id="tresc"></main>')
  const options = {
    publishedSlugs: ['page'],
    registeredSlugs: ['page', 'draft'],
    aliases: [{ alias: 'alias-page', target: 'page', initialTab: 'start' }],
  }
  const richErrors = checkInternalLinks(rich, vercelBeside(dist), options)
  expectHit('missing anchor', richErrors, '/page#missing (missing anchor)')
  expectHit('link to /404', richErrors, '/404 (404)')
  expectHit('link to 404.html', richErrors, '/404.html (404)')
  expectHit('unpublished slug', richErrors, '/draft (unpublished slug)')
  if (richErrors.some((error) => error.includes('/#narzedzia') || error.includes('/alias-page') || error.includes('/old#unused') || error.includes('/page#exists') || error.includes('#tresc'))) {
    console.error(richErrors.join('\n'))
    console.error('FAIL: valid anchor, alias, and redirect links should pass')
    process.exit(1)
  }
  console.log('ok: existing anchor, alias page, and redirect hash were accepted')
  console.log('PASS: internal link self-test')
}

const self = process.argv.includes('--self-test')
if (self) {
  selfTest()
} else {
  const dist = process.argv[2] ?? 'dist'
  const root = process.cwd()
  const vercelFile = existsSync(vercelBeside(dist)) ? vercelBeside(dist) : join(root, 'vercel.json')
  const { publishedSlugs } = readPublishList(root)
  const errors = checkInternalLinks(dist, vercelFile, {
    publishedSlugs,
    registeredSlugs: readRegisteredSlugs(root),
    aliases: readRouteAliases(root),
  })
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`FAIL: ${errors.length} internal link(s) do not resolve`)
    process.exit(1)
  }
  console.log('PASS: internal links resolve')
}
