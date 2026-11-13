import { describe, expect, it, vi } from 'vitest'
import { site, type OperatorDetails } from '../site'
import {
  applyOperatorFields,
  assertOperatorReadyForLaunch,
  legalPlaceholderTokens,
  operatorPlaceholderFields,
} from './operatorLaunch'

const filled = {
  name: 'Piotr Szewczyk',
  legalForm: 'jednoosobowa działalność gospodarcza',
  nip: '6222809805',
  regon: '368785970',
  correspondenceAddress: 'adres do uzupełnienia po zatwierdzeniu',
  email: 'kontakt@example.com',
} satisfies OperatorDetails

describe('operator launch guard', () => {
  it('fails when REQUIRE_OPERATOR_DATA=1 and an operator field is still a placeholder', () => {
    expect(operatorPlaceholderFields(site.operator)).toEqual(['correspondenceAddress', 'email'])
    const warn = vi.fn()
    expect(() => assertOperatorReadyForLaunch(site.operator, '1', warn)).toThrow(/placeholders/)
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns and passes when the launch flag is unset', () => {
    const warn = vi.fn()
    expect(() => assertOperatorReadyForLaunch(site.operator, undefined, warn)).not.toThrow()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toContain('correspondenceAddress')
  })

  it('passes without a warning when every operator field is filled', () => {
    const warn = vi.fn()
    expect(operatorPlaceholderFields(filled)).toEqual([])
    expect(() => assertOperatorReadyForLaunch(filled, '1', warn)).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })
})

const filledLegal =
  'Piotr Szewczyk, [ADRES], [E-MAIL KONTAKTOWY], REGON [REGON]. Wynik „[TEST]”. [Regulamin](/regulamin).'
const leftoverLegal = 'Firma [PEŁNA NAZWA FIRMY], serwis [ADRES SERWISU], [UZUPEŁNIJ: brak].'

describe('legal page placeholders', () => {
  it('fails when REQUIRE_OPERATOR_DATA=1 and a legal placeholder remains', () => {
    const warn = vi.fn()
    expect(() => assertOperatorReadyForLaunch(filled, '1', warn, [leftoverLegal])).toThrow(/\[PEŁNA NAZWA FIRMY\]/)
    expect(warn).not.toHaveBeenCalled()
  })

  it('passes without a warning when operator fields and legal pages are filled', () => {
    const warn = vi.fn()
    expect(legalPlaceholderTokens(applyOperatorFields(filledLegal, filled))).toEqual([])
    expect(() => assertOperatorReadyForLaunch(filled, '1', warn, [filledLegal])).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('ignores placeholders that appear only inside HTML comments', () => {
    const source = 'Gotowe. <!-- [PEŁNA NAZWA FIRMY] [ADRES SERWISU] --> Wynik „[TEST]”.'
    const warn = vi.fn()
    expect(legalPlaceholderTokens(source)).toEqual([])
    expect(() => assertOperatorReadyForLaunch(filled, '1', warn, [source])).not.toThrow()
    expect(warn).not.toHaveBeenCalled()
  })

  it('warns and passes when a legal placeholder remains and the launch flag is unset', () => {
    const warn = vi.fn()
    expect(() => assertOperatorReadyForLaunch(filled, undefined, warn, [leftoverLegal])).not.toThrow()
    expect(warn).toHaveBeenCalledOnce()
    expect(warn.mock.calls[0]?.[0]).toContain('[ADRES SERWISU]')
    expect(warn.mock.calls[0]?.[0]).toContain('[UZUPEŁNIJ: brak]')
  })
})

describe('applyOperatorFields', () => {
  it('fills REGON from site data and leaves the service-address placeholder intact', () => {
    const source = 'adres: [ADRES], e-mail [E-MAIL KONTAKTOWY], REGON: [REGON], witryna [ADRES SERWISU]'
    expect(applyOperatorFields(source, site.operator)).toBe(
      'adres: [ADRES], e-mail [E-MAIL KONTAKTOWY], REGON: 368785970, witryna [ADRES SERWISU]',
    )
  })
})
