import { expect, test } from '@playwright/test'
import { auditAxe } from './helpers/axe.js'

test('all five routes pass axe after motion has settled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const path of ['/', '/workspace', '/chat', '/wiki/sample/spoon-knife', '/architecture']) {
    await page.goto(path)
    if (path !== '/') await expect(page.locator('.route-viewport')).toHaveAttribute('data-ready', 'true')
    if (path.includes('sample')) await expect(page.locator('.diagram svg')).toHaveCount(1)
    const violations = await auditAxe(page)
    expect(violations, `${path} axe violations`).toEqual([])
  }
})
