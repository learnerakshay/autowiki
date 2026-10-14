import { expect } from '@playwright/test'

/** Prepare a deterministic capture without changing the page's normal motion behavior. */
export async function stableVisual(page, { loadLandingSections = false } = {}) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(() => window.scrollTo(0, 0))
  if (loadLandingSections && await page.locator('.landing-shell').count()) {
    await page.evaluate(() => window.dispatchEvent(new Event('landing:load-all')))
    const sections = page.locator('[data-lazy-section]')
    await expect.poll(async () => sections.count()).toBe(5)
    await expect(page.locator('[data-lazy-section][data-ready="false"]')).toHaveCount(0)
    for (const section of await sections.all()) {
      await section.scrollIntoViewIfNeeded()
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    }
    await page.evaluate(() => window.scrollTo(0, 0))
  }
  await page.evaluate(async () => {
    await document.fonts.ready
    await Promise.all([...document.images].map((image) => image.decode?.().catch(() => {})))
  })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }' })
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
}

export const stableScreenshot = { animations: 'disabled', caret: 'hide' }
