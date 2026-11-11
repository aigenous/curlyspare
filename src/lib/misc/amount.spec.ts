import { describe, expect, it } from 'vitest'
import { amountToWords } from './amount'

function words(input: string): string {
  const result = amountToWords(input)
  if (!result.ok) throw new Error(result.error)
  return result.words
}

describe('Polish amount in words', () => {
  it('inflects złote and grosze', () => {
    expect(words('0')).toBe('zero złotych')
    expect(words('1')).toBe('jeden złoty')
    expect(words('2')).toBe('dwa złote')
    expect(words('5')).toBe('pięć złotych')
    expect(words('12')).toBe('dwanaście złotych')
    expect(words('22')).toBe('dwadzieścia dwa złote')
    expect(words('101')).toBe('sto jeden złoty')
    expect(words('1,01')).toBe('jeden złoty jeden grosz')
    expect(words('1,02')).toBe('jeden złoty dwa grosze')
    expect(words('1,05')).toBe('jeden złoty pięć groszy')
  })

  it('spells thousands, millions, and a grouped invoice amount', () => {
    expect(words('1000')).toBe('tysiąc złotych')
    expect(words('2000')).toBe('dwa tysiące złotych')
    expect(words('5000')).toBe('pięć tysięcy złotych')
    expect(words('1000000')).toBe('milion złotych')
    expect(words('1.234,56')).toBe('tysiąc dwieście trzydzieści cztery złote pięćdziesiąt sześć groszy')
    expect(words('-2,50')).toBe('minus dwa złote pięćdziesiąt groszy')
  })

  it('rejects amounts that are not money', () => {
    expect(amountToWords('').ok).toBe(false)
    expect(amountToWords('12,345').ok).toBe(false)
    expect(amountToWords('abc').ok).toBe(false)
  })
})
