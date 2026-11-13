/* global console, process */
// Offline redirect check. Every vercel.json destination must be a built public
// page (fragment and query stripped), every redirect uses statusCode 301, and
// no source occupies a built page. redirects.pending.json holds redirects whose
// destination is not public yet: nothing in vercel.json may point there, and
// nothing pending may point at a page that is already public.
//
// Usage:
//   node scripts/check-dist-redirects.mjs [dist]
//   node scripts/check-dist-redirects.mjs --self-test
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import {
  expectedSitemapPaths,
  listBuiltPages,
  normalizeDestination,
  normalizeSource,
  readPublishList,
  readRedirects,
  readRouteAliases,
} from './lib/dist-guard.mjs'

function checkEntry(redirect, label, errors) {
  const source = typeof redirect.source === 'string' ? redirect.source : ''
  const destination = typeof redirect.destination === 'string' ? redirect.destination : ''
  if (!source.startsWith('/') || source.startsWith('//')) errors.push(`${label} source must be an absolute path`)
  if (!destination.startsWith('/') || destination.startsWith('//')) errors.push(`${label} destination must be an absolute path`)
  if (redirect.statusCode !== 301) errors.push(`${label} ${source || '(blank)'} must use statusCode 301`)
  return { source, destination }
}

export function checkRedirects({ dist, redirects, pending, publicPaths }) {
  const errors = []
  const built = listBuiltPages(dist)
  const publicSet = publicPaths instanceof Set ? publicPaths : new Set(publicPaths)

  function visit(list, bucket) {
    for (const redirect of list ?? []) {
      const { source, destination } = checkEntry(redirect, bucket, errors)
      if (!source || !destination) continue
      const sourcePath = normalizeSource(source)
      if (built.has(sourcePath)) errors.push(`${bucket} source ${source} collides with built page ${sourcePath}`)
      const destinationPath = normalizeDestination(destination)
      const published = publicSet.has(destinationPath)
      const exists = built.has(destinationPath)
      if (bucket === 'vercel.json') {
        if (!published) errors.push(`vercel.json ${source} points at unpublished page ${destinationPath}`)
        if (!exists) errors.push(`vercel.json ${source} destination ${destinationPath} is not a built page`)
      } else if (published) {
        errors.push(`pending redirect ${source} points at published page ${destinationPath}; promote it into vercel.json`)
      }
    }
  }

  visit(redirects, 'vercel.json')
  visit(pending, 'redirects.pending.json')
  return errors
}

function expectResult(name, errors, { fail, includes }) {
  const failed = errors.length > 0
  if (fail !== failed || (includes && !errors.some((error) => error.includes(includes)))) {
    console.error(`FAIL: self-test ${name}`)
    console.error(errors.join('\n') || '(no errors)')
    process.exit(1)
  }
  console.log(`ok: ${name}`)
}

function writePages(dist, paths) {
  mkdirSync(dist, { recursive: true })
  for (const path of paths) {
    const name = path === '/' ? 'index.html' : `${path.slice(1)}.html`
    writeFileSync(join(dist, name), `<main id="tresc">${path}</main>`)
  }
}

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'redirects-'))
  const dist = join(root, 'dist')
  writePages(dist, ['/', '/alfa', '/404'])
  const publicPaths = new Set(['/', '/alfa', '/walidator-alfa'])
  const live = [
    { source: '/stary', destination: '/alfa', statusCode: 301 },
    { source: '/stary/', destination: '/alfa', statusCode: 301 },
    { source: '/stary.html', destination: '/alfa.html', statusCode: 301 },
    { source: '/fragment', destination: '/alfa?x=1#wynik', statusCode: 301 },
  ]
  const pending = [{ source: '/wkrotce', destination: '/przyszle-narzedzie', statusCode: 301 }]
  expectResult('built 301 destinations and an unpublished pending redirect', checkRedirects({ dist, redirects: live, pending, publicPaths }), { fail: false })

  expectResult('destination is not built', checkRedirects({
    dist,
    redirects: [{ source: '/stary', destination: '/brak', statusCode: 301 }],
    pending: [],
    publicPaths: new Set([...publicPaths, '/brak']),
  }), { fail: true, includes: 'not a built page' })

  expectResult('vercel.json points at an unpublished page', checkRedirects({
    dist,
    redirects: [{ source: '/stary', destination: '/szkic', statusCode: 301 }],
    pending: [],
    publicPaths,
  }), { fail: true, includes: 'unpublished page /szkic' })

  expectResult('statusCode is not 301', checkRedirects({
    dist,
    redirects: [{ source: '/stary', destination: '/alfa', statusCode: 302 }],
    pending: [],
    publicPaths,
  }), { fail: true, includes: 'must use statusCode 301' })

  expectResult('statusCode is missing', checkRedirects({
    dist,
    redirects: [{ source: '/stary', destination: '/alfa', permanent: true }],
    pending: [],
    publicPaths,
  }), { fail: true, includes: 'must use statusCode 301' })

  expectResult('source collides with a built page', checkRedirects({
    dist,
    redirects: [{ source: '/alfa', destination: '/', statusCode: 301 }],
    pending: [],
    publicPaths,
  }), { fail: true, includes: 'collides with built page /alfa' })

  expectResult('trailing-slash source collides with a built page', checkRedirects({
    dist,
    redirects: [{ source: '/alfa/', destination: '/', statusCode: 301 }],
    pending: [],
    publicPaths,
  }), { fail: true, includes: 'collides with built page /alfa' })

  expectResult('.html source does not collide with the clean URL', checkRedirects({
    dist,
    redirects: [{ source: '/alfa.html', destination: '/alfa', statusCode: 301 }],
    pending: [],
    publicPaths,
  }), { fail: false })

  expectResult('pending redirect must be promoted', checkRedirects({
    dist,
    redirects: [],
    pending: [{ source: '/stary-alias', destination: '/walidator-alfa', statusCode: 301 }],
    publicPaths,
  }), { fail: true, includes: 'promote it into vercel.json' })

  const aliasDist = join(root, 'alias-dist')
  writePages(aliasDist, ['/', '/alfa', '/walidator-alfa', '/404'])
  expectResult('vercel.json may point at a published alias page', checkRedirects({
    dist: aliasDist,
    redirects: [{ source: '/stary-alias', destination: '/walidator-alfa#start', statusCode: 301 }],
    pending: [],
    publicPaths,
  }), { fail: false })

  expectResult('empty pending list', checkRedirects({ dist, redirects: live, pending: [], publicPaths }), { fail: false })
  console.log('PASS: redirect self-test')
}

function main() {
  const root = process.cwd()
  const dist = resolve(process.argv[2] ?? 'dist')
  const { publishedSlugs, shellPaths } = readPublishList(root)
  const aliases = readRouteAliases(root)
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
  const publicPaths = expectedSitemapPaths(shellPaths, publishedSlugs, aliases)
  const errors = checkRedirects({ dist, redirects, pending, publicPaths })
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`FAIL: ${errors.length} redirect problem(s)`)
    process.exit(1)
  }
  console.log(`PASS: ${redirects.length} redirects point at built public pages; ${pending.length} pending`)
}

if (process.argv.includes('--self-test')) selfTest()
else main()
