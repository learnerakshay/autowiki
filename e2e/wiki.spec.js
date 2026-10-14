import { expect, test } from '@playwright/test'

test('wiki replaces chapter content and keeps exactly one Mermaid SVG', async ({ page }) => {
  const chapters = [
    { title: 'Introduction', description: 'First chapter', markdown: '# Introduction\n\nFirst body.', mermaid: 'graph TD; A-->B;', diagramValid: true, filePaths: [] },
    { title: 'Structure', description: 'Second chapter', markdown: '# Structure\n\nSecond body.', mermaid: 'graph TD; C-->D;', diagramValid: true, filePaths: [] },
  ]
  await page.route('**/api/wiki/jobs/chapter-test', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ status: 'completed', repo: 'octocat/Spoon-Knife', generatedAt: '2026-10-12T23:25:46.465Z', chapters }),
  }))
  await page.goto('/wiki?jobId=chapter-test')
  await expect(page.getByRole('heading', { name: 'Chapters' })).toBeVisible()
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.locator('.diagram svg .nodeLabel')).toHaveText(['A', 'B'])
  await page.locator('.wiki-chapter-nav').getByRole('button', { name: /Structure/ }).click()
  await expect(page.locator('article h2')).toHaveText('Structure')
  await expect(page.locator('.chapter')).toContainText('Second body.')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.locator('.diagram svg .nodeLabel')).toHaveText(['C', 'D'])
  await expect(page.locator('.diagram svg .nodeLabel')).not.toHaveText(['A', 'B'])
  await page.locator('.wiki-chapter-nav').getByRole('button', { name: /Introduction/ }).click()
  await expect(page.locator('article h2')).toHaveText('Introduction')
  await expect(page.locator('.chapter')).toContainText('First body.')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
})


test('live Wiki generates chapters and changes diagram content', async ({ page }) => {
  test.skip(process.env.E2E_LIVE !== '1', 'Set E2E_LIVE=1 with API and Inngest running to generate a real Wiki.')
  await page.goto('/workspace?repo=octocat%2FSpoon-Knife')
  await page.getByRole('button', { name: 'Generate Wiki', exact: true }).click()
  await page.getByRole('link', { name: 'Open wiki', exact: true }).click()
  await expect(page.locator('.wiki-reader h1')).toHaveText('octocat/Spoon-Knife')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect.poll(async () => await page.locator('.diagram svg').count() === 1 || await page.locator('.wiki-diagram-error').isVisible(), { timeout: 15000 }).toBe(true)
  expect(await page.locator('.diagram svg').count()).toBeLessThanOrEqual(1)
  const first = await page.locator('#wiki-diagram').textContent()
  const chapters = page.locator('.wiki-reader-grid .wiki-chapter-button')
  expect(await chapters.count()).toBeGreaterThan(1)
  await chapters.nth(1).click()
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect.poll(async () => await page.locator('.diagram svg').count() === 1 || await page.locator('.wiki-diagram-error').isVisible(), { timeout: 15000 }).toBe(true)
  expect(await page.locator('.diagram svg').count()).toBeLessThanOrEqual(1)
  await expect(page.locator('#wiki-diagram')).not.toHaveText(first)
})
