import type { ToolDefinition } from '../registry/types'

export function fold(value: string): string {
  return value
    .replaceAll('ł', 'l')
    .replaceAll('Ł', 'L')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

function matchesNameOrSlug(tool: ToolDefinition, parts: readonly string[]): boolean {
  const title = fold(tool.title)
  const slug = fold(tool.slug)
  return parts.every((part) => title.includes(part) || slug.includes(part))
}

export function filterTools(list: readonly ToolDefinition[], query: string): ToolDefinition[] {
  const parts = fold(query).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return [...list]
  return list
    .map((tool, index) => ({ tool, index }))
    .filter(({ tool }) => {
      const haystack = fold([tool.title, tool.slug, tool.description, tool.category, ...tool.keywords].join(' '))
      return parts.every((part) => haystack.includes(part))
    })
    .sort((left, right) => {
      const rank = Number(matchesNameOrSlug(right.tool, parts)) - Number(matchesNameOrSlug(left.tool, parts))
      return rank || left.index - right.index
    })
    .map(({ tool }) => tool)
}
