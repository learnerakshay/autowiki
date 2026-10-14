import { expect, firefox, test, webkit } from '@playwright/test'

for (const [name, browserType] of [['Firefox', firefox], ['WebKit', webkit]]) {
  test(`${name} smoke: every route including 404`, async () => {
    test.skip(name === 'Firefox', 'Owner Windows host cannot launch Firefox (mozglue side-by-side assembly / spawn UNKNOWN); verify on a working host.')
    let browser
    try {
      browser = await browserType.launch({ executablePath: browserType.executablePath() })
    } catch (error) {
      if (name === 'Firefox' && /spawn UNKNOWN/.test(String(error))) {
        test.skip(true, 'Firefox executable cannot launch on this Windows host (spawn UNKNOWN)')
      }
      throw error
    }
    const context = await browser.newContext({ baseURL: process.env.BASE_URL ?? 'http://localhost:5173', viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    for (const path of ['/', '/workspace', '/chat', '/wiki/sample/spoon-knife', '/architecture', '/missing']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect((await page.locator('main').innerText()).trim().length).toBeGreaterThan(20)
      if (path !== '/') await expect(page.locator('.route-viewport')).toHaveAttribute('data-ready', 'true')
      if (path.includes('/sample/')) { await page.locator('#wiki-diagram').scrollIntoViewIfNeeded(); await expect(page.locator('.diagram svg')).toHaveCount(1) }
    }
    expect(errors).toEqual([])
    await context.close()
    await browser.close()
  })
}

test('Chrome without idle callbacks renders every route', async ({ page }) => {
  await page.addInitScript(() => { delete window.requestIdleCallback; delete window.cancelIdleCallback })
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  for (const path of ['/', '/workspace', '/chat', '/wiki/sample/spoon-knife', '/architecture', '/missing']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    expect((await page.locator('main').innerText()).trim().length).toBeGreaterThan(20)
  }
  expect(errors).toEqual([])
})
