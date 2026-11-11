export type ToolCategory = 'generatory' | 'konwertery' | 'kodowanie' | 'tekst' | 'siec' | 'inne'

export interface ToolDefinition {
  slug: string
  title: string
  description: string
  category: ToolCategory
  keywords: string[]
  disclaimer?: string
  component: () => Promise<unknown>
}
