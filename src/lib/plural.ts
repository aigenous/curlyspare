const polishRules = new Intl.PluralRules('pl')

export type NarzedzieWord = 'narzędzie' | 'narzędzia' | 'narzędzi'

/** Polish plural for "narzędzie", via Intl.PluralRules('pl'). */
export function narzedzieWord(count: number): NarzedzieWord {
  const category = polishRules.select(count)
  switch (category) {
    case 'one':
      return 'narzędzie'
    case 'few':
      return 'narzędzia'
    case 'many':
    case 'other':
    case 'zero':
    case 'two':
      return 'narzędzi'
    default: {
      const unreachable: never = category
      return unreachable
    }
  }
}

/** Count plus the matching noun. Zero hides the number so the sentence can stand alone. */
export function narzedzieCount(count: number): string {
  if (count === 0) return ''
  return `${count} ${narzedzieWord(count)}`
}

export function publishedToolLeadStart(count: number): string {
  if (count === 0) return 'Darmowe narzędzia'
  const word = narzedzieWord(count)
  const adjective = word === 'narzędzi' ? 'darmowych' : 'darmowe'
  return `${count} ${adjective} ${word}`
}

export function publishedToolSearchLabel(count: number): string {
  if (count === 0) return 'Szukaj narzędzia'
  return `Szukaj wśród ${narzedzieCount(count)}`
}
