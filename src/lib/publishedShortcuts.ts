import { publicTools } from '../registry/published'

/** Home chips and footer tool links. Empty when the publish list is empty. */
export const shortcutDefinitions = [
  { slug: 'generator-pesel', label: 'PESEL' },
  { slug: 'generator-nip', label: 'NIP' },
  { slug: 'walidator-iban', label: 'IBAN' },
  { slug: 'formatowanie-json', label: 'JSON' },
  { slug: 'kodowanie-base64', label: 'Base64' },
  { slug: 'generator-uuid', label: 'UUID' },
] as const

export function publishedShortcuts() {
  const published = new Set(publicTools().map((tool) => tool.slug))
  return shortcutDefinitions.filter((shortcut) => published.has(shortcut.slug))
}
