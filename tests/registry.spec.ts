import { describe, expect, it } from 'vitest'
import {
  generatorDisclaimer,
  gtinDisclaimer,
  ibanValidatorDisclaimer,
  idDocumentDisclaimer,
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
      'generator-krs',
      'generator-nrb',
    ])
    const own: Record<string, string> = {
      'numer-dowodu-osobistego': idDocumentDisclaimer,
      'numer-paszportu': idDocumentDisclaimer,
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

  it('gives the ID card and passport the dedicated disclaimer and no generator phrasing', () => {
    const dedicated =
      'Numer testowy o poprawnym formacie i sumie kontrolnej – nie jest to dokument ani jego wzór. Serwis nie tworzy obrazów, skanów ani danych dokumentów tożsamości. Numer może przypadkowo należeć do istniejącego dokumentu. Używanie go do podszywania się pod inną osobę, w formularzach urzędowych, bankowych lub przy weryfikacji tożsamości jest zabronione i może stanowić przestępstwo (m.in. art. 190a § 2, 270, 275, 286 i 297 Kodeksu karnego).'
    expect(dedicated).toHaveLength(438)
    expect(idDocumentDisclaimer).toBe(dedicated)
    for (const slug of ['numer-dowodu-osobistego', 'numer-paszportu']) {
      const tool = findTool(slug)
      expect(tool, slug).toBeDefined()
      if (!tool) return
      expect(tool.disclaimer).toBe(dedicated)
      for (const field of [tool.title, tool.description, ...tool.keywords]) {
        expect(field.toLowerCase(), `${slug} ${field}`).not.toContain('generator dowodu')
        expect(field.toLowerCase(), `${slug} ${field}`).not.toContain('generator paszportu')
      }
    }
  })
})
