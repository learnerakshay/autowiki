import { expect, firefox, test, webkit } from '@playwright/test'

for (const [name, browserType] of [['Firefox', firefox], ['WebKit', webkit]]) {
  test(`${name} smoke: landing, shell, Workspace, sample Wiki`, async () => {
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
    for (const path of ['/', '/workspace', '/wiki/sample/spoon-knife']) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (path !== '/') await expect(page.locator('.route-viewport')).toHaveAttribute('data-ready', 'true')
    }
    await expect(page.locator('.diagram svg')).toHaveCount(1)
    await context.close()
    await browser.close()
  })
}
