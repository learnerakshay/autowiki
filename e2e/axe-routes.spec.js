import { expect, test } from '@playwright/test'
import { auditAxe } from './helpers/axe.js'

test('all six routes pass axe at desktop and mobile after motion has settled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 390]) {
  await page.setViewportSize({ width, height: 900 })
  for (const path of ['/', '/workspace', '/chat', '/wiki', '/wiki/sample/spoon-knife', '/architecture']) {
    await page.goto(path)
    if (path !== '/') await expect(page.locator('.route-viewport')).toHaveAttribute('data-ready', 'true')
    if (path.includes('sample')) await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
    if (path.includes('sample')) await expect(page.locator('.diagram svg')).toHaveCount(1)
    if (path === '/architecture') {
      await page.evaluate(() => window.dispatchEvent(new Event('architecture:load-all')))
      await expect(page.getByRole('tab', { name: 'Index repository' })).toBeAttached()
      for (const section of await page.locator('.arch-section').all()) await section.scrollIntoViewIfNeeded()
    }
    const violations = await auditAxe(page)
    expect(violations, `${path} ${width}px axe violations`).toEqual([])
  }
  }
})
