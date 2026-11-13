/* global console, process */
// The catalogue, the built pages, and the sitemap must agree with the
// published list. Route aliases, when src/registry/route-aliases.ts exists,
// are extra public pages: each one is built, listed in the sitemap, aimed at
// a published tool, and free of collisions. Until that module exists the
// alias list is empty, so the same check passes before and after it lands.
// Nothing here hardcodes a tool total.
//
// Usage:
//   node scripts/check-dist-tool-counts.mjs [dist]
//   node scripts/check-dist-tool-counts.mjs --self-test
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  NOT_FOUND_PATH,
  catalogueSlugs,
  expectedSitemapPaths,
  listBuiltPages,
  normalizeDestination,
  publicContentPaths,
  readPublishList,
  readRedirects,
  readRouteAliases,
  routeAliasFile,
  sitemapPaths,
  slugTarget,
  statedToolCounts,
} from './lib/dist-guard.mjs'

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right))
}

function diff(expected, actual) {
  const missing = sorted(expected).filter((item) => !actual.has(item))
  const extra = sorted(actual).filter((item) => !expected.has(item))
  return { missing, extra }
}

function redirectKeys(redirects) {
  const keys = new Set()
  for (const redirect of redirects ?? []) {
    if (typeof redirect.source !== 'string') continue
    keys.add(normalizeDestination(redirect.source))
  }
  return keys
}

export function checkPublishedCounts({
  dist,
  publishedSlugs,
  shellPaths,
  aliases,
  redirects,
  pending,
}) {
  const errors = []
  const shellSet = new Set(shellPaths)
  const publishedSet = new Set(publishedSlugs)
  const aliasList = aliases ?? []
  const sources = redirectKeys([...(redirects ?? []), ...(pending ?? [])])
  const seenAliases = new Set()

  for (const alias of aliasList) {
    const name = alias.alias ?? ''
    const target = slugTarget(alias.target ?? '')
    if (!SLUG.test(name)) errors.push(`route alias ${name || '(blank)'} is not a slug`)
    if (!SLUG.test(target)) errors.push(`route alias ${name} points at ${target || '(blank)'}, which is not a slug`)
    if (seenAliases.has(name)) errors.push(`duplicate route alias ${name}`)
    seenAliases.add(name)
    if (!publishedSet.has(target)) errors.push(`route alias ${name} points at unpublished target ${target}`)
    if (publishedSet.has(name)) errors.push(`route alias ${name} collides with a published slug`)
    if (shellSet.has(`/${name}`) || name === '404') errors.push(`route alias ${name} collides with a shell page`)
    if (sources.has(`/${name}`)) errors.push(`route alias ${name} collides with a redirect source`)
  }

  const expectedSitemap = expectedSitemapPaths(shellPaths, publishedSlugs, aliasList)
  const expectedHtml = new Set([...expectedSitemap, NOT_FOUND_PATH])
  const built = listBuiltPages(dist)
  const htmlDiff = diff(expectedHtml, new Set(built.keys()))
  if (htmlDiff.missing.length > 0 || htmlDiff.extra.length > 0) {
    errors.push(`built pages differ from shell pages + published tools + route aliases + 404. Missing: ${htmlDiff.missing.join(', ') || 'none'}. Extra: ${htmlDiff.extra.join(', ') || 'none'}.`)
  }
  for (const alias of aliasList) {
    if (!built.has(`/${alias.alias}`)) errors.push(`route alias ${alias.alias} has no built page`)
  }

  const sitemapFile = join(dist, 'sitemap.xml')
  let sitemap = []
  if (!existsSync(sitemapFile)) {
    errors.push('sitemap.xml is missing')
  } else {
    sitemap = sitemapPaths(readFileSync(sitemapFile, 'utf8'))
    const sitemapSet = new Set(sitemap)
    if (sitemapSet.size !== sitemap.length) errors.push('sitemap.xml lists a URL more than once')
    const sitemapDiff = diff(expectedSitemap, sitemapSet)
    if (sitemapDiff.missing.length > 0 || sitemapDiff.extra.length > 0) {
      errors.push(`sitemap URLs differ from shell pages + published tools + route aliases. Missing: ${sitemapDiff.missing.join(', ') || 'none'}. Extra: ${sitemapDiff.extra.join(', ') || 'none'}.`)
    }
    for (const alias of aliasList) {
      if (!sitemapSet.has(`/${alias.alias}`)) errors.push(`route alias ${alias.alias} is missing from the sitemap`)
    }
  }

  const homeFile = built.get('/')
  let catalogue = []
  let stated = []
  if (!homeFile) {
    errors.push('home page is missing')
  } else {
    const home = readFileSync(homeFile, 'utf8')
    catalogue = catalogueSlugs(home)
    const catalogueSet = new Set(catalogue)
    if (catalogue.length !== catalogueSet.size) errors.push('home catalogue lists a tool more than once')
    const catalogueDiff = diff(publishedSet, catalogueSet)
    if (catalogueDiff.missing.length > 0 || catalogueDiff.extra.length > 0) {
      errors.push(`home catalogue differs from the published list. Missing: ${catalogueDiff.missing.join(', ') || 'none'}. Extra: ${catalogueDiff.extra.join(', ') || 'none'}.`)
    }
    stated = statedToolCounts(home)
    for (const count of stated) {
      if (count !== publishedSlugs.length) {
        errors.push(`home page states ${count} tools; the published list has ${publishedSlugs.length}`)
      }
    }
  }

  const contentPaths = publicContentPaths(publishedSlugs, aliasList)
  const builtContent = [...built.keys()].filter((path) => contentPaths.has(path))
  const sitemapContent = sitemap.filter((path) => contentPaths.has(path))
  return {
    errors,
    summary: {
      publishedTools: publishedSlugs.length,
      routeAliases: aliasList.length,
      catalogue: catalogue.length,
      builtToolPages: builtContent.length,
      sitemapToolUrls: sitemapContent.length,
      shellPages: shellPaths.length,
      htmlFiles: built.size,
      sitemapUrls: sitemap.length,
      stated,
    },
  }
}

function formatSummary(summary, aliasSource) {
  const stated = summary.stated.length > 0 ? summary.stated.join(', ') : 'none'
  return [
    `published tools ${summary.publishedTools}`,
    `route aliases ${summary.routeAliases} (${aliasSource})`,
    `catalogue ${summary.catalogue}`,
    `built tool pages ${summary.builtToolPages}`,
    `sitemap tool URLs ${summary.sitemapToolUrls}`,
    `shell pages ${summary.shellPages}`,
    `html files ${summary.htmlFiles}`,
    `sitemap URLs ${summary.sitemapUrls}`,
    `home tool counts ${stated}`,
  ].join(', ')
}

function writeSite(dir, { slugs, shells, aliases, homeCounts, sitemapExtra = [], htmlExtra = [] }) {
  mkdirSync(dir, { recursive: true })
  const pages = new Set(['/', ...shells.filter((path) => path !== '/'), ...slugs.map((slug) => `/${slug}`), ...aliases.map((alias) => `/${alias.alias}`), NOT_FOUND_PATH, ...htmlExtra])
  for (const path of pages) {
    const name = path === '/' ? 'index.html' : `${path.slice(1)}.html`
    const catalogue = path === '/'
      ? slugs.map((slug) => `<a class="toc__link" href="/${slug}">${slug}</a>`).join('')
      : ''
    const counts = path === '/'
      ? homeCounts.map((count) => `<p>${count} darmowych narzędzi</p>`).join('')
      : ''
    const chip = path === '/' ? '<a class="chip" href="/alfa">Alfa</a>' : ''
    writeFileSync(join(dir, name), `<main id="tresc">${chip}${counts}<section id="narzedzia">${catalogue}</section></main>`)
  }
  const locs = [...shells, ...slugs.map((slug) => `/${slug}`), ...aliases.map((alias) => `/${alias.alias}`), ...sitemapExtra]
  const body = locs.map((path) => `  <url><loc>https://tools.example.test${path === '/' ? '/' : path}</loc></url>`).join('\n')
  writeFileSync(join(dir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset>\n${body}\n</urlset>\n`)
}

function expectResult(name, result, { fail, includes }) {
  const failed = result.errors.length > 0
  if (fail !== failed || (includes && !result.errors.some((error) => error.includes(includes)))) {
    console.error(`FAIL: self-test ${name}`)
    console.error(result.errors.join('\n') || '(no errors)')
    process.exit(1)
  }
  console.log(`ok: ${name}`)
}

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'tool-counts-'))
  const slugs = ['alfa', 'beta']
  const shells = ['/', '/regulamin']
  const base = { publishedSlugs: slugs, shellPaths: shells, pending: [] }

  const passDir = join(root, 'pass')
  writeSite(passDir, { slugs, shells, aliases: [], homeCounts: [2, 2] })
  expectResult('published pages agree when there are no aliases', checkPublishedCounts({ ...base, dist: passDir, aliases: [], redirects: [] }), { fail: false })

  const alias = { alias: 'walidator-alfa', target: 'alfa', initialTab: 'sprawdz' }
  const aliasDir = join(root, 'alias')
  writeSite(aliasDir, { slugs, shells, aliases: [alias], homeCounts: [2, 2] })
  expectResult('alias page is counted beside the published tools', checkPublishedCounts({ ...base, dist: aliasDir, aliases: [alias], redirects: [] }), { fail: false })

  const statedDir = join(root, 'stated')
  writeSite(statedDir, { slugs, shells, aliases: [], homeCounts: [3] })
  expectResult('home page states another tool count', checkPublishedCounts({ ...base, dist: statedDir, aliases: [], redirects: [] }), {
    fail: true,
    includes: 'states 3 tools',
  })

  const catalogueDir = join(root, 'catalogue')
  writeSite(catalogueDir, { slugs: ['alfa'], shells, aliases: [], homeCounts: [2, 2] })
  writeFileSync(join(catalogueDir, 'beta.html'), '<main id="tresc"></main>')
  expectResult('catalogue misses a published tool', checkPublishedCounts({ ...base, dist: catalogueDir, aliases: [], redirects: [] }), {
    fail: true,
    includes: 'home catalogue differs',
  })

  const extraDir = join(root, 'extra')
  writeSite(extraDir, { slugs, shells, aliases: [], homeCounts: [2, 2], htmlExtra: ['/gamma'], sitemapExtra: ['/gamma'] })
  expectResult('extra built page and sitemap URL', checkPublishedCounts({ ...base, dist: extraDir, aliases: [], redirects: [] }), {
    fail: true,
    includes: 'built pages differ',
  })

  const targetDir = join(root, 'bad-target')
  const badTarget = { alias: 'walidator-alfa', target: 'brak', initialTab: 'sprawdz' }
  writeSite(targetDir, { slugs, shells, aliases: [badTarget], homeCounts: [2, 2] })
  expectResult('alias target is not published', checkPublishedCounts({ ...base, dist: targetDir, aliases: [badTarget], redirects: [] }), {
    fail: true,
    includes: 'unpublished target brak',
  })

  const shellAlias = { alias: 'regulamin', target: 'alfa', initialTab: 'sprawdz' }
  expectResult('alias collides with a shell page', checkPublishedCounts({ ...base, dist: passDir, aliases: [shellAlias], redirects: [] }), {
    fail: true,
    includes: 'collides with a shell page',
  })

  const slugClash = { alias: 'alfa', target: 'beta', initialTab: 'sprawdz' }
  const clashDir = join(root, 'slug-clash')
  writeSite(clashDir, { slugs, shells, aliases: [], homeCounts: [2, 2] })
  expectResult('alias collides with a published slug', checkPublishedCounts({ ...base, dist: clashDir, aliases: [slugClash], redirects: [] }), {
    fail: true,
    includes: 'collides with a published slug',
  })

  for (const source of ['/walidator-alfa', '/walidator-alfa/', '/walidator-alfa.html']) {
    expectResult(`alias collides with redirect source ${source}`, checkPublishedCounts({
      ...base,
      dist: aliasDir,
      aliases: [alias],
      redirects: [{ source, destination: '/alfa', statusCode: 301 }],
    }), { fail: true, includes: 'collides with a redirect source' })
  }

  const pendingClash = checkPublishedCounts({
    ...base,
    dist: aliasDir,
    aliases: [alias],
    redirects: [],
    pending: [{ source: '/walidator-alfa', destination: '/pozniej', statusCode: 301 }],
  })
  expectResult('alias collides with a pending redirect source', pendingClash, { fail: true, includes: 'collides with a redirect source' })

  const missingPage = join(root, 'missing-page')
  writeSite(missingPage, { slugs, shells, aliases: [], homeCounts: [2, 2], sitemapExtra: ['/walidator-alfa'] })
  expectResult('alias has no built page', checkPublishedCounts({ ...base, dist: missingPage, aliases: [alias], redirects: [] }), {
    fail: true,
    includes: 'has no built page',
  })

  const missingSitemap = join(root, 'missing-sitemap')
  writeSite(missingSitemap, { slugs, shells, aliases: [alias], homeCounts: [2, 2] })
  const sitemap = readFileSync(join(missingSitemap, 'sitemap.xml'), 'utf8').replace('  <url><loc>https://tools.example.test/walidator-alfa</loc></url>\n', '')
  writeFileSync(join(missingSitemap, 'sitemap.xml'), sitemap)
  expectResult('alias is missing from the sitemap', checkPublishedCounts({ ...base, dist: missingSitemap, aliases: [alias], redirects: [] }), {
    fail: true,
    includes: 'missing from the sitemap',
  })

  const duplicate = [
    { alias: 'walidator-alfa', target: 'alfa', initialTab: 'sprawdz' },
    { alias: 'walidator-alfa', target: 'beta', initialTab: 'sprawdz' },
  ]
  expectResult('duplicate alias', checkPublishedCounts({ ...base, dist: aliasDir, aliases: duplicate, redirects: [] }), {
    fail: true,
    includes: 'duplicate route alias',
  })

  const repo = join(root, 'repo')
  mkdirSync(join(repo, 'src/registry'), { recursive: true })
  writeFileSync(join(repo, 'src/registry/published-slugs.ts'), "export const publishedSlugList = [\n  'alfa',\n  'beta',\n] as const\n\nexport const shellPaths = ['/', '/regulamin'] as const\n")
  const withoutAliases = readRouteAliases(repo)
  const listed = readPublishList(repo)
  if (withoutAliases.length !== 0 || listed.publishedSlugs.join() !== 'alfa,beta' || listed.shellPaths.join() !== '/,/regulamin') {
    console.error('FAIL: self-test missing route-aliases module should be empty')
    process.exit(1)
  }
  console.log('ok: missing route-aliases module is empty')

  const aliasModule = `export interface RouteAlias { alias: string; target: string; initialTab: string }
export const ROUTE_ALIASES: readonly RouteAlias[] = [
  {
    alias: 'walidator-pesel',
    target: 'generator-pesel',
    initialTab: 'sprawdz',
  },
  { alias: 'walidator-nip', target: 'generator-nip', initialTab: 'sprawdz' },
  { alias: 'walidator-regon', target: 'generator-regon', initialTab: 'sprawdz' },
  { alias: 'generator-iban', target: 'walidator-iban', initialTab: 'generuj' },
] as const
`
  writeFileSync(routeAliasFile(repo), aliasModule)
  const parsed = readRouteAliases(repo)
  const names = parsed.map((item) => `${item.alias}->${item.target}:${item.initialTab}`).join(',')
  const want = 'walidator-pesel->generator-pesel:sprawdz,walidator-nip->generator-nip:sprawdz,walidator-regon->generator-regon:sprawdz,generator-iban->walidator-iban:generuj'
  if (names !== want) {
    console.error(`FAIL: self-test route alias module parsed as ${names}`)
    process.exit(1)
  }
  console.log('ok: route alias module is read when it exists')

  writeFileSync(routeAliasFile(repo), 'export const ROUTE_ALIASES = [] as const\n')
  if (readRouteAliases(repo).length !== 0) {
    console.error('FAIL: self-test empty ROUTE_ALIASES should be empty')
    process.exit(1)
  }
  console.log('ok: empty ROUTE_ALIASES is empty')

  writeFileSync(routeAliasFile(repo), 'export const SOMETHING_ELSE = []\n')
  let threw = false
  try {
    readRouteAliases(repo)
  } catch {
    threw = true
  }
  if (!threw) {
    console.error('FAIL: self-test a module without ROUTE_ALIASES should fail')
    process.exit(1)
  }
  console.log('ok: module without ROUTE_ALIASES was rejected')
  console.log('PASS: published count self-test')
}

function main() {
  const root = process.cwd()
  const dist = resolve(process.argv[2] ?? 'dist')
  const { publishedSlugs, shellPaths } = readPublishList(root)
  const aliases = readRouteAliases(root)
  const aliasSource = existsSync(routeAliasFile(root)) ? 'src/registry/route-aliases.ts' : 'none'
  const redirects = readRedirects(resolve(root, 'vercel.json'))
  const pending = readRedirects(resolve(root, 'redirects.pending.json'))
  if (!redirects) {
    console.error('FAIL: vercel.json is missing')
    process.exit(1)
  }
  if (!pending) {
    console.error('FAIL: redirects.pending.json is missing')
    process.exit(1)
  }
  const result = checkPublishedCounts({ dist, publishedSlugs, shellPaths, aliases, redirects, pending })
  const summary = formatSummary(result.summary, aliasSource)
  if (result.errors.length > 0) {
    console.error(result.errors.join('\n'))
    console.error(`FAIL: published counts (${summary})`)
    process.exit(1)
  }
  console.log(`PASS: published counts (${summary})`)
}

if (process.argv.includes('--self-test')) selfTest()
else main()
