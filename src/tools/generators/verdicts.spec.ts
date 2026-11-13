import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { generatorDisclaimer } from '../../brand'
import { validationMessage } from './messages'
import {
  GENERATED_NUMBER_LABEL,
  INVALID_NUMBER_LABEL,
  VALID_NUMBER_CAVEAT,
  VALID_NUMBER_LABEL,
  VAT_VALID_LABEL,
  vinPassLabel,
} from './verdicts'

const SIGNED_DISCLAIMER =
  'Dane fikcyjne, wygenerowane losowo wyłącznie do testowania oprogramowania. Numery mają jedynie poprawny format i sumę kontrolną i mogą przypadkowo pokrywać się z numerami istniejących osób lub firm; nie identyfikują nikogo, a serwis ich nie zapisuje. Zabronione jest używanie ich do podszywania się pod inne osoby, w dokumentach, formularzach urzędowych, bankowych lub finansowych \u2013 może to stanowić przestępstwo (m.in. art. 190a § 2, 270, 275, 286 i 297 Kodeksu karnego).'

const BANNED_CLAIMS = [
  'Poprawny PESEL',
  'Poprawny NIP',
  'Poprawny REGON',
  'Poprawny numer',
  'Poprawny NRB',
  'Poprawny EAN',
  'Poprawny VIN',
  'Poprawny IBAN',
  'Poprawny ISBN',
  'Poprawny numer VAT',
]

describe('signed status wording', () => {
  it('keeps the shared generator disclaimer on the signed text', () => {
    expect(generatorDisclaimer).toBe(SIGNED_DISCLAIMER)
    expect(generatorDisclaimer.includes('\u2013')).toBe(true)
  })

  it('uses the signed labels for generated numbers and for checks', () => {
    expect(GENERATED_NUMBER_LABEL).toBe('Poprawny format i suma kontrolna \u2013 dane fikcyjne (TEST)')
    expect(VALID_NUMBER_LABEL).toBe('Poprawny format i suma kontrolna')
    expect(VALID_NUMBER_CAVEAT).toBe('Nie potwierdza, że numer istnieje ani do kogo należy.')
    expect(INVALID_NUMBER_LABEL).toBe('Niepoprawny format lub suma kontrolna')
    expect(VAT_VALID_LABEL).toBe(
      'Poprawny format numeru VAT UE \u2013 nie sprawdzono w VIES (status podatnika nieznany)',
    )
    expect(vinPassLabel(false)).toBe('Poprawny format VIN')
    expect(vinPassLabel(true)).toBe('Poprawny format VIN i cyfra kontrolna')
  })

  it('maps a failed format or checksum to one sentence and leaves other errors alone', () => {
    expect(validationMessage('invalid-checksum')).toBe(INVALID_NUMBER_LABEL)
    expect(validationMessage('invalid-format')).toBe(INVALID_NUMBER_LABEL)
    expect(validationMessage('invalid-characters')).toBe(INVALID_NUMBER_LABEL)
    expect(validationMessage('invalid-length')).toBe(INVALID_NUMBER_LABEL)
    expect(validationMessage('invalid-date')).toBe(INVALID_NUMBER_LABEL)
    expect(validationMessage('empty')).toBe('Wpisz numer.')
    expect(validationMessage('unsupported-country')).toBe('Ten kraj nie jest obsługiwany.')
  })

  it('does not claim that a PESEL, NIP, VAT or VIN is valid on its own', () => {
    const here = dirname(fileURLToPath(import.meta.url))
    const sources = collectVue(here)
    expect(sources.length).toBeGreaterThan(0)
    for (const source of sources) {
      for (const claim of BANNED_CLAIMS) {
        expect(source.contents.includes(claim), `${source.path} contains ${claim}`).toBe(false)
      }
    }
    const vat = sources.find((source) => source.path.endsWith('WalidatorVatUe.vue'))
    expect(vat?.contents).toContain('Nie sprawdza statusu w VIES (aktywności podatnika VAT UE)')
    expect(vat?.contents).toContain('VAT_VALID_LABEL')
  })
})

function collectVue(directory: string): { path: string; contents: string }[] {
  const found: { path: string; contents: string }[] = []
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry)
    const stats = statSync(path)
    if (stats.isDirectory()) {
      found.push(...collectVue(path))
      continue
    }
    if (entry.endsWith('.vue')) {
      found.push({ path, contents: readFileSync(path, 'utf8') })
    }
  }
  return found
}
