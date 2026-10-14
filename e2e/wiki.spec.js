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
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await page.locator('.wiki-chapter-nav').getByRole('button', { name: /Structure/ }).click()
  await expect(page.locator('article h2')).toHaveText('Structure')
  await expect(page.locator('.chapter')).toContainText('Second body.')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await page.locator('.wiki-chapter-nav').getByRole('button', { name: /Introduction/ }).click()
  await expect(page.locator('article h2')).toHaveText('Introduction')
  await expect(page.locator('.chapter')).toContainText('First body.')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
})
