import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { auditAxe } from './helpers/axe.js'
import { stableVisual, stableScreenshot } from './helpers/stableVisual.js'

const out = resolve('../docs/verification/pass-b-artifacts')
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' })
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5180'
const mode = process.argv[2] || 'matrix'
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })

if (mode === 'matrix') {
  const rows = [], errors = []
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  let state = 'idle'
  await page.route('**/api/chat**', async (route) => {
    if (route.request().method() === 'POST') return state === 'error' ? route.fulfill({ status: 500, contentType: 'text/html', body: '<pre>private server stack</pre>' }) : json(route, { jobId: 'review' }, 202)
    if (state === 'loading') return json(route, { status: 'pending' })
    return json(route, { status: 'completed', answer: state === 'not-indexed' ? 'No indexed content was found for this repo. Index it first, then try again.' : '## Request boundary\n\nThe route dispatches an independent job.\n\n```js\nconst job = createJob()\n```', sources: state === 'not-indexed' ? [] : ['src/routes/chat.routes.js', 'src/service/rag.js'] })
  })
  for (const width of [1920, 1440, 1024, 768, 390, 360]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
    for (state of ['idle', 'validation', 'loading', 'answer', 'not-indexed', 'error', 'retry']) {
      await page.goto('/chat')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (state === 'validation') {
        await page.getByLabel('Repository', { exact: true }).fill('bad owner/repo')
        await page.getByLabel('Repository', { exact: true }).blur()
        await expect(page.getByLabel('Repository', { exact: true })).toHaveAttribute('aria-invalid', 'true')
      } else if (state !== 'idle') {
        await page.getByLabel('Repository', { exact: true }).fill('octocat/Spoon-Knife')
        await page.getByLabel('Question', { exact: true }).fill('How is a request dispatched?')
        if (state === 'retry') {
          state = 'error'
          await page.getByRole('button', { name: 'Ask', exact: true }).click()
          await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible()
          state = 'retry'
          await page.getByRole('button', { name: 'Retry', exact: true }).click()
        } else await page.getByRole('button', { name: 'Ask', exact: true }).click()
        await expect(page.locator('.qa-result')).toHaveAttribute('data-state', state === 'loading' ? 'pending' : state === 'error' ? 'error' : state === 'not-indexed' ? 'not-indexed' : 'completed')
      }
      const violations = await auditAxe(page)
      const overflow = await page.evaluate(() => [...document.querySelectorAll('main *')].filter((node) => node.getBoundingClientRect().right > innerWidth + 1).map((node) => ({ tag: node.tagName, class: node.className, right: Math.round(node.getBoundingClientRect().right) })).slice(0, 12))
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.screenshot({ path: `${out}/chat-${state}-${width}.png`, fullPage: true, ...stableScreenshot })
      rows.push({ route: 'Chat', state, width, violations, overflow })
    }
    await page.goto('/architecture')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('architecture:load-all')))
    await expect(page.getByRole('tab', { name: 'Index repository' })).toBeAttached()
    await expect(page.locator('.arch-deferred[data-ready="false"]')).toHaveCount(0)
    for (const section of await page.locator('.arch-section').all()) await section.scrollIntoViewIfNeeded()
    await page.addStyleTag({ content: '.arch-deferred { content-visibility: visible !important; }' })
    await page.evaluate(() => window.scrollTo(0,0))
    const violations = await auditAxe(page)
    const overflow = await page.evaluate(() => [...document.querySelectorAll('main *')].filter((node) => node.getBoundingClientRect().right > innerWidth + 1).map((node) => ({ tag: node.tagName, class: node.className, right: Math.round(node.getBoundingClientRect().right) })).slice(0, 12))
    await page.screenshot({ path: `${out}/architecture-${width}.png`, fullPage: true, ...stableScreenshot })
    rows.push({ route: 'Architecture', width, violations, overflow })
    console.log(`Reviewed ${width}px`)
  }
  await page.emulateMedia({ forcedColors: 'active', contrast: 'more', reducedMotion: 'reduce' })
  for (const route of ['/chat', '/architecture', '/workspace']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.screenshot({ path: `${out}/${route.slice(1)}-forced-colors.png`, fullPage: true })
    const active = page.locator('.ln a[aria-current="page"]').first()
    rows.push({ forcedColors: route, activeBorder: await active.evaluate((node) => getComputedStyle(node).borderBottomWidth) })
  }
  await writeFile(`${out}/matrix.json`, JSON.stringify({ rows, errors }, null, 2))
  console.log(JSON.stringify({ axeFailures: rows.filter((row) => row.violations?.length).length, overflowFailures: rows.filter((row) => row.overflow?.length).length, errors }))
  await context.close()
}

if (mode === 'metrics') {
  const rows = []
  for (const cpu of [1, 4]) for (const route of ['/', '/workspace', '/wiki/sample/spoon-knife', '/chat', '/architecture']) for (let run = 0; run < 3; run++) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.addInitScript(() => {
      window.__metrics = { tasks: [], cls: 0 }
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) window.__metrics.tasks.push(Math.round(entry.duration)) }).observe({ type: 'longtask', buffered: true })
      new PerformanceObserver((list) => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__metrics.cls += entry.value }).observe({ type: 'layout-shift', buffered: true })
    })
    const cdp = await context.newCDPSession(page)
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    for (const visit of ['first', 'revisit']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForTimeout(1200) // Fixed observation window, not a UI-state assertion.
      const metrics = await page.evaluate(() => window.__metrics)
      rows.push({ route, cpu, run, visit, maxTaskMs: Math.max(0, ...metrics.tasks), cls: metrics.cls })
      if (visit === 'first') await page.goto(route === '/' ? '/workspace' : '/')
    }
    await context.close()
  }
  const summary = []
  for (const route of [...new Set(rows.map((row) => row.route))]) for (const cpu of [1, 4]) for (const visit of ['first', 'revisit']) {
    const group = rows.filter((row) => row.route === route && row.cpu === cpu && row.visit === visit)
    const tasks = group.map((row) => row.maxTaskMs).sort((a,b) => a-b)
    summary.push({ route, cpu, visit, median: tasks[1], worst: tasks[2], cls: Math.max(...group.map((row) => row.cls)) })
  }
  await writeFile(`${out}/${process.env.METRIC_LABEL || 'after'}-metrics.json`, JSON.stringify({ rows, summary }, null, 2))
  console.log(JSON.stringify(summary))
}

if (mode === 'pixels') {
  const results = []
  for (const width of [1440, 768, 390]) {
    const captures = []
    for (const url of [process.env.BASELINE_URL, baseURL]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
      const page = await context.newPage()
      await page.goto(url)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await stableVisual(page, { loadLandingSections: true })
      captures.push(await page.screenshot({ fullPage: true, ...stableScreenshot }))
      await context.close()
    }
    const page = await browser.newPage()
    const result = await page.evaluate(async (encoded) => {
      const images = await Promise.all(encoded.map(async (data) => { const image = new Image(); image.src = `data:image/png;base64,${data}`; await image.decode(); const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight; const ctx = canvas.getContext('2d'); ctx.drawImage(image, 0, 0); return { width: canvas.width, height: canvas.height, data: ctx.getImageData(0,0,canvas.width,canvas.height).data } }))
      const [a,b] = images
      let pixels = 0
      if (a.width !== b.width || a.height !== b.height) return { dimensions: images.map(({width,height}) => [width,height]), mismatch: true }
      for (let i=0;i<a.data.length;i+=4) if (Math.abs(a.data[i]-b.data[i]) > 1 || Math.abs(a.data[i+1]-b.data[i+1]) > 1 || Math.abs(a.data[i+2]-b.data[i+2]) > 1) pixels++
      return { width: a.width, height: a.height, changedPixelsAboveOneChannel: pixels }
    }, captures.map((buffer) => buffer.toString('base64')))
    await writeFile(`${out}/landing-before-${width}.png`, captures[0])
    await writeFile(`${out}/landing-after-${width}.png`, captures[1])
    results.push({ width, ...result })
    await page.close()
  }
  await writeFile(`${out}/landing-pixels.json`, JSON.stringify(results, null, 2))
  console.log(JSON.stringify(results))
}

if (mode === 'quality') {
  const rows = [], consoleMessages = [], pageErrors = []
  const context = await browser.newContext({ baseURL, reducedMotion: 'reduce' })
  const page = await context.newPage()
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) consoleMessages.push({ type: message.type(), text: message.text() }) })
  for (const width of [1440, 390, 360]) {
    await page.setViewportSize({ width, height: 900 })
    for (const route of ['/', '/workspace', '/chat', '/wiki/sample/spoon-knife', '/architecture']) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      if (route.includes('sample')) {
        const overlap = await page.evaluate(() => {
          const heading = document.querySelector('#wiki-chapter-title').getBoundingClientRect()
          const bar = document.querySelector('.wiki-mobile-bar').getBoundingClientRect()
          return bar.width > 0 && Math.min(heading.bottom, bar.bottom) > Math.max(heading.top, bar.top)
        })
        rows.push({ route, width, firstHeadingOverlappedByToolbar: overlap })
        await page.locator('#wiki-diagram').scrollIntoViewIfNeeded()
        await expect(page.locator('.diagram svg')).toHaveCount(1)
      }
      if (route === '/architecture') {
        await page.evaluate(() => window.dispatchEvent(new Event('architecture:load-all')))
        await expect(page.getByRole('tab', { name: 'Index repository' })).toBeAttached()
        for (const section of await page.locator('.arch-section').all()) await section.scrollIntoViewIfNeeded()
      }
      if (['/chat', '/architecture'].includes(route)) {
        const text = await page.getByRole('main').innerText()
        rows.push({ route, width, numericPercent: /\d\s*%/.test(text), estimatedOrRemaining: /\b(?:estimated|remaining)\b/i.test(text), preservedNegativeWords: text.match(/\b(?:ETA|resume|percentage|Percentages|cancellation)\b/gi) || [], progressbars: await page.getByRole('progressbar').count(), cancelResumeControls: await page.getByRole('button', { name: /^(Cancel|Resume)$/i }).count() })
      }
    }
  }
  await writeFile(`${out}/quality.json`, JSON.stringify({ rows, consoleMessages, pageErrors, chrome: browser.version() }, null, 2))
  console.log(JSON.stringify({ consoleMessages, pageErrors, overlaps: rows.filter((row) => row.firstHeadingOverlappedByToolbar) }))
  await context.close()
}
await browser.close()
