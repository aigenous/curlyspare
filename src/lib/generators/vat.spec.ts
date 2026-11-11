import { describe, expect, it } from 'vitest'
import { validateEuVat } from './vat'

describe('EU VAT format', () => {
  it('checks the Polish NIP checksum and ignores separators', () => {
    expect(validateEuVat('PL 526-025-02-74')).toEqual({
      valid: true,
      vat: 'PL5260250274',
      country: 'PL',
    })
    expect(validateEuVat('PL5260250275')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('checks Belgian, French, Italian, Finnish and Swedish numbers', () => {
    expect(validateEuVat('BE0428.752.767')).toMatchObject({ valid: true, country: 'BE' })
    expect(validateEuVat('BE0000000097')).toMatchObject({ valid: true, country: 'BE' })
    expect(validateEuVat('BE0428752705')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(validateEuVat('FR40303265045')).toMatchObject({ valid: true, vat: 'FR40303265045' })
    expect(validateEuVat('FRXX303265045')).toMatchObject({ valid: true, country: 'FR' })
    expect(validateEuVat('FR41303265045')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(validateEuVat('IT00743110157')).toMatchObject({ valid: true, country: 'IT' })
    expect(validateEuVat('IT00743110155')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(validateEuVat('FI20774740')).toMatchObject({ valid: true, country: 'FI' })
    expect(validateEuVat('SE556036079301')).toMatchObject({ valid: true, country: 'SE' })
    expect(validateEuVat('SE556036079401')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(validateEuVat('SE556036079302')).toEqual({ valid: false, error: 'invalid-format' })
  })

  it('checks Danish, Portuguese, Slovenian and Slovak numbers', () => {
    expect(validateEuVat('DK12345674')).toMatchObject({ valid: true, country: 'DK' })
    expect(validateEuVat('DK12345675')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(validateEuVat('PT502011475')).toMatchObject({ valid: true, country: 'PT' })
    expect(validateEuVat('SI12345679')).toMatchObject({ valid: true, country: 'SI' })
    expect(validateEuVat('SK1234567884')).toMatchObject({ valid: true, country: 'SK' })
    expect(validateEuVat('SK1234567885')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('accepts the remaining EU formats without a checksum', () => {
    const samples = [
      'ATU12345678',
      'BG123456789',
      'BG1234567890',
      'CY12345678X',
      'CZ12345678',
      'CZ123456789',
      'CZ1234567890',
      'DE123456789',
      'EE123456789',
      'EL123456789',
      'ESX1234567A',
      'ES12345678A',
      'HR12345678901',
      'HU12345678',
      'IE1234567T',
      'IE1234567FA',
      'IE1A12345T',
      'LT123456789',
      'LT123456789012',
      'LU12345678',
      'LV12345678901',
      'MT12345678',
      'NL123456789B01',
      'RO12',
      'RO1234567890',
    ]
    for (const sample of samples) {
      expect(validateEuVat(sample).valid, sample).toBe(true)
    }
    expect(validateEuVat('GR123456789')).toEqual({
      valid: true,
      vat: 'EL123456789',
      country: 'EL',
    })
  })

  it('rejects an unknown country, a short number and an empty value', () => {
    expect(validateEuVat('GB123456789')).toEqual({ valid: false, error: 'unsupported-country' })
    expect(validateEuVat('DE12345678')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateEuVat('NL123456789X01')).toEqual({ valid: false, error: 'invalid-format' })
    expect(validateEuVat('')).toEqual({ valid: false, error: 'empty' })
    expect(validateEuVat('PL')).toEqual({ valid: false, error: 'invalid-length' })
  })
})
