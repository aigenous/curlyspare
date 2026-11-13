import { describe, expect, it } from 'vitest'
import { tools } from '../registry'
import { filterTools, fold } from './search'

describe('fold', () => {
  it('maps ł and Ł, which do not decompose under NFD', () => {
    expect(fold('Żółć')).toBe('zolc')
    expect(fold('Łódź')).toBe('lodz')
    expect(fold('łŁ')).toBe('ll')
  })

  it('strips combining marks from the other Polish letters', () => {
    expect(fold('ąęćńóśźż')).toBe('aecnoszz')
    expect(fold('ĄĘĆŃÓŚŹŻ')).toBe('aecnoszz')
  })

  it('finds a tool when the query drops Polish diacritics', () => {
    expect(filterTools(tools, 'znakow').map((tool) => tool.slug)).toContain('generator-slug')
  })

  it('ranks a name or slug match above a description-only match', () => {
    const slugs = filterTools(tools, 'json').map((tool) => tool.slug)
    const named = slugs.indexOf('formatowanie-json')
    const described = slugs.indexOf('generator-danych-testowych')
    expect(named).toBeGreaterThanOrEqual(0)
    expect(described).toBeGreaterThan(named)
    expect(slugs[0]).not.toBe('generator-danych-testowych')
  })
})
