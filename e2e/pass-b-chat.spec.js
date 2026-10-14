import { expect, test } from '@playwright/test'
import { auditAxe } from './helpers/axe.js'
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

test('Chat validates inline, normalizes URLs, submits by keyboard and retries identical inputs', async ({ page }) => {
  const submissions = []
  let fail = true
  await page.route('**/api/chat**', (route) => {
    if (route.request().method() === 'POST') {
      submissions.push(route.request().postDataJSON())
      return fail ? route.fulfill({ status: 500, contentType: 'text/html', body: '<pre>private stack</pre>' }) : json(route, { jobId: 'keyboard' }, 202)
    }
    return json(route, { status: 'completed', answer: 'The application is organized around request routes.', sources: ['src/routes/chat.routes.js'] })
  })
  await page.goto('/chat')
  const repo = page.getByLabel('Repository', { exact: true })
  const question = page.getByLabel('Question', { exact: true })
  const ask = page.getByRole('button', { name: 'Ask', exact: true })
  await expect(ask).toHaveAccessibleDescription(/Enter a repository and a question/)
  await repo.fill('bad owner/repo')
  await repo.blur()
  await expect(repo).toHaveAttribute('aria-invalid', 'true')
  await expect(page.locator('.ui-toast')).toHaveCount(0)
  await repo.fill('https://github.com/octocat/Spoon-Knife.git')
  await question.fill('How is it organized?')
  await question.press('Control+Enter')
  await expect(ask).toBeFocused()
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText('private stack')
  await repo.fill('acme/unsent-draft')
  await question.fill('Unsent question')
  fail = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
  expect(submissions).toEqual([{ repo: 'octocat/Spoon-Knife', question: 'How is it organized?' }, { repo: 'octocat/Spoon-Knife', question: 'How is it organized?' }])
  expect(await page.evaluate(() => document.activeElement.tagName)).not.toBe('BODY')
  await expect(page.getByText('Answers use retrieved indexed files. Review the returned paths before relying on implementation details.')).toBeVisible()
  await page.getByRole('button', { name: 'Ask another question' }).click()
  await expect(question).toBeFocused()
  expect(await auditAxe(page)).toEqual([])
})

test('empty sources alone do not claim a repository is unindexed', async ({ page }) => {
  await page.route('**/api/chat**', (route) => json(route, route.request().method() === 'POST' ? { jobId: 'empty' } : { status: 'completed', answer: 'An answer without returned citations.', sources: [] }, route.request().method() === 'POST' ? 202 : 200))
  await page.goto('/chat?repo=octocat%2FSpoon-Knife')
  await page.getByLabel('Question', { exact: true }).fill('What does it do?')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByText('No source paths were returned for this answer. No citations have been inferred.')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Repository is not indexed' })).toHaveCount(0)
  expect(await auditAxe(page)).toEqual([])
})
