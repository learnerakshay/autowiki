import { createHash } from 'node:crypto'
import { expect, test } from '@playwright/test'
import { stableScreenshot, stableVisual } from './helpers/stableVisual.js'

const hash = (buffer) => createHash('sha256').update(buffer).digest('hex')

test('landing full-page capture is visually stable in three fresh Chrome sessions', async ({ browser }) => {
  const raw = []
  const stable = []
  const pixelDifferences = []
  for (let run = 0; run < 3; run += 1) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    raw.push(hash(await page.screenshot({ fullPage: true, animations: 'disabled' })))
    await stableVisual(page, { loadLandingSections: true })
    const capture = await page.screenshot({ fullPage: true, ...stableScreenshot })
    stable.push(hash(capture))
    if (run) {
      const differences = await page.evaluate(async ([first, current]) => {
        const pixels = async (encoded) => {
          const image = new Image()
          image.src = `data:image/png;base64,${encoded}`
          await image.decode()
          const canvas = document.createElement('canvas')
          canvas.width = image.naturalWidth
          canvas.height = image.naturalHeight
          const context = canvas.getContext('2d')
          context.drawImage(image, 0, 0)
          return context.getImageData(0, 0, canvas.width, canvas.height).data
        }
        const a = await pixels(first)
        const b = await pixels(current)
        if (a.length !== b.length) return Infinity
        let count = 0
        for (let offset = 0; offset < a.length; offset += 4) if (a[offset] !== b[offset] || a[offset + 1] !== b[offset + 1] || a[offset + 2] !== b[offset + 2] || a[offset + 3] !== b[offset + 3]) count++
        return count
      }, [stable[0].buffer.toString('base64'), capture.toString('base64')])
      pixelDifferences.push(differences)
    }
    stable[run] = { hash: stable[run], buffer: capture }
    await context.close()
  }
  console.log(`Uncontrolled mismatches: ${raw.slice(1).filter((value) => value !== raw[0]).length}/2; stable pixel differences: ${pixelDifferences.join(', ')}`)
  expect(pixelDifferences.every((value) => value <= 32)).toBe(true)
})
