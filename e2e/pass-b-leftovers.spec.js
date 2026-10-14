import { expect, test } from '@playwright/test'
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const chapter = { title: 'Introduction', markdown: '# Introduction\n\nRepository source.', mermaid: 'graph TD; A-->B;', diagramValid: true, filePaths: [] }
const completed = { status: 'completed', repo: 'octocat/Spoon-Knife', chapters: [chapter] }

test('keyboard Wiki and Index activation preserves the button node and focus', async ({ page }) => {
  await page.route('**/api/**', (route) => json(route, route.request().method() === 'POST' ? { jobId: route.request().url().endsWith('wiki') ? 'wiki-focus' : 'index-focus' } : { status: 'pending' }, route.request().method() === 'POST' ? 202 : 200))
  await page.goto('/workspace?repo=octocat%2FSpoon-Knife')
  for (const name of ['Generate Wiki', 'Index Repository']) {
    const button = page.getByRole('button', { name, exact: true })
    await button.focus()
    await button.evaluate((node) => { window.__activatedButton = node })
    await page.keyboard.press('Enter')
    await expect(button).toHaveAttribute('aria-disabled', 'true')
    await expect(button).toBeFocused()
    expect(await button.evaluate((node) => node === window.__activatedButton)).toBe(true)
  }
})

test('pending Wiki transfers focus once to the reader heading', async ({ page }) => {
  let ready = false
  await page.route('**/api/wiki/jobs/focus', (route) => json(route, ready ? completed : { status: 'pending', progress: { stage: 'queued' } }))
  await page.goto('/wiki?jobId=focus')
  await page.getByRole('heading', { name: 'Generating your technical wiki' }).evaluate((node) => { node.tabIndex = -1; node.focus() })
  ready = true
  await expect(page.locator('.wiki-reader h1')).toBeFocused()
  await page.getByRole('link', { name: 'Generate another', exact: true }).focus()
  await expect(page.getByRole('link', { name: 'Generate another', exact: true })).toBeFocused()
})

test('HTML polling errors and missing process-local jobs have distinct recovery', async ({ page }) => {
  await page.route('**/api/wiki/jobs/server', (route) => route.fulfill({ status: 500, contentType: 'text/html', body: '<!DOCTYPE html><pre>private stack</pre>' }))
  await page.goto('/wiki?jobId=server')
  await expect(page.getByRole('heading', { name: 'Status check failed', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry status check' })).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText('private stack')
  await page.route('**/api/wiki/jobs/missing', (route) => json(route, { error: 'job not found' }, 404))
  await page.goto('/wiki?jobId=missing')
  await expect(page.getByRole('heading', { name: 'Job not found', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).toContainText('process-local')
  await expect(page.getByRole('link', { name: 'Start over' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Retry/ })).toHaveCount(0)
})

test('real wheel scrolls inline; Ctrl wheel and expanded wheel zoom', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 })
  await page.route('**/api/wiki/jobs/wheel', (route) => json(route, { ...completed, chapters: [{ ...chapter, markdown: '# Introduction\n\n' + 'Repository source.\n\n'.repeat(20) }] }))
  await page.goto('/wiki?jobId=wheel')
  const canvas = page.locator('.diagram').first()
  await canvas.scrollIntoViewIfNeeded()
  await expect(canvas.locator('svg')).toHaveCount(1)
  await canvas.hover()
  const scale = () => canvas.locator('.diagram-stage').evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a)
  const before = await page.evaluate(() => scrollY)
  await page.mouse.wheel(0, -120)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(before)
  expect(await scale()).toBe(1)
  await canvas.hover()
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -200)
  await page.keyboard.up('Control')
  await expect.poll(scale).toBeGreaterThan(1.1)
  await page.getByRole('button', { name: 'Expand diagram' }).click()
  const expanded = page.locator('.diagram--expanded')
  await expanded.hover()
  await page.mouse.wheel(0, -200)
  await expect.poll(() => expanded.locator('.diagram-stage').evaluate((node) => new DOMMatrixReadOnly(getComputedStyle(node).transform).a)).toBeGreaterThan(1.6)
})

test('Mermaid failure cleans body nodes and hides the dead expansion action', async ({ page }) => {
  await page.route('**/api/wiki/jobs/broken', (route) => json(route, { ...completed, chapters: [{ ...chapter, mermaid: 'graph TD; A[[[ broken -->;' }] }))
  await page.goto('/wiki?jobId=broken')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.getByText('Diagram could not be rendered.')).toBeVisible()
  expect(await page.evaluate(() => [...document.querySelectorAll('[id^="dmermaid"], svg[id^="mermaid"]')].filter((node) => !node.closest('.diagram')).length)).toBe(0)
  await expect(page.locator('.diagram svg')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Generated diagram/ })).toHaveCount(0)
})

test('unsaved Index has a neutral pill', async ({ page }) => {
  await page.route('**/api/index', (route) => json(route, { jobId: 'not-saved' }, 202))
  await page.route('**/api/index/jobs/not-saved', (route) => json(route, { status: 'completed', saved: false, fileCount: 2, chunkCount: 3 }))
  await page.goto('/workspace?repo=octocat%2FSpoon-Knife')
  await page.getByRole('button', { name: 'Index Repository' }).click()
  await expect(page.locator('.ui-status').filter({ hasText: 'Finished, not saved' })).toBeVisible()
  await expect(page.getByText('Succeeded', { exact: true })).toHaveCount(0)
})

test('context expansion loads a deferred diagram without scrolling to it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/api/wiki/jobs/deferred', (route) => json(route, { ...completed, chapters: [{ ...chapter, markdown: '# Introduction\n\n' + 'Repository context.\n\n'.repeat(40) }] }))
  await page.goto('/wiki?jobId=deferred')
  await expect(page.locator('.diagram svg')).toHaveCount(0)
  await page.getByRole('button', { name: /Generated diagram/ }).click()
  const dialog = page.getByRole('dialog', { name: 'Architecture diagram' })
  await expect(dialog.locator('.diagram svg')).toHaveCount(1)
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await dialog.locator('.diagram svg').evaluate((node) => { window.__deferredSvg = node })
  await page.keyboard.press('Escape')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  expect(await page.locator('.diagram svg').evaluate((node) => node === window.__deferredSvg)).toBe(true)
})
