import { describe, expect, it } from 'vitest'
import { brand, gtinDisclaimer, idDocumentDisclaimer } from '../../brand'
import { validateDowodOsobisty, validatePaszport } from '../../lib/generators'
import { TEST_COPY_PREFIX, TEST_DATA_FIELD, TEST_DATA_MARKER } from '../../lib/generators/person'
import { findTool } from '../../registry'
import { generatorTools } from './index'
import {
  META_TITLE_LIMIT,
  documentTitleFor,
  dowodPage,
  forbiddenIdCopyTerm,
  idDocumentExportFilename,
  idDocumentPublicText,
  idNumbersToCsv,
  idNumbersToJson,
  paszportPage,
  presentIdNumber,
  stripTestPrefix,
} from './id-document-copy'

describe('ID document page copy', () => {
  it('fits the document title in 60 characters', () => {
    const suffix = ` — ${brand.name}`
    const dowodTitle = documentTitleFor(dowodPage)
    const passportTitle = documentTitleFor(paszportPage)
    expect(dowodTitle).toBe(`${dowodPage.metaTitlePhrase}${suffix}`)
    expect(passportTitle).toBe(`${paszportPage.metaTitlePhrase}${suffix}`)
    expect(dowodTitle.length).toBeLessThanOrEqual(META_TITLE_LIMIT)
    expect(passportTitle.length).toBeLessThanOrEqual(META_TITLE_LIMIT)
  })

  it('drops to the fallback phrase when the preferred title exceeds 60 characters', () => {
    const suffix = ` — ${brand.name}`
    const title = documentTitleFor({
      ...paszportPage,
      metaTitlePhrase: `${paszportPage.metaTitlePhrase} dodatkowo`,
    })
    expect(title).toBe(`${paszportPage.metaTitleFallback}${suffix}`)
    expect(title.length).toBeLessThanOrEqual(META_TITLE_LIMIT)
    expect(title).not.toContain('i generator')
  })

  it('keeps validator-first headings and the open-graph title equal to the H1', () => {
    expect(dowodPage.h1.startsWith('Testowy numer dowodu osobistego – walidator')).toBe(true)
    expect(paszportPage.h1.startsWith('Testowy numer paszportu – walidator')).toBe(true)
    for (const page of [dowodPage, paszportPage]) {
      const tool = findTool(page.slug)
      expect(tool?.title).toBe(page.h1)
      expect(tool?.description).toBe(page.lead)
      expect(tool?.disclaimer).toBe(idDocumentDisclaimer)
      expect(page.lead.startsWith('Sprawdź')).toBe(true)
      expect(page.metaDescription.startsWith('Sprawdza')).toBe(true)
      expect(page.metaDescription.endsWith('Działa w przeglądarce, nie wysyłamy danych na serwer.')).toBe(true)
      expect(page.metaDescription.length).toBeLessThanOrEqual(155)
      for (const link of page.related) {
        expect(findTool(link.href.slice(1)), link.href).toBeDefined()
      }
    }
  })

  it('keeps forbidden terms out of public copy and leaves the EAN disclaimer alone', () => {
    for (const page of [dowodPage, paszportPage]) {
      for (const field of idDocumentPublicText(page)) {
        expect(forbiddenIdCopyTerm(field.text), `${page.slug} ${field.label}: ${field.text}`).toBeNull()
      }
    }
    expect(generatorTools.find((tool) => tool.slug === 'generator-ean')?.disclaimer).toBe(gtinDisclaimer)
  })

  it('prefixes the series and number, and marks exports with a dane_testowe column', () => {
    const line = presentIdNumber('ABS 123456')
    expect(TEST_COPY_PREFIX).toBe('[TEST]')
    expect(line).toBe('[TEST] ABS 123456')
    expect(stripTestPrefix(line)).toBe('ABS 123456')
    expect(stripTestPrefix('  [TEST]  ABS 123456  ')).toBe('ABS 123456')
    expect(stripTestPrefix('ABS 123456')).toBe('ABS 123456')
    expect(TEST_DATA_FIELD).toBe('dane_testowe')
    const csv = idNumbersToCsv([line])
    expect(csv.split('\n')[0]).toBe('numer,dane_testowe')
    expect(csv).toContain('[TEST] ABS 123456,tak')
    expect(TEST_DATA_MARKER).toBe('tak')
    const filename = idDocumentExportFilename('numer-dowodu-osobistego', 'csv')
    expect(filename).toBe('numer-dowodu-osobistego.csv')
    expect(filename).not.toContain('dane_testowe')
    const parsed: unknown = JSON.parse(idNumbersToJson([line]))
    expect(parsed).toEqual([{ numer: '[TEST] ABS 123456', dane_testowe: 'tak' }])
  })

  it('uses checksum examples that the real validators accept or reject', () => {
    for (const example of dowodPage.examples) {
      expect(validateDowodOsobisty(example.input).valid).toBe(example.valid)
    }
    for (const example of paszportPage.examples) {
      expect(validatePaszport(example.input).valid).toBe(example.valid)
    }
  })
})
