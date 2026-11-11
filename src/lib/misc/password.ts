export const passwordMinLength = 4
export const passwordMaxLength = 128

export interface PasswordClasses {
  lower: boolean
  upper: boolean
  digits: boolean
  symbols: boolean
}

const alphabets = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{}:,.?/',
} as const

const classOrder = ['lower', 'upper', 'digits', 'symbols'] as const

export type PasswordClassName = (typeof classOrder)[number]
export type EntropyLevel = 'niska' | 'umiarkowana' | 'wysoka'
export type PasswordFailure = 'length' | 'classes'

export function passwordAlphabet(classes: PasswordClasses): string {
  return classOrder
    .filter((name) => classes[name])
    .map((name) => alphabets[name])
    .join('')
}

export function entropyBits(length: number, alphabetSize: number): number {
  if (length <= 0 || alphabetSize < 2) return 0
  return Math.round(length * Math.log2(alphabetSize) * 10) / 10
}

export function entropyLevel(bits: number): EntropyLevel {
  if (bits < 50) return 'niska'
  if (bits < 80) return 'umiarkowana'
  return 'wysoka'
}

export function cryptoRandomInt(upperBound: number): number {
  if (!Number.isInteger(upperBound) || upperBound < 1 || upperBound > 0xffff_ffff) {
    throw new RangeError('Górna granica losowania jest poza zakresem.')
  }
  const range = 0x1_0000_0000
  const limit = range - (range % upperBound)
  const buffer = new Uint32Array(1)
  for (;;) {
    crypto.getRandomValues(buffer)
    const value = buffer[0] ?? 0
    if (value < limit) return value % upperBound
  }
}

export function generatePassword(
  length: number,
  classes: PasswordClasses,
  randomInt: (upperBound: number) => number,
):
  | { ok: true; password: string; bits: number; level: EntropyLevel }
  | { ok: false; reason: PasswordFailure } {
  if (!Number.isInteger(length) || length < passwordMinLength || length > passwordMaxLength) {
    return { ok: false, reason: 'length' }
  }
  const sets = classOrder.filter((name) => classes[name]).map((name) => alphabets[name])
  if (sets.length === 0) return { ok: false, reason: 'classes' }
  if (length < sets.length) return { ok: false, reason: 'length' }

  const pool = sets.join('')
  const chars: string[] = sets.map((set) => set[randomInt(set.length)] ?? '')
  while (chars.length < length) chars.push(pool[randomInt(pool.length)] ?? '')
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swap = randomInt(index + 1)
    const current = chars[index] ?? ''
    chars[index] = chars[swap] ?? ''
    chars[swap] = current
  }
  const bits = entropyBits(length, pool.length)
  return { ok: true, password: chars.join(''), bits, level: entropyLevel(bits) }
}
