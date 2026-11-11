import { expect, test, type Page } from '@playwright/test'

test('chmod turns 755 into a symbolic mode and rejects a non-octal digit', async ({ page }) => {
  await page.goto('/kalkulator-chmod')
  await expect(stat(page, 'Ósemkowo')).toHaveText('0755')
  await expect(stat(page, 'Symbolicznie')).toHaveText('rwxr-xr-x')
  await page.getByLabel('Zapis ósemkowy').fill('644')
  await expect(stat(page, 'Symbolicznie')).toHaveText('rw-r--r--')
  const octal = page.getByLabel('Zapis ósemkowy')
  await octal.fill('899')
  await octal.blur()
  await expect(page.locator('.message-error')).toHaveText('Podaj 3 albo 4 cyfry ósemkowe, na przykład 755 albo 4755.')
})

test('date span states an age and notices a reversed range', async ({ page }) => {
  await page.goto('/roznica-dat')
  await expect(page.getByText('36 lat, 5 miesięcy i 27 dni (13329 dni)')).toBeVisible()
  await expect(stat(page, 'Lata')).toHaveText('36')
  await expect(stat(page, 'Dni łącznie')).toHaveText('13329')
  await page.getByLabel('Data początkowa albo urodzenia').fill('2026-11-11')
  await page.getByLabel('Data końcowa').fill('1990-05-15')
  await expect(page.getByText('data początkowa jest później')).toBeVisible()
})

test('line tool sorts Polish lines and drops duplicates', async ({ page }) => {
  await page.goto('/sortowanie-alfabetyczne')
  await expect(page.getByLabel('Wynik')).toHaveValue('ala\nAla\nżółć')
})

test('percent calculator finds a share, a ratio, a change, and rejects zero', async ({ page }) => {
  await page.goto('/kalkulator-procentow')
  await expect(page.getByText('Wynik:')).toContainText('30')
  await expect(page.getByText('To jest')).toContainText('20%')
  await expect(page.getByText('Zmiana:')).toContainText('25%')
  await expect(stat(page, 'Po dodaniu')).toHaveText('220')
  await expect(stat(page, 'Po odjęciu')).toHaveText('180')
  await page.getByLabel('Całość').fill('0')
  await expect(page.getByText('Nie można dzielić przez zero.')).toBeVisible()
})

test('time zone tool converts a Warsaw winter noon to New York', async ({ page }) => {
  await page.goto('/konwerter-stref-czasowych')
  await expect(stat(page, 'Europe/Warsaw')).toHaveText('2026-01-15 12:00')
  await expect(stat(page, 'America/New_York')).toHaveText('2026-01-15 06:00')
  await expect(stat(page, 'Przesunięcie')).toHaveText('UTC+01:00 → UTC-05:00')
  await page.getByLabel('Inna strefa źródłowa').fill('nie-strefa')
  await expect(page.locator('.message-error')).toHaveText(
    'Nieznana strefa czasowa. Użyj nazwy IANA, na przykład Europe/Warsaw.',
  )
})

test('data units convert kibibytes and reject a negative amount', async ({ page }) => {
  await page.goto('/kalkulator-bajtow')
  await expect(stat(page, 'B')).toHaveText('1536')
  await expect(stat(page, 'KiB')).toHaveText('1,5')
  await expect(stat(page, 'KB')).toHaveText('1,536')
  await page.getByLabel('Wartość').fill('-1')
  await expect(page.locator('.message-error')).toHaveText('Podaj nieujemną liczbę.')
})

test('user-agent parser recognises the sample Chrome header', async ({ page }) => {
  await page.goto('/parser-user-agent')
  await expect(stat(page, 'Przeglądarka')).toHaveText('Chrome 120.0')
  await expect(stat(page, 'System')).toHaveText('Windows 10/11')
  await expect(stat(page, 'Urządzenie')).toHaveText('komputer')
  await page.getByLabel('User-Agent').fill('')
  await expect(stat(page, 'Przeglądarka')).toHaveText(/nieznana/)
})

function stat(page: Page, name: string) {
  const exact = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  return page.locator('dt', { hasText: exact }).locator('xpath=following-sibling::dd')
}
