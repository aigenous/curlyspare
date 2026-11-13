import { expect, test } from '@playwright/test'

test('operator page shows NIP, REGON and the Lawyer placeholders for address and email', async ({ page }) => {
  await page.goto('/operator')

  const details = page.locator('.operator-details')
  await expect(details.getByText('NIP', { exact: true })).toBeVisible()
  await expect(details.getByText('6222809805')).toBeVisible()
  await expect(details.getByText('REGON', { exact: true })).toBeVisible()
  await expect(details.getByText('368785970')).toBeVisible()
  await expect(details.getByText('[ADRES]', { exact: true })).toBeVisible()
  await expect(details.getByText('[E-MAIL KONTAKTOWY]', { exact: true })).toBeVisible()

  await expect(page.locator('body')).not.toContainText('[ADRES E-MAIL DO KONTAKTU]')
  await expect(page.locator('footer')).toContainText(
    'Piotr Szewczyk, jednoosobowa działalność gospodarcza, NIP 6222809805',
  )
})
