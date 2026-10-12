import { expect, test } from '@playwright/test'

const REPO = 'acme/platform'

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

test('Chat loads with accessible empty state, query prefill, and non-submitting suggestions', async ({ page }) => {
  let requests = 0
  await page.route('**/api/**', (route) => {
    requests += 1
    return json(route, { error: 'Unexpected request' }, 500)
  })

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto(`/chat?repo=${encodeURIComponent(REPO)}`)

  await expect(page.getByRole('heading', { level: 1, name: 'Ask better questions about your code.' })).toBeVisible()
  await expect(page.getByLabel('Repository', { exact: true })).toHaveValue(REPO)
  await expect(page.getByLabel('Question', { exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Ask', exact: true })).toBeDisabled()
  await expect(page.getByText('Entering a repository does not index it.')).toBeVisible()
  await page.screenshot({ path: 'screenshots/prompt-09-chat-empty.png', fullPage: true })

  const suggestion = page.getByRole('button', { name: 'How is the application structured?' })
  await suggestion.focus()
  await suggestion.press('Enter')
  await expect(page.getByLabel('Question', { exact: true })).toHaveValue('How is the application structured?')
  await expect(page.getByLabel('Question', { exact: true })).toBeFocused()
  expect(requests).toBe(0)

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'screenshots/prompt-09-chat-desktop.png', fullPage: true })
  await page.screenshot({ path: '../.impeccable/review/desktop.png', fullPage: true })
})

test('Chat renders a secure Markdown answer, real sources, copy action, and honest empty sources', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  let activeJob = 'grounded-answer'
  let complete = false

  await page.route('**/api/chat**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      activeJob = body.question.includes('empty') ? 'empty-sources' : 'grounded-answer'
      return json(route, { jobId: activeJob, status: 'pending' }, 202)
    }
    if (url.pathname.endsWith('/grounded-answer')) {
      if (!complete) return json(route, { status: 'pending' })
      return json(route, {
        status: 'completed',
        answer: `# Answer\n\nThe request enters through **the route layer**.\n\n## Flow\n\n- Validate input\n- Dispatch the job\n\n| Layer | Role |\n| --- | --- |\n| Route | Validation |\n| Worker | Retrieval |\n\n\`createJob()\` stores the identifier.\n\n\`\`\`js\nconst status = 'pending'\n\`\`\`\n\n[Safe reference](https://example.com) and [unsafe](javascript:alert('xss')).\n\n<script>window.__chatUnsafe = true</script>\n\n![tracking image](https://example.com/tracker.png)`,
        sources: ['src/routes/chat.routes.js', 'src/inngest/functions/askQuestions.js', 'src/routes/chat.routes.js'],
      })
    }
    if (url.pathname.endsWith('/empty-sources')) {
      return json(route, { status: 'completed', answer: 'No indexed content was found for this repo. Index it first, then try again.', sources: [] })
    }
    return json(route, { error: 'job not found' }, 404)
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto('/chat')
  await page.getByLabel('Repository', { exact: true }).fill(REPO)
  await page.getByLabel('Question', { exact: true }).fill('How does a Chat request move through the system?')
  const ask = page.getByRole('button', { name: 'Ask', exact: true })
  await ask.focus()
  await ask.press('Enter')

  await expect(page.getByText('pending...', { exact: true })).toBeVisible()
  await expect(page.locator('.chat-request-state .chat-submitted-question')).toHaveText('How does a Chat request move through the system?')
  await page.screenshot({ path: 'screenshots/prompt-09-chat-pending.png', fullPage: true })

  complete = true
  await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
  await expect(page.locator('.chat-answer-markdown strong')).toHaveText('the route layer')
  await expect(page.locator('.chat-answer-markdown ul > li')).toHaveCount(2)
  await expect(page.locator('.chat-answer-markdown table')).toBeVisible()
  await expect(page.locator('.chat-answer-markdown pre')).toContainText("status = 'pending'")
  await expect(page.locator('.chat-answer-markdown script')).toHaveCount(0)
  await expect(page.locator('.chat-answer-markdown img')).toHaveCount(0)
  expect(await page.evaluate(() => window.__chatUnsafe)).toBeUndefined()
  await expect(page.getByRole('link', { name: 'unsafe' })).not.toHaveAttribute('href', /javascript:/i)
  await expect(page.getByRole('heading', { name: 'Sources', exact: true })).toBeVisible()
  await expect(page.locator('.chat-source-item')).toHaveCount(2)
  await expect(page.locator('.chat-source-item').first()).toContainText('src/routes/chat.routes.js')

  await page.getByRole('button', { name: 'Copy Answer' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('The request enters through')

  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 7000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'screenshots/prompt-09-chat-answer.png', fullPage: true })
  await page.locator('.chat-sources').screenshot({ path: 'screenshots/prompt-09-chat-sources.png' })

  await page.getByLabel('Question', { exact: true }).fill('Show an empty source response')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByText('No source paths were returned for this answer. No citations have been inferred.')).toBeVisible()
  await expect(page.locator('.chat-source-item')).toHaveCount(0)
  expect(activeJob).toBe('empty-sources')
})

test('Chat presents failed and unknown jobs with their submitted context', async ({ page }) => {
  let nextJob = 'failed-job'
  await page.route('**/api/chat**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') return json(route, { jobId: nextJob, status: 'pending' }, 202)
    if (url.pathname.endsWith('/failed-job')) return json(route, { status: 'failed', error: 'The retrieval provider rejected this request.' })
    return json(route, { error: 'job not found' }, 404)
  })

  await page.goto('/chat')
  await page.getByLabel('Repository', { exact: true }).fill(REPO)
  await page.getByLabel('Question', { exact: true }).fill('Where is the request validated?')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('The retrieval provider rejected this request.')
  await expect(page.getByRole('heading', { name: 'Where is the request validated?', exact: true })).toBeVisible()
  await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 7000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'screenshots/prompt-09-chat-error.png', fullPage: true })

  nextJob = 'missing-job'
  await page.getByLabel('Question', { exact: true }).fill('Where is the worker registered?')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('job not found')
  await expect(page.getByRole('heading', { name: 'Where is the worker registered?', exact: true })).toBeVisible()
  await expect(page.locator('body')).not.toContainText('Where is the request validated?')
})

test('newer Chat context wins over a late older response and draft edits do not relabel results', async ({ page }) => {
  await page.route('**/api/chat**', async (route) => {
    const url = new URL(route.request().url())
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON()
      return json(route, { jobId: body.question === 'Question A' ? 'job-a' : 'job-b', status: 'pending' }, 202)
    }
    if (url.pathname.endsWith('/job-a')) {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return json(route, { status: 'completed', answer: 'Late answer A', sources: ['src/a.js'] })
    }
    if (url.pathname.endsWith('/job-b')) return json(route, { status: 'completed', answer: 'Current answer B', sources: ['src/b.js'] })
    return json(route, { error: 'job not found' }, 404)
  })

  await page.goto('/chat')
  await page.getByLabel('Repository', { exact: true }).fill('acme/repository-a')
  await page.getByLabel('Question', { exact: true }).fill('Question A')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.getByText('pending...', { exact: true })).toBeVisible()

  await page.getByLabel('Repository', { exact: true }).fill('acme/repository-b')
  await page.getByLabel('Question', { exact: true }).fill('Question B')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.chat-answer-markdown')).toContainText('Current answer B')
  await page.waitForTimeout(1000)
  await expect(page.locator('.chat-answer-markdown')).not.toContainText('Late answer A')
  await expect(page.locator('.chat-answer')).toContainText('acme/repository-b')
  await expect(page.locator('.chat-answer')).toContainText('Question B')

  await page.getByLabel('Repository', { exact: true }).fill('acme/unsent-draft')
  await expect(page.getByText('Composer edits do not alter the active request. Select Ask to replace it.')).toBeVisible()
  await expect(page.locator('.chat-answer')).toContainText('acme/repository-b')
  await expect(page.locator('.chat-answer')).not.toContainText('acme/unsent-draft')
})

test('Chat remains usable without horizontal overflow at required widths and reduced motion', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })

  await page.route('**/api/chat**', async (route) => {
    if (route.request().method() === 'POST') return json(route, { jobId: 'responsive-answer', status: 'pending' }, 202)
    return json(route, {
      status: 'completed',
      answer: '## Implementation\n\nA long identifier remains contained: `createRepositoryGroundedQuestionWithoutOverflow()`.\n\n| Very long column heading | Result |\n| --- | --- |\n| `repository_context_identifier_that_must_scroll_inside_the_table` | Safe |\n\n```js\nconst extremelyLongImplementationIdentifier = repository.services.question.answer.handler\n```',
      sources: ['src/features/repository/questions/extremely/deeply/nested/source-file-with-a-very-long-name.js'],
    })
  })

  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
    await page.goto('/chat')
    await page.getByLabel('Repository', { exact: true }).fill('organization-with-a-long-name/repository-with-a-long-name')
    await page.getByLabel('Question', { exact: true }).fill('How does the implementation remain safe on narrow screens?')
    await page.getByRole('button', { name: 'Ask', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Answer', exact: true })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(page.getByRole('button', { name: 'Copy Answer' })).toBeVisible()

    if (width === 390) {
      await expect(page.locator('[data-sonner-toast]')).toHaveCount(0, { timeout: 7000 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: 'screenshots/prompt-09-chat-mobile.png', fullPage: true })
      await page.screenshot({ path: '../.impeccable/review/mobile.png', fullPage: true })
    }
  }

  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})
