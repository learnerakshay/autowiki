import { expect, test } from '@playwright/test'
import { stableScreenshot, stableVisual } from './helpers/stableVisual.js'

test('landing matches the calibrated screenshot from committed Pass A source', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await stableVisual(page, { loadLandingSections: true })
  if (process.env.E2E_STYLE_REGRESSION === '1') await page.addStyleTag({ content: '.landing-hero__copy { opacity: .3 !important; }' })
  expect(await page.screenshot({ fullPage: true, ...stableScreenshot })).toMatchSnapshot('pass-a-4f21681-landing-full.png', { threshold: 0.1, maxDiffPixels: 100 })
})
