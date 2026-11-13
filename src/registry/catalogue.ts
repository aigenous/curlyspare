import type { ToolDefinition } from './types'

/**
 * Landing groups and row copy.
 * Order and design labels follow the Product Owner list, revision 5 (2026-11-13).
 * A row without its own label or description uses the registry tool.
 * Public slugs are unchanged. This file does not change ToolDefinition.
 */

export const catalogueGroupIds = [
  'identifiers',
  'test-data',
  'encoding',
  'formatting',
  'text-and-numbers',
  'time',
  'network',
  'hashes',
] as const

export type CatalogueGroupId = (typeof catalogueGroupIds)[number]

export type LandingKind =
  | 'validator'
  | 'generator'
  | 'converter'
  | 'formatter'
  | 'preview'
  | 'tester'
  | 'calculator'

export const landingKindLabel: Record<LandingKind, string> = {
  validator: 'walidator',
  generator: 'generator',
  converter: 'konwerter',
  formatter: 'formater',
  preview: 'podgląd',
  tester: 'tester',
  calculator: 'kalkulator',
}

export interface CatalogueGroup {
  id: CatalogueGroupId
  label: string
  anchor: string
  legacyAnchors: readonly string[]
}

export const catalogueGroups: readonly CatalogueGroup[] = [
  {
    id: 'identifiers',
    label: 'Identyfikatory',
    anchor: 'identyfikatory',
    legacyAnchors: ['polskie-identyfikatory'],
  },
  { id: 'test-data', label: 'Dane testowe', anchor: 'dane-testowe', legacyAnchors: [] },
  { id: 'encoding', label: 'Kodowanie', anchor: 'kodowanie', legacyAnchors: [] },
  {
    id: 'formatting',
    label: 'Formatowanie i dane',
    anchor: 'formatowanie-i-dane',
    legacyAnchors: [],
  },
  {
    id: 'text-and-numbers',
    label: 'Tekst i liczby',
    anchor: 'tekst-i-liczby',
    legacyAnchors: ['tekst'],
  },
  { id: 'time', label: 'Czas', anchor: 'czas', legacyAnchors: [] },
  {
    id: 'network',
    label: 'Sieć i system',
    anchor: 'siec-i-system',
    legacyAnchors: ['siec'],
  },
  { id: 'hashes', label: 'Hashe', anchor: 'hashe', legacyAnchors: [] },
]

interface LandingRowSource {
  slug: string
  groupId: CatalogueGroupId
  kind: LandingKind
  label?: string
  description?: string
}

const landingRowSources: readonly LandingRowSource[] = [
  { slug: 'generator-pesel', groupId: 'identifiers', kind: 'validator', label: 'Walidator PESEL', description: 'Suma kontrolna, data urodzenia i płeć' },
  { slug: 'generator-nip', groupId: 'identifiers', kind: 'validator', label: 'Walidator NIP', description: 'Suma kontrolna i budowa numeru' },
  { slug: 'generator-regon', groupId: 'identifiers', kind: 'validator', label: 'Walidator REGON', description: 'Numery 9- i 14-cyfrowe' },
  { slug: 'walidator-iban', groupId: 'identifiers', kind: 'validator', label: 'Walidator IBAN i NRB', description: 'Suma mod 97 i numer rozliczeniowy banku' },
  { slug: 'numer-dowodu-osobistego', groupId: 'identifiers', kind: 'validator', label: 'Walidator numeru dowodu', description: 'Cyfra kontrolna serii i numeru' },
  { slug: 'numer-paszportu', groupId: 'identifiers', kind: 'validator' },
  { slug: 'generator-krs', groupId: 'identifiers', kind: 'generator' },
  { slug: 'walidator-vat-ue', groupId: 'identifiers', kind: 'validator' },
  { slug: 'walidator-vin', groupId: 'identifiers', kind: 'validator' },
  { slug: 'konwerter-isbn', groupId: 'identifiers', kind: 'converter' },

  { slug: 'generator-pesel', groupId: 'test-data', kind: 'generator', label: 'Generator PESEL', description: 'Numery [TEST] dla wybranej daty i płci' },
  { slug: 'generator-nip', groupId: 'test-data', kind: 'generator', label: 'Generator NIP', description: 'Numery [TEST] z poprawną sumą kontrolną' },
  { slug: 'generator-regon', groupId: 'test-data', kind: 'generator', label: 'Generator REGON', description: 'Numery [TEST], 9 lub 14 cyfr' },
  { slug: 'walidator-iban', groupId: 'test-data', kind: 'generator', label: 'Generator IBAN', description: 'Polskie rachunki [TEST] do formularzy' },
  { slug: 'generator-danych-testowych', groupId: 'test-data', kind: 'generator', label: 'Generator osoby testowej', description: 'Fikcyjne imiona, nazwiska i adresy' },
  { slug: 'generator-uuid', groupId: 'test-data', kind: 'generator', label: 'Generator UUID', description: 'Wersje 4 i 7, pojedynczo lub seriami' },
  { slug: 'generator-hasel', groupId: 'test-data', kind: 'generator', label: 'Generator haseł', description: 'Długość, zestawy znaków, entropia' },
  { slug: 'lorem-ipsum', groupId: 'test-data', kind: 'generator', label: 'Lorem ipsum po polsku', description: 'Tekst zastępczy z polskimi znakami' },
  { slug: 'generator-ean', groupId: 'test-data', kind: 'generator' },

  { slug: 'kodowanie-base64', groupId: 'encoding', kind: 'converter', label: 'Base64', description: 'Kodowanie i dekodowanie tekstu oraz plików' },
  { slug: 'kodowanie-url', groupId: 'encoding', kind: 'converter', label: 'URL encode / decode', description: 'Znaki specjalne w adresach i parametrach' },
  { slug: 'encje-html', groupId: 'encoding', kind: 'converter', label: 'Encje HTML', description: 'Zamiana znaków na encje i z powrotem' },
  { slug: 'dekoder-jwt', groupId: 'encoding', kind: 'preview', label: 'Dekoder JWT', description: 'Nagłówek, payload i daty ważności' },
  { slug: 'hex-na-tekst', groupId: 'encoding', kind: 'converter', label: 'Hex ↔ tekst', description: 'Zapis szesnastkowy bajtów UTF-8' },
  { slug: 'zamiana-systemow-liczbowych', groupId: 'encoding', kind: 'converter', label: 'Systemy liczbowe', description: 'Dwójkowy, ósemkowy, dziesiętny, szesnastkowy' },
  { slug: 'escape-unicode', groupId: 'encoding', kind: 'converter', label: 'Unicode escape', description: 'Sekwencje \\u i punkty kodowe' },
  { slug: 'kodowanie-base32', groupId: 'encoding', kind: 'converter' },
  { slug: 'generator-jwt', groupId: 'encoding', kind: 'generator' },
  { slug: 'kompresja-gzip', groupId: 'encoding', kind: 'converter' },
  { slug: 'generator-qr', groupId: 'encoding', kind: 'generator' },

  { slug: 'formatowanie-json', groupId: 'formatting', kind: 'formatter', label: 'Formater JSON', description: 'Wcięcia, walidacja, minifikacja' },
  { slug: 'json-na-yaml', groupId: 'formatting', kind: 'converter', label: 'JSON ↔ YAML', description: 'Konwersja w obie strony' },
  { slug: 'json-na-csv', groupId: 'formatting', kind: 'converter', label: 'JSON ↔ CSV', description: 'Tablice obiektów jako tabela' },
  { slug: 'formatowanie-xml', groupId: 'formatting', kind: 'formatter', label: 'Formater XML', description: 'Wcięcia i sprawdzenie poprawności' },
  { slug: 'formatowanie-sql', groupId: 'formatting', kind: 'formatter', label: 'Formater SQL', description: 'Czytelne zapytania, wybór dialektu' },
  { slug: 'edytor-markdown', groupId: 'formatting', kind: 'preview', label: 'Podgląd Markdown', description: 'Edytor z podglądem na żywo' },
  { slug: 'porownanie-tekstu', groupId: 'formatting', kind: 'preview', label: 'Porównywarka tekstu', description: 'Różnice linia po linii' },
  { slug: 'walidator-json-schema', groupId: 'formatting', kind: 'validator' },
  { slug: 'xml-na-json', groupId: 'formatting', kind: 'converter' },
  { slug: 'json-na-typescript', groupId: 'formatting', kind: 'converter' },
  { slug: 'tester-jsonpath', groupId: 'formatting', kind: 'tester' },
  { slug: 'toml-na-json', groupId: 'formatting', kind: 'converter' },
  { slug: 'csv-na-markdown', groupId: 'formatting', kind: 'converter' },

  { slug: 'tester-regex', groupId: 'text-and-numbers', kind: 'tester', label: 'Tester wyrażeń regularnych', description: 'Dopasowania, grupy i flagi' },
  { slug: 'kwota-slownie', groupId: 'text-and-numbers', kind: 'converter', label: 'Kwota słownie', description: 'Złote i grosze zapisane słowami' },
  { slug: 'licznik-znakow', groupId: 'text-and-numbers', kind: 'calculator', label: 'Licznik znaków i słów', description: 'Znaki, słowa, linie, akapity' },
  { slug: 'zmiana-wielkosci-liter', groupId: 'text-and-numbers', kind: 'converter', label: 'Zmiana wielkości liter', description: 'camelCase, snake_case, kebab-case' },
  { slug: 'generator-slug', groupId: 'text-and-numbers', kind: 'converter', label: 'Slug bez polskich znaków', description: 'ą→a, ł→l, spacje na myślniki' },
  { slug: 'sortowanie-alfabetyczne', groupId: 'text-and-numbers', kind: 'converter', label: 'Sortowanie linii', description: 'Sortowanie i usuwanie duplikatów' },
  { slug: 'kalkulator-procentow', groupId: 'text-and-numbers', kind: 'calculator' },
  { slug: 'kalkulator-vat', groupId: 'text-and-numbers', kind: 'calculator' },
  { slug: 'hex-na-rgb', groupId: 'text-and-numbers', kind: 'converter' },

  { slug: 'unix-timestamp', groupId: 'time', kind: 'converter', label: 'Konwerter timestamp', description: 'Unix ↔ data, sekundy i milisekundy' },
  { slug: 'roznica-dat', groupId: 'time', kind: 'calculator', label: 'Kalkulator dat', description: 'Różnica dat w latach, miesiącach i dniach' },
  { slug: 'kalkulator-dni-roboczych', groupId: 'time', kind: 'calculator' },
  { slug: 'wyrazenie-cron', groupId: 'time', kind: 'preview', label: 'Objaśniacz cron', description: 'Wyrażenie cron opisane słowami' },
  { slug: 'konwerter-stref-czasowych', groupId: 'time', kind: 'converter', label: 'Strefy czasowe', description: 'Ta sama chwila w kilku strefach' },

  { slug: 'kalkulator-podsieci', groupId: 'network', kind: 'calculator', label: 'Kalkulator CIDR', description: 'Maska, zakres adresów, liczba hostów' },
  { slug: 'parser-url', groupId: 'network', kind: 'preview', label: 'Parser URL', description: 'Adres rozłożony na części' },
  { slug: 'curl-na-fetch', groupId: 'network', kind: 'converter' },
  { slug: 'parser-user-agent', groupId: 'network', kind: 'preview' },
  { slug: 'kalkulator-chmod', groupId: 'network', kind: 'calculator' },
  { slug: 'kalkulator-bajtow', groupId: 'network', kind: 'calculator' },

  { slug: 'generator-sha256', groupId: 'hashes', kind: 'calculator', label: 'Hashe SHA', description: 'SHA-1, SHA-256, SHA-512' },
  { slug: 'generator-hmac', groupId: 'hashes', kind: 'calculator', label: 'HMAC', description: 'Podpis wiadomości kluczem' },
]

export interface LandingRow {
  key: string
  slug: string
  groupId: CatalogueGroupId
  kind: LandingKind
  kindLabel: string
  label: string
  description: string
}

type ListedTool = Pick<ToolDefinition, 'slug' | 'title' | 'description'>

export function landingRowsFor(tools: readonly ListedTool[]): LandingRow[] {
  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]))
  const rows: LandingRow[] = []
  landingRowSources.forEach((source, index) => {
    const tool = bySlug.get(source.slug)
    if (!tool) return
    rows.push({
      key: `${source.groupId}-${source.slug}-${index}`,
      slug: source.slug,
      groupId: source.groupId,
      kind: source.kind,
      kindLabel: landingKindLabel[source.kind],
      label: source.label ?? tool.title,
      description: source.description ?? tool.description,
    })
  })
  return rows
}

export function groupedLandingRows(tools: readonly ListedTool[]): { group: CatalogueGroup; rows: LandingRow[] }[] {
  const rows = landingRowsFor(tools)
  return catalogueGroups
    .map((group) => ({ group, rows: rows.filter((row) => row.groupId === group.id) }))
    .filter((section) => section.rows.length > 0)
}

export function primaryGroupFor(slug: string): CatalogueGroup {
  const source = landingRowSources.find((row) => row.slug === slug)
  if (!source) throw new Error(`Tool has no catalogue group: ${slug}`)
  const group = catalogueGroups.find((item) => item.id === source.groupId)
  if (!group) throw new Error(`Unknown catalogue group: ${source.groupId}`)
  return group
}

export function relatedInGroup(slug: string, tools: readonly ListedTool[], limit = 4): { slug: string; label: string }[] {
  const groupId = primaryGroupFor(slug).id
  const seen = new Set<string>()
  const links: { slug: string; label: string }[] = []
  for (const row of landingRowsFor(tools)) {
    if (row.groupId !== groupId || row.slug === slug || seen.has(row.slug)) continue
    seen.add(row.slug)
    links.push({ slug: row.slug, label: row.label })
    if (links.length === limit) break
  }
  return links
}

/** Old catalogue anchors from the design. Returns the current anchor, or null. */
export function legacyAnchorRedirect(hash: string): string | null {
  const id = hash.replace(/^#/, '')
  if (id === '') return null
  const group = catalogueGroups.find((item) => item.legacyAnchors.includes(id))
  return group ? group.anchor : null
}

export function catalogueSourceCount(): number {
  return landingRowSources.length
}
