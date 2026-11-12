import { describe, expect, it } from 'vitest'
import { validateVin } from './vin'

describe('VIN', () => {
  it('accepts the published VIN 1M8GDM9AXKP042788', () => {
    expect(validateVin('1M8GDM9A XKP042788')).toEqual({
      valid: true,
      vin: '1M8GDM9AXKP042788',
      checkDigitVerified: true,
    })
  })

  it('accepts a check digit of 1 and rejects a changed digit', () => {
    expect(validateVin('11111111111111111')).toEqual({
      valid: true,
      vin: '11111111111111111',
      checkDigitVerified: true,
    })
    expect(validateVin('11111111211111111')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('accepts a European VIN without treating the ninth character as a check digit', () => {
    expect(validateVin('WM8GDM9AYKP042788')).toEqual({
      valid: true,
      vin: 'WM8GDM9AYKP042788',
      checkDigitVerified: false,
    })
  })

  it('rejects letters that the standard excludes, the wrong length and an empty value', () => {
    expect(validateVin('1M8GDM9AXKP04278I')).toEqual({ valid: false, error: 'invalid-format' })
    expect(validateVin('1M8GDM9AXKP04278')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateVin('1M8GDM9AXKP04278-')).toEqual({ valid: false, error: 'invalid-length' })
    expect(validateVin('')).toEqual({ valid: false, error: 'empty' })
    expect(validateVin('1M8GDM9AXKP04278#')).toEqual({ valid: false, error: 'invalid-characters' })
  })
})
