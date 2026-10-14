import { expect, test } from '@playwright/test'
import { architectureNodes } from '../web/src/data/architecture.js'

test.use({ reducedMotion: 'reduce' })
test('every selected node: edge label geometry, contrast and canvas gap at three desktop widths', async ({ page }) => {
  const rows = []
  for (const width of [1100, 1440, 1920]) {
    await page.setViewportSize({ width, height: 1080 })
    await page.goto('/architecture')
    for (const node of architectureNodes) {
      await page.locator('.arch-node').filter({ hasText: node.label }).click()
      await expect(page.locator('.arch-detail h2')).toHaveText(node.label)
      await expect(page.locator('.arch-detail .ui-disc__trigger')).toHaveAttribute('aria-expanded', 'false')
      for (const edge of await page.locator('.arch-detail li button').all()) {
        await edge.focus()
        const geometry = await page.evaluate(() => {
          const boxes = [...document.querySelectorAll('.arch-connectors text')].map((element) => element.getBoundingClientRect())
          const nodes = [...document.querySelectorAll('.arch-node')].map((element) => element.getBoundingClientRect())
          const overlap = (a,b) => Math.min(a.right,b.right) - Math.max(a.left,b.left) > 0 && Math.min(a.bottom,b.bottom) - Math.max(a.top,b.top) > 0
          return { labels: boxes.length, collisions: boxes.flatMap((a,i) => [...nodes, ...boxes.slice(i+1)].filter((b) => overlap(a,b))).length }
        })
        expect(geometry.labels).toBe(1)
        expect(geometry.collisions, `${width} ${node.id}`).toBe(0)
      }
      const gap = await page.evaluate(() => Math.max(0, document.querySelector('.arch-overview').getBoundingClientRect().bottom - document.querySelector('.arch-canvas').getBoundingClientRect().bottom))
      rows.push({ width, node: node.id, gap })
      expect(gap, `${width} ${node.id} gap`).toBeLessThanOrEqual(80)
    }
  }
  console.log('CANVAS_GAPS ' + JSON.stringify(rows))
})

test('backbone resolves real text backgrounds and has aligned stages and connector', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/architecture')
  await page.locator('.arch-section--JobArchitecture').scrollIntoViewIfNeeded()
  await expect(page.locator('.arch-backbone')).toBeVisible()
  const metrics = await page.evaluate(() => {
    const root = document.querySelector('.arch-backbone')
    const rgb = (value) => value.match(/[\d.]+/g).map(Number)
    const luminance = (color) => color.slice(0,3).map((v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4 }).reduce((sum,v,i) => sum + v * [.2126,.7152,.0722][i], 0)
    const contrast = (element) => {
      let current = element, background
      while (current) { const color = rgb(getComputedStyle(current).backgroundColor); if (color[3] !== 0) { background = color; break } current = current.parentElement }
      const pseudo = getComputedStyle(element, '::before')
      const tint = rgb(pseudo.backgroundColor)
      if (Number(pseudo.opacity) === 1 && tint[3] !== 0 && pseudo.position === 'absolute' && [pseudo.top,pseudo.right,pseudo.bottom,pseudo.left].every((value) => parseFloat(value) <= 0)) background = tint
      const fg = luminance(rgb(getComputedStyle(element).color)), bg = luminance(background || [255,255,255])
      return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)
    }
    const text = [...root.querySelectorAll('*')].filter((element) => [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent.trim()))
    const circles = [...root.querySelectorAll('.pipeline li > span')].map((el) => el.getBoundingClientRect())
    const titles = [...root.querySelectorAll('.pipeline li > strong')].map((el) => el.getBoundingClientRect().top)
    const line = root.querySelector('.pipeline__track').getBoundingClientRect()
    return { text: text.map((el) => ({ text: el.textContent, ratio: contrast(el) })), clearance: circles[0].top - root.querySelector(':scope > p').getBoundingClientRect().bottom, spread: Math.max(...titles)-Math.min(...titles), end: Math.abs(line.right - (circles.at(-1).left + circles.at(-1).width/2)) }
  })
  console.log('BACKBONE ' + JSON.stringify(metrics))
  for (const item of metrics.text) expect(item.ratio, item.text).toBeGreaterThanOrEqual(4.5)
  expect(metrics.clearance).toBeGreaterThanOrEqual(16)
  expect(metrics.spread).toBeLessThanOrEqual(1)
  expect(metrics.end).toBeLessThanOrEqual(1)
})

test('sample controls fit at element level; RAG switch and explore focus', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 640 })
  await page.goto('/wiki/sample/spoon-knife')
  const overflow = await page.evaluate(() => [...document.querySelectorAll('main button, main button svg')].filter((el) => { const box = el.getBoundingClientRect(); return box.width && (box.right > innerWidth + 1 || box.left < -1) }).map((el) => el.outerHTML.slice(0,100)))
  expect(overflow).toEqual([])
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/architecture')
  await page.getByRole('link', { name: 'Explore the system' }).click()
  await expect(page.locator('#system-overview-title')).toBeFocused()
  await page.locator('.arch-section--RagExplorer').scrollIntoViewIfNeeded()
  const top = await page.locator('.arch-independent').evaluate((el) => el.getBoundingClientRect().top + scrollY)
  await page.getByRole('tab', { name: 'Answer question' }).click()
  expect(Math.abs(await page.locator('.arch-independent').evaluate((el) => el.getBoundingClientRect().top + scrollY) - top)).toBeLessThanOrEqual(1)
})
