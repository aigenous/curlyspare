import { describe, expect, it } from 'vitest'
import {
  generatorDisclaimer,
  gtinDisclaimer,
  ibanValidatorDisclaimer,
  isbnValidatorDisclaimer,
  personTestDisclaimer,
  vatValidatorDisclaimer,
  vinValidatorDisclaimer,
} from '../src/brand'
import { assertRegistry, findTool, tools } from '../src/registry'
import type { ToolDefinition } from '../src/registry/types'

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reserved = new Set(['regulamin', 'polityka-prywatnosci', 'operator', '404'])

describe('tool registry', () => {
  it('accepts the current registry', () => {
    expect(() => assertRegistry()).not.toThrow()
  })

  it('rejects an invalid slug and a duplicate slug', () => {
    const bad: ToolDefinition = {
      slug: 'Zly_Slug',
      title: 'Zły',
      description: 'Niepoprawny slug.',
      category: 'inne',
      keywords: [],
      component: () => Promise.resolve({}),
    }
    tools.push(bad)
    try {
      expect(() => assertRegistry()).toThrow('Invalid tool slug: Zly_Slug')
    } finally {
      tools.pop()
    }

    const first = tools[0]
    expect(first).toBeDefined()
    if (!first) return
    tools.push({ ...first })
    try {
      expect(() => assertRegistry()).toThrow(`Duplicate tool slug: ${first.slug}`)
    } finally {
      tools.pop()
    }
    expect(() => assertRegistry()).not.toThrow()
  })

  it('keeps slugs unique and lowercase kebab without Polish diacritics', () => {
    const slugs = tools.map((tool) => tool.slug)
    expect(new Set(slugs).size).toBe(slugs.length)

    for (const tool of tools) {
      expect(tool.slug, tool.title).toMatch(kebab)
      expect(tool.slug, tool.title).not.toMatch(/[ąćęłńóśźż]/)
      expect(reserved.has(tool.slug), tool.slug).toBe(false)
      expect(tool.title.trim().length, tool.slug).toBeGreaterThan(0)
      expect(tool.description.trim().length, tool.slug).toBeGreaterThan(0)
      expect(findTool(tool.slug)).toBe(tool)
    }
  })

  it('gives identifier generators the shared disclaimer and checkers their own', () => {
    expect(generatorDisclaimer.trim().length).toBeGreaterThan(40)
    const shared = new Set([
      'generator-pesel',
      'generator-nip',
      'generator-regon',
      'generator-dowod-osobisty',
      'generator-paszport',
      'generator-krs',
      'generator-nrb',
    ])
    const own: Record<string, string> = {
      'generator-ean': gtinDisclaimer,
      'walidator-vat-ue': vatValidatorDisclaimer,
      'walidator-vin': vinValidatorDisclaimer,
      'konwerter-isbn': isbnValidatorDisclaimer,
      'generator-osoby-testowej': personTestDisclaimer,
      'walidator-iban': ibanValidatorDisclaimer,
    }
    const identifier = /pesel|nip|regon|krs|iban|dowod|paszport|ean|isbn|vin|vat-ue|osoby-testowej/
    const generators = tools.filter(
      (tool) => tool.category === 'generatory' || identifier.test(tool.slug),
    )
    expect(generators.length).toBe(shared.size + Object.keys(own).length)
    for (const tool of generators) {
      if (shared.has(tool.slug)) {
        expect(tool.disclaimer, tool.slug).toBe(generatorDisclaimer)
        continue
      }
      expect(tool.disclaimer, tool.slug).toBe(own[tool.slug])
      expect(tool.disclaimer, tool.slug).not.toBe(generatorDisclaimer)
    }
  })
})
