export const dataUnits = [
  { id: 'B', bytes: 1n },
  { id: 'KB', bytes: 1000n },
  { id: 'MB', bytes: 1000n ** 2n },
  { id: 'GB', bytes: 1000n ** 3n },
  { id: 'TB', bytes: 1000n ** 4n },
  { id: 'KiB', bytes: 1024n },
  { id: 'MiB', bytes: 1024n ** 2n },
  { id: 'GiB', bytes: 1024n ** 3n },
  { id: 'TiB', bytes: 1024n ** 4n },
] as const

export type DataUnit = (typeof dataUnits)[number]['id']

export function isDataUnit(value: string): value is DataUnit {
  return dataUnits.some((unit) => unit.id === value)
}

export function convertData(
  value: string,
  from: DataUnit,
): { ok: true; values: { id: DataUnit; text: string }[] } | { ok: false; error: string } {
  const bytes = toBytes(value, from)
  if (bytes === null) return { ok: false, error: 'Podaj nieujemną liczbę.' }
  return {
    ok: true,
    values: dataUnits.map((unit) => ({ id: unit.id, text: fromBytes(bytes, unit.bytes) })),
  }
}

function toBytes(value: string, from: DataUnit): bigint | null {
  const text = value.trim().replaceAll(' ', '').replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(text)) return null
  const [whole = '0', fraction = ''] = text.split('.')
  const scale = 10n ** BigInt(fraction.length)
  const scaled = BigInt(whole) * scale + BigInt(fraction || '0')
  const factor = dataUnits.find((unit) => unit.id === from)?.bytes ?? 1n
  return (scaled * factor + scale / 2n) / scale
}

function fromBytes(bytes: bigint, factor: bigint): string {
  const scale = 1_000_000n
  const scaled = (bytes * scale + factor / 2n) / factor
  const whole = scaled / scale
  const fraction = (scaled % scale).toString().padStart(6, '0').replace(/0+$/, '')
  const text = fraction ? `${whole}.${fraction}` : whole.toString()
  return text.replace('.', ',')
}
