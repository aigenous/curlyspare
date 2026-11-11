import { describe, expect, it } from 'vitest'
import { generatorDisclaimer } from '../src/brand'
import { assertRegistry, findTool, tools } from '../src/registry'

const kebab = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const reserved = new Set(['regulamin', 'polityka-prywatnosci', 'operator', '404'])

describe('tool registry', () => {
  it('accepts the current registry', () => {
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

  it('gives every generator the shared testing disclaimer', () => {
    expect(generatorDisclaimer.trim().length).toBeGreaterThan(40)
    const generators = tools.filter((tool) => tool.category === 'generatory')
    expect(generators.every((tool) => tool.disclaimer === generatorDisclaimer)).toBe(true)
    for (const tool of generators) {
      expect(tool.disclaimer, tool.slug).toBe(generatorDisclaimer)
    }
  })
})
