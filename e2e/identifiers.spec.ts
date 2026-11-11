import { existsSync } from 'node:fs'
import { expect, test } from '@playwright/test'

const present = existsSync(new URL('../src/lib/generators/index.ts', import.meta.url))

interface IdentifierLibrary {
  validatePesel: (value: string) => { valid: boolean }
  validateNip: (value: string) => { valid: boolean }
  validateRegon: (value: string) => { valid: boolean }
  validateKrs: (value: string) => { valid: boolean }
  validateDowodOsobisty: (value: string) => { valid: boolean }
  validatePaszport: (value: string) => { valid: boolean }
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
    await expect(page.getByRole('alert')).toHaveText('Obsługiwany jest wyłącznie polski IBAN (PL).')
    await page.getByLabel('IBAN').fill('')
    await page.getByRole('button', { name: 'Sprawdź' }).click()
    await expect(page.getByRole('alert')).toHaveText('Wpisz numer.')
  })
})
