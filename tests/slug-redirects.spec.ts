import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { tools } from '../src/registry'

interface SlugRedirect {
  source: string
  destination: string
  statusCode: number
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8')) as { redirects?: unknown }

const sourcePattern = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)(\/|\.html)?$/
const destinationPattern = /^\/([a-z0-9]+(?:-[a-z0-9]+)*)$/
const variants = ['', '/', '.html'] as const

// Old -> new slugs. The #14 registry diff (8bcee21^1..8bcee21) supplied every row
// except the two ID documents, and removed generator-nrb by merging it into
// walidator-iban. Commit 570deb8 (#15) renamed the ID document tools.
const renamed: ReadonlyArray<readonly [string, string]> = [
  ['generator-dowod-osobisty', 'numer-dowodu-osobistego'],
  ['generator-paszport', 'numer-paszportu'],
  ['generator-nrb', 'walidator-iban'],
  ['generator-osoby-testowej', 'generator-danych-testowych'],
  ['generator-skrotow', 'generator-sha256'],
  ['znacznik-czasu', 'unix-timestamp'],
  ['kodowanie-hex', 'hex-na-tekst'],
  ['ucieczki-unicode', 'escape-unicode'],
  ['parser-adresu', 'parser-url'],
  ['koder-jwt', 'generator-jwt'],
  ['kompresja', 'kompresja-gzip'],
  ['wielkosc-liter', 'zmiana-wielkosci-liter'],
  ['licznik-tekstu', 'licznik-znakow'],
  ['slugify', 'generator-slug'],
  ['linie-tekstu', 'sortowanie-alfabetyczne'],
  ['jednostki-danych', 'kalkulator-bajtow'],
  ['chmod', 'kalkulator-chmod'],
  ['strefy-czasowe', 'konwerter-stref-czasowych'],
  ['dni-robocze', 'kalkulator-dni-roboczych'],
  ['wyjasniacz-cron', 'wyrazenie-cron'],
  ['kalkulator-cidr', 'kalkulator-podsieci'],
  ['podglad-markdown', 'edytor-markdown'],
  ['systemy-liczbowe', 'zamiana-systemow-liczbowych'],
  ['konwerter-kolorow', 'hex-na-rgb'],
]

function isRedirect(value: unknown): value is SlugRedirect {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  return (
    keys.length === 3 &&
    keys.every((key) => key === 'source' || key === 'destination' || key === 'statusCode') &&
    typeof record.source === 'string' &&
    typeof record.destination === 'string' &&
    typeof record.statusCode === 'number'
  )
}

function readRedirects(value: unknown): SlugRedirect[] {
  if (!Array.isArray(value)) {
    throw new Error('vercel.json redirects must be an array')
  }
  return value.map((item) => {
    if (!isRedirect(item)) {
      throw new Error('redirect must have only source, destination, and statusCode')
    }
    return item
  })
}

describe('slug redirects', () => {
  it('sends every renamed slug to its new registry path with status 301', () => {
    expect(renamed).toHaveLength(24)
    const redirects = readRedirects(vercel.redirects)
    const registry = new Set(tools.map((tool) => tool.slug))
    const sources = redirects.map((redirect) => redirect.source)
    expect(new Set(sources).size).toBe(sources.length)

    const bySlug = new Map<string, Map<string, string>>()
    for (const redirect of redirects) {
      expect(redirect.statusCode).toBe(301)
      expect(redirect).not.toHaveProperty('permanent')

      const source = sourcePattern.exec(redirect.source)
      const destination = destinationPattern.exec(redirect.destination)
      expect(source, redirect.source).not.toBeNull()
      expect(destination, redirect.destination).not.toBeNull()
      if (!source?.[1] || !destination?.[1]) {
        throw new Error(`unreadable redirect ${redirect.source} -> ${redirect.destination}`)
      }

      const from = source[1]
      const variant = source[2] ?? ''
      const to = destination[1]
      expect(registry.has(to), to).toBe(true)
      expect(registry.has(from), from).toBe(false)

      const variantsForSlug = bySlug.get(from) ?? new Map<string, string>()
      expect(variantsForSlug.has(variant), `${from} ${variant}`).toBe(false)
      variantsForSlug.set(variant, redirect.destination)
      bySlug.set(from, variantsForSlug)
    }

    expect(bySlug.size).toBe(renamed.length)
    const expected = new Map(renamed)
    for (const [from, to] of renamed) {
      const found = bySlug.get(from)
      expect(found, from).toBeDefined()
      if (!found) continue
      expect([...found.keys()].sort()).toEqual([...variants].sort())
      for (const variant of variants) {
        expect(found.get(variant)).toBe(`/${to}`)
      }
    }

    for (const from of bySlug.keys()) {
      expect(expected.has(from), from).toBe(true)
    }
  })
})
