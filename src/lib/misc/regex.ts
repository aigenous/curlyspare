export const regexFlags = ['d', 'g', 'i', 'm', 's', 'u', 'v', 'y'] as const

export type RegexFlag = (typeof regexFlags)[number]

export interface RegexGroup {
  key: string
  value: string | null
}

export interface RegexHit {
  index: number
  length: number
  text: string
  groups: RegexGroup[]
}

export interface TextSpan {
  text: string
  match: boolean
}

export function isRegexFlag(value: string): value is RegexFlag {
  return (regexFlags as readonly string[]).includes(value)
}

export function matchRegex(
  pattern: string,
  flags: readonly RegexFlag[],
  text: string,
): { ok: true; matches: RegexHit[] } | { ok: false; error: string } {
  const selected = [...new Set(flags)]
  if (selected.includes('u') && selected.includes('v')) {
    return { ok: false, error: 'Flagi u i v wykluczają się.' }
  }
  let expression: RegExp
  try {
    expression = new RegExp(pattern, selected.slice().sort().join(''))
  } catch {
    return { ok: false, error: 'Niepoprawne wyrażenie regularne.' }
  }
  const repeated = selected.includes('g') || selected.includes('y')
  const matches: RegexHit[] = []
  if (!repeated) {
    const found = expression.exec(text)
    if (found) matches.push(toHit(found))
    return { ok: true, matches }
  }
  const limit = text.length + 1
  for (let guard = 0; guard < limit; guard += 1) {
    const found = expression.exec(text)
    if (!found) break
    matches.push(toHit(found))
    if (found[0].length === 0) expression.lastIndex += 1
  }
  return { ok: true, matches }
}

export function highlightSpans(
  text: string,
  matches: readonly Pick<RegexHit, 'index' | 'length'>[],
): TextSpan[] {
  const spans: TextSpan[] = []
  let cursor = 0
  const ordered = [...matches].sort((left, right) => left.index - right.index)
  for (const match of ordered) {
    if (match.index < cursor || match.length <= 0) continue
    const end = Math.min(text.length, match.index + match.length)
    if (match.index > cursor) spans.push({ text: text.slice(cursor, match.index), match: false })
    spans.push({ text: text.slice(match.index, end), match: true })
    cursor = end
  }
  if (cursor < text.length) spans.push({ text: text.slice(cursor), match: false })
  return spans
}

function toHit(found: RegExpExecArray): RegexHit {
  const groups: RegexGroup[] = []
  for (let index = 1; index < found.length; index += 1) {
    groups.push({ key: String(index), value: found[index] ?? null })
  }
  for (const [name, value] of Object.entries(found.groups ?? {})) {
    groups.push({ key: name, value: value ?? null })
  }
  return { index: found.index, length: found[0].length, text: found[0], groups }
}
