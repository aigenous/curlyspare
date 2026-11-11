import { describe, expect, it, vi } from 'vitest'
import { cryptoRandomInt, generateUnique, randomDigitChar, randomUppercaseLetter } from './random'

describe('cryptoRandomInt', () => {
  it('returns an unbiased remainder from the sampled word', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      const view = array as Uint32Array
      view[0] = 42
      return array
    })

    expect(cryptoRandomInt(10)).toBe(2)
    spy.mockRestore()
  })

  it('rejects values in the incomplete residue class and draws again', () => {
    let call = 0
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation((array) => {
      const view = array as Uint32Array
      view[0] = call === 0 ? 4_294_967_290 : 5
      call += 1
      return array
    })

    expect(cryptoRandomInt(10)).toBe(5)
    expect(call).toBe(2)
    spy.mockRestore()
  })

  it('always returns 0 when the only admissible value is 0', () => {
    expect(cryptoRandomInt(1)).toBe(0)
  })

  it('rejects a range that is not a positive integer inside the uint32 span', () => {
    expect(() => cryptoRandomInt(0)).toThrow(RangeError)
    expect(() => cryptoRandomInt(-3)).toThrow(RangeError)
    expect(() => cryptoRandomInt(1.5)).toThrow(RangeError)
    expect(() => cryptoRandomInt(0x1_0000_0001)).toThrow(RangeError)
  })

  it('stays inside the requested range across many draws', () => {
    for (let index = 0; index < 200; index += 1) {
      const value = cryptoRandomInt(7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
      expect(Number.isInteger(value)).toBe(true)
    }
  })
})

describe('random characters', () => {
  it('draws a decimal digit and an uppercase letter', () => {
    expect(randomDigitChar(() => 4)).toBe('4')
    expect(randomUppercaseLetter(() => 18)).toBe('S')
  })
})

describe('generateUnique', () => {
  it('returns distinct values in generation order', () => {
    const values = ['a', 'a', 'b', 'b', 'c']
    const result = generateUnique(3, () => values.shift() ?? 'z')
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty list when nothing was requested', () => {
    expect(generateUnique(0, () => 'a')).toEqual([])
  })

  it('throws when the source cannot produce enough distinct values', () => {
    expect(() => generateUnique(2, () => 'only')).toThrow(RangeError)
    expect(() => generateUnique(-1, () => 'a')).toThrow(RangeError)
    expect(() => generateUnique(1.5, () => 'a')).toThrow(RangeError)
  })
})
