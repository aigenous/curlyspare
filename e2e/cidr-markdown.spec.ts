import { expect, test, type Page } from '@playwright/test'

test('CIDR calculator shows a /24, a single host, and rejects a bad address', async ({ page }) => {
  await page.goto('/kalkulator-cidr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kalkulator CIDR')
  await expect(stat(page, 'Sieć')).toHaveText('192.168.1.0')
  await expect(stat(page, 'Rozgłoszenie')).toHaveText('192.168.1.255')
  await expect(stat(page, 'Maska')).toHaveText('255.255.255.0')
  await expect(stat(page, 'Hosty użyteczne')).toHaveText('254')

  await page.getByLabel('Adres IPv4 i prefiks').fill('10.0.0.1/32')
  await expect(stat(page, 'Sieć')).toHaveText('10.0.0.1')
  await expect(stat(page, 'Rozgłoszenie')).toHaveText('10.0.0.1')
  await expect(stat(page, 'Hosty użyteczne')).toHaveText('1')

  await page.getByLabel('Adres IPv4 i prefiks').fill('192.168.1.256/24')
  await expect(page.locator('.message-error')).toHaveText('Adres albo długość prefiksu jest niepoprawna.')
  await page.getByLabel('Adres IPv4 i prefiks').fill('nie-adres')
  await expect(page.locator('.message-error')).toHaveText('Podaj adres w postaci 192.168.1.10/24.')
})

test('Markdown preview renders formatting and strips active HTML', async ({ page }) => {
  await page.goto('/podglad-markdown')
  await expect(page.getByRole('heading', { level: 1, name: 'Podgląd Markdown' })).toBeVisible()
  await expect(page.getByText('Skrypty i atrybuty zdarzeń są usuwane.')).toBeVisible()

  const preview = page.locator('.preview.md')
  await expect(preview.locator('h1')).toHaveCount(0)
  await expect(preview.locator('h2')).toHaveText('Nagłówek')
  await expect(preview.locator('strong')).toHaveText('Pogrubienie')
  await expect(preview.locator('a')).toHaveAttribute('href', 'https://example.com')

  await page
    .getByLabel('Markdown')
    .fill('<script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>')
  await expect(preview).toContainText('link')
  const html = (await preview.innerHTML()).toLowerCase()
  expect(html).not.toContain('<script')
  expect(html).not.toContain('onerror')
  expect(html).not.toContain('javascript:')
})

function stat(page: Page, name: string) {
  return page.locator('dt', { hasText: new RegExp(`^${name}$`) }).locator('xpath=following-sibling::dd')
}
