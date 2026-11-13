import type { ToolCategory } from './registry/types'

const messages = {
  skip: 'Przejdź do treści',
  search: 'Szukaj',
  searchLabel: 'Szukaj narzędzia',
  searchPlaceholder: 'Szukaj narzędzia…',
  theme: 'Przełącz motyw',
  paletteLabel: 'Szybkie wyszukiwanie',
  palettePlaceholder: 'Narzędzie, słowo kluczowe…',
  paletteEmpty: 'Nic nie znaleziono.',
  paletteClose: 'Zamknij',
  homeKicker: '100% w przeglądarce',
  homeTitle: 'Krótkie narzędzia na co dzień',
  homeLede:
    'Formatery, identyfikatory i polskie dane testowe. Wpisane i wygenerowane wartości nie opuszczają tej przeglądarki.',
  homeEmpty: 'Żadne narzędzie nie jest jeszcze opublikowane.',
  homeNoResults: 'Nie znaleziono pasujących narzędzi.',
  draftBadge: 'Wersja robocza',
  footerLocal: 'Obliczenia wyłącznie w przeglądarce. Bez analityki i bez ciasteczek.',
  footerTerms: 'Regulamin',
  footerPrivacy: 'Polityka prywatności',
  footerOperator: 'Operator',
  footerWorking: 'Nazwa robocza serwisu.',
  notFoundTitle: 'Nie ma takiej strony',
  notFoundBody: 'Ten adres nie prowadzi do narzędzia.',
  notFoundHome: 'Wróć na start',
  termsTitle: 'Regulamin',
  privacyTitle: 'Polityka prywatności',
  operatorTitle: 'Operator',
  termsDescription: 'Zasady korzystania z narzędzi testowych DevNarzędzia.',
  privacyDescription: 'Dane są liczone lokalnie w przeglądarce i nie są wysyłane na serwer.',
  operatorDescription: 'Dane identyfikacyjne operatora serwisu.',
} as const

export type MessageKey = keyof typeof messages

const categories: Record<ToolCategory, string> = {
  generatory: 'Generatory',
  konwertery: 'Konwertery',
  kodowanie: 'Kodowanie',
  tekst: 'Tekst',
  siec: 'Sieć',
  inne: 'Inne',
}

export function t(key: MessageKey): string {
  return messages[key]
}

export function categoryLabel(category: ToolCategory): string {
  return categories[category]
}
