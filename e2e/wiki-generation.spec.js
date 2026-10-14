import { expect, test } from '@playwright/test'

const REPO = 'octocat/Spoon-Knife'

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

test('Workspace reports real generation stages and settles cleanly on completion', async ({ page }) => {
  let pollCount = 0
  const requests = []
  const pendingStates = [
    { status: 'pending', repo: REPO, progress: { stage: 'queued' } },
    { status: 'pending', repo: REPO, progress: { stage: 'planning_outline' } },
    { status: 'pending', repo: REPO, progress: { stage: 'generating_chapter', chapter: 2, totalChapters: 4 } },
    { status: 'pending', repo: REPO, progress: { stage: 'saving_wiki' } },
  ]

  await page.route('**/api/wiki**', (route) => {
    const { pathname } = new URL(route.request().url())
    requests.push(`${route.request().method()} ${pathname}`)

    if (route.request().method() === 'POST' && pathname === '/api/wiki') {
      return json(route, { jobId: 'prompt-08-progress', status: 'pending' }, 202)
    }

    if (pathname === '/api/wiki/jobs/prompt-08-progress') {
      if (pollCount < pendingStates.length) {
        const response = pendingStates[pollCount]
        pollCount += 1
        return json(route, response)
      }

      return json(route, {
        status: 'completed',
        repo: REPO,
        generatedAt: '2026-10-13T00:00:00.000Z',
        chapters: [
          { title: 'Overview' },
          { title: 'Architecture' },
          { title: 'Data flow' },
          { title: 'Operations' },
        ],
      })
    }

    return route.fallback()
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Generate Wiki' }).click()

  const jobRegion = page.getByRole('complementary', { name: 'Wiki preview or live job' })
  const progress = page.getByRole('region', { name: 'Wiki generation activity' })
  await expect(jobRegion).toContainText('Pending')
  await expect(progress.getByText('Preparing the generation job')).toBeVisible()
  await expect(progress).toContainText(REPO)
  await expect(progress).toContainText('No percentage or completion estimate is available.')
  await expect(page.locator('body')).not.toContainText('%')
  await page.waitForTimeout(700)
  await page.screenshot({ path: 'test-results/captures/prompt-08-generation-desktop.png', fullPage: true })
  await page.screenshot({ path: 'test-results/captures/prompt-08-generation-pending.png', fullPage: true })

  await expect(progress.getByText('Planning the wiki structure')).toBeVisible()
  await expect(progress.getByText('Generating chapter 2 of 4')).toBeVisible()
  await page.screenshot({ path: 'test-results/captures/prompt-08-generation-stage.png', fullPage: true })
  await expect(progress.getByText('Saving the generated wiki')).toBeVisible()

  await expect(jobRegion).toContainText('Wiki is ready')
  await expect(jobRegion).toContainText('4')
  await expect(progress).toHaveCount(0)
  await expect(page.locator('.workspace-activity')).toHaveCount(0)
  await expect(jobRegion.getByRole('link', { name: 'Open wiki' })).toHaveAttribute('href', '/wiki?jobId=prompt-08-progress')
  await page.screenshot({ path: 'test-results/captures/prompt-08-generation-completed.png', fullPage: true })

  expect(requests.filter((request) => request === 'POST /api/wiki')).toHaveLength(1)
  expect(requests.every((request) => request === 'POST /api/wiki' || request === 'GET /api/wiki/jobs/prompt-08-progress')).toBe(true)
})

test('Wiki generation state is responsive, reduced-motion safe, and uses actual chapter counts', async ({ page }) => {
  await page.route('**/api/wiki/jobs/mobile-stage', (route) => json(route, {
    status: 'pending',
    repo: REPO,
    progress: { stage: 'generating_chapter', chapter: 3, totalChapters: 6 },
  }))
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
    await page.goto('/wiki?jobId=mobile-stage')
    await expect(page.getByText('Generating chapter 3 of 6')).toBeVisible()
    await expect(page.getByRole('region', { name: 'Wiki generation activity' })).toContainText(REPO)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (width === 390) {
      await page.screenshot({ path: 'test-results/captures/prompt-08-generation-mobile.png', fullPage: true })
    }
  }
})

test('missing stage metadata stays honest and terminal failure replaces activity', async ({ page }) => {
  await page.route('**/api/wiki/jobs/*', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/legacy-pending')) return json(route, { status: 'pending', repo: REPO })
    if (path.endsWith('/failed-generation')) return json(route, { status: 'failed', error: 'Generation retries were exhausted.' })
    return json(route, { error: 'job not found' }, 404)
  })

  await page.goto('/wiki?jobId=legacy-pending')
  await expect(page.getByText('Generation is still running')).toBeVisible()
  await expect(page.getByText(/not live stage progress/i)).toBeVisible()
  await expect(page.locator('body')).not.toContainText('%')

  await page.goto('/wiki?jobId=failed-generation')
  await expect(page.getByRole('heading', { name: 'Wiki generation failed' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Generation retries were exhausted.')
  await expect(page.getByRole('region', { name: 'Wiki generation activity' })).toHaveCount(0)
  await page.screenshot({ path: 'test-results/captures/prompt-08-generation-failed.png', fullPage: true })
})
