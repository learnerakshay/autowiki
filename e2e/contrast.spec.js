import { expect, test } from '@playwright/test'

test('forced colours and high contrast preserve shell, Workspace, and Wiki controls', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.emulateMedia({ forcedColors: 'active', contrast: 'more', reducedMotion: 'reduce' })
  for (const path of ['/workspace', '/wiki/sample/spoon-knife', '/chat', '/architecture']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const button = page.getByRole('button').first()
    await button.focus()
    expect(await button.evaluate((element) => getComputedStyle(element).outlineStyle)).not.toBe('none')
    const active = page.locator('.ln__links a[aria-current="page"]')
    expect(await active.evaluate((node) => getComputedStyle(node).borderBottomWidth)).toBe('2px')
    expect(await active.evaluate((node) => getComputedStyle(node).borderBottomStyle)).toBe('solid')
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1280)
  }
})

test('reduced transparency media preference keeps content readable', async ({ page }) => {
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-transparency', value: 'reduce' }] })
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Explore a sample Wiki' })).toBeVisible()
})
