import { describe, expect, it } from 'vitest'
import { JWT_NOTICE } from './jwt'
import { SHA1_NOTICE } from './hash'
import { converterTools } from '../../tools/converters'

const slugs = [
  'formatowanie-json',
  'kodowanie-base64',
  'dekoder-jwt',
  'generator-uuid',
  'kodowanie-url',
  'generator-skrotow',
  'znacznik-czasu',
  'json-na-yaml',
  'json-na-csv',
  'generator-hmac',
  'kodowanie-base32',
  'kodowanie-hex',
  'ucieczki-unicode',
  'formatowanie-xml',
  'parser-adresu',
  'formatowanie-sql',
]

describe('converterTools', () => {
  it('registers the Polish converter slugs', () => {
    expect(converterTools.map((tool) => tool.slug)).toEqual(slugs)
    for (const tool of converterTools) {
      expect(tool.slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      expect(tool.title.length).toBeGreaterThan(0)
      expect(tool.description.length).toBeGreaterThan(0)
      expect(tool.keywords.length).toBeGreaterThan(0)
      expect(['konwertery', 'kodowanie', 'tekst']).toContain(tool.category)
      expect(typeof tool.component).toBe('function')
    }
  })

  it('states that a JWT signature is not verified and that SHA-1 is obsolete', () => {
    expect(converterTools.find((tool) => tool.slug === 'dekoder-jwt')?.disclaimer).toBe(JWT_NOTICE)
    expect(JWT_NOTICE.toLowerCase()).toContain('nie został zweryfikowany')
    expect(converterTools.find((tool) => tool.slug === 'generator-skrotow')?.disclaimer).toBe(SHA1_NOTICE)
  })
})
