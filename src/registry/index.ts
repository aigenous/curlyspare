import { converterTools } from '../tools/converters'
import { generatorTools } from '../tools/generators'
import { miscTools } from '../tools/misc'
import type { ToolCategory, ToolDefinition } from './types'

export const categories: readonly ToolCategory[] = [
  'generatory',
  'konwertery',
  'kodowanie',
  'tekst',
  'siec',
  'inne',
]

export const tools: ToolDefinition[] = [...generatorTools, ...converterTools, ...miscTools]

const reservedSlugs = new Set(['regulamin', 'polityka-prywatnosci', 'operator', '404'])

export function findTool(slug: string): ToolDefinition | undefined {
  return tools.find((tool) => tool.slug === slug)
}

export function assertRegistry(): void {
  const seen = new Set<string>()
  for (const tool of tools) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tool.slug) || reservedSlugs.has(tool.slug)) {
      throw new Error(`Invalid tool slug: ${tool.slug}`)
    }
    if (seen.has(tool.slug)) {
      throw new Error(`Duplicate tool slug: ${tool.slug}`)
    }
    seen.add(tool.slug)
  }
}
