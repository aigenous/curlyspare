import { describe, expect, it } from 'vitest'
import { convertEntities } from './entities'

describe('HTML entities', () => {
  it('encodes markup and Polish letters', () => {
    expect(convertEntities(`<a href="x">&</a>`, 'encode')).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&lt;/a&gt;')
    const encoded = convertEntities('łódź', 'encode')
    expect(encoded).not.toContain('ł')
    expect(convertEntities(encoded, 'decode')).toBe('łódź')
  })

  it('decodes named and numeric references', () => {
    expect(convertEntities('&nbsp;&mdash;', 'decode')).toBe('\u00A0\u2014')
    expect(convertEntities('&#322;&#243;d&#378;', 'decode')).toBe('łódź')
  })
})
