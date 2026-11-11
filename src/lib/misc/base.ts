export const numberBases = [2, 8, 10, 16] as const

export type NumberBase = (typeof numberBases)[number]

const digitAlphabet = '0123456789abcdef'
const maxDigits = 4096

export function isNumberBase(value: number): value is NumberBase {
  return (numberBases as readonly number[]).includes(value)
}

export function convertBase(
  value: string,
  from: NumberBase,
  to: NumberBase,
): { ok: true; value: string } | { ok: false; error: string } {
  const compact = value.trim().replaceAll(' ', '').replaceAll('_', '')
  if (!compact) return { ok: false, error: 'Wpisz liczbę.' }
  const sign = compact.startsWith('-') ? '-' : ''
  const body = compact.replace(/^[+-]/, '').toLowerCase()
  if (!body) return { ok: false, error: 'Wpisz liczbę.' }
  if (body.length > maxDigits) return { ok: false, error: 'Liczba jest za długa.' }
  const allowed = digitAlphabet.slice(0, from)
  for (const char of body) {
    if (!allowed.includes(char)) {
      return { ok: false, error: `Znak „${char}” nie należy do systemu o podstawie ${from}.` }
    }
  }
  return { ok: true, value: formatBigInt(sign === '-' ? -parseBigInt(body, from) : parseBigInt(body, from), to) }
}

function parseBigInt(body: string, base: NumberBase): bigint {
  const radix = BigInt(base)
  let result = 0n
  for (const char of body) {
    result = result * radix + BigInt(digitAlphabet.indexOf(char))
  }
  return result
}

function formatBigInt(value: bigint, base: NumberBase): string {
  if (value === 0n) return '0'
  const negative = value < 0n
  const radix = BigInt(base)
  let rest = negative ? -value : value
  let digits = ''
  while (rest > 0n) {
    digits = digitAlphabet[Number(rest % radix)] + digits
    rest /= radix
  }
  const rendered = base === 16 ? digits.toUpperCase() : digits
  return negative ? `-${rendered}` : rendered
}
