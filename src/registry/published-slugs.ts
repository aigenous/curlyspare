/**
 * Public tool slugs. Navigation, search, prerender and the sitemap omit a
 * tool until its slug is listed here. The list now covers every tool.
 *
 * This module stays free of Vue imports so the Vite config can read it.
 */
export const publishedSlugList = [
  'csv-na-markdown',
  'curl-na-fetch',
  'dekoder-jwt',
  'edytor-markdown',
  'encje-html',
  'escape-unicode',
  'formatowanie-json',
  'formatowanie-sql',
  'formatowanie-xml',
  'generator-danych-testowych',
  'generator-ean',
  'generator-hasel',
  'generator-hmac',
  'generator-jwt',
  'generator-krs',
  'generator-nip',
  'generator-pesel',
  'generator-qr',
  'generator-regon',
  'generator-sha256',
  'generator-slug',
  'generator-uuid',
  'hex-na-rgb',
  'hex-na-tekst',
  'json-na-csv',
  'json-na-typescript',
  'json-na-yaml',
  'kalkulator-bajtow',
  'kalkulator-chmod',
  'kalkulator-dni-roboczych',
  'kalkulator-podsieci',
  'kalkulator-procentow',
  'kalkulator-vat',
  'kodowanie-base32',
  'kodowanie-base64',
  'kodowanie-url',
  'kompresja-gzip',
  'konwerter-isbn',
  'konwerter-stref-czasowych',
  'kwota-slownie',
  'licznik-znakow',
  'lorem-ipsum',
  'numer-dowodu-osobistego',
  'numer-paszportu',
  'parser-url',
  'parser-user-agent',
  'porownanie-tekstu',
  'roznica-dat',
  'sortowanie-alfabetyczne',
  'tester-jsonpath',
  'tester-regex',
  'toml-na-json',
  'unix-timestamp',
  'walidator-iban',
  'walidator-json-schema',
  'walidator-vat-ue',
  'walidator-vin',
  'wyrazenie-cron',
  'xml-na-json',
  'zamiana-systemow-liczbowych',
  'zmiana-wielkosci-liter',
] as const

export const shellPaths = ['/', '/regulamin', '/polityka-prywatnosci', '/operator', '/licencje'] as const

export function visibleSlugs(registered: readonly string[], includeDrafts: boolean): string[] {
  if (includeDrafts) return [...registered]
  const allowed = new Set<string>(publishedSlugList)
  return registered.filter((slug) => allowed.has(slug))
}
