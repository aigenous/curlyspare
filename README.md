# CurlySpare

CurlySpare is a set of free tools for developers. Everything runs in the browser. Values you type, files you pick, and data the tools generate stay in that browser; they are not sent to a server. The working name of the site is **DevNarzędzia**.

The shell is Vue 3, TypeScript, Vite, and vite-ssg, installed with pnpm. The tool list, routes, and search all come from `src/registry`. Agent rules for that contract live in [AGENTS.md](AGENTS.md).

## Tools

Sixty-two tools, in registry order (`generatorTools`, then `converterTools`, then `miscTools`), grouped by `category`. The title and the one-line description are the Polish copy from the registry.

### Generatory (`generatory`)

| Title | Slug | Description |
| --- | --- | --- |
| Generator PESEL | `generator-pesel` | Generuje i sprawdza numer PESEL: data urodzenia, płeć i suma kontrolna. |
| Generator NIP | `generator-nip` | Generuje i sprawdza NIP oraz pokazuje zapis z myślnikami. |
| Generator REGON | `generator-regon` | Generuje i sprawdza REGON 9-cyfrowy oraz 14-cyfrowy numer jednostki lokalnej. |
| Generator dowodu osobistego | `generator-dowod-osobisty` | Generuje i sprawdza serię i numer dowodu osobistego. |
| Generator numeru paszportu | `generator-paszport` | Generuje i sprawdza numer polskiego paszportu (dwie litery i siedem cyfr). |
| Generator numeru KRS | `generator-krs` | Losuje i sprawdza 10-cyfrowy numer KRS. Rejestr nie używa sumy kontrolnej. |
| Generator NRB | `generator-nrb` | Generuje i sprawdza polski numer rachunku: suma IBAN oraz cyfra kontrolna numeru rozliczeniowego. |
| Generator EAN i GTIN | `generator-ean` | Generuje i sprawdza EAN-8, EAN-13 oraz GTIN-14. Walidator przyjmuje też UPC-A. |
| Walidator VAT UE | `walidator-vat-ue` | Sprawdza format i sumę kontrolną numeru VAT państw UE, bez zapytania do rejestru. |
| Walidator VIN | `walidator-vin` | Sprawdza cyfrę kontrolną numeru VIN według ISO 3779. |
| Konwerter ISBN | `konwerter-isbn` | Sprawdza ISBN-10 i ISBN-13 oraz przelicza jeden format na drugi. |
| Generator osoby testowej | `generator-osoby-testowej` | Tworzy fikcyjną osobę: imię, nazwisko, PESEL zgodny z płcią i datą oraz adres o poprawnym formacie kodu. |
| Walidator IBAN PL | `walidator-iban` | Sprawdza polski IBAN algorytmem mod 97. Nie generuje rachunku i nie łączy się z bankiem. |

### Konwertery (`konwertery`)

| Title | Slug | Description |
| --- | --- | --- |
| Formatowanie JSON | `formatowanie-json` | Formatuj, minimalizuj i sprawdzaj JSON. Błąd podaje wiersz i kolumnę. |
| Znacznik czasu Unix | `znacznik-czasu` | Zamień znacznik Unix na datę i odwrotnie. Domyślna strefa to Europe/Warsaw. |
| JSON na YAML | `json-na-yaml` | Zamień JSON na YAML i YAML 1.2 z powrotem na JSON. |
| JSON na CSV | `json-na-csv` | Zamień tablicę obiektów JSON na CSV i CSV z nagłówkiem z powrotem na JSON. |
| Formatowanie XML | `formatowanie-xml` | Formatuj, minimalizuj i sprawdzaj dokument XML w przeglądarce. |
| Parser adresu URL | `parser-adresu` | Rozłóż adres na części, edytuj parametry zapytania i złóż URL z powrotem. |
| Formatowanie SQL | `formatowanie-sql` | Formatuj zapytanie SQL. Dialekty obejmują PostgreSQL, MySQL, MariaDB i SQLite. |
| Walidator JSON Schema | `walidator-json-schema` | Sprawdź dokument JSON względem JSON Schema. Błędy podają ścieżkę pola. |
| XML na JSON | `xml-na-json` | Zamień XML na JSON i obiekt JSON z powrotem na XML. |
| JSON na TypeScript | `json-na-typescript` | Zbuduj interfejsy TypeScript z przykładowego dokumentu JSON. |
| Tester JSONPath | `tester-jsonpath` | Wykonaj zapytanie JSONPath na dokumencie JSON i zobacz trafienia. |
| TOML na JSON | `toml-na-json` | Zamień TOML na JSON i obiekt JSON z powrotem na TOML. |
| cURL na fetch | `curl-na-fetch` | Zamień polecenie curl na wywołanie fetch oraz axios. |
| CSV na Markdown | `csv-na-markdown` | Zamień CSV na tabelę Markdown. Pierwszy wiersz jest nagłówkiem. |
| Jednostki danych | `jednostki-danych` | Przelicza bajty, kilobajty i kibibajty, od B do TiB. |
| Strefy czasowe | `strefy-czasowe` | Przelicza datę i godzinę między strefami IANA. Domyślnie Europa/Warszawa. |
| Systemy liczbowe | `systemy-liczbowe` | Przelicza liczbę między systemem dwójkowym, ósemkowym, dziesiętnym i szesnastkowym. |

### Kodowanie (`kodowanie`)

| Title | Slug | Description |
| --- | --- | --- |
| Kodowanie Base64 | `kodowanie-base64` | Koduj i dekoduj Base64 w UTF-8, także wariant URL-safe i pliki. |
| Dekoder JWT | `dekoder-jwt` | Odczytaj nagłówek i payload tokenu JWT oraz daty exp i iat. Podpis nie jest weryfikowany. |
| Generator UUID | `generator-uuid` | Generuj UUID v4 i v7, także hurtowo, i sprawdź wersję identyfikatora. |
| Kodowanie URL | `kodowanie-url` | Koduj i dekoduj składniki adresu URL oraz pola formularza. |
| Skróty SHA | `generator-skrotow` | Policz skrót SHA-1, SHA-256 lub SHA-512 z tekstu albo pliku. Liczone lokalnie. |
| Generator HMAC | `generator-hmac` | Policz HMAC SHA-256 albo SHA-512 z klucza i wiadomości. Liczone lokalnie. |
| Kodowanie Base32 | `kodowanie-base32` | Koduj i dekoduj Base32 (RFC 4648) dla tekstu UTF-8 i plików. |
| Kodowanie szesnastkowe | `kodowanie-hex` | Zamień tekst albo bajty na hex i odczytaj hex z powrotem jako UTF-8. |
| Ucieczki Unicode | `ucieczki-unicode` | Zamień znaki na \uXXXX albo \u{punkt} i pokaż bajty UTF-8. |
| Koder JWT | `koder-jwt` | Podpisz payload JWT algorytmem HS256, HS384 albo HS512. Sekret zostaje w przeglądarce. |
| Kompresja gzip | `kompresja` | Kompresuj i rozpakuj gzip albo deflate do Base64 w przeglądarce. |
| Encje HTML | `encje-html` | Koduje i dekoduje encje HTML, także polskie znaki. |

### Tekst (`tekst`)

| Title | Slug | Description |
| --- | --- | --- |
| Wielkość liter | `wielkosc-liter` | Zamienia wielkość liter, także na camelCase, snake_case i kebab-case. |
| Licznik tekstu | `licznik-tekstu` | Liczy znaki, słowa, linie i akapity bez wysyłania treści. |
| Lorem ipsum po polsku | `lorem-ipsum` | Układa przykładowe polskie akapity do makiet i testów układu. |
| Slug z polskich znaków | `slugify` | Robi adresowy slug i zamienia polskie znaki diakrytyczne. |
| Linie tekstu | `linie-tekstu` | Sortuje linie po polsku, usuwa duplikaty i puste wiersze. |
| Podgląd Markdown | `podglad-markdown` | Renderuje Markdown i czyści wynik w przeglądarce. |
| Porównanie tekstu | `porownanie-tekstu` | Pokazuje różnice linia po linii albo słowo po słowie. Nic nie jest wysyłane. |
| Tester wyrażeń regularnych | `tester-regex` | Sprawdza wyrażenie, flagi i grupy na tekście w przeglądarce. |

### Sieć (`siec`)

| Title | Slug | Description |
| --- | --- | --- |
| Parser User-Agent | `parser-user-agent` | Odczytuje przeglądarkę, system i rodzaj urządzenia z nagłówka User-Agent. |
| Kalkulator CIDR | `kalkulator-cidr` | Liczy adres sieci, maskę, rozgłoszenie i zakres hostów dla IPv4. |

### Inne (`inne`)

| Title | Slug | Description |
| --- | --- | --- |
| Generator kodów QR | `generator-qr` | Rysuje kod QR w przeglądarce. Obraz nie jest wysyłany na serwer. |
| Generator haseł | `generator-hasel` | Losuje hasło w przeglądarce i szacuje jego entropię. |
| Kalkulator procentów | `kalkulator-procentow` | Liczy procent z liczby, udział, zmianę procentową oraz dodanie i odjęcie procentu. |
| Kalkulator chmod | `chmod` | Przelicza uprawnienia pliku między zapisem ósemkowym i symbolicznym. |
| Różnica dat | `roznica-dat` | Liczy lata, miesiące i dni między dwiema datami, także wiek. |
| Dni robocze | `dni-robocze` | Liczy dni robocze w Polsce, z świętami stałymi i ruchomymi, i dodaje ich liczbę do daty. |
| Kalkulator VAT | `kalkulator-vat` | Liczy netto, VAT i brutto dla stawek 23, 8, 5 i 0 procent. |
| Kwota słownie | `kwota-slownie` | Zapisuje kwotę w złotych i groszach słownie, do faktury. |
| Wyjaśniacz cron | `wyjasniacz-cron` | Tłumaczy wyrażenie cron na polski i pokazuje pięć kolejnych uruchomień w strefie Europe/Warsaw. |
| Konwerter kolorów | `konwerter-kolorow` | Przelicza kolor między HEX, RGB i HSL. |

## Requirements

- Node.js `>=22` (`engines` in `package.json`)
- pnpm `10.33.4` (`packageManager` in `package.json`)

## Local development

```bash
pnpm install
pnpm dev
```

`pnpm dev` starts the Vite dev server. Copy `.env.example` to `.env.local` when the canonical origin should differ from the default in `src/site.ts`.

Ctrl or Cmd+K searches the registry. The only `localStorage` key is `devnarzedzia.theme`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Vite dev server |
| `pnpm build` | `vite-ssg build`. Prerenders each route to `dist/<slug>.html` and writes `sitemap.xml` and `robots.txt`. |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm test` | Vitest (`tests/` and `src/**/*.{spec,test}.ts`) |
| `pnpm test:e2e` | Playwright in Chromium. The config builds `dist` if needed and serves it with `vite preview` on port 4173. |

## Project layout

- `src/registry` — `ToolDefinition` and the `tools` array. Home, search, routes, and the sitemap read it.
- `src/tools/generators`, `src/tools/converters`, `src/tools/misc` — tool screens, registered from each folder's `index.ts`.
- `src/lib/generators`, `src/lib/converters`, `src/lib/misc` — logic used by those screens.
- `src/pages` — home, tool page, legal pages, 404.
- `src/components`, `src/composables`, `src/router`, `src/styles` — shell, theme, routes, and tokens.
- `src/site.ts`, `src/brand.ts`, `src/i18n.ts` — site name, operator data, shared disclaimer, and UI strings.
- `e2e/` — Playwright. `tests/` — Vitest guards and registry checks. `scripts/check-licenses.mjs` — fails the build of the dependency tree when a package is copyleft-only.
- `public/` — static files such as the favicon.
- `vercel.json` — hosting settings described below.

## Adding a tool

The contract in `src/registry/types.ts` is:

```ts
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
```

1. Put pure logic in the matching `src/lib/...` folder and the screen in the matching `src/tools/...` folder.
2. Append a `ToolDefinition` to `generatorTools`, `converterTools`, or `miscTools`. `src/registry/index.ts` spreads those arrays in that order.
3. `slug` is lowercase words separated by single hyphens, unique, and not `regulamin`, `polityka-prywatnosci`, `operator`, or `404`.
4. `component` must resolve to a Vue module (`{ default: Component }`). The shell renders the title, description, and optional disclaimer, then the component.
5. `keywords` feed search. No server calls and no analytics.
6. Generators that invent identifiers set `disclaimer` to `generatorDisclaimer` from `src/brand.ts`.

## Environment variables

`VITE_SITE_URL` is the public origin, with no trailing slash. `.env.example` sets `https://devnarzedzia.example`, which is also `defaultSiteUrl` in `src/site.ts`.

- `src/brand.ts` reads `import.meta.env.VITE_SITE_URL` for canonical URLs.
- `vite.config.ts` reads `process.env.VITE_SITE_URL` when `pnpm build` writes `sitemap.xml` and `robots.txt`.

Set it for a production build so those URLs match the domain. No other `VITE_` variable is used.

## Deployment on Vercel

This repository records the hosting settings. It does not create, link, or deploy a Vercel project.

| Setting | Value |
| --- | --- |
| Framework preset | Vite |
| Install command | `pnpm install` |
| Build command | `pnpm run build` |
| Output directory | `dist` |
| Node.js | 22 |

`vercel.json` sets `framework` to `vite`, `buildCommand` to `pnpm run build`, `outputDirectory` to `dist`, `cleanUrls` to `true`, and `trailingSlash` to `false`. Clean URLs serve `dist/generator-pesel.html` at `/generator-pesel`. Unknown paths use `dist/404.html`. Set `VITE_SITE_URL` in the project environment before a production build.

## Legal

The shell has three legal routes. Their copy is still a placeholder:

| Route | Page |
| --- | --- |
| `/regulamin` | Regulamin |
| `/polityka-prywatnosci` | Polityka prywatności |
| `/operator` | Operator (name, legal form, NIP, and email from `src/site.ts`) |

The footer links to those three routes. Licence texts are the files in the next section. This repository does not add a licence page.

## Licence

The project is [MIT](LICENSE):

```text
Copyright (c) 2026 Piotr Szewczyk
```

Production dependencies, including transitive ones, are listed in [THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt). The file follows `pnpm licenses list --prod` (84 packages on this tree). Each entry has the installed version, the copyright line, and the licence text from that package.

Inter is self-hosted with `@fontsource/inter` and stays under the SIL Open Font License 1.1. DOMPurify is `(MPL-2.0 OR Apache-2.0)`; both texts are in the notices file. Other licences in the tree include BSD-3-Clause (`diff`, `smol-toml`, `fast-uri`, and others), BSD-2-Clause (`entities`), ISC (`yaml` and others), Apache-2.0 (`typescript`), Python-2.0 (`argparse`), and CC0-1.0 (`railroad-diagrams`).

The notices file is maintained from the lockfile. A build-time generator that needs a new dependency, such as `rollup-plugin-license`, is not part of this repository.
