/* global console, process, URL */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'

const hrefPattern = /<a\b[^>]*?\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path, out)
    else if (name.endsWith('.html')) out.push(path)
  }
  return out
}

function pageUrl(dist, file) {
  let rel = relative(dist, file).split(sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) rel = rel.slice(0, -'/index.html'.length)
  else if (rel.endsWith('.html')) rel = rel.slice(0, -'.html'.length)
  const url = `/${rel}`.replace(/\/+$/, '')
  return url === '' ? '/' : url
}

function ignore(href) {
  const value = href.trim()
  return (
    value === '' ||
    value.startsWith('#') ||
    value.startsWith('mailto:') ||
    value.startsWith('tel:') ||
    value.startsWith('//') ||
    /^[a-z][a-z0-9+.-]*:/i.test(value)
  )
}

function normalize(page, href) {
  const bare = href.split('#')[0]?.split('?')[0] ?? ''
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

function redirectSources(vercelFile) {
  if (!existsSync(vercelFile)) return new Set()
  const parsed = JSON.parse(readFileSync(vercelFile, 'utf8'))
  const sources = new Set()
  for (const redirect of parsed.redirects ?? []) {
    if (typeof redirect.source !== 'string' || /[()*]/.test(redirect.source)) continue
    const path = redirect.source.length > 1 ? redirect.source.replace(/\/+$/, '') : redirect.source
    sources.add(path)
  }
  return sources
}

function resolves(dist, pathname, redirects) {
  if (redirects.has(pathname)) return true
  if (pathname === '/') return existsSync(join(dist, 'index.html'))
  const rel = pathname.replace(/^\//, '')
  return (
    existsSync(join(dist, `${rel}.html`)) ||
    existsSync(join(dist, rel, 'index.html')) ||
    existsSync(join(dist, rel))
  )
}

export function checkInternalLinks(dist, vercelFile) {
  const redirects = redirectSources(vercelFile)
  const errors = []
  for (const file of walk(dist)) {
    const page = pageUrl(dist, file)
    const html = readFileSync(file, 'utf8')
    for (const match of html.matchAll(hrefPattern)) {
      const href = match[1] ?? match[2] ?? ''
      if (ignore(href)) continue
      const pathname = normalize(page, href)
      if (pathname == null || resolves(dist, pathname, redirects)) continue
      errors.push(`${page} -> ${href}`)
    }
  }
  return errors
}

function vercelBeside(dist) {
  return join(dirname(dist), 'vercel.json')
}

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'links-'))
  const dist = join(root, 'dist')
  mkdirSync(dist)
  writeFileSync(join(dist, 'index.html'), '<a href="/ok">ok</a><a href="/old">old</a><a href="https://example.com">ext</a><a href="#top">hash</a><a href="mailto:a@b.c">mail</a><a href="/notes.txt">file</a>')
  writeFileSync(join(dist, 'ok.html'), '<a href="/">home</a>')
  writeFileSync(join(dist, 'notes.txt'), 'notes')
  writeFileSync(join(root, 'vercel.json'), JSON.stringify({ redirects: [{ source: '/old', destination: '/ok' }] }))
  const clean = checkInternalLinks(dist, vercelBeside(dist))
  if (clean.length > 0) {
    console.error(clean.join('\n'))
    console.error('FAIL: clean fixture should pass')
    process.exit(1)
  }
  writeFileSync(join(dist, 'ok.html'), '<a href="/missing-page">broken</a>', { flag: 'a' })
  const broken = checkInternalLinks(dist, vercelBeside(dist))
  if (broken.length === 0) {
    console.error('FAIL: planted broken link should fail')
    process.exit(1)
  }
  console.log('PASS: internal link self-test')
}

const self = process.argv.includes('--self-test')
if (self) {
  selfTest()
} else {
  const dist = process.argv[2] ?? 'dist'
  const vercelFile = existsSync(vercelBeside(dist)) ? vercelBeside(dist) : join(process.cwd(), 'vercel.json')
  const errors = checkInternalLinks(dist, vercelFile)
  if (errors.length > 0) {
    console.error(errors.join('\n'))
    console.error(`FAIL: ${errors.length} internal link(s) do not resolve`)
    process.exit(1)
  }
  console.log('PASS: internal links resolve')
}
