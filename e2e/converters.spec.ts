import { existsSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const present = existsSync(new URL('../src/lib/converters/json.ts', import.meta.url))

test.describe('converter screens', () => {
  test.skip(!present, 'converter screens are not on this branch yet')

  test('JSON formatter pretty-prints, minifies, and reports the broken line', async ({ page }) => {
    await page.goto('/formatowanie-json')
    await page.getByLabel('Dokument JSON').fill('{"b":1,"a":2}')
    await page.getByRole('checkbox', { name: 'Sortuj klucze' }).check()
    await page.getByRole('button', { name: 'Formatuj' }).click()
    await expect(output(page)).toHaveValue('{\n  "a": 2,\n  "b": 1\n}\n')
    await page.getByRole('button', { name: 'Minimalizuj' }).click()
    await expect(output(page)).toHaveValue('{"b":1,"a":2}')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny JSON')
    await page.getByLabel('Dokument JSON').fill('{')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toContainText('Wiersz 1')
  })

  test('Base64 encodes and decodes text, and rejects a bad alphabet', async ({ page }) => {
    await page.goto('/kodowanie-base64')
    await page.getByLabel('Tekst albo Base64').fill('abc')
    await page.getByRole('button', { name: 'Koduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('YWJj')
    await page.getByLabel('Tekst albo Base64').fill('YWJj')
    await page.getByRole('button', { name: 'Dekoduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('abc')
    await page.getByLabel('Tekst albo Base64').fill('!!!!')
    await page.getByRole('button', { name: 'Dekoduj tekst' }).click()
    await expect(page.getByRole('alert')).toHaveText('Niepoprawny znak w Base64.')
  })

  test('URL encoder round-trips a component and reports a broken percent sequence', async ({ page }) => {
    await page.goto('/kodowanie-url')
    await page.getByLabel('Tekst').fill('a b/ą')
    await page.getByRole('button', { name: 'Koduj', exact: true }).click()
    await expect(output(page)).toHaveValue('a%20b%2F%C4%85')
    await page.getByLabel('Tekst').fill('a%20b%2F%C4%85')
    await page.getByRole('button', { name: 'Dekoduj', exact: true }).click()
    await expect(output(page)).toHaveValue('a b/ą')
    await page.getByLabel('Tryb').selectOption('form')
    await page.getByLabel('Tekst').fill('a b')
    await page.getByRole('button', { name: 'Koduj', exact: true }).click()
    await expect(output(page)).toHaveValue('a+b')
    await page.getByLabel('Tryb').selectOption('component')
    await page.getByLabel('Tekst').fill('%')
    await page.getByRole('button', { name: 'Dekoduj', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
  })

  test('YAML and CSV round-trip a small document and reject empty input', async ({ page }) => {
    await page.goto('/json-na-yaml')
    await page.getByLabel('JSON albo YAML').fill('{"a":1}')
    await page.getByRole('button', { name: 'JSON na YAML' }).click()
    await expect(output(page)).toHaveValue('a: 1\n')
    await page.getByLabel('JSON albo YAML').fill('a: 1\n')
    await page.getByRole('button', { name: 'YAML na JSON' }).click()
    await expect(output(page)).toHaveValue('{\n  "a": 1\n}\n')
    await page.getByLabel('JSON albo YAML').fill('{')
    await page.getByRole('button', { name: 'JSON na YAML' }).click()
    await expect(page.getByRole('alert')).toContainText('Wiersz 1')

    await page.goto('/json-na-csv')
    await page.getByLabel('JSON albo CSV').fill('[{"name":"Ala","city":"Kraków"}]')
    await page.getByRole('button', { name: 'JSON na CSV' }).click()
    await expect(output(page)).toHaveValue('name,city\nAla,Kraków\n')
    await page.getByLabel('JSON albo CSV').fill('name,city\nAla,Kraków\n')
    await page.getByRole('button', { name: 'CSV na JSON' }).click()
    await expect(output(page)).toHaveValue(/"name": "Ala"[\s\S]*"city": "Kraków"/)
    await page.getByLabel('JSON albo CSV').fill('[]')
    await page.getByRole('button', { name: 'JSON na CSV' }).click()
    await expect(page.getByRole('alert')).toHaveText('Pusta tablica nie zawiera kolumn CSV.')
  })

  test('UUID generator emits version 4 and rejects a non-UUID', async ({ page }) => {
    await page.goto('/generator-uuid')
    await page.getByLabel('Liczba').fill('2')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const lines = (await page.getByLabel('Identyfikatory').inputValue()).split('\n').filter(Boolean)
    expect(lines).toHaveLength(2)
    for (const line of lines) {
      expect(line).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    }
    await page.getByLabel('UUID').fill(lines[0] ?? '')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('losowy (v4)')
    await page.getByLabel('UUID').fill('nie-uuid')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('To nie jest UUID.')
  })

  test('SHA-256 of abc matches the known vector', async ({ page }) => {
    await page.goto('/generator-sha256')
    await expect(page.locator('.disclaimer')).toContainText('SHA-1')
    await page.getByLabel('Tekst').fill('abc')
    await page.getByRole('button', { name: 'Policz tekst' }).click()
    await expect(page.getByLabel('Szesnastkowo')).toHaveValue(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    )
    await expect(page.getByRole('status')).toHaveText('Policzono skrót tekstu.')
  })

  test('Unix timestamp converts the epoch and a Warsaw winter hour', async ({ page }) => {
    await page.goto('/unix-timestamp')
    await page.getByLabel('Znacznik Unix').fill('0')
    await page.getByRole('button', { name: 'Przelicz na datę' }).click()
    await expect(stat(page, 'UTC')).toHaveText('1970-01-01T00:00:00.000Z')
    await expect(stat(page, 'Sekundy')).toHaveText('0')

    await page.getByLabel('Data lokalna').fill('2024-01-15 12:00:00')
    await page.getByRole('button', { name: 'Przelicz na Unix' }).click()
    await expect(stat(page, 'UTC')).toHaveText('2024-01-15T11:00:00.000Z')
    await expect(stat(page, 'Sekundy')).toHaveText('1705316400')

    await page.getByLabel('Data lokalna').fill('2024-03-31 02:30:00')
    await page.getByRole('button', { name: 'Przelicz na Unix' }).click()
    await expect(page.getByRole('alert')).toContainText('przeskok czasu')
    await page.getByLabel('Znacznik Unix').fill('teraz')
    await page.getByRole('button', { name: 'Przelicz na datę' }).click()
    await expect(page.getByRole('alert')).toHaveText('Znacznik Unix musi być liczbą.')
  })

  test('JWT decoder reads the payload and does not claim the signature was checked', async ({ page }) => {
    await page.goto('/dekoder-jwt')
    await expect(page.locator('.disclaimer')).toContainText('Podpis nie został zweryfikowany')
    await page.getByLabel('Token JWT').fill(`${jwtPart({ alg: 'HS256', typ: 'JWT' })}.${jwtPart({ sub: 'ala', exp: 1893456000 })}.c2ln`)
    await page.getByRole('button', { name: 'Dekoduj' }).click()
    await expect(stat(page, 'Algorytm')).toHaveText('HS256')
    await expect(stat(page, 'Wygasa (exp)')).toContainText('2030')
    await expect(stat(page, 'Podpis')).toContainText('nie zweryfikowano')
    await expect(page.getByRole('heading', { name: 'Payload' }).locator('xpath=following::textarea[1]')).toHaveValue(
      /"sub": "ala"/,
    )
    await page.getByLabel('Token JWT').fill('nie.token')
    await page.getByRole('button', { name: 'Dekoduj' }).click()
    await expect(page.getByRole('alert')).toHaveText('Token JWT powinien mieć trzy części rozdzielone kropkami.')
  })

  test('HMAC of a Polish word matches the local SHA-256 vector and rejects an empty key', async ({ page }) => {
    test.skip(!converterReady('generator-hmac/GeneratorHmac.vue'), 'HMAC screen is not on this branch yet')
    await page.goto('/generator-hmac')
    await page.getByLabel('Klucz').fill('klucz')
    await page.getByLabel('Wiadomość').fill('zażółć')
    await page.getByRole('button', { name: 'Policz HMAC' }).click()
    await expect(page.getByLabel('Szesnastkowo')).toHaveValue(
      '01dfcba5b00e0282b0b198a1639a10b45ad85ae2337c2b175a1a90725054b6a7',
    )
    await page.getByLabel('Klucz').fill('')
    await page.getByRole('button', { name: 'Policz HMAC' }).click()
    await expect(page.getByText('Klucz HMAC nie może być pusty.')).toBeVisible()
  })

  test('Base32 and hex round-trip text and reject a bad alphabet', async ({ page }) => {
    test.skip(!converterReady('kodowanie-base32/KodowanieBase32.vue'), 'Base32 screen is not on this branch yet')
    await page.goto('/kodowanie-base32')
    await page.getByLabel('Tekst albo Base32').fill('foo')
    await page.getByRole('button', { name: 'Koduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('MZXW6===')
    await page.getByLabel('Tekst albo Base32').fill('MZXW6===')
    await page.getByRole('button', { name: 'Dekoduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('foo')
    await page.getByLabel('Tekst albo Base32').fill('MZXW6Y10')
    await page.getByRole('button', { name: 'Dekoduj tekst', exact: true }).click()
    await expect(page.getByText('Niepoprawny znak w Base32.')).toBeVisible()

    await page.goto('/hex-na-tekst')
    await page.getByLabel('Tekst albo hex').fill('foo')
    await page.getByRole('button', { name: 'Koduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('666f6f')
    await page.getByLabel('Tekst albo hex').fill('666f6f')
    await page.getByRole('button', { name: 'Dekoduj tekst', exact: true }).click()
    await expect(output(page)).toHaveValue('foo')
    await page.getByLabel('Tekst albo hex').fill('zz')
    await page.getByRole('button', { name: 'Dekoduj tekst', exact: true }).click()
    await expect(page.getByText('Niepoprawny znak w hex.')).toBeVisible()
  })

  test('Unicode escapes round-trip ż and XML pretty-prints a document', async ({ page }) => {
    test.skip(!converterReady('ucieczki-unicode/UcieczkiUnicode.vue'), 'Unicode screen is not on this branch yet')
    await page.goto('/escape-unicode')
    await page.getByRole('textbox', { name: 'Tekst', exact: true }).fill('ż')
    await page.getByRole('button', { name: 'Ucieknij' }).click()
    await expect(output(page)).toHaveValue('\\u017c')
    await page.getByRole('textbox', { name: 'Tekst', exact: true }).fill('\\u017c')
    await page.getByRole('button', { name: 'Odczytaj' }).click()
    await expect(output(page)).toHaveValue('ż')
    await page.getByRole('textbox', { name: 'Tekst', exact: true }).fill('\\')
    await page.getByRole('button', { name: 'Odczytaj' }).click()
    await expect(page.getByText('Ucieczka na końcu tekstu jest niedokończona.')).toBeVisible()

    await page.goto('/formatowanie-xml')
    await page.getByLabel('Dokument XML').fill('<root><child a="1">zażółć</child><empty/></root>')
    await page.getByRole('button', { name: 'Formatuj' }).click()
    await expect(output(page)).toHaveValue('<root>\n  <child a="1">zażółć</child>\n  <empty/>\n</root>\n')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByText('Poprawny XML: element główny „root”.')).toBeVisible()
    await page.getByLabel('Dokument XML').fill('')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.locator('.message-error')).toHaveText('Pusty dokument XML.')
  })

  test('URL parser splits host, path, and query', async ({ page }) => {
    test.skip(!converterReady('parser-adresu/ParserAdresu.vue'), 'URL parser is not on this branch yet')
    await page.goto('/parser-url')
    await page.getByLabel('Adres URL albo parametry').fill('https://ala:hasło@example.com:8443/a/b?x=1#sekcja')
    await page.getByRole('button', { name: 'Rozłóż' }).click()
    await expect(stat(page, 'Host')).toHaveText('example.com')
    await expect(stat(page, 'Port')).toHaveText('8443')
    await expect(stat(page, 'Ścieżka')).toHaveText('/a/b')
    await expect(stat(page, 'Fragment')).toHaveText('#sekcja')
    await page.getByLabel('Adres URL albo parametry').fill('')
    await page.getByRole('button', { name: 'Rozłóż' }).click()
    await expect(page.locator('.message-error')).toHaveText('Wklej adres URL albo parametry zapytania.')
  })

  test('JSON Schema accepts a matching object and lists the missing field', async ({ page }) => {
    test.skip(!converterReady('walidator-json-schema/WalidatorJsonSchema.vue'), 'JSON Schema screen is not on this branch yet')
    const schema = JSON.stringify({
      type: 'object',
      additionalProperties: false,
      required: ['a'],
      properties: { a: { type: 'number', minimum: 0 } },
    })
    await page.goto('/walidator-json-schema')
    await page.getByLabel('Dane JSON').fill('{"a": 1}')
    await page.getByLabel('JSON Schema').fill(schema)
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByText('Dane pasują do schematu.')).toBeVisible()
    await page.getByLabel('Dane JSON').fill('{"b": 1}')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.locator('.message-error')).toContainText('brakuje pola „a”')
    await expect(page.locator('.message-error')).toContainText('niedozwolone pole „b”')
    await page.getByLabel('Dane JSON').fill('{')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.locator('.message-error')).toBeVisible()
  })

  test('SQL formatter uppercases PostgreSQL clauses and rejects an empty query', async ({ page }) => {
    test.skip(!converterReady('formatowanie-sql/FormatowanieSql.vue'), 'SQL screen is not on this branch yet')
    await page.goto('/formatowanie-sql')
    await page.getByLabel('Zapytanie SQL').fill("select a, b from users where id = 1 and name = 'Ala' order by a")
    await page.getByRole('button', { name: 'Formatuj' }).click()
    await expect(page.getByLabel('Wynik')).toHaveValue(
      "SELECT\n  a,\n  b\nFROM\n  users\nWHERE\n  id = 1\n  AND name = 'Ala'\nORDER BY\n  a\n",
    )
    await page.getByLabel('Dialekt').selectOption('mysql')
    await page.getByLabel('Zapytanie SQL').fill('select id from t limit 5')
    await page.getByRole('button', { name: 'Formatuj' }).click()
    await expect(page.getByLabel('Wynik')).toHaveValue(/LIMIT\n {2}5/)
    await page.getByLabel('Zapytanie SQL').fill('   ')
    await page.getByRole('button', { name: 'Formatuj' }).click()
    await expect(page.locator('.message-error')).toHaveText('Wklej zapytanie SQL.')
  })
})

function converterReady(path: string): boolean {
  return existsSync(new URL(`../src/tools/converters/${path}`, import.meta.url))
}

function output(page: Page) {
  return page.getByLabel('Wynik')
}

function stat(page: Page, name: string) {
  const exact = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  return page.locator('dt', { hasText: exact }).locator('xpath=following-sibling::dd')
}

function jwtPart(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '')
}
