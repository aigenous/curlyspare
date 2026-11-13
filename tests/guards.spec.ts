import { readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const sourceExtensions = new Set(['.ts', '.tsx', '.vue', '.js', '.mjs', '.cjs'])

function walk(directory: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(directory)
  } catch {
    return []
  }
  const files: string[] = []
  for (const entry of entries) {
    if (entry === 'node_modules' || entry === 'dist') continue
    const path = join(directory, entry)
    if (statSync(path).isDirectory()) {
      files.push(...walk(path))
      continue
    }
    if (sourceExtensions.has(extname(path)) && !/\.(spec|test)\.[cm]?[jt]sx?$/.test(path)) {
      files.push(path)
    }
  }
  return files
}

function stripLiterals(line: string): string {
  return line
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
}

function hits(files: string[], pattern: RegExp): string[] {
  const found: string[] = []
  for (const file of files) {
    const lines = readFileSync(file, 'utf8').split(/\r?\n/)
    lines.forEach((line, index) => {
      if (pattern.test(line)) found.push(`${relative(root, file)}:${index + 1}`)
    })
  }
  return found
}

describe('static source guards', () => {
  it('does not call Math.random anywhere under src', () => {
    const files = walk(join(root, 'src'))
    expect(files.length).toBeGreaterThan(0)
    expect(hits(files, /Math\s*(?:\.\s*random\b|\[\s*['"]random['"]\s*\])/)).toEqual([])
  })

  it('does not make network calls from tool code', () => {
    const files = [...walk(join(root, 'src/tools')), ...walk(join(root, 'src/lib'))]
    expect(files.length).toBeGreaterThan(0)
    // curl-to-fetch prints fetch() and axios snippets. Literals are not calls.
    const imports =
      /\bfrom\s+['"](?:axios|node:(?:https?|net|http2|tls))['"]|\brequire\s*\(\s*['"]axios['"]|import\s*\(\s*['"]https?:/
    const calls =
      /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\s*\(|\bEventSource\b|\baxios\s*\(|\baxios\s*\.\s*[A-Za-z_$]/
    const found: string[] = []
    for (const file of files) {
      const lines = readFileSync(file, 'utf8').split(/\r?\n/)
      lines.forEach((line, index) => {
        if (imports.test(line) || calls.test(stripLiterals(line))) {
          found.push(`${relative(root, file)}:${index + 1}`)
        }
      })
    }
    expect(found).toEqual([])
  })
})
