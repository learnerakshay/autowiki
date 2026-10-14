import { expect, test } from '@playwright/test'

const REPO = 'octocat/Spoon-Knife'
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
const live = (page) => page.getByRole('complementary', { name: 'Wiki preview or live job' })

test('repository validation, disabled reason, and sample entry are keyboard accessible', async ({ page }) => {
  await page.goto('/workspace')
  const field = page.getByLabel('GitHub repository')
  const index = page.getByRole('button', { name: 'Index Repository' })
  await index.focus()
  await expect(index).toHaveAttribute('aria-disabled', 'true')
  await expect(page.getByRole('tooltip')).toContainText('Enter a valid repository first')
  await field.fill('bad owner/repo')
  await expect(page.getByText('Repository names cannot contain spaces.')).toBeVisible()
  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  await expect(field).toBeFocused()
  await field.fill(REPO)
  await expect(index).toBeEnabled()
  const sample = page.getByRole('link', { name: 'Explore a sample Wiki' })
  await sample.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/wiki\/sample\/spoon-knife$/)
})

test('landing handoff prefills and focuses the repository field', async ({ page }) => {
  await page.goto('/')
  await page.locator('.landing-hero').getByRole('textbox', { name: /GitHub repository/ }).fill('https://github.com/octocat/Spoon-Knife.git')
  await page.locator('.landing-hero').getByRole('button', { name: 'Generate a Wiki' }).click()
  await expect(page).toHaveURL(/\/workspace\?repo=octocat%2FSpoon-Knife$/)
  await expect(page.getByLabel('GitHub repository')).toHaveValue(REPO)
  await expect(page.getByLabel('GitHub repository')).toBeFocused()
})

test('Wiki and Index jobs run concurrently and expose only actual progress', async ({ page }) => {
  let wikiStarts = 0
  let indexStarts = 0
  await page.route('**/api/**', (route) => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() === 'POST' && path === '/api/wiki') { wikiStarts++; return json(route, { jobId: 'wiki-pending', status: 'pending' }, 202) }
    if (route.request().method() === 'POST' && path === '/api/index') { indexStarts++; return json(route, { jobId: 'index-pending', status: 'pending' }, 202) }
    if (path.endsWith('/wiki-pending')) return json(route, { status: 'pending', repo: REPO, progress: { stage: 'generating_chapter', chapter: 2, totalChapters: 4 } })
    if (path.endsWith('/index-pending')) return json(route, { status: 'pending' })
    return route.fallback()
  })
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  await expect(live(page)).toContainText('Generating chapter 2 of 4')
  await expect(page.getByLabel('GitHub repository')).toHaveAttribute('readonly', '')
  await page.getByRole('button', { name: 'Index Repository' }).click()
  await expect(page.locator('.workspace-index p').filter({ hasText: 'Repository indexing is in progress.' })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('%')
  expect(wikiStarts).toBe(1)
  expect(indexStarts).toBe(1)
})

test('Wiki completion shows actual chapter titles and opens the reader', async ({ page }) => {
  let polls = 0
  await page.route('**/api/wiki**', (route) => {
    if (route.request().method() === 'POST') return json(route, { jobId: 'done', status: 'pending' }, 202)
    polls++
    if (polls === 1) return json(route, { status: 'pending', repo: REPO, progress: { stage: 'queued' } })
    return json(route, { status: 'completed', repo: REPO, chapters: [{ title: 'Overview', markdown: 'Overview', mermaid: 'graph TD; A-->B;', diagramValid: true }, { title: 'Architecture', markdown: 'Architecture', mermaid: 'graph TD; A-->B;', diagramValid: true }] })
  })
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  await expect(live(page)).toContainText('Wiki is ready')
  await expect(live(page)).toContainText('Overview')
  await expect(live(page).getByRole('link', { name: 'Open wiki' })).toHaveAttribute('href', '/wiki?jobId=done')
  await live(page).getByRole('link', { name: 'Open wiki' }).click()
  await expect(page).toHaveURL(/\/wiki\?jobId=done#chapter-1$/)
  await expect(page.getByText('Generated just now')).toBeVisible()
  await page.reload()
  await expect(page.getByText('Generated just now')).toHaveCount(0)
})

test('terminal failure and network failure have recovery actions', async ({ page }) => {
  await page.route('**/api/wiki**', (route) => route.request().method() === 'POST' ? json(route, { jobId: 'failed' }, 202) : json(route, { status: 'failed', error: 'Generation retries were exhausted.' }))
  await page.goto('/workspace')
  await page.getByLabel('GitHub repository').fill(REPO)
  await page.getByRole('button', { name: 'Generate Wiki' }).click()
  await expect(live(page).locator('.workspace-preview__error')).toContainText('Generation retries were exhausted.')
  await live(page).getByRole('button', { name: 'Edit repository' }).click()
  await expect(page.getByLabel('GitHub repository')).toBeFocused()
  await page.unroute('**/api/wiki**')
  await page.route('**/api/wiki', (route) => route.abort('failed'))
  await live(page).getByRole('button', { name: 'Try again' }).click()
  await expect(live(page).locator('.workspace-preview__error')).toContainText('The service could not be reached')
})

test('Workspace fits desktop, tablet and phone widths under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 1280, 768, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1, name: 'What will we document today?' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width)
  }
})
