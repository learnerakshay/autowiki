import AxeBuilder from '@axe-core/playwright'

/** Axe must inspect the settled colours, never a halfway transparent entrance frame. */
export async function auditAxe(page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.evaluate(async () => { await document.fonts.ready })
  await page.addStyleTag({ content: '*, *::before, *::after { animation: none !important; transition: none !important; }' })
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== 'running'))
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const result = await new AxeBuilder({ page }).analyze()
  return result.violations.map(({ id, impact, nodes }) => ({ id, impact, selectors: nodes.map((node) => node.target.join(' ')) }))
}
