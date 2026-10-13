import { expect, test } from '@playwright/test'

const SAMPLE_URL = '/wiki/sample/spoon-knife'
const REPO = 'octocat/Spoon-Knife'

function isForbiddenRequest(url) {
  const parsed = new URL(url)
  return parsed.pathname.startsWith('/api/')
    || ['api.github.com', 'api.openai.com', 'api.pinecone.io'].some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`))
}

test('sample entry points open an authentic backend-independent Wiki', async ({ page }) => {
  const forbiddenRequests = []
  const pageErrors = []
  page.on('request', (request) => {
    if (isForbiddenRequest(request.url())) forbiddenRequests.push(request.url())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const sampleLink = page.getByRole('link', { name: 'Explore Sample Wiki' })
  await expect(sampleLink).toHaveAttribute('href', SAMPLE_URL)
  await sampleLink.click()

  await expect(page).toHaveURL(new RegExp(`${SAMPLE_URL}$`))
  await expect(page.getByText('Pre-generated sample', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: REPO })).toBeVisible()
  await expect(page.getByText('3 chapters', { exact: true })).toBeVisible()
  await expect(page.getByText(/does not start a new AI generation job/i)).toBeVisible()
  await expect(page.locator('.wiki-markdown p').first()).toBeVisible()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.locator('.wiki-job-details')).toHaveCount(0)

  const chapterButtons = page.locator('.wiki-chapter-nav button')
  await chapterButtons.nth(1).click()
  await chapterButtons.nth(2).click()
  await chapterButtons.nth(0).click()
  await chapterButtons.nth(2).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Styling' })).toBeVisible()
  await expect(chapterButtons.nth(2)).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await chapterButtons.nth(2).focus()
  await chapterButtons.nth(2).press('Home')
  await expect(chapterButtons.nth(0)).toBeFocused()
  await expect(page.getByRole('heading', { level: 2, name: 'Introduction' })).toBeVisible()
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: REPO })).toBeVisible()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Generate your own' })).toHaveAttribute('href', '/workspace')
  expect(forbiddenRequests).toEqual([])
  expect(pageErrors).toEqual([])
})

test('workspace exposes the sample without submitting a job', async ({ page }) => {
  const apiRequests = []
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
  })

  await page.goto('/workspace')
  const sampleLink = page.getByRole('link', { name: 'Open the pre-generated Spoon-Knife Wiki' })
  await expect(sampleLink).toHaveAttribute('href', SAMPLE_URL)
  await sampleLink.click()
  await expect(page).toHaveURL(new RegExp(`${SAMPLE_URL}$`))
  await expect(page.getByText('Pre-generated sample', { exact: true })).toBeVisible()
  expect(apiRequests).toEqual([])
})

test('sample reader is responsive and complete with reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 1280, height: 900 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto(SAMPLE_URL)
    await expect(page.getByRole('heading', { level: 1, name: REPO })).toBeVisible()
    await expect(page.locator('.diagram svg')).toHaveCount(1)
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (viewport.width <= 900) {
      const selector = page.getByLabel('Chapter', { exact: true })
      await selector.selectOption('1')
      await expect(page.getByRole('heading', { level: 2, name: 'Web Structure' })).toBeVisible()
      await expect(page.locator('.diagram svg')).toHaveCount(1)
    }
  }
})

test('live Wiki job route keeps its existing polling contract', async ({ page }) => {
  let jobRequests = 0
  await page.route('**/api/wiki/jobs/live-contract', (route) => {
    jobRequests += 1
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'pending' }) })
  })
  await page.goto('/wiki?jobId=live-contract')
  await expect(page.getByRole('heading', { name: 'Generating your technical wiki' })).toBeVisible()
  expect(jobRequests).toBeGreaterThan(0)
})
