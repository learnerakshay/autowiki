import { expect, test } from '@playwright/test'

const sample = '/wiki/sample/spoon-knife'

test('reader navigation, actual headings, deep link, source and code actions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(sample)
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await page.locator('.wiki-chapter-nav').getByRole('button', { name: /Web Structure/ }).click()
  await expect(page).toHaveURL(/#chapter-2$/)
  await expect(page.getByRole('heading', { level: 2, name: 'Web Structure' })).toBeVisible()
  await expect(page.getByRole('navigation', { name: 'In this chapter' }).getByRole('button', { name: 'Head Section' })).toBeVisible()
  await page.getByRole('navigation', { name: 'In this chapter' }).getByRole('button', { name: 'Head Section' }).click()
  await expect(page.getByRole('heading', { name: 'Head Section' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open index.html on GitHub' })).toHaveAttribute('href', 'https://github.com/octocat/Spoon-Knife/blob/HEAD/index.html')
  await page.getByRole('button', { name: /Next: Styling/ }).click()
  await expect(page).toHaveURL(/#chapter-3$/)
  await expect(page.locator('.wiki-code-block').first()).toBeVisible()
  await expect(page.locator('.wiki-code-block').first().getByRole('button', { name: 'Copy' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: 'Styling' })).toBeVisible()
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
})

test('diagram controls keep exactly one SVG while zooming, panning and expanding', async ({ page }) => {
  await page.goto(sample)
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  const svg = page.locator('.diagram svg')
  await expect(svg).toHaveCount(1)
  await page.getByRole('button', { name: 'Zoom in' }).click()
  await expect(page.locator('.diagram-controls').first()).toContainText('125%')
  await page.locator('.diagram').first().focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('0')
  await expect(page.locator('.diagram-controls').first()).toContainText('100%')
  await page.getByRole('button', { name: 'Expand diagram' }).click()
  const dialog = page.getByRole('dialog', { name: 'Architecture diagram' })
  await expect(dialog).toBeVisible()
  await expect(svg).toHaveCount(1)
  expect(await dialog.locator('.diagram svg').count()).toBe(1)
  await dialog.getByRole('button', { name: 'Zoom in' }).click()
  await expect(svg).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Expand diagram' })).toBeFocused()
  await expect(svg).toHaveCount(1)
})

test('reader renders without horizontal scroll at required widths', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 1366, 1280, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(sample)
    await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `test-results/captures/wiki-review-${width}.png`, fullPage: true })
  }
})

test('generated Wiki uses the same reader and arrival hint', async ({ page }) => {
  const data = {
    status: 'completed', repo: 'octocat/Spoon-Knife', generatedAt: '2026-10-12T23:25:46.465Z',
    chapters: [{ title: 'Introduction', description: 'First chapter', markdown: '# Introduction\n\nGenerated body.', mermaid: 'graph TD; A-->B;', diagramValid: true, filePaths: ['README.md'] }],
  }
  await page.route('**/api/wiki/jobs/generated-review', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) }))
  await page.goto('/wiki?jobId=generated-review')
  await expect(page.getByRole('heading', { level: 1, name: 'octocat/Spoon-Knife' })).toBeVisible()
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Open Chat' })).toHaveAttribute('href', '/chat?repo=octocat%2FSpoon-Knife')
})
