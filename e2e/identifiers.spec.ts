import { existsSync, readFileSync } from 'node:fs'
import { expect, test, type Download } from '@playwright/test'

const present = existsSync(new URL('../src/lib/generators/index.ts', import.meta.url))

interface IdentifierLibrary {
  validatePesel: (value: string) => { valid: boolean }
  validateNip: (value: string) => { valid: boolean }
  validateRegon: (value: string) => { valid: boolean }
  validateKrs: (value: string) => { valid: boolean }
  validateDowodOsobisty: (value: string) => { valid: boolean }
  validatePaszport: (value: string) => { valid: boolean }
  validateNrb: (value: string) => { valid: boolean }
  validateGtin: (value: string) => { valid: boolean }
}

async function loadIdentifiers(): Promise<IdentifierLibrary> {
  const specifier = '../src/lib/generators/index.ts'
  return import(specifier) as Promise<IdentifierLibrary>
}

test.describe('identifier screens', () => {
  test.skip(!present, 'generator screens are not on this branch yet')

  test('PESEL generates a valid number and checks a known checksum', async ({ page }) => {
    const api = await loadIdentifiers()
    await page.goto('/generator-pesel')
    await expect(page.locator('.disclaimer')).toContainText('wyłącznie do testowania')
    await page.getByLabel('Ile numerów').fill('0')
    await page.getByRole('button', { name: 'Generuj' }).click()
    await expect(page.getByRole('alert')).toHaveText('Podaj liczbę od 1 do 100.')

    await page.getByLabel('Ile numerów').fill('1')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const value = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(value).toMatch(/^\d{11}$/)
    expect(api.validatePesel(value).valid).toBe(true)
    await expect(page.getByText(/\d{2}\.\d{2}\.\d{4}/)).toBeVisible()

    await page.getByLabel('Numer PESEL').fill('44051401359')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('14.05.1944')
    await expect(page.getByRole('status')).toContainText('mężczyzna')
    await page.getByLabel('Numer PESEL').fill('44051401358')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')

    const csvButton = page.getByRole('button', { name: 'Pobierz CSV' })
    if (await csvButton.count()) {
      const [download] = await Promise.all([page.waitForEvent('download'), csvButton.click()])
      expect(download.suggestedFilename()).toBe('pesel.csv')
      expect(await readDownload(download)).toContain(value)
    }
  })

  test('NIP generates a valid number and rejects a damaged checksum', async ({ page }) => {
    const api = await loadIdentifiers()
    await page.goto('/generator-nip')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const value = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(value).toMatch(/^\d{10}$/)
    expect(api.validateNip(value).valid).toBe(true)
    await page.getByLabel('Numer NIP').fill('5260250274')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny NIP')
    await page.getByLabel('Numer NIP').fill('1234563219')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })

  test('REGON generates both lengths and checks a known 9-digit number', async ({ page }) => {
    const api = await loadIdentifiers()
    await page.goto('/generator-regon')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const shortNumber = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(shortNumber).toMatch(/^\d{9}$/)
    expect(api.validateRegon(shortNumber).valid).toBe(true)

    await page.getByLabel('Długość').selectOption('14')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const localUnit = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(localUnit).toMatch(/^\d{14}$/)
    expect(api.validateRegon(localUnit).valid).toBe(true)

    await page.getByLabel('Numer REGON').fill('000002217')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('Poprawny REGON (9 cyfr).')
    await page.getByLabel('Numer REGON').fill('000002218')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })

  test('ID card and passport screens generate values that pass their own check', async ({ page }) => {
    const api = await loadIdentifiers()
    await page.goto('/generator-dowod-osobisty')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const card = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(card).toMatch(/^[A-Z]{3} \d{6}$/)
    expect(api.validateDowodOsobisty(card).valid).toBe(true)
    await page.getByLabel('Seria i numer').fill('ABS123456')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny numer dowodu')
    await page.getByLabel('Seria i numer').fill('ZZC108202')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')

    await page.goto('/generator-paszport')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const passport = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(passport).toMatch(/^[A-Z]{2} ?\d{7}$/)
    expect(api.validatePaszport(passport).valid).toBe(true)
    await page.getByLabel('Numer paszportu').fill('AA3234567')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny numer paszportu')
    await page.getByLabel('Numer paszportu').fill('AA3234568')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })

  test('KRS accepts a 10-digit number and says there is no checksum', async ({ page }) => {
    const api = await loadIdentifiers()
    await page.goto('/generator-krs')
    await expect(page.getByText('Nie ma sumy kontrolnej')).toBeVisible()
    await page.getByRole('button', { name: 'Generuj' }).click()
    const value = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(value).toMatch(/^\d{10}$/)
    expect(api.validateKrs(value).valid).toBe(true)
    await page.getByLabel('Numer KRS').fill('0123456789')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('nie ma cyfry kontrolnej')
    await page.getByLabel('Numer KRS').fill('abcdefghij')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Numer zawiera niedozwolone znaki.')
  })

  test('IBAN validator accepts a Polish checksum and rejects another country', async ({ page }) => {
    await page.goto('/walidator-iban')
    await expect(page.locator('.disclaimer')).toContainText('wyłącznie do testowania')
    await page.getByLabel('IBAN').fill('PL61109010140000071219812874')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny IBAN')
    await page.getByLabel('IBAN').fill('DE89370400440532013000')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Ten kraj nie jest obsługiwany.')
    await page.getByLabel('IBAN').fill('')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Wpisz numer.')
  })

  test('NRB generates a spaced account number that validates', async ({ page }) => {
    test.skip(!screenReady('generator-nrb/GeneratorNrb.vue'), 'NRB screen is not on this branch yet')
    const api = await loadIdentifiers()
    await page.goto('/generator-nrb')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const value = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(value).toMatch(/^\d{2}(?: \d{4}){6}$/)
    expect(api.validateNrb(value).valid).toBe(true)
    await page.getByLabel('NRB lub IBAN PL').fill('09 1010 1010 0075 9122 2300 0000')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toContainText('Poprawny NRB')
    await expect(page.getByRole('status')).toContainText('10101010')
  })

  test('EAN generator checks a published EAN-13 and rejects a bad digit', async ({ page }) => {
    test.skip(!screenReady('generator-ean/GeneratorEan.vue'), 'EAN screen is not on this branch yet')
    const api = await loadIdentifiers()
    await page.goto('/generator-ean')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const value = (await page.getByLabel('Wynik').inputValue()).trim()
    expect(value).toMatch(/^\d{13}$/)
    expect(api.validateGtin(value).valid).toBe(true)
    await page.getByRole('textbox', { name: 'Numer', exact: true }).fill('5901234123457')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('Poprawny EAN-13: 5901234123457.')
    await page.getByRole('textbox', { name: 'Numer', exact: true }).fill('5901234123458')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })

  test('EU VAT accepts a Polish NIP and rejects a damaged checksum', async ({ page }) => {
    test.skip(!screenReady('walidator-vat-ue/WalidatorVatUe.vue'), 'EU VAT screen is not on this branch yet')
    await page.goto('/walidator-vat-ue')
    await expect(page.getByText('Nie ma zapytania do żadnego rejestru.')).toBeVisible()
    await page.getByLabel('Numer VAT').fill('PL 526-025-02-74')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('Poprawny numer VAT (PL): PL5260250274.')
    await page.getByLabel('Numer VAT').fill('PL5260250275')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })

  test('test-person generator writes a fictional PESEL that validates', async ({ page }) => {
    test.skip(!screenReady('generator-osoby-testowej/GeneratorOsobyTestowej.vue'), 'test-person screen is not on this branch yet')
    const api = await loadIdentifiers()
    await page.goto('/generator-osoby-testowej')
    await expect(page.locator('.disclaimer')).toContainText('wyłącznie do testowania')
    await page.getByRole('button', { name: 'Generuj' }).click()
    const line = await page.getByLabel('Wynik').inputValue()
    const pesel = /PESEL (\d{11})/.exec(line)?.[1] ?? ''
    expect(pesel).toMatch(/^\d{11}$/)
    expect(api.validatePesel(pesel).valid).toBe(true)
    expect(line).toMatch(/\d{2}-\d{3}/)
  })

  test('VIN validator accepts the published example and rejects letter I', async ({ page }) => {
    test.skip(!screenReady('walidator-vin/WalidatorVin.vue'), 'VIN screen is not on this branch yet')
    await page.goto('/walidator-vin')
    await page.getByLabel('VIN').fill('1M8GDM9AXKP042788')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('Poprawny VIN: 1M8GDM9AXKP042788.')
    await page.getByLabel('VIN').fill('1M8GDM9AXKP04278I')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Nieprawidłowy format numeru.')
  })

  test('ISBN converter turns ISBN-10 into ISBN-13 and rejects a bad check digit', async ({ page }) => {
    test.skip(!screenReady('konwerter-isbn/KonwerterIsbn.vue'), 'ISBN screen is not on this branch yet')
    await page.goto('/konwerter-isbn')
    await page.getByLabel('ISBN').fill('0-306-40615-2')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('status')).toHaveText('Poprawny ISBN-10.')
    await expect(page.getByLabel('ISBN-13')).toHaveValue('9780306406157')
    await page.getByRole('textbox', { name: 'ISBN', exact: true }).fill('0306406153')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Suma kontrolna się nie zgadza.')
  })
})

function screenReady(path: string): boolean {
  return existsSync(new URL(`../src/tools/generators/${path}`, import.meta.url))
}

async function readDownload(download: Download): Promise<string> {
  const path = await download.path()
  return path ? readFileSync(path, 'utf8') : ''
}
