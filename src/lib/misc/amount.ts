const ones = ['', 'jeden', 'dwa', 'trzy', 'cztery', 'pięć', 'sześć', 'siedem', 'osiem', 'dziewięć']
const teens = [
  'dziesięć',
  'jedenaście',
  'dwanaście',
  'trzynaście',
  'czternaście',
  'piętnaście',
  'szesnaście',
  'siedemnaście',
  'osiemnaście',
  'dziewiętnaście',
]
const tens = [
  '',
  '',
  'dwadzieścia',
  'trzydzieści',
  'czterdzieści',
  'pięćdziesiąt',
  'sześćdziesiąt',
  'siedemdziesiąt',
  'osiemdziesiąt',
  'dziewięćdziesiąt',
]
const hundreds = ['', 'sto', 'dwieście', 'trzysta', 'czterysta', 'pięćset', 'sześćset', 'siedemset', 'osiemset', 'dziewięćset']
const scales: ([string, string, string] | null)[] = [
  null,
  ['tysiąc', 'tysiące', 'tysięcy'],
  ['milion', 'miliony', 'milionów'],
  ['miliard', 'miliardy', 'miliardów'],
]

export function parseMoneyGrosze(input: string): bigint | null {
  const parsed = parseAmount(input)
  if (!parsed || parsed.negative) return null
  return parsed.zloty * 100n + BigInt(parsed.grosz)
}

export function amountToWords(input: string): { ok: true; words: string } | { ok: false; error: string } {
  const parsed = parseAmount(input)
  if (!parsed) return { ok: false, error: 'Podaj kwotę, na przykład 1234,56.' }
  if (parsed.zloty > 999_999_999_999n) {
    return { ok: false, error: 'Kwota może mieć najwyżej 12 cyfr przed przecinkiem.' }
  }
  const zloty = `${spell(parsed.zloty)} ${form(parsed.zloty, ['złoty', 'złote', 'złotych'])}`
  const words =
    parsed.grosz === 0
      ? zloty
      : `${zloty} ${spell(BigInt(parsed.grosz))} ${form(parsed.grosz, ['grosz', 'grosze', 'groszy'])}`
  return { ok: true, words: parsed.negative ? `minus ${words}` : words }
}

function parseAmount(input: string): { negative: boolean; zloty: bigint; grosz: number } | null {
  const compact = input.trim().replaceAll(' ', '').replaceAll('\u00A0', '')
  if (!compact || compact === '-' || compact === '+') return null
  const negative = compact.startsWith('-')
  const body = compact.replace(/^[+-]/, '')
  if (!/^[\d.,]+$/.test(body)) return null
  const decimal = decimalBody(body)
  if (!decimal) return null
  const [whole, fraction = ''] = decimal.split('.')
  if (!whole || !/^\d+$/.test(whole) || fraction.length > 2 || !/^\d*$/.test(fraction)) return null
  const grosz = Number(fraction.padEnd(2, '0') || '0')
  return { negative, zloty: BigInt(whole), grosz }
}

function decimalBody(body: string): string | null {
  const comma = body.lastIndexOf(',')
  const dot = body.lastIndexOf('.')
  if (comma >= 0 && dot >= 0) {
    const decimalIndex = Math.max(comma, dot)
    const separator = body[decimalIndex]
    const thousands = separator === ',' ? '.' : ','
    if (body.slice(0, decimalIndex).includes(separator) || body.slice(decimalIndex + 1).includes(thousands)) return null
    return `${body.slice(0, decimalIndex).replaceAll(thousands, '')}.${body.slice(decimalIndex + 1)}`
  }
  if (comma >= 0) return body.replace(',', '.')
  if (dot >= 0) {
    const pieces = body.split('.')
    if (pieces.length === 2 && (pieces[1] ?? '').length > 0 && (pieces[1] ?? '').length <= 2) {
      return `${pieces[0]}.${pieces[1]}`
    }
    if (pieces.slice(1).every((piece) => piece.length === 3)) return pieces.join('')
    return null
  }
  return body
}

function spell(value: bigint): string {
  if (value === 0n) return 'zero'
  const digits = value.toString()
  const groups: number[] = []
  for (let end = digits.length; end > 0; end -= 3) {
    groups.push(Number(digits.slice(Math.max(0, end - 3), end)))
  }
  const words: string[] = []
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index] ?? 0
    if (group === 0) continue
    const scale = scales[index]
    if (scale && group === 1) words.push(scale[0])
    else if (scale) words.push(`${underThousand(group)} ${form(group, scale)}`)
    else words.push(underThousand(group))
  }
  return words.join(' ')
}

function underThousand(value: number): string {
  const words: string[] = []
  const hundred = Math.floor(value / 100)
  const rest = value % 100
  if (hundred > 0) words.push(hundreds[hundred] ?? '')
  if (rest >= 10 && rest < 20) words.push(teens[rest - 10] ?? '')
  else {
    const ten = Math.floor(rest / 10)
    const one = rest % 10
    if (ten > 0) words.push(tens[ten] ?? '')
    if (one > 0) words.push(ones[one] ?? '')
  }
  return words.filter(Boolean).join(' ')
}

function form(value: bigint | number, forms: [string, string, string]): string {
  const count = typeof value === 'bigint' ? value : BigInt(value)
  if (count === 1n) return forms[0]
  const tail = Number(count % 100n)
  const last = tail % 10
  if (last >= 2 && last <= 4 && (tail < 12 || tail > 14)) return forms[1]
  return forms[2]
}
