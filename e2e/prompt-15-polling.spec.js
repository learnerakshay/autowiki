import { expect, test } from '@playwright/test'

test('a polling transport failure can recover without creating a duplicate Wiki job', async ({ page }) => {
  let statusChecks = 0
  let generationRequests = 0

  await page.route('**/api/wiki', async (route) => {
    generationRequests += 1
    await route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'Unexpected generation request' }) })
  })
  await page.route('**/api/wiki/jobs/retry-job', async (route) => {
    statusChecks += 1
    if (statusChecks <= 4) {
      await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Status service temporarily unavailable' }) })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'completed',
        repo: 'octocat/Spoon-Knife',
        generatedAt: '2026-10-14T00:00:00.000Z',
        chapters: [{
          title: 'Recovered chapter',
          description: 'The original job completed after polling recovered.',
          filePaths: ['README.md'],
          markdown: '# Recovered chapter\n\nThe original job was not resubmitted.',
          mermaid: 'graph TD; A[Job] --> B[Recovered];',
          diagramValid: true,
        }],
      }),
    })
  })

  await page.goto('/wiki?jobId=retry-job')
  const retry = page.getByRole('button', { name: 'Retry status check' })
  await expect(retry).toBeVisible({ timeout: 10_000 })
  await retry.click()

  await expect(page.getByRole('heading', { name: 'Recovered chapter' })).toBeVisible()
  expect(statusChecks).toBeGreaterThanOrEqual(5)
  expect(generationRequests).toBe(0)
})
