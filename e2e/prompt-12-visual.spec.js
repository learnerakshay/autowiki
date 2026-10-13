import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'

const sampleWiki = JSON.parse(readFileSync(resolve('..', 'wiki-output', 'octocat-Spoon-Knife.json'), 'utf8'))

function json(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
}

async function capture(page, name, fullPage = true) {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: `screenshots/${name}.png`, fullPage })
}

test('capture Prompt 12 crafted product states', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.route('**/api/wiki/jobs/prompt-12-reader', (route) => json(route, { status: 'completed', ...sampleWiki }))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await capture(page, 'prompt-12-landing-desktop')

  await page.goto('/workspace')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await capture(page, 'prompt-12-workspace-desktop')

  await page.goto('/wiki?jobId=prompt-12-reader')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await capture(page, 'prompt-12-wiki-desktop')

  await page.goto('/architecture')
  const openAiNode = page.locator('.architecture-node').filter({ hasText: 'OpenAI models' })
  await openAiNode.evaluate((node) => node.click())
  await expect(openAiNode).toHaveAttribute('aria-pressed', 'true')
  await capture(page, 'prompt-12-architecture-active')

  await page.route('**/api/chat**', async (route) => {
    if (route.request().method() === 'POST') return json(route, { jobId: 'prompt-12-answer', status: 'pending' }, 202)
    return json(route, {
      status: 'completed',
      answer: '## Repository flow\n\nThe request enters the **route layer**, creates a background job, and returns a job identifier for polling.\n\n- Validate repository input\n- Dispatch the worker\n- Persist grounded output\n\n```js\nconst status = "pending"\n```',
      sources: ['src/routes/chat.routes.js', 'src/inngest/functions/askQuestions.js'],
    })
  })
  await page.goto('/chat?repo=octocat%2FSpoon-Knife')
  await page.getByLabel('Question', { exact: true }).fill('How does a request move through AutoWiki?')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
  await capture(page, 'prompt-12-chat-answer')

  await page.goto('/wiki/sample/spoon-knife')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await capture(page, 'prompt-12-sample-wiki')

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/wiki/sample/spoon-knife')
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await capture(page, 'prompt-12-mobile')
})
