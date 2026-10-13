import { expect, test } from '@playwright/test'

const widths = [1440, 1280, 1024, 768, 390, 320]

test('Landing scroll story is accessible, interactive, and responsive', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Your repository, beautifully documented.' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate', exact: true })).toBeVisible()

  const tabs = page.getByRole('tab')
  await tabs.nth(0).focus()
  await page.keyboard.press('ArrowRight')
  await expect(tabs.nth(1)).toHaveAttribute('data-state', 'active')

  const steps = page.locator('.process-step')
  await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto' })
  for (let index = 0; index < 3; index += 1) {
    await steps.nth(index).evaluate((element) => {
      const top = element.getBoundingClientRect().top + window.scrollY
      window.scrollTo(0, top + element.clientHeight / 2 - window.innerHeight / 2)
    })
    await expect(steps.nth(index)).toHaveAttribute('aria-current', 'step')
    await page.waitForTimeout(550)
    await page.screenshot({ path: `screenshots/prompt-14-scroll-story-step-${index + 1}.png` })
  }

  await page.goto('/workspace')
  await page.goto('/')
  await expect(page.locator('.process-step')).toHaveCount(3)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  }

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('Workspace hierarchy keeps both real actions and the sample path available', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/workspace')

  await expect(page.getByRole('heading', { level: 1, name: 'What will we document today?' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Generate Wiki' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Index Repository' })).toBeDisabled()
  await expect(page.getByRole('link', { name: 'Open the pre-generated Spoon-Knife Wiki' })).toHaveAttribute('href', '/wiki/sample/spoon-knife')
  await expect(page.getByText('Conceptual workflow—not live job progress.')).toBeVisible()

  await page.setViewportSize({ width: 320, height: 800 })
  await page.reload()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('Sample Wiki uses the flagship reader at desktop and mobile sizes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/wiki/sample/spoon-knife')

  await expect(page.getByRole('heading', { level: 1, name: 'octocat/Spoon-Knife' })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Chapter context' })).toBeVisible()
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await page.locator('.wiki-chapter-button').nth(1).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Web Structure' })).toBeVisible()
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByLabel('Chapter', { exact: true })).toBeVisible()
  await expect(page.getByRole('complementary', { name: 'Chapter context' })).toBeHidden()
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})
