import { describe, expect, it } from 'vitest'
import { convertBase, isNumberBase } from './base'

describe('number base converter', () => {
  it('converts between binary, octal, decimal, and hex with BigInt', () => {
    expect(convertBase('255', 10, 16)).toEqual({ ok: true, value: 'FF' })
    expect(convertBase('ff', 16, 2)).toEqual({ ok: true, value: '11111111' })
    expect(convertBase('11111111', 2, 8)).toEqual({ ok: true, value: '377' })
    expect(convertBase('377', 8, 10)).toEqual({ ok: true, value: '255' })
    expect(convertBase('-1_000', 10, 16)).toEqual({ ok: true, value: '-3E8' })
    expect(convertBase('0', 2, 10)).toEqual({ ok: true, value: '0' })
  })

  it('keeps integers larger than Number.MAX_SAFE_INTEGER exact', () => {
    expect(convertBase('9007199254740993', 10, 16)).toEqual({ ok: true, value: '20000000000001' })
  })

  it('rejects digits from another base and empty input', () => {
    expect(convertBase('2', 2, 10).ok).toBe(false)
    expect(convertBase('  ', 10, 2)).toEqual({ ok: false, error: 'Wpisz liczbę.' })
    expect(convertBase('g', 16, 10).ok).toBe(false)
    expect(isNumberBase(16)).toBe(true)
    expect(isNumberBase(3)).toBe(false)
  })
})
