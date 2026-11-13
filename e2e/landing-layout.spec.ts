import { existsSync, mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'

const groups = [
  ['Identyfikatory', 'identyfikatory'],
  ['Dane testowe', 'dane-testowe'],
  ['Kodowanie', 'kodowanie'],
  ['Formatowanie i dane', 'formatowanie-i-dane'],
  ['Tekst i liczby', 'tekst-i-liczby'],
  ['Czas', 'czas'],
  ['Sieć i system', 'siec-i-system'],
  ['Hashe', 'hashe'],
] as const

const artifactDir = '/opt/cursor/artifacts'

test('landing lists eight groups and the conservative calculation claim', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  for (const [label, anchor] of groups) {
    await expect(page.locator(`#${anchor} > h3`)).toHaveText(label)
  }
  await expect(page.locator('a.toc__link')).toHaveCount(65)
  await expect(page.locator('a.toc__link[href="/generator-pesel"]')).toHaveCount(2)
  await expect(page.locator('#identyfikatory a[href="/generator-nip"] .toc__desc')).toHaveText(
    'Suma kontrolna i budowa numeru',
  )
  await expect(page.getByRole('heading', { name: 'Pokazujemy obliczenia' }).locator('xpath=..')).toContainText(
    'Sprawdzisz format i sumę kontrolną popularnych numerów.',
  )
  await expect(page.getByText('cyfrę, przy której numer przestaje się zgadzać')).toHaveCount(0)
  await expect(page.getByText('kod urzędu skarbowego')).toHaveCount(0)
  await expect(page.getByLabel('Numer PESEL')).toHaveValue('44051401359')
  await expect(page.getByRole('status')).toContainText('Poprawny format i suma kontrolna')
  await expect(page.locator('.hero__in')).toHaveClass(/hero__in--with-demo/)
  expect(await columnCount(page.locator('.hero__in'))).toBeGreaterThan(1)
  expect(await overflows(page)).toBe(false)
  await saveShot(page, 'landing-1280')

  await page.getByLabel('Numer PESEL').fill('44051401358')
  await expect(page.getByRole('status')).toContainText('Niepoprawny format lub suma kontrolna')
  await expect(page.locator('.calc')).toContainText('wpisano 8')
  await expect(page.locator('.calc')).not.toContainText('mod 10')
  await expect(page.locator('.calc')).not.toContainText('powinna')
  await page.getByLabel('Numer PESEL').fill('44051')
  await expect(page.getByRole('status')).toHaveText('Wpisano 5 z 11 cyfr.')
  await expect(page.locator('.calc')).toHaveText('Obliczenia pojawią się po wpisaniu 11 cyfr.')
  await expect(page.locator('.facts')).toHaveCount(0)

  await page.setViewportSize({ width: 390, height: 844 })
  expect(await columnCount(page.locator('.hero__in'))).toBe(1)
  expect(await overflows(page)).toBe(false)
  await saveShot(page, 'landing-390')
})

test('tool page uses the shared frame and stacks the structure table at 390px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/generator-pesel')
  await expect(page.getByRole('navigation', { name: 'Okruszki' })).toBeVisible()
  await expect(page.locator('section.tool')).toBeVisible()
  await expect(page.getByRole('note', { name: 'Zastrzeżenie' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Co dzieje się z danymi' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Powiązane narzędzia' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Budowa numeru PESEL' })).toBeVisible()
  await expect(page.getByText('Pokaż obliczenia')).toHaveCount(0)
  expect(await overflows(page)).toBe(false)
  await saveShot(page, 'tool-pesel-1280')

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.locator('.tool-head .crumbs')).toBeHidden()
  await expect(page.locator('.lead-mobile')).toBeVisible()
  const before = await page.locator('.responsive-table tbody td').first().evaluate((cell) => {
    return getComputedStyle(cell, '::before').content
  })
  expect(before).toContain('Znaczenie')
  const thead = await page.locator('.responsive-table thead').evaluate((head) => {
    const style = getComputedStyle(head)
    return { position: style.position, width: style.width, clip: style.clipPath }
  })
  expect(thead.position).toBe('absolute')
  expect(thead.width).toBe('1px')
  expect(thead.clip).not.toBe('none')
  expect(await overflows(page)).toBe(false)
  await saveShot(page, 'tool-pesel-390')
})

test('a retired catalogue anchor redirects on the home page', async ({ page }) => {
  await page.goto('/#polskie-identyfikatory')
  await expect(page).toHaveURL(/#identyfikatory$/)
  await page.goto('/#tekst')
  await expect(page).toHaveURL(/#tekst-i-liczby$/)
  await page.goto('/#siec')
  await expect(page).toHaveURL(/#siec-i-system$/)
})

async function columnCount(locator: ReturnType<Page['locator']>): Promise<number> {
  const columns = await locator.evaluate((element) => getComputedStyle(element).gridTemplateColumns)
  return columns.split(' ').filter((part) => part.length > 0 && part !== 'none').length
}

async function overflows(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
}

async function saveShot(page: Page, name: string) {
  if (!existsSync('/opt/cursor')) return
  mkdirSync(artifactDir, { recursive: true })
  await page.screenshot({ path: `${artifactDir}/${name}.png`, fullPage: true })
}
