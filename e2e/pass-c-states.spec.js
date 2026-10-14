import { expect, test } from '@playwright/test'
import { auditAxe } from './helpers/axe.js'

test.use({ reducedMotion: 'reduce' })
test('404 is branded, truthful, focused and navigable', async ({ page }) => {
  await page.goto('/wiki/lost-artifact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found')
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused()
  await expect(page).toHaveTitle('Page not found — AutoWiki')
  await expect(page.locator('main')).toContainText('Generated Wikis exist only while the server process lives.')
  for (const name of ['Workspace', 'Chat', 'Architecture', 'Sample Wiki']) await expect(page.locator('main').getByRole('link', { name, exact: true })).toBeVisible()
  expect(await auditAxe(page)).toEqual([])
})
test('route render error retains navigation, hides the exception and resets on navigation', async ({ page }) => {
  await page.route('**/assets/Chat-*.js', (route) => route.fulfill({ contentType: 'text/javascript', body: 'export default function ForcedError(){throw new Error("private-stack-sentinel")}' }))
  await page.goto('/chat')
  await expect(page.getByRole('heading', { name: 'This page could not be displayed' })).toBeVisible()
  await expect(page.locator('.ln')).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText('private-stack-sentinel')
  await expect(page.locator('main code')).toHaveText(/^AW-[a-z0-9]{6}$/)
  await page.locator('.ln').getByRole('link', { name: 'Workspace', exact: true }).click()
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('This page could not be displayed')
})
test('root boundary catches shell render errors with branded recovery', async ({ page }) => {
  await page.route('**/assets/AppShell-*.js', (route) => route.fulfill({ contentType: 'text/javascript', body: 'export function AppShell(){throw new Error("private-root-sentinel")}' }))
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { name: 'This page could not be displayed' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go home' })).toBeVisible()
  await expect(page.getByRole('main')).not.toContainText('private-root-sentinel')
})
test('blocked page chunk offers Reload to update', async ({ page }) => {
  await page.route('**/assets/Chat-*.js', (route) => route.abort())
  await page.goto('/chat')
  await expect(page.getByRole('button', { name: 'Reload to update' })).toBeVisible()
  await expect(page.locator('.ln')).toBeVisible()
})

test('blocked recovery chunk still leaves a branded non-empty recovery screen', async ({ page }) => {
  await page.route('**/assets/Chat-*.js', (route) => route.abort())
  await page.route('**/assets/ErrorPage-*.js', (route) => route.abort())
  await page.goto('/chat')
  await expect(page.getByRole('heading',{level:1})).toHaveText('AutoWiki could not display this page')
  await expect(page.getByRole('link',{name:'Reload to update'})).toBeVisible()
  await expect(page.locator('.ln')).toBeVisible()
})
test('offline banner does not shift content or retry and return toast is honest', async ({ page, context }) => {
  await page.goto('/workspace')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  const top = await page.locator('main').evaluate((el) => el.getBoundingClientRect().top)
  await context.setOffline(true)
  await expect(page.locator('.offline-banner')).toContainText('Status checks may fail and can be retried manually.')
  expect(await page.locator('main').evaluate((el) => el.getBoundingClientRect().top)).toBe(top)
  await context.setOffline(false)
  await expect(page.locator('.offline-banner')).toHaveCount(0)
  await expect(page.locator('.ui-toast')).toContainText('Retry failed status checks manually.')
})
test('failed fetch shows connection issue without submitting again', async ({ page }) => {
  let requests = 0
  await page.route('**/api/chat', (route) => { requests++; return route.abort() })
  await page.goto('/chat?repo=acme%2Frepo')
  await page.getByLabel('Question', { exact: true }).fill('How is this structured?')
  await page.getByRole('button', { name: 'Ask', exact: true }).click()
  await expect(page.locator('.offline-banner')).toContainText('The service could not be reached.')
  await expect(page.getByRole('alert')).toBeVisible()
  await page.waitForTimeout(2100)
  expect(requests).toBe(1)
})
test('dev CSS reduced motion matches OS peak and resting animations', async ({ browser }) => {
  const results = []
  for (const preference of ['os', 'dev']) {
    const context = await browser.newContext({ baseURL: process.env.BASE_URL || 'http://127.0.0.1:5192', reducedMotion: preference === 'os' ? 'reduce' : 'no-preference' })
    const page = await context.newPage()
    if (preference === 'dev') await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => { document.documentElement.dataset.reducedMotion = 'true' }))
    await page.goto('/architecture')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(() => window.dispatchEvent(new Event('architecture:load-all')))
    await expect(page.locator('.arch-backbone')).toBeAttached()
    await page.waitForTimeout(600)
    const result = await page.evaluate(async () => {
      const counts = []
      for (let i = 0; i < 12; i++) { counts.push(document.getAnimations().filter((animation) => animation.playState === 'running').length); await new Promise(requestAnimationFrame) }
      return { peak: Math.max(...counts), end: counts.at(-1) }
    })
    results.push(result)
    await context.close()
  }
  console.log('REDUCED_PARITY ' + JSON.stringify(results))
  expect(results[1]).toEqual(results[0])
})

test('network status-check failure pauses polling and returning online does not retry', async ({ page }) => {
  let requests = 0
  await page.route('**/api/wiki/jobs/offline-status', (route) => { requests++; return route.abort() })
  await page.goto('/wiki?jobId=offline-status')
  await expect(page.getByRole('heading', { name: 'Status check failed', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry status check' })).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event('online')))
  await page.waitForTimeout(4200)
  expect(requests).toBe(1)
})

test('mobile offline notice clears the page heading', async ({ page }) => {
  for (const width of [360,390,768]) {
    await page.setViewportSize({width,height:844})
    await page.goto('/workspace')
    await expect(page.getByRole('heading',{level:1})).toBeVisible()
    await page.evaluate(()=>window.dispatchEvent(new Event('offline')))
    await expect(page.locator('.offline-banner')).toBeVisible()
    const clearance=await page.evaluate(()=>document.querySelector('h1').getBoundingClientRect().top-document.querySelector('.offline-banner').getBoundingClientRect().bottom)
    expect(clearance).toBeGreaterThanOrEqual(0)
  }
})

test('OS and dev CSS motion peaks match during load and a RAG tab switch', async ({ browser }) => {
  const results=[]
  for (const mode of ['os','dev']) {
    const context=await browser.newContext({baseURL:process.env.BASE_URL,reducedMotion:mode==='os'?'reduce':'no-preference'})
    const page=await context.newPage()
    await page.addInitScript((mode)=>{
      document.addEventListener('DOMContentLoaded',()=>{
        if(mode==='dev')document.documentElement.dataset.reducedMotion='true'
        window.__cssPeak=0
        const sample=()=>{window.__cssPeak=Math.max(window.__cssPeak,document.getAnimations().filter((animation)=>animation.playState==='running'&&/CSSAnimation|CSSTransition/.test(animation.constructor.name)).length);requestAnimationFrame(sample)}
        sample()
      })
    },mode)
    await page.goto('/architecture');await expect(page.getByRole('heading',{level:1})).toBeVisible()
    await page.evaluate(()=>window.dispatchEvent(new Event('architecture:load-all')))
    await expect(page.getByRole('tab',{name:'Answer question'})).toBeAttached()
    await page.getByRole('tab',{name:'Answer question'}).click()
    await page.waitForTimeout(500)
    results.push(await page.evaluate(()=>window.__cssPeak))
    await context.close()
  }
  console.log('CSS_SESSION_PEAKS '+JSON.stringify(results))
  expect(results[1]).toBe(results[0])
})
