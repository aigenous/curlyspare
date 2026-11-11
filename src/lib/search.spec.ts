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
    expect(filterTools(tools, 'znakow').map((tool) => tool.slug)).toContain('slugify')
  })
})
