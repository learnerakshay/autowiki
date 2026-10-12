import { expect, test } from '@playwright/test'

const REPO = 'octocat/Spoon-Knife'

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

test('wiki and index jobs keep independent pending state', async ({ page }) => {
  let wikiStarts = 0
  let indexStarts = 0

  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()

    if (method === 'POST' && pathname === '/api/wiki') {
      wikiStarts += 1
      return json(route, { jobId: 'wiki-pending' }, 202)
    }

    if (method === 'POST' && pathname === '/api/index') {
      indexStarts += 1
      return json(route, { jobId: 'index-pending' }, 202)
    }

    if (pathname === '/api/wiki/jobs/wiki-pending') return json(route, { status: 'pending' })
    if (pathname === '/api/index/jobs/index-pending') return json(route, { status: 'pending' })
    return route.fallback()
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)

  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  const wikiStatus = page.getByRole('region', { name: 'Wiki generation status' })
  await expect(wikiStatus.getByRole('status')).toHaveText('Pending')
  await expect(wikiStatus).toContainText('wiki-pending')

  await page.getByRole('button', { name: 'Index Repository' }).click()
  const indexStatus = page.getByRole('region', { name: 'Repository indexing status' })
  await expect(indexStatus.getByRole('status')).toHaveText('Pending')
  await expect(indexStatus).toContainText('index-pending')

  await expect(wikiStatus.getByRole('status')).toHaveText('Pending')
  await expect(wikiStatus).toContainText('wiki-pending')
  expect(wikiStarts).toBe(1)
  expect(indexStarts).toBe(1)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'screenshots/prompt-06-wiki-pending.png', fullPage: true })

  await page.reload()
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Index Repository' }).click()
  await expect(indexStatus.getByRole('status')).toHaveText('Pending')
  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  await expect(wikiStatus.getByRole('status')).toHaveText('Pending')
  await expect(indexStatus.getByRole('status')).toHaveText('Pending')
  expect(wikiStarts).toBe(2)
  expect(indexStarts).toBe(2)
})

test('starting wiki after indexing preserves both results and actions', async ({ page }) => {
  await page.route('**/api/**', async (route) => {
    const { pathname } = new URL(route.request().url())
    const method = route.request().method()

    if (method === 'POST' && pathname === '/api/index') return json(route, { jobId: 'index-complete' }, 202)
    if (method === 'POST' && pathname === '/api/wiki') return json(route, { jobId: 'wiki-complete' }, 202)
    if (pathname === '/api/index/jobs/index-complete') {
      return json(route, { status: 'completed', fileCount: 24, chunkCount: 91, saved: true, truncated: false })
    }
    if (pathname === '/api/wiki/jobs/wiki-complete') {
      return json(route, {
        status: 'completed',
        repo: REPO,
        generatedAt: '2026-10-12T00:00:00.000Z',
        chapters: [{ title: 'Overview' }, { title: 'Architecture' }],
      })
    }
    return route.fallback()
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)

  await page.getByRole('button', { name: 'Index Repository' }).click()
  const indexStatus = page.getByRole('region', { name: 'Repository indexing status' })
  await expect(indexStatus.getByRole('status')).toHaveText('Completed')
  await expect(indexStatus).toContainText('24')
  await expect(indexStatus).toContainText('91')

  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  const wikiStatus = page.getByRole('region', { name: 'Wiki generation status' })
  await expect(wikiStatus.getByRole('status')).toHaveText('Completed')
  await expect(wikiStatus).toContainText('2')
  await expect(wikiStatus.getByRole('link', { name: 'View wiki' })).toHaveAttribute('href', '/wiki?jobId=wiki-complete')

  await expect(indexStatus.getByRole('status')).toHaveText('Completed')
  await expect(indexStatus.getByRole('link', { name: 'Open Chat' })).toHaveAttribute('href', '/chat')
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'screenshots/prompt-06-wiki-completed.png', fullPage: true })
  await indexStatus.screenshot({ path: 'screenshots/prompt-06-indexing-state.png' })
})

test('workspace presents backend submission errors with recovery context', async ({ page }) => {
  await page.route('**/api/wiki', (route) => json(route, { error: 'Repository could not be read.' }, 422))
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Generate Wiki' }).click()

  await expect(page.getByRole('alert')).toContainText('Repository could not be read.')
  await expect(page.getByRole('button', { name: 'Generate Wiki' })).toBeEnabled()
  await expect(page.getByRole('region', { name: 'Wiki generation status' }).getByRole('status')).toHaveText('Ready')
})

test('workspace stays within the viewport at required responsive widths', async ({ page }) => {
  const widths = [1440, 1280, 768, 390, 320]
  const pageErrors = []
  const consoleErrors = []

  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of widths) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1, name: 'What will we document today?' })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (width === 1440) {
      await page.screenshot({ path: 'screenshots/prompt-06-workspace-desktop.png', fullPage: true })
    }

    if (width === 390) {
      await page.screenshot({ path: 'screenshots/prompt-06-workspace-mobile.png', fullPage: true })
    }
  }

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
