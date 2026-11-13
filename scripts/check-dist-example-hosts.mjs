/* global console, process, URL */
// Fails when dist contains an .example host or an http(s) URL whose host is
// example.com, example.org, example.net, or a subdomain of those.
// A match that sits only inside a placeholder="..." or placeholder='...'
// attribute is allowed. The same text anywhere else fails.
//
// Usage:
//   node scripts/check-dist-example-hosts.mjs [dist]
//   node scripts/check-dist-example-hosts.mjs --self-test
import { existsSync, mkdtempSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative, sep } from 'node:path'
import { walk } from './lib/dist-guard.mjs'

const RESERVED_ROOTS = ['example.com', 'example.org', 'example.net']
const BINARY_EXT = new Set(['.woff', '.woff2', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.pdf', '.zip', '.gz', '.br'])

function extensionOf(name) {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot).toLowerCase()
}

function readText(file) {
  const buffer = readFileSync(file)
  if (buffer.includes(0)) return null
  return buffer.toString('utf8')
}

function placeholderRanges(text) {
  const ranges = []
  const pattern = /\bplaceholder\s*=\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/gi
  for (const match of text.matchAll(pattern)) {
    const quoted = match[1] ?? ''
    const start = match.index + match[0].length - quoted.length
    ranges.push([start + 1, start + quoted.length - 1])
  }
  return ranges
}

function inside(ranges, start, end) {
  return ranges.some(([from, to]) => start >= from && end <= to)
}

function lineOf(text, index) {
  let line = 1
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (text.charCodeAt(cursor) === 10) line += 1
  }
  return line
}

function isReservedHost(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '')
  return RESERVED_ROOTS.some((root) => host === root || host.endsWith(`.${root}`))
}

function overlaps(hit, start) {
  return start >= hit.index && start < hit.end
}

export function findExampleHosts(dir) {
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    return { error: `FAIL: not a directory: ${dir}`, hits: [] }
  }
  const hits = []
  const files = walk(dir, (name, path) => {
    if (BINARY_EXT.has(extensionOf(name))) return false
    return statSync(path).isFile()
  })
  for (const file of files) {
    const text = readText(file)
    if (text == null) continue
    const ranges = placeholderRanges(text)
    const display = relative(dir, file).split(sep).join('/')
    const urlHits = []
    for (const match of text.matchAll(/\bhttps?:\/\/[^\s"'<>\\)]+/gi)) {
      const start = match.index ?? 0
      const raw = match[0]
      if (inside(ranges, start, start + raw.length)) continue
      const trimmed = raw.replace(/[.,;:]+$/, '')
      let hostname
      try {
        hostname = new URL(trimmed).hostname
      } catch {
        continue
      }
      if (!isReservedHost(hostname)) continue
      urlHits.push({ index: start, end: start + raw.length, text: trimmed })
    }
    for (const hit of urlHits) {
      hits.push({ file: display, line: lineOf(text, hit.index), text: hit.text })
    }
    for (const match of text.matchAll(/[a-z0-9-]+\.example\b/g)) {
      const start = match.index ?? 0
      if (inside(ranges, start, start + match[0].length)) continue
      if (urlHits.some((hit) => overlaps(hit, start))) continue
      hits.push({ file: display, line: lineOf(text, start), text: match[0] })
    }
  }
  hits.sort((left, right) => left.file.localeCompare(right.file) || left.line - right.line || left.text.localeCompare(right.text))
  return { error: '', hits }
}

function printResult(dir, result) {
  if (result.error) {
    console.error(result.error)
    return false
  }
  if (result.hits.length > 0) {
    for (const hit of result.hits) console.error(`${dir}/${hit.file}:${hit.line}:${hit.text}`)
    console.error(`FAIL: ${result.hits.length} example host hit(s) in ${dir}`)
    return false
  }
  console.log(`PASS: no .example or example.com/org/net hosts in ${dir}`)
  return true
}

function writeTree(root, files) {
  for (const [name, contents] of Object.entries(files)) {
    const path = join(root, name)
    mkdirSync(join(path, '..'), { recursive: true })
    writeFileSync(path, contents)
  }
}

function selfTest() {
  const root = mkdtempSync(join(tmpdir(), 'example-hosts-'))
  const failures = [
    ['planted .example host', { 'page.html': 'https://planted.example/qr\n' }, 'planted.example'],
    ['example.com URL', { 'page.html': 'https://example.com/not-a-dot-example-tld\n' }, 'https://example.com/not-a-dot-example-tld'],
    ['example.org URL', { 'page.html': 'See http://example.org/path for more.\n' }, 'http://example.org/path'],
    ['example.net subdomain in JS', { 'assets/app.js': 'const host = "https://cdn.example.net/a";\n' }, 'https://cdn.example.net/a'],
    ['userinfo and port', { 'page.html': '<a href="https://user:pass@www.example.com:8443/a">x</a>\n' }, 'https://user:pass@www.example.com:8443/a'],
    ['uppercase host', { 'assets/app.js': 'load("HTTPS://Example.COM/x")\n' }, 'HTTPS://Example.COM/x'],
    ['nested subdomain', { 'page.html': 'https://a.b.example.org/x\n' }, 'https://a.b.example.org/x'],
    [
      'placeholder plus a real link',
      { 'page.html': '<input placeholder="https://example.com/ok"><a href="https://www.example.com/x">x</a>\n' },
      'https://www.example.com/x',
    ],
    [
      'JS string that is not a placeholder attribute',
      { 'page.html': '<input placeholder="https://example.com/szukaj?q=ala">\n', 'assets/app.js': 'const sample = "https://example.com/szukaj?q=ala";\n' },
      'https://example.com/szukaj?q=ala',
    ],
  ]
  for (const [name, files, needle] of failures) {
    const dir = join(root, name.replace(/\s+/g, '-'))
    mkdirSync(dir, { recursive: true })
    writeTree(dir, files)
    const result = findExampleHosts(dir)
    const found = result.hits.map((hit) => `${hit.file}:${hit.text}`)
    if (result.error || !found.some((hit) => hit.includes(needle))) {
      console.error(`FAIL: self-test ${name} should report ${needle}`)
      console.error(found.join('\n') || result.error)
      process.exit(1)
    }
    if (name === 'placeholder plus a real link' && found.some((hit) => hit.includes('https://example.com/ok'))) {
      console.error('FAIL: self-test placeholder URL should be allowed')
      console.error(found.join('\n'))
      process.exit(1)
    }
    if (name === 'JS string that is not a placeholder attribute' && found.some((hit) => hit.startsWith('page.html:'))) {
      console.error('FAIL: self-test HTML placeholder should be allowed when JS repeats it')
      console.error(found.join('\n'))
      process.exit(1)
    }
    console.log(`ok: ${name} was rejected`)
  }

  const clean = join(root, 'clean')
  mkdirSync(clean, { recursive: true })
  writeTree(clean, {
    'page.html': 'Przykładowy tekst do kodu QR\nhttps://curlyspare.vercel.app/generator-qr\npage.examples\n',
    'placeholder.html': '<input placeholder="https://example.com/szukaj?q=ala"><input placeholder=\'http://sub.example.org/a\'>\n',
    'placeholder-tld.html': '<input placeholder="https://planted.example/qr">\n',
    'neighbours.html': [
      'https://notexample.com/a',
      'https://example.com.evil.test/a',
      'https://example.community/a',
      'https://example.org.not/a',
      'mailto:dev@example.com',
      'bare example.com',
      '',
    ].join('\n'),
    'notes.txt': 'page.examples\n',
    'assets/app.css': 'body{color:red;background:url(https://notexample.com/bg.png)}\n',
  })
  const cleanResult = findExampleHosts(clean)
  if (cleanResult.error || cleanResult.hits.length > 0) {
    console.error('FAIL: self-test clean directory was rejected')
    for (const hit of cleanResult.hits) console.error(`${hit.file}:${hit.line}:${hit.text}`)
    console.error(cleanResult.error)
    process.exit(1)
  }
  console.log('ok: clean directory was accepted')

  const cssDir = join(root, 'css-url')
  mkdirSync(cssDir, { recursive: true })
  writeTree(cssDir, { 'assets/app.css': 'body{background:url(https://example.com/bg.png)}\n' })
  const cssResult = findExampleHosts(cssDir)
  if (!cssResult.hits.some((hit) => hit.text.includes('https://example.com/bg.png'))) {
    console.error('FAIL: self-test CSS example.com URL should fail')
    process.exit(1)
  }
  console.log('ok: CSS example.com URL was rejected')

  const missing = findExampleHosts(join(root, 'missing'))
  if (!missing.error) {
    console.error('FAIL: self-test missing directory should fail')
    process.exit(1)
  }
  console.log('ok: missing directory was rejected')
  console.log('PASS: example host self-test')
}

const self = process.argv.includes('--self-test')
if (self) {
  selfTest()
} else {
  const dir = process.argv[2] ?? 'dist'
  const result = findExampleHosts(dir)
  if (!printResult(dir, result)) process.exit(1)
}
