import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { DISCLAIMER } from './disclaimer'
import * as api from './index'

const BANNED = ['Math.random', 'localStorage', 'sessionStorage', 'indexedDB', 'sendBeacon']

describe('generator policy', () => {
  it('exports the shared disclaimer unchanged', () => {
    expect(DISCLAIMER).toBe(
      'Wygenerowane numery są fikcyjne i służą wyłącznie do testów oprogramowania. Nie używaj ich do podszywania się pod inne osoby ani w dokumentach.',
    )
    expect(api.DISCLAIMER).toBe(DISCLAIMER)
    expect(typeof api.generatePesel).toBe('function')
    expect(typeof api.validateIbanPl).toBe('function')
    expect(typeof api.generateKrs).toBe('function')
  })

  it('keeps generated identifiers on the client and out of a non-crypto PRNG', () => {
    const roots = [new URL('.', import.meta.url).pathname, new URL('../../tools/generators/', import.meta.url).pathname]
    const sources = roots.flatMap((root) => (exists(root) ? collectSources(root) : []))
    expect(sources.length).toBeGreaterThan(0)
    for (const source of sources) {
      for (const token of BANNED) {
        expect(source.contents.includes(token), `${source.path} contains ${token}`).toBe(false)
      }
    }
  })
})

function exists(path: string): boolean {
  try {
    statSync(path)
    return true
  } catch {
    return false
  }
}

function collectSources(directory: string): { path: string; contents: string }[] {
  const found: { path: string; contents: string }[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      found.push(...collectSources(path))
      continue
    }
    if (entry.endsWith('.test.ts') || (!entry.endsWith('.ts') && !entry.endsWith('.vue'))) {
      continue
    }
    found.push({ path, contents: readFileSync(path, 'utf8') })
  }
  return found
}
