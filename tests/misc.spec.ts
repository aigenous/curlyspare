import { describe, expect, it } from 'vitest'
import { convertCase, isCaseMode } from '../src/lib/misc/case'
import { formatHex, hslToRgb, parseHex, rgbToHsl } from '../src/lib/misc/color'
import { polishLorem } from '../src/lib/misc/lorem'
import { slugifyPolish } from '../src/lib/misc/slug'
import { textStats } from '../src/lib/misc/stats'
import { filterTools, fold } from '../src/lib/search'
import { tools } from '../src/registry'

describe('search', () => {
  it('folds Polish diacritics that Unicode decomposes', () => {
    expect(fold('Ąćęńóśź')).toBe('acenosz')
  })

  it('matches a tool by keyword and ignores blank queries', () => {
    expect(filterTools(tools, '   ')).toHaveLength(tools.length)
    expect(filterTools(tools, 'QR').map((tool) => tool.slug)).toEqual(['generator-qr'])
    expect(filterTools(tools, 'nie-ma-takiego-narzedzia')).toEqual([])
  })
})

describe('slugify', () => {
  it('builds an ascii kebab slug from Polish text', () => {
    expect(slugifyPolish('Zażółć gęślą jaźń — przykładowy tytuł')).toBe(
      'zazolc-gesla-jazn-przykladowy-tytul',
    )
    expect(slugifyPolish('---')).toBe('')
  })
})

describe('case conversion', () => {
  it('recognises only the supported modes', () => {
    expect(isCaseMode('kebab')).toBe(true)
    expect(isCaseMode('pascal')).toBe(false)
  })

  it('converts Polish text without dropping letters', () => {
    const input = 'Zażółć gęślą jaźń'
    expect(convertCase(input, 'upper')).toBe('ZAŻÓŁĆ GĘŚLĄ JAŹŃ')
    expect(convertCase(input, 'lower')).toBe('zażółć gęślą jaźń')
    expect(convertCase(input, 'kebab')).toBe('zażółć-gęślą-jaźń')
    expect(convertCase(input, 'snake')).toBe('zażółć_gęślą_jaźń')
    expect(convertCase(input, 'camel')).toBe('zażółćGęśląJaźń')
    expect(convertCase(input, 'title')).toBe('Zażółć Gęślą Jaźń')
    expect(convertCase('cześć. świat', 'sentence')).toBe('Cześć. Świat')
    expect(convertCase('', 'title')).toBe('')
  })
})

describe('text stats', () => {
  it('counts an empty string as zeros', () => {
    expect(textStats('')).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      paragraphs: 0,
    })
  })

  it('counts words, lines, and paragraphs', () => {
    expect(textStats('a b\n\nc')).toEqual({
      characters: 6,
      charactersNoSpaces: 3,
      words: 3,
      lines: 3,
      paragraphs: 2,
    })
    expect(textStats('  ')).toMatchObject({ words: 0, paragraphs: 0, characters: 2, lines: 1 })
  })
})

describe('lorem', () => {
  it('clamps the requested size and stays deterministic', () => {
    const once = polishLorem(1, 1)
    expect(once).toBe(
      'Tester wkleja krótki akapit i sprawdza, czy formularz przyjmuje polskie znaki.',
    )
    expect(polishLorem(1, 1)).toBe(once)
    expect(polishLorem(0, 99).split('\n\n')).toHaveLength(1)
    expect(polishLorem(Number.NaN, 3).split(' ').length).toBeGreaterThan(3)
  })
})

describe('color conversion', () => {
  it('parses short and long hex and rejects garbage', () => {
    expect(parseHex('#315CB4')).toEqual({ r: 49, g: 92, b: 180 })
    expect(parseHex('abc')).toEqual(parseHex('#aabbcc'))
    expect(parseHex('zz')).toBeNull()
    expect(formatHex({ r: 49, g: 92, b: 180 })).toBe('#315cb4')
  })

  it('covers the remaining hue sectors and clamps bad channels', () => {
    expect(hslToRgb({ h: 90, s: 100, l: 50 })).toEqual({ r: 128, g: 255, b: 0 })
    expect(hslToRgb({ h: 270, s: 100, l: 50 })).toEqual({ r: 128, g: 0, b: 255 })
    expect(hslToRgb({ h: 330, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 128 })
    expect(rgbToHsl({ r: 255, g: 0, b: 128 }).h).toBe(329.9)
    expect(hslToRgb({ h: 0, s: Number.NaN, l: 200 })).toEqual({ r: 255, g: 255, b: 255 })
    expect(formatHex({ r: Number.NaN, g: 300, b: -5 })).toBe('#00ff00')
  })

  it('round-trips primary colors through HSL', () => {
    expect(rgbToHsl({ r: 255, g: 255, b: 255 })).toEqual({ h: 0, s: 0, l: 100 })
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual({ r: 255, g: 0, b: 0 })
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual({ r: 0, g: 255, b: 0 })
    const original = { r: 49, g: 92, b: 180 }
    const roundTrip = hslToRgb(rgbToHsl(original))
    expect(Math.abs(roundTrip.r - original.r)).toBeLessThanOrEqual(1)
    expect(Math.abs(roundTrip.g - original.g)).toBeLessThanOrEqual(1)
    expect(Math.abs(roundTrip.b - original.b)).toBeLessThanOrEqual(1)
  })
})
