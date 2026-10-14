import { expect, test } from '@playwright/test'
import { stableScreenshot, stableVisual } from './helpers/stableVisual.js'

const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

test('capture Prompt 15 release-candidate routes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await stableVisual(page)
  await page.screenshot({ path: 'screenshots/prompt-15-landing-hero.png', ...stableScreenshot })
  await stableVisual(page, { loadLandingSections: true })
  await page.screenshot({ path: 'screenshots/prompt-15-landing-full.png', fullPage: true, ...stableScreenshot })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await stableVisual(page, { loadLandingSections: true })
  await page.screenshot({ path: 'screenshots/prompt-15-landing-mobile.png', fullPage: true, ...stableScreenshot })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { name: 'What will we document today?' })).toBeVisible()
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'screenshots/prompt-15-workspace-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'What will we document today?' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-15-workspace-mobile.png', fullPage: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/wiki/sample/spoon-knife')
  await expect(page.getByRole('heading', { name: 'octocat/Spoon-Knife' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-15-wiki-desktop.png', fullPage: true })
  await page.screenshot({ path: 'screenshots/prompt-15-sample-wiki.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'octocat/Spoon-Knife' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-15-wiki-mobile.png', fullPage: true })

  await page.route('**/api/chat**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') return json(route, { jobId: 'prompt-15-chat', status: 'pending' }, 202)
    if (url.pathname.endsWith('/prompt-15-chat')) {
      return json(route, {
        status: 'completed',
        answer: '## Repository structure\n\nThe page structure lives in `index.html`; presentation rules live in `styles.css`.\n\n- Inspect HTML semantics\n- Review the stylesheet\n- Confirm both paths in the source rail',
        sources: ['index.html', 'styles.css', 'README.md'],
      })
    }
    return route.continue()
  })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/chat')
  await page.getByLabel('Repository').fill('octocat/Spoon-Knife')
  await page.getByLabel('Question').fill('Which files define the page structure and styling?')
  await page.getByRole('button', { name: 'Ask' }).click()
  await expect(page.getByRole('heading', { name: 'Answer' })).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-15-chat-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'screenshots/prompt-15-chat-mobile.png', fullPage: true })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/architecture')
  await page.getByRole('button', { name: /OpenAI models/i }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'OpenAI models' })).toBeVisible()
  await page.waitForTimeout(250)
  await page.screenshot({ path: 'screenshots/prompt-15-architecture-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.reload()
  await expect(page.getByRole('heading', { name: /Understand the system/i })).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-15-architecture-mobile.png', fullPage: true })
})

test('all primary routes fit the required responsive matrix', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  const routes = ['/', '/workspace', '/wiki/sample/spoon-knife', '/chat', '/architecture']
  const widths = [1920, 1440, 1280, 1024, 768, 390, 320]

  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })

    for (const route of routes) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)

      const dimensions = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
      }))
      expect(dimensions.document, `${route} overflowed at ${width}px`).toBeLessThanOrEqual(dimensions.viewport)
    }
  }
})
