import { describe, expect, it, vi } from 'vitest'
import { site, type OperatorDetails } from '../site'
import { applyOperatorFields, assertOperatorReadyForLaunch, operatorPlaceholderFields } from './operatorLaunch'

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

describe('applyOperatorFields', () => {
  it('fills REGON from site data and leaves the service-address placeholder intact', () => {
    const source = 'adres: [ADRES], e-mail [E-MAIL KONTAKTOWY], REGON: [REGON], witryna [ADRES SERWISU]'
    expect(applyOperatorFields(source, site.operator)).toBe(
      'adres: [ADRES], e-mail [E-MAIL KONTAKTOWY], REGON: 368785970, witryna [ADRES SERWISU]',
    )
  })
})
