import { expect, test, type Page } from '@playwright/test'
import { tools, type ToolDefinition } from '../src/registry'

const finished = tools.filter((tool) => tool.category === 'generatory' || tool.category === 'konwertery')

test('every finished generator shows the disclaimer and every converter renders', async ({ page }) => {
  for (const tool of finished) {
    await openTool(page, tool)
  }
  expect(finished.every((tool) => tool.slug.length > 0)).toBe(true)
})

test.describe('shell tools', () => {
  test('case tool converts Polish text to kebab-case', async ({ page }) => {
    await page.goto('/wielkosc-liter')
    await page.getByLabel('Wielkość').selectOption('kebab')
    await expect(page.getByLabel('Wynik')).toHaveValue('zażółć-gęślą-jaźń')
  })

  test('counter counts words in pasted text', async ({ page }) => {
    await page.goto('/licznik-tekstu')
    await page.getByLabel('Tekst').fill('a b\n\nc')
    await expect(stat(page, 'Słowa')).toHaveText('3')
    await expect(stat(page, 'Akapity')).toHaveText('2')
    await expect(stat(page, 'Znaki')).toHaveText('6')
    await expect(stat(page, 'Znaki bez spacji')).toHaveText('3')
  })

  test('lorem generator writes a single deterministic sentence', async ({ page }) => {
    await page.goto('/lorem-ipsum')
    await page.getByLabel('Akapity').fill('1')
    await page.getByLabel('Zdania w akapicie').fill('1')
    await page.getByRole('button', { name: 'Generuj' }).click()
    await expect(page.getByLabel('Wynik')).toHaveValue(
      'Tester wkleja krótki akapit i sprawdza, czy formularz przyjmuje polskie znaki.',
    )
  })

  test('slug tool strips Polish diacritics', async ({ page }) => {
    await page.goto('/slugify')
    await expect(page.getByLabel('Slug')).toHaveValue('zazolc-gesla-jazn-przykladowy-tytul')
    await page.getByLabel('Tekst').fill('---')
    await expect(page.getByLabel('Slug')).toHaveValue('')
  })

  test('QR tool draws a local image and rejects an empty value', async ({ page }) => {
    await page.goto('/generator-qr')
    await page.getByLabel('Treść').fill('')
    await page.getByRole('button', { name: 'Generuj kod QR' }).click()
    await expect(page.getByRole('alert')).toHaveText('Wpisz tekst albo adres.')
    await page.getByLabel('Treść').fill('https://devnarzedzia.example/slugify')
    await page.getByRole('button', { name: 'Generuj kod QR' }).click()
    const image = page.getByRole('img', { name: 'Wygenerowany kod QR' })
    await expect(image).toBeVisible()
    await expect(image).toHaveAttribute('src', /^data:image\/png;base64,/)
    await expect(page.getByRole('link', { name: 'Pobierz PNG' })).toHaveAttribute('href', /^data:image\/png/)
  })

  test('color tool converts HEX red into RGB', async ({ page }) => {
    await page.goto('/konwerter-kolorow')
    const hex = page.getByLabel('HEX')
    await hex.fill('#ff0000')
    await hex.blur()
    await expect(page.getByRole('spinbutton', { name: 'R', exact: true })).toHaveValue('255')
    await expect(page.getByRole('spinbutton', { name: 'G', exact: true })).toHaveValue('0')
    await expect(page.getByRole('spinbutton', { name: 'B', exact: true })).toHaveValue('0')
    await expect(page.locator('.swatch')).toHaveAttribute('style', /rgb\(\s*255,\s*0,\s*0\s*\)/)
  })
})

async function openTool(page: Page, tool: ToolDefinition) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`/${tool.slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(tool.title)
  if (tool.category === 'generatory') {
    expect(tool.disclaimer).toBeTruthy()
    await expect(page.locator('.disclaimer')).toHaveText(tool.disclaimer ?? '')
  }
  expect(errors).toEqual([])
}

function stat(page: Page, name: string) {
  return page.locator('dt', { hasText: new RegExp(`^${name}$`) }).locator('xpath=following-sibling::dd')
}
