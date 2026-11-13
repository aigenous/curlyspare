import { expect, test, type Page } from '@playwright/test'

test('amount in words spells the default invoice total and rejects a third decimal', async ({ page }) => {
  await page.goto('/kwota-slownie')
  await expect(page.getByLabel('Słownie')).toHaveValue(
    'tysiąc dwieście trzydzieści cztery złote pięćdziesiąt sześć groszy',
  )
  await page.getByLabel('Kwota PLN').fill('1')
  await expect(page.getByLabel('Słownie')).toHaveValue('jeden złoty')
  await page.getByLabel('Kwota PLN').fill('12,345')
  await expect(page.locator('.message-error')).toHaveText('Podaj kwotę, na przykład 1234,56.')
})

test('VAT calculator adds 23 percent and extracts it from a gross amount', async ({ page }) => {
  await page.goto('/kalkulator-vat')
  await expect(stat(page, 'Netto')).toHaveText('100,00')
  await expect(stat(page, 'VAT')).toHaveText('23,00')
  await expect(stat(page, 'Brutto')).toHaveText('123,00')

  await page.getByLabel('Stawka').selectOption('8')
  await expect(stat(page, 'VAT')).toHaveText('8,00')
  await expect(stat(page, 'Brutto')).toHaveText('108,00')

  await page.getByLabel('Podana kwota to').selectOption('gross')
  await page.getByLabel('Stawka').selectOption('23')
  await expect(stat(page, 'Netto')).toHaveText('81,30')
  await expect(stat(page, 'VAT')).toHaveText('18,70')
  await expect(stat(page, 'Brutto')).toHaveText('100,00')

  await page.getByRole('textbox', { name: 'Kwota', exact: true }).fill('-1')
  await expect(page.locator('.message-error')).toHaveText('Podaj nieujemną kwotę, na przykład 100,00.')
})

test('cron explainer describes a weekday schedule and rejects a broken expression', async ({ page }) => {
  await page.goto('/wyrazenie-cron')
  await expect(page.getByText('Co 15 minut, w godzinach od 9 do 17, każdego dnia miesiąca, w każdym miesiącu, od poniedziałku do piątku.')).toBeVisible()
  await expect(page.locator('ol.match-list li')).toHaveCount(5)
  await page.getByLabel('Wyrażenie cron').fill('nie cron')
  await expect(page.locator('.message-error')).toHaveText(
    'Wyrażenie cron ma mieć pięć pól: minuta godzina dzień miesiąc dzień-tygodnia.',
  )
  await page.getByLabel('Wyrażenie cron').fill('0 0 31 2 *')
  await expect(page.locator('.message-error')).toHaveText(
    'Nie udało się znaleźć pięciu kolejnych uruchomień w ciągu dwóch lat.',
  )
})

test('working-day calculator skips Independence Day and rejects a reversed range', async ({ page }) => {
  await page.goto('/kalkulator-dni-roboczych')
  await expect(stat(page, 'Dni robocze między datami')).toHaveText('3')
  await expect(page.getByText('2026-11-11 Narodowe Święto Niepodległości')).toBeVisible()
  await expect(page.getByText('Wypada:')).toContainText('2026-11-17')
  await expect(page.getByRole('listitem').filter({ hasText: 'Wigilia Bożego Narodzenia' })).toBeVisible()

  await page.getByLabel('Data końcowa').fill('2026-11-01')
  await expect(page.locator('.message-error')).toHaveText('Data końcowa jest wcześniejsza niż początkowa.')
})

function stat(page: Page, name: string) {
  const exact = new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`)
  return page.locator('dt', { hasText: exact }).locator('xpath=following-sibling::dd')
}
