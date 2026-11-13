const polishRules = new Intl.PluralRules('pl')

export type ToolNoun = 'narzędzie' | 'narzędzia' | 'narzędzi'

/** Polish plural of the tool noun, via Intl.PluralRules('pl'). */
export function toolNoun(count: number): ToolNoun {
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
export function toolCountPhrase(count: number): string {
  if (count === 0) return ''
  return `${count} ${toolNoun(count)}`
}

export function publishedToolLeadStart(count: number): string {
  if (count === 0) return 'Darmowe narzędzia'
  const word = toolNoun(count)
  const adjective = word === 'narzędzi' ? 'darmowych' : 'darmowe'
  return `${count} ${adjective} ${word}`
}

export function publishedToolSearchLabel(count: number): string {
  if (count === 0) return 'Szukaj narzędzia'
  return `Szukaj wśród ${toolCountPhrase(count)}`
}
