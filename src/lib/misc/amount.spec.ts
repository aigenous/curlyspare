import { describe, expect, it } from 'vitest'
import { amountToWords } from './amount'

function words(input: string): string {
  const result = amountToWords(input)
  if (!result.ok) throw new Error(result.error)
  return result.words
}

const zlotyCases: Array<[string, string]> = [
  ['0', 'zero złotych'],
  ['1', 'jeden złoty'],
  ['2', 'dwa złote'],
  ['5', 'pięć złotych'],
  ['11', 'jedenaście złotych'],
  ['12', 'dwanaście złotych'],
  ['21', 'dwadzieścia jeden złotych'],
  ['22', 'dwadzieścia dwa złote'],
  ['25', 'dwadzieścia pięć złotych'],
  ['101', 'sto jeden złotych'],
  ['112', 'sto dwanaście złotych'],
  ['1000', 'tysiąc złotych'],
  ['1001', 'tysiąc jeden złotych'],
  ['2000', 'dwa tysiące złotych'],
  ['5000', 'pięć tysięcy złotych'],
  ['21000', 'dwadzieścia jeden tysięcy złotych'],
  ['22000', 'dwadzieścia dwa tysiące złotych'],
  ['101000', 'sto jeden tysięcy złotych'],
  ['1000000', 'milion złotych'],
  ['2000000', 'dwa miliony złotych'],
  ['101000000', 'sto jeden milionów złotych'],
  ['1000000000', 'miliard złotych'],
  ['2000000000', 'dwa miliardy złotych'],
  ['5000000000', 'pięć miliardów złotych'],
  ['21000000000', 'dwadzieścia jeden miliardów złotych'],
  ['101000000000', 'sto jeden miliardów złotych'],
]

const groszCases: Array<[string, string]> = [
  ['0,01', 'zero złotych jeden grosz'],
  ['0,02', 'zero złotych dwa grosze'],
  ['0,04', 'zero złotych cztery grosze'],
  ['0,05', 'zero złotych pięć groszy'],
  ['0,11', 'zero złotych jedenaście groszy'],
  ['0,12', 'zero złotych dwanaście groszy'],
  ['0,13', 'zero złotych trzynaście groszy'],
  ['0,14', 'zero złotych czternaście groszy'],
  ['0,21', 'zero złotych dwadzieścia jeden groszy'],
  ['0,22', 'zero złotych dwadzieścia dwa grosze'],
  ['0,24', 'zero złotych dwadzieścia cztery grosze'],
  ['0,25', 'zero złotych dwadzieścia pięć groszy'],
  ['1,01', 'jeden złoty jeden grosz'],
  ['1,02', 'jeden złoty dwa grosze'],
  ['1,05', 'jeden złoty pięć groszy'],
  ['1,21', 'jeden złoty dwadzieścia jeden groszy'],
  ['21,02', 'dwadzieścia jeden złotych dwa grosze'],
  ['22,22', 'dwadzieścia dwa złote dwadzieścia dwa grosze'],
  ['101,12', 'sto jeden złotych dwanaście groszy'],
  ['112,14', 'sto dwanaście złotych czternaście groszy'],
]

describe('Polish amount in words', () => {
  it.each(zlotyCases)('inflects %s as %s', (input, expected) => {
    expect(words(input)).toBe(expected)
  })

  it.each(groszCases)('inflects grosze in %s as %s', (input, expected) => {
    expect(words(input)).toBe(expected)
  })

  it('spells a grouped invoice amount and a negative amount', () => {
    expect(words('1.234,56')).toBe('tysiąc dwieście trzydzieści cztery złote pięćdziesiąt sześć groszy')
    expect(words('-2,50')).toBe('minus dwa złote pięćdziesiąt groszy')
  })

  it('rejects amounts that are not money', () => {
    expect(amountToWords('').ok).toBe(false)
    expect(amountToWords('12,345').ok).toBe(false)
    expect(amountToWords('abc').ok).toBe(false)
  })
})
