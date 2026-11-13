import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const publishedPages = ['/', '/regulamin', '/polityka-prywatnosci', '/operator', '/licencje', '/404']
const widths = [1280, 390] as const
const themes = ['light', 'dark'] as const

for (const path of publishedPages) {
  for (const width of widths) {
    for (const theme of themes) {
      test(`search button is named Szukaj on ${path} at ${width}px ${theme}`, async ({ page }) => {
        await page.addInitScript((value) => {
          localStorage.setItem('curlyspare.theme', value)
        }, theme)
        await page.setViewportSize({ width, height: width === 390 ? 844 : 800 })
        await page.emulateMedia({ colorScheme: theme })
        await page.goto(path)
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)

        const button = page.locator('header .search-trigger')
        await expect(button).toHaveAccessibleName('Szukaj')
        await expect(button).not.toHaveAttribute('aria-label', /.*/)
        await expect(button.locator('kbd')).toHaveAttribute('aria-hidden', 'true')

        if (path === '/') {
          await expect(page.locator('.hero kbd')).toHaveAttribute('aria-hidden', 'true')
        }
        if (path === '/404') {
          await expect(page.locator('main kbd')).toHaveAttribute('aria-hidden', 'true')
        }

        const results = await new AxeBuilder({ page })
          .withRules(['label-content-name-mismatch', 'button-name'])
          .analyze()
        expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([])
      })
    }
  }
}
