import { expect, test } from '@playwright/test'

async function capture(page, name, fullPage = true) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage })
}

test('Prompt 13 landing reset is responsive, interactive, and uses only local sample data', async ({ page }) => {
  const apiRequests = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
  })
  await page.emulateMedia({ reducedMotion: 'reduce' })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByText('octocat / Spoon-Knife')).toBeVisible()
  await capture(page, 'prompt-13-after-landing-desktop')
  await page.screenshot({ path: '../.impeccable/review/desktop.png', fullPage: true })
  await page.locator('.product-window').screenshot({ path: 'screenshots/prompt-13-after-documentation-preview.png' })

  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(3)
  await tabs.nth(0).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active')
  await tabs.nth(2).click()
  await expect(page.getByRole('heading', { name: 'Source context' })).toBeVisible()
  await expect(apiRequests).toEqual([])

  await page.locator('.landing-hero').getByRole('link', { name: 'Explore Sample Wiki' }).click()
  await expect(page).toHaveURL(/\/wiki\/sample\/spoon-knife$/)
  await page.goto('/')
  await page.getByRole('link', { name: 'Architecture', exact: true }).first().click()
  await expect(page).toHaveURL(/\/architecture$/)
  await page.goto('/')
  const hero = page.locator('.landing-hero')
  await hero.getByRole('textbox', { name: /GitHub repository/ }).fill('octocat/Spoon-Knife')
  await hero.getByRole('button', { name: 'Generate a Wiki', exact: true }).click()
  await expect(page).toHaveURL(/\/workspace\?repo=octocat%2FSpoon-Knife$/)

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await capture(page, 'prompt-13-after-landing-laptop')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden()
  await capture(page, 'prompt-13-after-landing-mobile')
  await page.screenshot({ path: '../.impeccable/review/mobile.png', fullPage: true })

  await page.setViewportSize({ width: 320, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await capture(page, 'prompt-13-after-landing-320')

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await capture(page, 'prompt-13-after-workspace-shell', false)

  await page.goto('/wiki/sample/spoon-knife')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await capture(page, 'prompt-13-after-wiki-shell', false)

  await page.setViewportSize({ width: 1586, height: 992 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.screenshot({ path: '../.impeccable/review/hero-1586x992.png', fullPage: false })
})
