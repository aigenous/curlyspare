import { expect, test, type Page } from '@playwright/test'
import { tools, type ToolDefinition } from '../src/registry'

const finished = tools.filter(
  (tool) => tool.category === 'generatory' || tool.category === 'konwertery' || tool.category === 'kodowanie',
)

test('every finished generator shows the disclaimer and every converter renders', async ({ page }) => {
  for (const tool of finished) {
    await openTool(page, tool)
  }
  expect(finished.every((tool) => tool.slug.length > 0)).toBe(true)
})

test.describe('shell tools', () => {
  test('case tool converts Polish text to kebab-case', async ({ page }) => {
    await page.goto('/zmiana-wielkosci-liter')
    await page.getByLabel('Wielkość').selectOption('kebab')
    await expect(page.getByLabel('Wynik')).toHaveValue('zażółć-gęślą-jaźń')
  })

  test('counter counts words in pasted text', async ({ page }) => {
    await page.goto('/licznik-znakow')
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
    await page.goto('/generator-slug')
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

  test('password generator uses the selected classes and rejects an empty alphabet', async ({ page }) => {
    await page.goto('/generator-hasel')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Generator haseł')
    await page.getByRole('button', { name: 'Generuj', exact: true }).click()
    const password = page.getByLabel('Hasło')
    await expect(password).not.toHaveValue('')
    const value = await password.inputValue()
    expect(value).toHaveLength(16)
    expect(value).toMatch(/^[a-zA-Z0-9]+$/)
    expect(value).toMatch(/[a-z]/)
    expect(value).toMatch(/[A-Z]/)
    expect(value).toMatch(/\d/)

    await page.getByLabel('Małe litery').uncheck()
    await page.getByLabel('Wielkie litery').uncheck()
    await page.getByLabel('Cyfry').uncheck()
    await page.getByRole('button', { name: 'Generuj', exact: true }).click()
    await expect(page.getByText('Zaznacz co najmniej jeden zestaw znaków.')).toBeVisible()
    await expect(password).toHaveValue('')
  })

  test('HTML entities encode markup and decode it back', async ({ page }) => {
    await page.goto('/encje-html')
    const result = page.getByLabel('Wynik')
    await expect(result).toHaveValue(/&lt;p&gt;/)
    await expect(result).toHaveValue(/&amp;/)
    await page.getByLabel('Tekst').fill('&lt;b&gt;łódź&lt;/b&gt;')
    await page.getByLabel('Kierunek').selectOption('decode')
    await expect(result).toHaveValue('<b>łódź</b>')
  })

  test('text diff marks the changed line and can switch to words', async ({ page }) => {
    await page.goto('/porownanie-tekstu')
    await expect(page.locator('.diff-removed')).toContainText('ma')
    await expect(page.locator('.diff-added')).toContainText('nie ma')
    await page.getByLabel('Tryb').selectOption('word')
    await expect(page.locator('.diff-added')).toContainText('nie')
  })

  test('number bases round-trip and reject a foreign digit', async ({ page }) => {
    await page.goto('/zamiana-systemow-liczbowych')
    await expect(page.getByLabel('Wynik')).toHaveValue('FF')
    await page.getByLabel('Liczba').fill('2')
    await page.getByLabel('Z systemu').selectOption('2')
    await expect(page.getByText('Znak „2” nie należy do systemu o podstawie 2.')).toBeVisible()
    await page.getByLabel('Liczba').fill('FF')
    await page.getByLabel('Z systemu').selectOption('16')
    await page.getByLabel('Na system').selectOption('10')
    await expect(page.getByLabel('Wynik')).toHaveValue('255')
    await page.getByLabel('Na system').selectOption('2')
    await expect(page.getByLabel('Wynik')).toHaveValue('11111111')
  })

  test('regex tester highlights Polish words and reports a bad pattern', async ({ page }) => {
    await page.goto('/tester-regex')
    await expect(page.locator('.mark')).toHaveText(['Zażółć', 'gęślą', 'jaźń'])
    await page.getByLabel('Wyrażenie').fill('(')
    await expect(page.getByText('Niepoprawne wyrażenie regularne.')).toBeVisible()
    await page.getByLabel('Wyrażenie').fill('a')
    await page.getByRole('checkbox', { name: 'v', exact: true }).check()
    await expect(page.getByText('Flagi u i v wykluczają się.')).toBeVisible()
  })

  test('color tool converts HEX red into RGB', async ({ page }) => {
    await page.goto('/hex-na-rgb')
    const hex = page.getByLabel('HEX')
    await hex.fill('#ff0000')
    await hex.blur()
    await expect(page.getByRole('spinbutton', { name: 'Czerwony' })).toHaveValue('255')
    await expect(page.getByRole('spinbutton', { name: 'Zielony' })).toHaveValue('0')
    await expect(page.getByRole('spinbutton', { name: 'Niebieski' })).toHaveValue('0')
    await expect(page.locator('.swatch')).toHaveAttribute('style', /rgb\(\s*255,\s*0,\s*0\s*\)/)
  })
})

async function openTool(page: Page, tool: ToolDefinition) {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto(`/${tool.slug}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(tool.title)
  if (tool.category === 'generatory') {
    expect(tool.disclaimer, `${tool.slug} needs a disclaimer`).toBeTruthy()
  }
  if (tool.disclaimer) {
    await expect(page.locator('.disclaimer')).toHaveText(tool.disclaimer)
  }
  expect(errors).toEqual([])
}

function stat(page: Page, name: string) {
  return page.locator('dt', { hasText: new RegExp(`^${name}$`) }).locator('xpath=following-sibling::dd')
}
