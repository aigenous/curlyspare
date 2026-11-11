import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { euVatPassMessage, ibanPassMessage, isbnPassMessage, vinPassMessage } from './verdicts'

const BANNED_PASS = [/poprawny numer vat/i, /poprawny vin/i, /poprawny iban/i, /poprawny isbn/i]

describe('validator pass wording', () => {
  it('reports a correct VAT checksum without calling the number valid', () => {
    const message = euVatPassMessage('PL', 'PL5260250274')
    expect(message).toBe('Format i suma kontrolna poprawne (PL): PL5260250274.')
    expect(BANNED_PASS.some((pattern) => pattern.test(message))).toBe(false)
  })

  it('reports a correct VIN check digit without calling the VIN valid', () => {
    const message = vinPassMessage('1M8GDM9AXKP042788')
    expect(message).toBe('Cyfra kontrolna poprawna: 1M8GDM9AXKP042788.')
    expect(message).not.toMatch(/poprawny vin/i)
  })

  it('reports a correct ISBN checksum and keeps the 979 note', () => {
    expect(isbnPassMessage('ISBN-10', '0306406152')).toBe('Suma kontrolna poprawna (ISBN-10).')
    expect(isbnPassMessage('ISBN-13', null)).toBe(
      'Suma kontrolna poprawna (ISBN-13). Prefiks 979 nie ma odpowiednika ISBN-10.',
    )
    expect(isbnPassMessage('ISBN-13', null)).not.toMatch(/poprawny isbn/i)
  })

  it('reports a correct IBAN checksum without claiming the account exists', () => {
    const message = ibanPassMessage('PL61 1090 1014 0000 0712 1981 2874', '61109010140000071219812874')
    expect(message).toBe(
      'Format i suma kontrolna poprawne: PL61 1090 1014 0000 0712 1981 2874. NRB: 61109010140000071219812874.',
    )
    expect(message).not.toMatch(/poprawny iban/i)
    expect(message).not.toMatch(/istnieje|nadany|aktyw/i)
  })

  it('keeps the pass phrases out of the checker screens', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const screens = [
      'walidator-vat-ue/WalidatorVatUe.vue',
      'walidator-vin/WalidatorVin.vue',
      'konwerter-isbn/KonwerterIsbn.vue',
      'walidator-iban/WalidatorIban.vue',
    ]
    for (const screen of screens) {
      const source = readFileSync(join(here, screen), 'utf8')
      for (const pattern of BANNED_PASS) {
        expect(pattern.test(source), `${screen} matches ${pattern}`).toBe(false)
      }
    }
    const vat = readFileSync(join(here, 'walidator-vat-ue/WalidatorVatUe.vue'), 'utf8')
    expect(vat).toContain('Nie sprawdza statusu w VIES (aktywności podatnika VAT UE)')
  })
})
