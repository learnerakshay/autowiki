import { expect, test } from '@playwright/test'

test('record route mount long tasks and layout shifts at 1× and 4× CPU', async ({ browser }) => {
  const rows = []
  for (const throttle of [1, 4]) {
    for (const path of ['/', '/workspace', '/chat', '/wiki/sample/spoon-knife', '/architecture']) {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.addInitScript(() => {
        window.__mountMetrics = { tasks: [], cls: 0 }
        new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__mountMetrics.tasks.push(Math.round(entry.duration)) }).observe({ type: 'longtask', buffered: true })
        new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__mountMetrics.cls += entry.value }).observe({ type: 'layout-shift', buffered: true })
      })
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: throttle })
      for (const visit of ['first', 'revisit']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        if (path !== '/') await expect(page.locator('.route-viewport')).toHaveAttribute('data-ready', 'true')
        await page.waitForTimeout(1200)
        const metrics = await page.evaluate(() => window.__mountMetrics)
        expect(metrics.cls, `${path} ${visit} CLS`).toBe(0)
        expect(Math.max(0, ...metrics.tasks), `${path} ${visit} catastrophic mount regression`).toBeLessThan(throttle === 4 ? 1200 : 300)
        rows.push({ route: path, visit, cpu: throttle, maxTaskMs: Math.max(0, ...metrics.tasks), tasksOver50Ms: metrics.tasks.length, cls: Number(metrics.cls.toFixed(4)) })
        if (visit === 'first') await page.goto(path === '/' ? '/workspace' : '/')
      }
      await context.close()
    }
  }
  console.log('MOUNT_METRICS ' + JSON.stringify(rows))
})
