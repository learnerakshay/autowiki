import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, test } from '@playwright/test'
import {
  architectureNodes,
  engineeringDecisions,
  wikiStages,
} from '../web/src/data/architecture.js'

test('architecture data references verified source files and supported Wiki stages', () => {
  const sourcePaths = new Set([
    ...architectureNodes.flatMap((node) => node.files),
    ...wikiStages.flatMap((stage) => stage.files),
    ...engineeringDecisions.flatMap((decision) => decision.evidence),
  ])

  for (const sourcePath of sourcePaths) {
    expect(existsSync(resolve('..', sourcePath)), `${sourcePath} should exist`).toBe(true)
  }

  expect(wikiStages.map((stage) => stage.progress)).toEqual([
    'fetching_repository',
    'planning_outline',
    'generating_chapter',
    'saving_wiki',
    'completed',
  ])
})

test('architecture explorer exposes real workflows, evidence, and keyboard interaction', async ({ page }) => {
  const pageErrors = []
  const consoleErrors = []
  const apiRequests = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('request', (request) => {
    if (new URL(request.url()).pathname.startsWith('/api/')) apiRequests.push(request.url())
  })
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write'])

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/')
  await page.getByRole('link', { name: 'Architecture', exact: true }).first().click()
  await expect(page).toHaveURL(/\/architecture$/)

  await expect(page.getByRole('heading', { level: 1, name: 'Understand the system behind the Wiki.' })).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('architecture:load-all')))
  await expect(page.getByRole('heading', { name: 'How AutoWiki builds technical knowledge.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Grounded answers from repository context.' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'The shared asynchronous backbone.' })).toBeVisible()
  await expect(page.getByText('Conceptual—not live monitoring')).toBeVisible()

  const pineconeNode = page.getByRole('button', { name: /Pinecone index/ })
  await pineconeNode.click()
  await expect(pineconeNode).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('heading', { name: 'Pinecone index' })).toBeVisible()
  await expect(page.getByText('Supports Index and Chat only. Wiki generation never depends on this vector path.')).toBeVisible()
  const vectorPath = page.locator('.arch-detail').getByRole('button', { name: 'Copy source path src/service/vectorStore.js' })
  await vectorPath.click()
  await expect(page.locator('.ui-toast')).toContainText('Source path copied')
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('src/service/vectorStore.js')

  const reactNode = page.getByRole('button', { name: /React client/ })
  await reactNode.focus()
  await reactNode.press('ArrowRight')
  const expressNode = page.getByRole('button', { name: /Express API/ })
  await expect(expressNode).toBeFocused()
  await expect(expressNode).toHaveAttribute('aria-pressed', 'true')

  const questionTab = page.getByRole('tab', { name: 'Answer question' })
  await page.getByRole('tab', { name: 'Index repository' }).focus()
  await page.getByRole('tab', { name: 'Index repository' }).press('ArrowRight')
  await expect(questionTab).toBeFocused()
  await expect(questionTab).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Top five Pinecone matches with metadata')).toBeVisible()
  await expect(page.getByText('Each submission is an independent background request; the implementation does not retain conversation memory.')).toBeVisible()

  await page.getByRole('button', { name: /Latest Mermaid render wins/ }).click()
  await expect(page.getByText('Ignore a late result after effect cleanup.')).toBeVisible()
  await expect(page.getByText('The terminal error is stored after the background retry lifecycle is exhausted.')).toBeVisible()
  await expect(page.getByText('Pending is intentionally indeterminate.')).toBeVisible()
  await expect(page.getByRole('progressbar')).toHaveCount(0)

  await page.evaluate(() => window.scrollTo(0, 0))
  await page.screenshot({ path: 'test-results/captures/prompt-10-architecture-desktop.png', fullPage: true })
  await page.locator('.arch-overview').screenshot({ path: 'test-results/captures/prompt-10-system-overview.png' })
  await page.locator('.arch-section--WikiPipeline').screenshot({ path: 'test-results/captures/prompt-10-wiki-pipeline.png' })
  await page.locator('.arch-section--RagExplorer').screenshot({ path: 'test-results/captures/prompt-10-rag-pipeline.png' })
  await page.locator('.arch-section--JobArchitecture').screenshot({ path: 'test-results/captures/prompt-10-job-architecture.png' })
  await page.locator('.arch-section--EngineeringDecisions').screenshot({ path: 'test-results/captures/prompt-10-reliability.png' })

  await page.getByRole('link', { name: 'Open Workspace' }).first().click()
  await expect(page).toHaveURL(/\/workspace$/)
  expect(apiRequests).toEqual([])
  expect(pageErrors).toEqual([])
  expect(consoleErrors).toEqual([])
})

test('architecture explorer remains visible with reduced motion and does not overflow', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })

  for (const width of [1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width <= 390 ? 844 : 900 })
    await page.goto('/architecture')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: /React client/ })).toBeVisible()
    await page.locator('.arch-section--WikiPipeline').scrollIntoViewIfNeeded()
    await expect(page.getByRole('button', { name: /Write chapters \+ diagrams/ })).toBeVisible()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

    if (width === 390) {
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: 'test-results/captures/prompt-10-architecture-mobile.png', fullPage: true })
    }
  }
})
