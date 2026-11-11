export const lineOrders = ['none', 'asc', 'desc'] as const

export type LineOrder = (typeof lineOrders)[number]

export interface LineOptions {
  order: LineOrder
  unique: boolean
  trim: boolean
  dropEmpty: boolean
}

export function isLineOrder(value: string): value is LineOrder {
  return (lineOrders as readonly string[]).includes(value)
}

export function arrangeLines(text: string, options: LineOptions): { text: string; inputCount: number; outputCount: number } {
  const raw = text.length === 0 ? [] : text.split(/\r?\n/)
  let lines = raw.map((line) => (options.trim ? line.trim() : line))
  if (options.dropEmpty) lines = lines.filter((line) => line.length > 0)
  if (options.unique) lines = [...new Set(lines)]
  if (options.order !== 'none') {
    const direction = options.order === 'asc' ? 1 : -1
    lines = [...lines].sort((left, right) => left.localeCompare(right, 'pl') * direction)
  }
  return { text: lines.join('\n'), inputCount: raw.length, outputCount: lines.length }
}
