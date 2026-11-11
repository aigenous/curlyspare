import { expect, test } from '@playwright/test'

test('operator page shows REGON, the correspondence address and a contact mailto link', async ({ page }) => {
  await page.goto('/operator')

  const details = page.locator('.operator-details')
  await expect(details.getByText('NIP', { exact: true })).toBeVisible()
  await expect(details.getByText('6222809805')).toBeVisible()
  await expect(details.getByText('REGON', { exact: true })).toBeVisible()
  await expect(details.getByText('368785970')).toBeVisible()
  await expect(details.getByText('Adres korespondencyjny')).toBeVisible()
  await expect(details.getByText('Bobrowiecka 10/2, 00-728 Warszawa')).toBeVisible()
  await expect(details.getByText('Adres e-mail do kontaktu')).toBeVisible()

  const email = details.getByRole('link', { name: 'pszewczykpl@gmail.com' })
  await expect(email).toBeVisible()
  await expect(email).toHaveAttribute('href', 'mailto:pszewczykpl@gmail.com')

  await expect(page.locator('body')).not.toContainText('[ADRES E-MAIL DO KONTAKTU]')
  await expect(page.locator('footer')).toContainText('NIP 6222809805')
})
