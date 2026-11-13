import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { generatorDisclaimer } from '../../brand'
import * as api from './index'

const BANNED = ['Math.random', 'localStorage', 'sessionStorage', 'indexedDB', 'sendBeacon', 'fetch(']

describe('generator policy', () => {
  it('exports the identifier functions', () => {
    expect(typeof api.generatePesel).toBe('function')
    expect(typeof api.validatePesel).toBe('function')
    expect(typeof api.generateNip).toBe('function')
    expect(typeof api.generateRegon).toBe('function')
    expect(typeof api.generateIdCardNumber).toBe('function')
    expect(typeof api.generatePassport).toBe('function')
    expect(typeof api.generateKrs).toBe('function')
    expect(typeof api.validateIbanPl).toBe('function')
    expect(api.DISCLAIMER).toBe(generatorDisclaimer)
  })

  it('keeps identifiers in the browser and away from a non-crypto PRNG', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const roots = [here, join(here, '../../tools/generators')]
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
    if (entry.endsWith('.test.ts') || entry.endsWith('.spec.ts')) {
      continue
    }
    if (!entry.endsWith('.ts') && !entry.endsWith('.vue')) {
      continue
    }
    found.push({ path, contents: readFileSync(path, 'utf8') })
  }
  return found
}
