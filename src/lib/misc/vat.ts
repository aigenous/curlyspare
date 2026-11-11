import { parseMoneyGrosze } from './amount'

export const vatRates = [23, 8, 5, 0] as const
export const vatBases = ['net', 'gross'] as const

export type VatRate = (typeof vatRates)[number]
export type VatBasis = (typeof vatBases)[number]

export interface VatBreakdown {
  net: string
  vat: string
  gross: string
}

export function isVatRate(value: number): value is VatRate {
  return (vatRates as readonly number[]).includes(value)
}

export function isVatBasis(value: string): value is VatBasis {
  return (vatBases as readonly string[]).includes(value)
}

export function calculateVat(
  input: string,
  rate: VatRate,
  basis: VatBasis,
): { ok: true; breakdown: VatBreakdown } | { ok: false; error: string } {
  const amount = parseMoneyGrosze(input)
  if (amount === null) return { ok: false, error: 'Podaj nieujemną kwotę, na przykład 100,00.' }
  const vatRate = BigInt(rate)
  const net = basis === 'net' ? amount : divRound(amount * 100n, 100n + vatRate)
  const vat = basis === 'net' ? divRound(amount * vatRate, 100n) : amount - net
  const gross = basis === 'net' ? net + vat : amount
  return {
    ok: true,
    breakdown: { net: formatGrosze(net), vat: formatGrosze(vat), gross: formatGrosze(gross) },
  }
}

function divRound(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator
  const remainder = numerator % denominator
  return remainder * 2n >= denominator ? quotient + 1n : quotient
}

function formatGrosze(value: bigint): string {
  const whole = (value / 100n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const fraction = (value % 100n).toString().padStart(2, '0')
  return `${whole},${fraction}`
}
