import type { ToolDefinition } from '../registry/types'

export function fold(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '')
}

export function filterTools(list: readonly ToolDefinition[], query: string): ToolDefinition[] {
  const parts = fold(query).trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return [...list]
  return list.filter((tool) => {
    const haystack = fold([tool.title, tool.description, tool.category, ...tool.keywords].join(' '))
    return parts.every((part) => haystack.includes(part))
  })
}
