export function percentOf(percentText: string, wholeText: string): { ok: true; text: string } | { ok: false; error: string } {
  const percent = parseDecimal(percentText)
  const whole = parseDecimal(wholeText)
  if (percent === null || whole === null) return { ok: false, error: 'Podaj obie liczby.' }
  return { ok: true, text: formatDecimal((percent * whole) / 100) }
}

export function ratioPercent(partText: string, wholeText: string): { ok: true; text: string } | { ok: false; error: string } {
  const part = parseDecimal(partText)
  const whole = parseDecimal(wholeText)
  if (part === null || whole === null) return { ok: false, error: 'Podaj obie liczby.' }
  if (whole === 0) return { ok: false, error: 'Nie można dzielić przez zero.' }
  return { ok: true, text: formatDecimal((part / whole) * 100) }
}

export function percentChange(fromText: string, toText: string): { ok: true; text: string } | { ok: false; error: string } {
  const from = parseDecimal(fromText)
  const to = parseDecimal(toText)
  if (from === null || to === null) return { ok: false, error: 'Podaj obie liczby.' }
  if (from === 0) return { ok: false, error: 'Nie można liczyć zmiany od zera.' }
  return { ok: true, text: formatDecimal(((to - from) / from) * 100) }
}

export function adjustPercent(
  baseText: string,
  percentText: string,
  direction: 'add' | 'subtract',
): { ok: true; text: string } | { ok: false; error: string } {
  const base = parseDecimal(baseText)
  const percent = parseDecimal(percentText)
  if (base === null || percent === null) return { ok: false, error: 'Podaj obie liczby.' }
  const sign = direction === 'add' ? 1 : -1
  return { ok: true, text: formatDecimal(base * (1 + (sign * percent) / 100)) }
}

function parseDecimal(value: string): number | null {
  const text = value.trim().replaceAll(' ', '').replace(',', '.')
  if (!/^[+-]?\d+(\.\d+)?$/.test(text)) return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

function formatDecimal(value: number): string {
  const rounded = Math.round(value * 1_000_000) / 1_000_000
  return rounded.toString().replace('.', ',')
}
