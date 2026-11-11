import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  generatorDisclaimer,
  gtinDisclaimer,
  ibanValidatorDisclaimer,
  isbnValidatorDisclaimer,
  personTestDisclaimer,
  vatValidatorDisclaimer,
  vinValidatorDisclaimer,
} from '../../brand'
import { generatorTools } from './index'

const sharedDisclaimer = new Set([
  'generator-pesel',
  'generator-nip',
  'generator-regon',
  'generator-dowod-osobisty',
  'generator-paszport',
  'generator-krs',
  'generator-nrb',
])

describe('generator registry', () => {
  it('registers each identifier tool with its disclaimer', () => {
    const slugs = generatorTools.map((tool) => tool.slug)
    expect(slugs).toEqual([
      'generator-pesel',
      'generator-nip',
      'generator-regon',
      'generator-dowod-osobisty',
      'generator-paszport',
      'generator-krs',
      'generator-nrb',
      'generator-ean',
      'walidator-vat-ue',
      'walidator-vin',
      'konwerter-isbn',
      'generator-osoby-testowej',
      'walidator-iban',
    ])
    const own: Record<string, string> = {
      'generator-ean': gtinDisclaimer,
      'walidator-vat-ue': vatValidatorDisclaimer,
      'walidator-vin': vinValidatorDisclaimer,
      'konwerter-isbn': isbnValidatorDisclaimer,
      'generator-osoby-testowej': personTestDisclaimer,
      'walidator-iban': ibanValidatorDisclaimer,
    }
    for (const tool of generatorTools) {
      expect(tool.category).toBe('generatory')
      expect(tool.title.trim().length).toBeGreaterThan(0)
      expect(tool.description.trim().length).toBeGreaterThan(0)
      expect(tool.keywords.length).toBeGreaterThan(0)
      if (sharedDisclaimer.has(tool.slug)) {
        expect(tool.disclaimer, tool.slug).toBe(generatorDisclaimer)
        continue
      }
      expect(tool.disclaimer, tool.slug).toBe(own[tool.slug])
      expect(tool.disclaimer, tool.slug).not.toBe(generatorDisclaimer)
    }
  })

  it('keeps the test-person page off fake-identity and registration wording', () => {
    const tool = generatorTools.find((item) => item.slug === 'generator-osoby-testowej')
    expect(tool).toBeDefined()
    if (!tool) return
    const here = dirname(fileURLToPath(import.meta.url))
    const screen = readFileSync(join(here, 'generator-osoby-testowej/GeneratorOsobyTestowej.vue'), 'utf8')
    const copy = [tool.title, tool.description, tool.disclaimer ?? '', ...tool.keywords, screen]
      .join('\n')
      .toLowerCase()
    for (const phrase of ['fake', 'fałszywy', 'falszywy', 'do rejestracji', 'for registration', 'do weryfikacji']) {
      expect(copy.includes(phrase), phrase).toBe(false)
    }
    expect(tool.disclaimer).toContain('rekord jej nie dotyczy')
    expect(tool.disclaimer).toContain('wyłącznie do testowania oprogramowania')
  })
})
