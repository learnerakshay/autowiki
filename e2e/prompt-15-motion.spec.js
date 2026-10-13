import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'

const root = dirname(fileURLToPath(import.meta.url))
const screenshots = resolve(root, 'screenshots')
const videos = resolve(root, 'videos')

test.use({ viewport: { width: 1440, height: 900 }, video: 'on' })

async function scrollToStoryProgress(page, progress) {
  await page.locator('.horizontal-story').evaluate((element, value) => {
    const start = window.scrollY + element.getBoundingClientRect().top
    const distance = element.offsetHeight - window.innerHeight
    window.scrollTo(0, start + distance * value)
  }, progress)
  await page.waitForTimeout(700)
}

async function centerStep(page, step) {
  await step.evaluate((element) => {
    const top = window.scrollY + element.getBoundingClientRect().top
    window.scrollTo({ top: top + element.offsetHeight * 0.5 - window.innerHeight * 0.5, behavior: 'instant' })
  })
  await page.waitForTimeout(350)
}

test.describe('Prompt 15 scroll storytelling', () => {
  test.beforeAll(async () => {
    await Promise.all([mkdir(screenshots, { recursive: true }), mkdir(videos, { recursive: true })])
  })

  test('horizontal story moves forward, backward, and exits cleanly', async ({ page }) => {
    const errors = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })

    const story = page.locator('.horizontal-story')
    await expect(story).toHaveClass(/is-enhanced/)
    await scrollToStoryProgress(page, 0)
    await expect(page.locator('.horizontal-story__status')).toContainText('Introduction')
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-horizontal-scroll-start.png') })

    const startTransform = await page.locator('.horizontal-story__track').evaluate((element) => getComputedStyle(element).transform)
    await scrollToStoryProgress(page, 0.5)
    await expect(page.locator('.horizontal-story__status')).toContainText('Web Structure')
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-horizontal-scroll-middle.png') })
    const middleTransform = await page.locator('.horizontal-story__track').evaluate((element) => getComputedStyle(element).transform)
    expect(middleTransform).not.toBe(startTransform)

    await scrollToStoryProgress(page, 1)
    await expect(page.locator('.horizontal-story__status')).toContainText('Styling')
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-horizontal-scroll-end.png') })

    await scrollToStoryProgress(page, 0)
    await expect(page.locator('.horizontal-story__status')).toContainText('Introduction')

    await page.getByRole('button', { name: 'Open Styling' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('.horizontal-story__status')).toContainText('Styling')

    await page.locator('#features').scrollIntoViewIfNeeded()
    await expect(page.locator('#features')).toBeInViewport()
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(errors).toEqual([])

    const video = page.video()
    await page.close()
    await video?.saveAs(resolve(videos, 'prompt-15-horizontal-scroll.webm'))
  })

  test('vertical stages activate in both directions and survive remounting', async ({ page }) => {
    await page.goto('/')
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    const steps = page.locator('.process-step')

    await centerStep(page, steps.nth(2))
    await expect(steps.nth(2)).toHaveAttribute('aria-current', 'step', { timeout: 5000 })
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-vertical-story-end.png') })

    await centerStep(page, steps.nth(1))
    await expect(steps.nth(1)).toHaveAttribute('aria-current', 'step', { timeout: 5000 })
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-vertical-story-middle.png') })

    await centerStep(page, steps.nth(0))
    await expect(steps.nth(0)).toHaveAttribute('aria-current', 'step', { timeout: 5000 })
    await page.screenshot({ path: resolve(screenshots, 'prompt-15-vertical-story-start.png') })

    await page.goto('/workspace')
    await expect(page.getByRole('heading', { name: 'What will we document today?' })).toBeVisible()
    await page.goto('/')
    await expect(page.locator('.horizontal-story')).toHaveCount(1)
    await expect(page.locator('.horizontal-story')).toHaveClass(/is-enhanced/)

    const video = page.video()
    await page.close()
    await video?.saveAs(resolve(videos, 'prompt-15-hero-and-vertical-scroll.webm'))
  })
})

test('mobile and reduced motion expose every horizontal scene without sticky motion', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  const page = await context.newPage()
  await page.goto('/')

  await expect(page.locator('.horizontal-story')).not.toHaveClass(/is-enhanced/)
  await expect(page.locator('.horizontal-scene')).toHaveCount(3)
  await expect(page.locator('.horizontal-scene').nth(2)).toBeVisible()
  await page.locator('.horizontal-story').scrollIntoViewIfNeeded()
  await page.screenshot({ path: resolve(screenshots, 'prompt-15-reduced-motion.png') })
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await context.close()
})
