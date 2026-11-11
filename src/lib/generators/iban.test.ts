import { describe, expect, it } from 'vitest'
import { formatIban, validateIbanPl } from './iban'

const WIKIPEDIA_IBAN = 'PL61109010140000071219812874'
const MINISTRY_IBAN = 'PL09101010100075912223000000'

describe('IBAN PL', () => {
  it('accepts the ISO example and prints it in groups of four', () => {
    expect(validateIbanPl('PL61 1090 1014 0000 0712 1981 2874')).toEqual({
      valid: true,
      iban: WIKIPEDIA_IBAN,
      formatted: 'PL61 1090 1014 0000 0712 1981 2874',
      nrb: '61109010140000071219812874',
    })
    expect(formatIban(WIKIPEDIA_IBAN)).toBe('PL61 1090 1014 0000 0712 1981 2874')
    expect(ibanMod97BigInt(WIKIPEDIA_IBAN)).toBe(1n)
  })

  it('accepts the Ministry of Finance account in lowercase', () => {
    const result = validateIbanPl('pl09 1010 1010 0075 9122 2300 0000')
    expect(result).toMatchObject({ valid: true, iban: MINISTRY_IBAN })
    expect(ibanMod97BigInt(MINISTRY_IBAN)).toBe(1n)
  })

  it('rejects a check-digit change, another country and a malformed value', () => {
    expect(validateIbanPl('PL61109010140000071219812875')).toEqual({
      valid: false,
      error: 'invalid-checksum',
    })
    expect(validateIbanPl('DE89370400440532013000')).toEqual({
      valid: false,
      error: 'unsupported-country',
    })
    expect(validateIbanPl('PL6110901014')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateIbanPl('PL6110901014000007121981287X')).toEqual({
      valid: false,
      error: 'invalid-characters',
    })
    expect(validateIbanPl('61109010140000071219812874')).toEqual({
      valid: false,
      error: 'invalid-format',
    })
    expect(validateIbanPl('   ')).toEqual({ valid: false, error: 'empty' })
    expect(validateIbanPl('PL61 1090 1014 0000 0712 1981 287!')).toEqual({
      valid: false,
      error: 'invalid-characters',
    })
  })
})

function ibanMod97BigInt(iban: string): bigint {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`
  let expanded = ''
  for (const char of rearranged) {
    const code = char.charCodeAt(0)
    expanded += code >= 65 ? String(code - 55) : char
  }
  return BigInt(expanded) % 97n
}
