import { describe, expect, it } from 'vitest'
import { tools } from '.'
import {
  catalogueGroups,
  catalogueSourceCount,
  landingRowsFor,
  primaryGroupFor,
} from './catalogue'

describe('landing catalogue', () => {
  const rows = landingRowsFor(tools)

  it('lists eight groups and 65 rows over the 61 registered tools', () => {
    expect(catalogueGroups).toHaveLength(8)
    expect(catalogueSourceCount()).toBe(65)
    expect(rows).toHaveLength(65)
    expect(new Set(rows.map((row) => row.slug)).size).toBe(tools.length)
    expect(tools).toHaveLength(61)
    for (const tool of tools) {
      expect(primaryGroupFor(tool.slug).label.length).toBeGreaterThan(0)
    }
  })

  it('keeps the published group order and legacy anchors', () => {
    expect(catalogueGroups.map((group) => group.anchor)).toEqual([
      'identyfikatory',
      'dane-testowe',
      'kodowanie',
      'formatowanie-i-dane',
      'tekst-i-liczby',
      'czas',
      'siec-i-system',
      'hashe',
    ])
    expect(catalogueGroups[0]?.legacyAnchors).toEqual(['polskie-identyfikatory'])
    expect(catalogueGroups[4]?.legacyAnchors).toEqual(['tekst'])
    expect(catalogueGroups[6]?.legacyAnchors).toEqual(['siec'])
  })

  it('points both rows of a combined tool at the same slug', () => {
    for (const slug of ['generator-pesel', 'generator-nip', 'generator-regon', 'walidator-iban']) {
      const matches = rows.filter((row) => row.slug === slug)
      expect(matches).toHaveLength(2)
      expect(matches.map((row) => row.groupId)).toEqual(['identifiers', 'test-data'])
    }
  })

  it('uses the approved card copy for NIP, the test person and SQL', () => {
    const nip = rows.find((row) => row.slug === 'generator-nip' && row.groupId === 'identifiers')
    expect(nip?.label).toBe('Walidator NIP')
    expect(nip?.description).toBe('Suma kontrolna i budowa numeru')
    expect(rows.some((row) => row.description.includes('kod urzędu skarbowego'))).toBe(false)

    const person = rows.find((row) => row.slug === 'generator-danych-testowych')
    expect(person?.label).toBe('Generator osoby testowej')
    expect(tools.find((tool) => tool.slug === 'generator-danych-testowych')?.title).toBe(
      'Generator danych testowych (osoba)',
    )

    const sql = rows.find((row) => row.slug === 'formatowanie-sql')
    expect(sql?.label).toBe('Formater SQL')
    expect(tools.find((tool) => tool.slug === 'formatowanie-sql')?.title).toBe('Formatowanie SQL')
  })
})
