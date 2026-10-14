import { expect, test } from '@playwright/test'

const REPO = 'octocat/Spoon-Knife'

const chapters = [
  {
    title: 'Overview',
    description: 'How the repository is organized and why its main pieces exist.',
    filePaths: ['README.md', 'src/index.js'],
    markdown: `# Overview

AutoWiki turns **repository context** into readable technical documentation.

## Architecture

- Reads source files
- Plans chapters
  - Preserves file context
- Produces diagrams

> Generated documentation should be reviewed alongside the source.

| Layer | Responsibility |
| --- | --- |
| API | Starts jobs |
| Worker | Generates chapters |

\`inlineCode()\` remains readable.

\`\`\`js
export function startWiki(repo) {
  return { repo, status: 'pending' }
}
\`\`\`

[Project guide](https://docs.github.com/) and [unsafe](javascript:alert('xss')).

<script>window.__unsafeExecuted = true</script>`,
    mermaid: 'flowchart LR\n  Repo[Repository] --> Outline[Wiki outline]\n  Outline --> Chapters[Chapters]',
    diagramValid: true,
  },
  {
    title: 'Data flow',
    description: 'How a request moves through the generation pipeline.',
    filePaths: ['src/routes/wiki.routes.js'],
    markdown: '# Data flow\n\nA request creates a job and dispatches the generation event.\n\n1. Validate the repository.\n2. Create the job.\n3. Poll for completion.',
    mermaid: 'flowchart TD\n  Request --> Job\n  Job --> Worker\n  Worker --> Result',
    diagramValid: true,
  },
  {
    title: 'Rendering safety',
    description: 'How the reader keeps asynchronous diagrams current.',
    filePaths: ['web/src/pages/MermaidDiagram.jsx'],
    markdown: '# Rendering safety\n\nOnly the latest chapter render may replace the active diagram.',
    mermaid: 'sequenceDiagram\n  participant UI\n  participant Mermaid\n  UI->>Mermaid: Render latest chapter\n  Mermaid-->>UI: Replace guarded SVG',
    diagramValid: true,
  },
]

const completedJob = {
  status: 'completed',
  repo: REPO,
  generatedAt: '2026-10-12T17:41:15.576Z',
  chapters,
}

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  })
}

async function mockWikiJobs(page) {
  await page.route('**/api/wiki/jobs/*', (route) => {
    const path = new URL(route.request().url()).pathname
    if (path.endsWith('/wiki-reader')) return json(route, completedJob)
    if (path.endsWith('/wiki-pending')) return json(route, { status: 'pending' })
    if (path.endsWith('/wiki-failed')) return json(route, { status: 'failed', error: 'Generation provider rejected the request.' })
    return json(route, { error: 'job not found' }, 404)
  })
}

test('completed Wiki renders semantic Markdown and keeps one current Mermaid SVG', async ({ page, context }, testInfo) => {
  const pageErrors = []
  const consoleErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await mockWikiJobs(page)
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/wiki?jobId=wiki-reader')

  await expect(page.getByRole('heading', { level: 1, name: REPO })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: 'Architecture', exact: true })).toBeVisible()
  await expect(page.locator('.wiki-markdown > ul > li')).toHaveCount(3)
  await expect(page.locator('.wiki-table-scroll table')).toBeVisible()
  await expect(page.locator('.wiki-code-block pre')).toContainText("status: 'pending'")
  await expect(page.locator('.chapter')).not.toContainText('## Architecture')
  await expect(page.locator('.wiki-markdown script')).toHaveCount(0)
  expect(await page.evaluate(() => window.__unsafeExecuted)).toBeUndefined()
  await expect(page.getByRole('link', { name: 'unsafe' })).not.toHaveAttribute('href', /javascript:/i)
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await expect(page.locator('.ui-toast')).toHaveCount(0, { timeout: 7000 })
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('prompt-07-wiki-desktop.png'), fullPage: true })
  await page.locator('.diagram-card').screenshot({ path: testInfo.outputPath('prompt-07-mermaid-diagram.png') })

  await page.getByRole('button', { name: 'Copy Markdown' }).click()
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('# Overview')

  const chapterButtons = page.locator('.wiki-reader-grid > .wiki-chapter-nav button')
  await chapterButtons.nth(1).click()
  await chapterButtons.nth(2).click()
  await chapterButtons.nth(0).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Overview' })).toBeVisible()
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)
  await expect(page.locator('.chapter')).not.toContainText('Only the latest chapter render')

  await chapterButtons.nth(0).focus()
  await chapterButtons.nth(0).press('ArrowDown')
  await expect(page.getByRole('heading', { level: 2, name: 'Data flow' })).toBeVisible()
  await expect(chapterButtons.nth(1)).toHaveAttribute('aria-current', 'page')
  await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
  await expect(page.locator('.diagram svg')).toHaveCount(1)

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: testInfo.outputPath('prompt-07-wiki-chapter.png'), fullPage: true })
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('mobile chapter navigation and reduced motion remain functional', async ({ page }, testInfo) => {
  await mockWikiJobs(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const viewport of [
    { width: 1280, height: 800 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 },
    { width: 320, height: 800 },
  ]) {
    await page.setViewportSize(viewport)
    await page.goto('/wiki?jobId=wiki-reader')
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (viewport.width <= 850) {
      await page.locator('.wiki-mobile-bar').getByRole('button', { name: /Overview/ }).click()
      await page.getByRole('dialog', { name: 'Chapters' }).getByRole('button', { name: /Rendering safety/ }).click()
      await expect(page.getByRole('heading', { level: 2, name: 'Rendering safety' })).toBeVisible()
      await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
      await expect(page.locator('.diagram svg')).toHaveCount(1)
    }

    if (viewport.width === 390) {
      await expect(page.locator('.ui-toast')).toHaveCount(0, { timeout: 7000 })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: testInfo.outputPath('prompt-07-wiki-mobile.png'), fullPage: true })
    }
  }
})

test('pending Wiki shows honest indeterminate status', async ({ page }, testInfo) => {
  await mockWikiJobs(page)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/wiki?jobId=wiki-pending')

  await expect(page.getByText('Generating…', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Generating your technical wiki' })).toBeVisible()
  await expect(page.getByText(/not live stage progress/i)).toBeVisible()
  await expect(page.locator('body')).not.toContainText('%')
  await page.screenshot({ path: testInfo.outputPath('prompt-07-wiki-pending.png'), fullPage: true })
})

test('failed and unknown Wiki jobs explain recovery honestly', async ({ page }, testInfo) => {
  await mockWikiJobs(page)
  await page.goto('/wiki?jobId=wiki-failed')
  await expect(page.getByRole('heading', { name: 'Wiki generation failed' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('Generation provider rejected the request.')
  await page.screenshot({ path: testInfo.outputPath('prompt-07-wiki-failed.png'), fullPage: true })

  await page.goto('/wiki?jobId=missing-job')
  await expect(page.getByRole('heading', { name: 'Job not found' })).toBeVisible()
  await page.getByText('Job details', { exact: true }).click()
  await expect(page.getByText(/stored in memory/i)).toBeVisible()
  await expect(page.getByRole('link', { name: 'Start over' })).toHaveAttribute('href', '/workspace')
  await expect(page.getByRole('button', { name: 'Retry status check' })).toHaveCount(0)
})
