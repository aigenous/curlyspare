import { describe, expect, it } from 'vitest'
import { validateIsbn } from './isbn'

describe('ISBN', () => {
  it('validates ISBN-10 0-306-40615-2 and converts it to ISBN-13', () => {
    expect(validateIsbn('0-306-40615-2')).toEqual({
      valid: true,
      isbn: '0306406152',
      kind: 'ISBN-10',
      isbn10: '0306406152',
      isbn13: '9780306406157',
    })
    expect(validateIsbn('0306406153')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('validates the ISBN-13 form and converts it back', () => {
    expect(validateIsbn('978-0-306-40615-7')).toMatchObject({
      valid: true,
      kind: 'ISBN-13',
      isbn10: '0306406152',
      isbn13: '9780306406157',
    })
  })

  it('accepts an ISBN-10 whose check character is X', () => {
    // 0×10+8×9+0×8+4×7+4×6+2×5+9×4+5×3+7×2 = 199, 199 mod 11 = 1, check = X.
    expect(validateIsbn('080442957x')).toMatchObject({
      valid: true,
      isbn: '080442957X',
      kind: 'ISBN-10',
    })
  })

  it('keeps a 979 number as ISBN-13 only', () => {
    const result = validateIsbn(isbn13('979123456789'))
    expect(result).toMatchObject({ valid: true, kind: 'ISBN-13', isbn10: null })
  })

  it('rejects an empty value, a bad prefix, letters and the wrong length', () => {
    expect(validateIsbn('')).toEqual({ valid: false, error: 'empty' })
    expect(validateIsbn('9770306406157')).toEqual({ valid: false, error: 'invalid-format' })
    expect(validateIsbn('0-306-4061A-2')).toEqual({ valid: false, error: 'invalid-characters' })
    expect(validateIsbn('030640615')).toEqual({ valid: false, error: 'invalid-length' })
  })
})

function isbn13(body12: string): string {
  const weights = [1, 3, 1, 3, 1, 3, 1, 3, 1, 3, 1, 3]
  const sum = [...body12].reduce((total, char, index) => total + Number(char) * (weights[index] ?? 0), 0)
  return `${body12}${(10 - (sum % 10)) % 10}`
}
