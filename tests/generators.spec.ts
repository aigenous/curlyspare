import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { generatorDisclaimer } from '../src/brand'

type RandomInt = (maxExclusive: number) => number

const libraryPath = new URL('../src/lib/generators/index.ts', import.meta.url)
const generatorsPresent = existsSync(libraryPath)

type PeselSex = 'kobieta' | 'mezczyzna'
type CalendarDate = { year: number; month: number; day: number }

interface ValidationFailure {
  valid: false
  error: string
}

interface Generators {
  DISCLAIMER: string
  generatePesel: (
    options: { birthDate?: CalendarDate; sex?: PeselSex },
    rng?: RandomInt,
  ) => string
  generateNip: (rng?: RandomInt) => string
  generateRegon: (length?: 9 | 14, rng?: RandomInt) => string
  generateKrs: (rng?: RandomInt) => string
  generateDowodOsobisty: (rng?: RandomInt) => string
  generatePaszport: (rng?: RandomInt) => string
  validatePesel: (input: string) => { valid: boolean; sex?: PeselSex; birthDate?: CalendarDate }
  validateNip: (input: string) => { valid: boolean }
  validateRegon: (input: string) => { valid: boolean; length?: 9 | 14 }
  validateKrs: (input: string) => { valid: boolean } | ValidationFailure
  validateIbanPl: (input: string) => { valid: boolean; iban?: string } | ValidationFailure
  validateDowodOsobisty: (input: string) => { valid: boolean } | ValidationFailure
  validatePaszport: (input: string) => { valid: boolean } | ValidationFailure
}

async function loadGenerators(): Promise<Generators> {
  const specifier = '../src/lib/generators/index.ts'
  return import(specifier) as Promise<Generators>
}

async function loadSequenceRng(): Promise<(values: readonly number[]) => RandomInt> {
  const specifier = '../src/lib/generators/sequence-rng.ts'
  const module = (await import(specifier)) as { sequenceRng: (values: readonly number[]) => RandomInt }
  return module.sequenceRng
}

describe.skipIf(!generatorsPresent)('Polish identifier generators', () => {
  it('publishes a testing disclaimer', async () => {
    const { DISCLAIMER } = await loadGenerators()
    expect(DISCLAIMER).toBe(generatorDisclaimer)
  })

  it('reproduces published checksum vectors and rejects a damaged digit', async () => {
    const api = await loadGenerators()
    const sequenceRng = await loadSequenceRng()

    expect(
      api.generatePesel(
        { birthDate: { year: 1944, month: 5, day: 14 }, sex: 'mezczyzna' },
        sequenceRng([0, 1, 3, 2]),
      ),
    ).toBe('44051401359')
    expect(api.validatePesel('440514 01359')).toMatchObject({
      valid: true,
      sex: 'mezczyzna',
      birthDate: { year: 1944, month: 5, day: 14 },
    })
    expect(api.validatePesel('00222900009')).toMatchObject({
      valid: true,
      sex: 'kobieta',
      birthDate: { year: 2000, month: 2, day: 29 },
    })
    expect(api.validatePesel('90123199990')).toMatchObject({
      valid: true,
      sex: 'mezczyzna',
      birthDate: { year: 1990, month: 12, day: 31 },
    })
    expect(api.validatePesel('44051401358')).toEqual({ valid: false, error: 'invalid-checksum' })
    expect(api.validatePesel('00022900003')).toEqual({ valid: false, error: 'invalid-date' })

    expect(api.generateNip(sequenceRng([4, 2, 6, 0, 2, 5, 0, 2, 7]))).toBe('5260250274')
    expect(api.validateNip('526-025-02-74').valid).toBe(true)
    expect(api.validateNip('1234563218').valid).toBe(true)
    expect(api.validateNip('1234563219')).toEqual({ valid: false, error: 'invalid-checksum' })

    expect(api.generateRegon(9, sequenceRng([0, 0, 0, 0, 0, 2, 2, 1]))).toBe('000002217')
    expect(api.validateRegon('000002217').valid).toBe(true)
    expect(api.validateRegon('00000221700018')).toMatchObject({ valid: true, length: 14 })
    expect(api.validateRegon('000002218')).toEqual({ valid: false, error: 'invalid-checksum' })

    expect(api.generateKrs(sequenceRng([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]))).toBe('0123456789')
    expect(api.validateKrs('0123456789').valid).toBe(true)
    expect(api.validateKrs('123')).toEqual({ valid: false, error: 'invalid-length' })

    expect(api.validateIbanPl('PL61 1090 1014 0000 0712 1981 2874')).toMatchObject({
      valid: true,
      iban: 'PL61109010140000071219812874',
    })
    expect(api.validateIbanPl('pl09 1010 1010 0075 9122 2300 0000')).toMatchObject({
      valid: true,
      iban: 'PL09101010100075912223000000',
    })
    expect(api.validateIbanPl('PL61109010140000071219812875')).toEqual({
      valid: false,
      error: 'invalid-checksum',
    })
    expect(api.validateIbanPl('DE89370400440532013000')).toEqual({
      valid: false,
      error: 'unsupported-country',
    })

    expect(api.generateDowodOsobisty(sequenceRng([0, 1, 18, 2, 3, 4, 5, 6]))).toBe('ABS123456')
    expect(api.validateDowodOsobisty('ZZC108201').valid).toBe(true)
    expect(api.validateDowodOsobisty('ZZC108202')).toEqual({ valid: false, error: 'invalid-checksum' })

    expect(api.generatePaszport(sequenceRng([0, 0, 2, 3, 4, 5, 6, 7]))).toBe('AA3234567')
    expect(api.validatePaszport('aa 3234567').valid).toBe(true)
    expect(api.validatePaszport('AA3234568')).toEqual({ valid: false, error: 'invalid-checksum' })
  })

  it('validates freshly generated identifiers', async () => {
    const api = await loadGenerators()
    expect(api.validatePesel(api.generatePesel()).valid).toBe(true)
    expect(api.validatePesel(api.generatePesel({ sex: 'kobieta' })).valid).toBe(true)
    expect(api.validateNip(api.generateNip()).valid).toBe(true)
    expect(api.validateRegon(api.generateRegon(9)).valid).toBe(true)
    expect(api.validateRegon(api.generateRegon(14)).valid).toBe(true)
    expect(api.validateKrs(api.generateKrs()).valid).toBe(true)
    expect(api.validateDowodOsobisty(api.generateDowodOsobisty()).valid).toBe(true)
    expect(api.validatePaszport(api.generatePaszport()).valid).toBe(true)
  })
})
