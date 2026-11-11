export interface ChmodMode {
  octal: string
  symbolic: string
  setuid: boolean
  setgid: boolean
  sticky: boolean
}

export function chmodFromOctal(value: string): { ok: true; mode: ChmodMode } | { ok: false; error: string } {
  const digits = value.trim()
  if (!/^[0-7]{3,4}$/.test(digits)) return { ok: false, error: 'Podaj 3 albo 4 cyfry ósemkowe, na przykład 755 albo 4755.' }
  const padded = digits.padStart(4, '0')
  return { ok: true, mode: fromBits(Number.parseInt(padded, 8)) }
}

export function chmodFromSymbolic(value: string): { ok: true; mode: ChmodMode } | { ok: false; error: string } {
  const text = value.trim()
  if (!/^[r-][w-][xsS-][r-][w-][xsS-][r-][w-][xtT-]$/.test(text)) {
    return { ok: false, error: 'Zapis symboliczny ma mieć 9 znaków, na przykład rwxr-xr-x.' }
  }
  let bits = 0
  const classes = [0, 3, 6]
  for (const start of classes) {
    const read = text[start] === 'r'
    const write = text[start + 1] === 'w'
    const execChar = text[start + 2] ?? '-'
    const exec = execChar === 'x' || execChar === 's' || execChar === 't'
    const nibble = (read ? 4 : 0) + (write ? 2 : 0) + (exec ? 1 : 0)
    bits |= nibble << (6 - start)
  }
  if (text[2] === 's' || text[2] === 'S') bits |= 0o4000
  if (text[5] === 's' || text[5] === 'S') bits |= 0o2000
  if (text[8] === 't' || text[8] === 'T') bits |= 0o1000
  return { ok: true, mode: fromBits(bits) }
}

function fromBits(bits: number): ChmodMode {
  const octal = bits.toString(8).padStart(4, '0')
  const special = Number.parseInt(octal[0] ?? '0', 8)
  const user = Number.parseInt(octal[1] ?? '0', 8)
  const group = Number.parseInt(octal[2] ?? '0', 8)
  const other = Number.parseInt(octal[3] ?? '0', 8)
  return {
    octal,
    symbolic: `${triplet(user, special & 4, 's', 'S')}${triplet(group, special & 2, 's', 'S')}${triplet(other, special & 1, 't', 'T')}`,
    setuid: (special & 4) !== 0,
    setgid: (special & 2) !== 0,
    sticky: (special & 1) !== 0,
  }
}

function triplet(nibble: number, special: number, on: string, off: string): string {
  const read = (nibble & 4) !== 0 ? 'r' : '-'
  const write = (nibble & 2) !== 0 ? 'w' : '-'
  const exec = (nibble & 1) !== 0
  const flag = special ? (exec ? on : off) : exec ? 'x' : '-'
  return `${read}${write}${flag}`
}
