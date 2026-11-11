import { describe, expect, it } from 'vitest'
import { generatorDisclaimer } from '../../brand'
import { generatorTools } from './index'

describe('generator registry', () => {
  it('registers each identifier tool with the shared disclaimer', () => {
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
      'konwerter-isbn',
      'walidator-iban',
    ])
    for (const tool of generatorTools) {
      expect(tool.category).toBe('generatory')
      expect(tool.disclaimer).toBe(generatorDisclaimer)
      expect(tool.title.trim().length).toBeGreaterThan(0)
      expect(tool.description.trim().length).toBeGreaterThan(0)
      expect(tool.keywords.length).toBeGreaterThan(0)
    }
  })
})
