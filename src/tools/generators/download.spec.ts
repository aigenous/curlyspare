import { describe, expect, it } from 'vitest'
import { identifiersToCsv, identifiersToJson } from './download'

describe('identifier export', () => {
  it('writes a header and one value per row', () => {
    expect(identifiersToCsv('pesel', ['44051401359', '00222900009'])).toBe(
      'pesel\n44051401359\n00222900009',
    )
  })

  it('quotes a value that contains a comma or a quote', () => {
    expect(identifiersToCsv('nip', ['526-025-02-74', 'a,b"c'])).toContain('"a,b""c"')
  })

  it('emits a JSON array', () => {
    expect(JSON.parse(identifiersToJson(['000002217']))).toEqual(['000002217'])
  })
})