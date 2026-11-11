import { expect, test } from '@playwright/test'
import { tools } from '../src/registry'

const shellPages = [
  { path: '/', heading: 'Krótkie narzędzia na co dzień', title: /Krótkie narzędzia na co dzień — DevNarzędzia/ },
  { path: '/regulamin', heading: 'Regulamin', title: /Regulamin — DevNarzędzia/ },
  { path: '/polityka-prywatnosci', heading: 'Polityka prywatności', title: /Polityka prywatności — DevNarzędzia/ },
  { path: '/operator', heading: 'Operator', title: /Operator — DevNarzędzia/ },
  { path: '/404', heading: 'Nie ma takiej strony', title: /Nie ma takiej strony — DevNarzędzia/ },
]

test('home is Polish and lists every registered tool', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'pl')
  await expect(page).toHaveTitle(shellPages[0].title)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(shellPages[0].heading)
  for (const tool of tools) {
    await expect(page.getByRole('link', { name: new RegExp(`^${escapeRegExp(tool.title)}(?:\\s|$)`) })).toBeVisible()
  }
})

for (const item of shellPages.slice(1)) {
  test(`${item.path} renders a title`, async ({ page }) => {
    await page.goto(item.path)
    await expect(page).toHaveTitle(item.title)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(item.heading)
  })
}

for (const tool of tools) {
  test(`/${tool.slug} renders a title`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto(`/${tool.slug}`)
    await expect(page).toHaveTitle(new RegExp(`${escapeRegExp(tool.title)} — DevNarzędzia`))
    await expect(page.getByRole('heading', { level: 1, name: tool.title })).toBeVisible()
    await expect(page.getByText(tool.description)).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('an unknown address shows the not-found page', async ({ page }) => {
  const response = await page.goto('/nie-ma-takiej-strony')
  expect(response?.status()).toBe(404)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Nie ma takiej strony')
})

test('Ctrl+K search opens a tool', async ({ page }) => {
  await page.goto('/')
  const dialog = page.getByRole('dialog', { name: 'Szybkie wyszukiwanie' })
  // The shortcut is listened for after hydration. Pressing once before that
  // listener exists is lost, so retry until the palette opens.
  await expect(async () => {
    await page.keyboard.press('Control+k')
    await expect(dialog).toBeVisible({ timeout: 250 })
  }).toPass()
  await dialog.getByRole('searchbox').fill('slugify')
  await dialog.getByRole('button', { name: 'Slug z polskich znaków' }).click()
  await expect(page).toHaveURL(/\/slugify$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Slug z polskich znaków')
})

test('dark mode toggles and survives a reload', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  await page.getByRole('button', { name: 'Przełącz motyw' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await page.getByRole('button', { name: 'Przełącz motyw' }).click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
})

test('sitemap lists every tool slug and the shell pages', async ({ request }) => {
  const response = await request.get('/sitemap.xml')
  expect(response.ok()).toBeTruthy()
  const xml = await response.text()
  for (const path of ['/', '/regulamin', '/polityka-prywatnosci', '/operator']) {
    expect(xml, path).toContain(`https://devnarzedzia.example${path === '/' ? '/' : path}</loc>`)
  }
  for (const tool of tools) {
    expect(xml, tool.slug).toContain(`https://devnarzedzia.example/${tool.slug}</loc>`)
  }
  expect(xml).not.toContain('/404')
})

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
