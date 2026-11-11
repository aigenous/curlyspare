export type CaseMode = 'upper' | 'lower' | 'sentence' | 'title' | 'camel' | 'snake' | 'kebab'

const modes: readonly CaseMode[] = ['upper', 'lower', 'sentence', 'title', 'camel', 'snake', 'kebab']

export function isCaseMode(value: string): value is CaseMode {
  return (modes as readonly string[]).includes(value)
}

function words(input: string): string[] {
  return input
    .split(/[^\p{L}\p{N}]+/u)
    .map((word) => word.trim())
    .filter(Boolean)
}

function capitalize(word: string): string {
  const chars = Array.from(word.toLocaleLowerCase('pl-PL'))
  const first = chars[0]
  if (!first) return ''
  return first.toLocaleUpperCase('pl-PL') + chars.slice(1).join('')
}

export function convertCase(input: string, mode: CaseMode): string {
  switch (mode) {
    case 'upper':
      return input.toLocaleUpperCase('pl-PL')
    case 'lower':
      return input.toLocaleLowerCase('pl-PL')
    case 'sentence':
      return input.toLocaleLowerCase('pl-PL').replace(/(^|[.!?]\s+)(\p{L})/gu, (_, prefix: string, letter: string) => {
        return prefix + letter.toLocaleUpperCase('pl-PL')
      })
    case 'title':
      return words(input).map(capitalize).join(' ')
    case 'camel':
      return words(input)
        .map((word, index) => (index === 0 ? word.toLocaleLowerCase('pl-PL') : capitalize(word)))
        .join('')
    case 'snake':
      return words(input)
        .map((word) => word.toLocaleLowerCase('pl-PL'))
        .join('_')
    case 'kebab':
      return words(input)
        .map((word) => word.toLocaleLowerCase('pl-PL'))
        .join('-')
    default: {
      const unreachable: never = mode
      return unreachable
    }
  }
}
