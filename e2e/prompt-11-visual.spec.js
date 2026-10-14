import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const phase = process.env.PROMPT11_SCREENSHOT_PHASE || 'after'
const sampleWiki = JSON.parse(readFileSync(resolve('..', 'wiki-output', 'octocat-Spoon-Knife.json'), 'utf8'))

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function setViewport(page, width) {
  await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
}

async function capture(page, name, width) {
  const overflow = await page.evaluate(() => {
    const documentWidth = document.documentElement.scrollWidth
    return {
      viewport: window.innerWidth,
      documentWidth,
      elements: documentWidth > window.innerWidth
        ? [...document.querySelectorAll('body *')]
            .map((element) => ({
              tag: element.tagName,
              className: typeof element.className === 'string' ? element.className : '',
              left: Math.round(element.getBoundingClientRect().left),
              right: Math.round(element.getBoundingClientRect().right),
            }))
            .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
            .slice(0, 12)
        : [],
    }
  })
  expect(overflow, `${name} should not overflow at ${width}px`).toEqual({ viewport: width, documentWidth: width, elements: [] })
  await page.evaluate(() => window.scrollTo(0, 0))
  let lastError
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await page.screenshot({
        path: `test-results/captures/prompt-11-${phase}-${name}-${width === 390 ? 'mobile' : 'desktop'}.png`,
        fullPage: true,
      })
      return
    } catch (error) {
      lastError = error
      await page.waitForTimeout(150)
    }
  }
  throw lastError
}

test('capture Prompt 11 visual baseline and final states', async ({ page }) => {
  await page.route('**/api/wiki/jobs/*', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/prompt-11-reader')) return json(route, { status: 'completed', ...sampleWiki })
    if (path.endsWith('/prompt-11-pending')) {
      return json(route, {
        status: 'pending',
        repo: 'octocat/Spoon-Knife',
        progress: { stage: 'generating_chapter', chapter: 2, totalChapters: 3 },
      })
    }
    return json(route, { error: 'job not found' }, 404)
  })

  for (const width of [1440, 390]) {
    await setViewport(page, width)

    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await capture(page, 'landing', width)

    await page.goto('/workspace')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await capture(page, 'workspace', width)

    await page.goto('/wiki?jobId=prompt-11-reader')
    await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
    await expect(page.locator('.diagram svg')).toHaveCount(1)
    await capture(page, 'wiki', width)

    await page.goto('/wiki?jobId=prompt-11-pending')
    await expect(page.getByRole('heading', { name: 'Generating your technical wiki' })).toBeVisible()
    await capture(page, 'wiki-pending', width)

    await page.goto('/chat?repo=octocat%2FSpoon-Knife')
    await expect(page.getByLabel('Repository', { exact: true })).toHaveValue('octocat/Spoon-Knife')
    await capture(page, 'chat-empty', width)

    await page.route('**/api/chat**', async (route) => {
      if (route.request().method() === 'POST') return json(route, { jobId: 'prompt-11-answer', status: 'pending' }, 202)
      return json(route, {
        status: 'completed',
        answer: '## Repository flow\n\nThe request enters the **route layer**, creates a background job, and returns a job identifier for polling.\n\n- Validate repository input\n- Dispatch the worker\n- Persist grounded output\n\n```js\nconst status = "pending"\n```',
        sources: ['src/routes/chat.routes.js', 'src/inngest/functions/askQuestions.js'],
      })
    })
    await page.getByLabel('Question', { exact: true }).fill('How does a request move through AutoWiki?')
    await page.getByRole('button', { name: 'Ask', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
    await capture(page, 'chat', width)
    await page.unroute('**/api/chat**')

    if (process.env.PROMPT11_SKIP_ARCHITECTURE !== '1') {
      await page.goto('/architecture')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await capture(page, 'architecture', width)
    }

    if (phase === 'after') {
      await page.goto('/wiki/sample/spoon-knife')
      await expect(page.getByText('Pre-generated sample', { exact: true })).toBeVisible()
      await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
      await expect(page.locator('.diagram svg')).toHaveCount(1)
      await page.evaluate(() => window.scrollTo(0, 0))
      let lastError
      for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
          await page.screenshot({
            path: `test-results/captures/prompt-11-sample-${width === 390 ? 'mobile' : 'wiki'}.png`,
            fullPage: true,
          })
          lastError = undefined
          break
        } catch (error) {
          lastError = error
          await page.waitForTimeout(150)
        }
      }
      if (lastError) throw lastError
    }
  }
})
