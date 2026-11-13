import { brand } from '../../brand'
import { TEST_COPY_PREFIX, TEST_DATA_FIELD, TEST_DATA_MARKER } from '../../lib/generators/person'

export const META_TITLE_LIMIT = 60

export const ID_DOCUMENT_SLUGS = ['numer-dowodu-osobistego', 'numer-paszportu'] as const

export type IdDocumentSlug = (typeof ID_DOCUMENT_SLUGS)[number]

export interface IdDocumentExample {
  input: string
  output: string
  valid: boolean
}

export interface IdDocumentFaq {
  question: string
  answer: string
}

export interface IdDocumentLink {
  href: string
  label: string
}

export interface IdDocumentPage {
  slug: IdDocumentSlug
  h1: string
  lead: string
  metaTitlePhrase: string
  metaTitleFallback: string
  metaDescription: string
  keywords: readonly string[]
  intro: string
  steps: readonly string[]
  examples: readonly IdDocumentExample[]
  faq: readonly IdDocumentFaq[]
  related: readonly IdDocumentLink[]
  breadcrumb: readonly [string, string, string]
}

const copyStep = 'Skopiuj wynik albo pobierz plik CSV lub JSON.'

export const dowodPage: IdDocumentPage = {
  slug: 'numer-dowodu-osobistego',
  h1: 'Testowy numer dowodu osobistego – walidator i generator',
  lead: 'Sprawdź, czy seria i numer dowodu mają poprawny format i cyfrę kontrolną, albo wygeneruj numer testowy.',
  metaTitlePhrase: 'Testowy numer dowodu osobistego – walidator',
  metaTitleFallback: 'Testowy numer dowodu osobistego – walidator',
  metaDescription:
    'Sprawdza format i cyfrę kontrolną serii i numeru dowodu osobistego oraz tworzy numery testowe. Działa w przeglądarce, nie wysyłamy danych na serwer.',
  keywords: ['dowód', 'dowód osobisty', 'seria', 'numer dowodu', 'walidator', 'cyfra kontrolna'],
  intro:
    'Walidator sprawdza serię i numer polskiego dowodu osobistego: trzy litery, sześć cyfr i cyfrę kontrolną na czwartej pozycji. Generator tworzy losowe numery testowe o tym samym formacie, przydatne do testów walidacji pól w oprogramowaniu. Poprawny wynik oznacza tylko zgodność formatu i sumy kontrolnej. Nie potwierdza, że dokument o takim numerze istnieje.',
  steps: [
    'Wklej serię i numer w pole sprawdzania.',
    'Odczytaj wynik: poprawny albo powód błędu.',
    'Aby dostać numer testowy, kliknij „Generuj”.',
    copyStep,
  ],
  examples: [
    { input: 'XYZ712345', output: 'poprawny format i cyfra kontrolna', valid: true },
    { input: 'XYZ612345', output: 'błędna suma kontrolna', valid: false },
  ],
  faq: [
    {
      question: 'Jak zbudowany jest numer dowodu osobistego?',
      answer: 'Ma trzy litery serii i sześć cyfr. Pierwsza cyfra, czyli czwarty znak, jest cyfrą kontrolną.',
    },
    {
      question: 'Jak liczy się cyfrę kontrolną?',
      answer:
        'Litery zamienia się na liczby (A = 10, B = 11 … Z = 35), a wszystkie dziewięć znaków mnoży się przez wagi 7, 3, 1, 9, 7, 3, 1, 7, 3. W poprawnym numerze suma jest podzielna przez 10.',
    },
    {
      question: 'Czy numer testowy może należeć do prawdziwego dokumentu?',
      answer: 'Tak, przypadkowo może. Dlatego służy wyłącznie do testów oprogramowania.',
    },
  ],
  related: [
    { href: '/numer-paszportu', label: 'Testowy numer paszportu' },
    { href: '/generator-pesel', label: 'Generator PESEL' },
    { href: '/generator-danych-testowych', label: 'Generator danych testowych (osoba)' },
  ],
  breadcrumb: ['Strona główna', 'Dane testowe PL', 'Testowy numer dowodu osobistego'],
}

export const paszportPage: IdDocumentPage = {
  slug: 'numer-paszportu',
  h1: 'Testowy numer paszportu – walidator i generator',
  lead: 'Sprawdź, czy numer paszportu ma poprawny format i cyfrę kontrolną, albo wygeneruj numer testowy.',
  metaTitlePhrase: 'Testowy numer paszportu – walidator i generator',
  metaTitleFallback: 'Testowy numer paszportu – walidator',
  metaDescription:
    'Sprawdza format i cyfrę kontrolną numeru polskiego paszportu oraz tworzy numery testowe. Działa w przeglądarce, nie wysyłamy danych na serwer.',
  keywords: ['paszport', 'numer paszportu', 'walidator paszportu', 'cyfra kontrolna'],
  intro:
    'Walidator sprawdza numer polskiego paszportu: dwie litery i siedem cyfr, z cyfrą kontrolną na trzeciej pozycji. Generator tworzy losowe numery testowe o tym samym formacie, przydatne do testów walidacji pól w oprogramowaniu. Poprawny wynik oznacza tylko zgodność formatu i sumy kontrolnej. Nie potwierdza, że paszport o takim numerze istnieje.',
  steps: [
    'Wklej numer w pole sprawdzania.',
    'Odczytaj wynik: poprawny albo powód błędu.',
    'Aby dostać numer testowy, kliknij „Generuj”.',
    copyStep,
  ],
  examples: [
    { input: 'XY4123456', output: 'poprawny format i cyfra kontrolna', valid: true },
    { input: 'XY5123456', output: 'błędna suma kontrolna', valid: false },
  ],
  faq: [
    {
      question: 'Ile znaków ma numer paszportu?',
      answer: 'Dziewięć: dwie litery i siedem cyfr. Pierwsza cyfra, czyli trzeci znak, jest cyfrą kontrolną.',
    },
    {
      question: 'Jak liczy się cyfrę kontrolną?',
      answer:
        'Litery zamienia się na liczby (A = 10 … Z = 35), a dziewięć znaków mnoży się przez wagi 7, 3, 9, 1, 7, 3, 1, 7, 3. W poprawnym numerze suma jest podzielna przez 10.',
    },
    {
      question: 'Czy numer testowy może należeć do prawdziwego paszportu?',
      answer: 'Tak, przypadkowo może. Dlatego służy wyłącznie do testów oprogramowania.',
    },
  ],
  related: [
    { href: '/numer-dowodu-osobistego', label: 'Testowy numer dowodu osobistego' },
    { href: '/generator-pesel', label: 'Generator PESEL' },
    { href: '/generator-danych-testowych', label: 'Generator danych testowych (osoba)' },
  ],
  breadcrumb: ['Strona główna', 'Dane testowe PL', 'Testowy numer paszportu'],
}

const pages: Record<IdDocumentSlug, IdDocumentPage> = {
  'numer-dowodu-osobistego': dowodPage,
  'numer-paszportu': paszportPage,
}

export function isIdDocumentSlug(slug: string): slug is IdDocumentSlug {
  return (ID_DOCUMENT_SLUGS as readonly string[]).includes(slug)
}

export function idDocumentPage(slug: string): IdDocumentPage | null {
  if (!isIdDocumentSlug(slug)) return null
  return pages[slug]
}

export function documentTitleFor(page: IdDocumentPage): string {
  const suffix = ` — ${brand.name}`
  const preferred = `${page.metaTitlePhrase}${suffix}`
  if (preferred.length <= META_TITLE_LIMIT) return preferred
  return `${page.metaTitleFallback}${suffix}`
}

export function idDocumentDocumentTitle(slug: string): string | null {
  const page = idDocumentPage(slug)
  return page === null ? null : documentTitleFor(page)
}

export function presentIdNumber(formatted: string): string {
  return `${TEST_COPY_PREFIX} ${formatted}`
}

export function stripTestPrefix(input: string): string {
  if (!input.startsWith(TEST_COPY_PREFIX)) return input
  return input.slice(TEST_COPY_PREFIX.length).trimStart()
}

export function idDocumentExportFilename(slug: IdDocumentSlug, extension: 'csv' | 'json'): string {
  return `${slug}.${extension}`
}

export function idNumbersToCsv(lines: readonly string[]): string {
  const header = `numer,${TEST_DATA_FIELD}`
  const rows = lines.map((line) => `${csvField(line)},${TEST_DATA_MARKER}`)
  return [header, ...rows].join('\n')
}

export function idNumbersToJson(lines: readonly string[]): string {
  const records = lines.map((line) => ({
    numer: line,
    [TEST_DATA_FIELD]: TEST_DATA_MARKER,
  }))
  return JSON.stringify(records, null, 2)
}

const FORBIDDEN_PHRASES = [
  'generator dowodu',
  'generator paszportu',
  'ze zdjęciem',
  'mobywatel',
  'wzór',
  'wzor',
  'do weryfikacji',
  'fake',
  'podróbka',
  'do rejestracji',
  'kyc',
  '100% bezpieczne',
] as const

export function forbiddenIdCopyTerm(text: string): string | null {
  const folded = text.toLowerCase()
  for (const phrase of FORBIDDEN_PHRASES) {
    if (folded.includes(phrase)) return phrase
  }
  if (folded.includes('skan')) return 'skan'
  return null
}

export function idDocumentPublicText(page: IdDocumentPage): { label: string; text: string }[] {
  const fields: { label: string; text: string }[] = [
    { label: 'h1', text: page.h1 },
    { label: 'lead', text: page.lead },
    { label: 'metaTitlePhrase', text: page.metaTitlePhrase },
    { label: 'metaTitleFallback', text: page.metaTitleFallback },
    { label: 'documentTitle', text: documentTitleFor(page) },
    { label: 'metaDescription', text: page.metaDescription },
    { label: 'ogTitle', text: page.h1 },
    { label: 'intro', text: page.intro },
    { label: 'breadcrumb', text: page.breadcrumb.join(' › ') },
  ]
  page.steps.forEach((step, index) => {
    fields.push({ label: `step ${index + 1}`, text: step })
  })
  page.examples.forEach((example, index) => {
    fields.push({ label: `example ${index + 1} input`, text: example.input })
    fields.push({ label: `example ${index + 1} output`, text: example.output })
  })
  page.faq.forEach((item, index) => {
    fields.push({ label: `faq ${index + 1} question`, text: item.question })
    fields.push({ label: `faq ${index + 1} answer`, text: item.answer })
  })
  page.related.forEach((item, index) => {
    fields.push({ label: `related ${index + 1}`, text: `${item.label} ${item.href}` })
  })
  page.keywords.forEach((keyword, index) => {
    fields.push({ label: `keyword ${index + 1}`, text: keyword })
  })
  return fields
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}
