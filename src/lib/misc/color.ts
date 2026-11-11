export interface Rgb {
  r: number
  g: number
  b: number
}

export interface Hsl {
  h: number
  s: number
  l: number
}

export function parseHex(input: string): Rgb | null {
  const hex = input.trim().replace(/^#/, '')
  const full = hex.length === 3 ? hex.split('').map((char) => char + char).join('') : hex
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return {
    r: Number.parseInt(full.slice(0, 2), 16),
    g: Number.parseInt(full.slice(2, 4), 16),
    b: Number.parseInt(full.slice(4, 6), 16),
  }
}

export function formatHex(rgb: Rgb): string {
  return `#${toByte(rgb.r)}${toByte(rgb.g)}${toByte(rgb.b)}`
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = clampByte(rgb.r) / 255
  const g = clampByte(rgb.g) / 255
  const b = clampByte(rgb.b) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2
  if (delta === 0) return { h: 0, s: 0, l: round(lightness * 100) }
  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  const hueSector = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
  let hue = hueSector * 60
  if (hue < 0) hue += 360
  return { h: round(hue), s: round(saturation * 100), l: round(lightness * 100) }
}

export function hslToRgb(hsl: Hsl): Rgb {
  const h = ((hsl.h % 360) + 360) % 360
  const s = clampPercent(hsl.s) / 100
  const l = clampPercent(hsl.l) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = hslChannels(h, c, x)
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  }
}

function hslChannels(h: number, c: number, x: number): [number, number, number] {
  if (h < 60) return [c, x, 0]
  if (h < 120) return [x, c, 0]
  if (h < 180) return [0, c, x]
  if (h < 240) return [0, x, c]
  if (h < 300) return [x, 0, c]
  return [c, 0, x]
}

function toByte(value: number): string {
  return clampByte(value).toString(16).padStart(2, '0')
}

function clampByte(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(255, Math.max(0, Math.round(value)))
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(100, Math.max(0, value))
}

function round(value: number): number {
  return Math.round(value * 10) / 10
}
