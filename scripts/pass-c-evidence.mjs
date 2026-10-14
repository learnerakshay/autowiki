import { chromium, expect } from '../e2e/node_modules/@playwright/test/index.mjs'
import { PNG } from '../e2e/node_modules/playwright-core/lib/utilsBundle.js'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import { stableVisual, stableScreenshot } from '../e2e/helpers/stableVisual.js'

const mode = process.argv[2] || 'pixels'
const out = new URL('../docs/verification/pass-c-artifacts/', import.meta.url)
await mkdir(out, { recursive: true })
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:5192'
const baselineURL = process.env.BASELINE_URL || 'http://127.0.0.1:5193'
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROME_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROME_PATH } : { channel: 'chrome' })
try {
  if (mode === 'pixels') {
    const rows = []
    for (const width of [1440, 1024, 390]) {
      const captures = []
      for (const [label, url] of [['baseline-a', baselineURL], ['baseline-b', baselineURL], ['pass-c', baseURL]]) {
        const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce' })
        const page = await context.newPage()
        await page.goto(url)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await stableVisual(page, { loadLandingSections: true })
        const bytes = await page.screenshot({ fullPage: true, ...stableScreenshot })
        await writeFile(new URL(`landing-${label}-${width}.png`, out), bytes)
        captures.push(PNG.sync.read(bytes))
        await context.close()
      }
      function compare(a,b) {
        if (a.width !== b.width || a.height !== b.height) return { dimensionMismatch: true, a: [a.width,a.height], b: [b.width,b.height] }
        let exact = 0, aboveOneChannel = 0, maximumDelta = 0
        for (let i=0; i<a.data.length; i+=4) {
          let delta=0
          for (let c=0; c<4; c++) delta=Math.max(delta, Math.abs(a.data[i+c]-b.data[i+c]))
          if (delta) exact++
          if (delta>1) aboveOneChannel++
          maximumDelta=Math.max(maximumDelta,delta)
        }
        return { exact, aboveOneChannel, maximumDelta }
      }
      rows.push({ width, noise: compare(captures[0],captures[1]), change: compare(captures[0],captures[2]), changeAgainstControlB: compare(captures[1],captures[2]) })
    }
    await writeFile(new URL('landing-pixels.json', out), JSON.stringify(rows,null,2))
    console.log(JSON.stringify(rows))
  } else if (mode === 'metrics') {
    const rows = []
    for (const [label,url] of [['pass-b',baselineURL],['pass-c',baseURL]]) for (const route of ['/', '/workspace', '/chat', '/architecture', '/wiki/sample/spoon-knife']) for (let run=1; run<=3; run++) {
      const context = await browser.newContext({ viewport: { width:1440,height:900 }, reducedMotion:'reduce' })
      const page=await context.newPage()
      await page.addInitScript(() => {
        window.__metrics={tasks:[],cls:0}
        new PerformanceObserver((list)=>list.getEntries().forEach((entry)=>window.__metrics.tasks.push(entry.duration))).observe({type:'longtask',buffered:true})
        new PerformanceObserver((list)=>list.getEntries().forEach((entry)=>{if(!entry.hadRecentInput)window.__metrics.cls+=entry.value})).observe({type:'layout-shift',buffered:true})
      })
      const cdp=await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate',{rate:4})
      for (const visit of ['first','revisit']) {
        await page.goto(url+route)
        await expect(page.getByRole('heading',{level:1})).toBeVisible()
        await page.waitForTimeout(1500)
        const metrics=await page.evaluate(()=>window.__metrics)
        rows.push({label,route,run,visit,cpu:4,maxTaskMs:Math.max(0,...metrics.tasks),taskSumMs:metrics.tasks.reduce((a,b)=>a+b,0),cls:metrics.cls})
        if(visit==='first') await page.goto(url+(route==='/'?'/workspace':'/'))
      }
      await context.close()
    }
    const bundles=[]
    for (const [label,dir] of [['pass-b','../.pass-c/baseline/assets/'],['pass-c','../web/dist/assets/']]) {
      const root=new URL(dir,import.meta.url)
      const file=(await readdir(root)).find((name)=>/^index-.*\.js$/.test(name))
      const bytes=await readFile(new URL(file,root))
      bundles.push({label,file,bytes:bytes.length,gzip:gzipSync(bytes).length})
    }
    const targets={'/':175,'/workspace':145,'/chat':190,'/architecture':150,'/wiki/sample/spoon-knife':225}
    const failures=rows.filter((row)=>row.label==='pass-c'&&(row.maxTaskMs>targets[row.route]||row.cls!==0))
    const gzipGrowth=bundles[1].gzip-bundles[0].gzip
    await writeFile(new URL('metrics.json',out),JSON.stringify({rows,bundles,targets,failures,gzipGrowth,browser:browser.version()},null,2))
    console.log(JSON.stringify({rows,bundles,failures,gzipGrowth}))
    if(failures.length||gzipGrowth>2000)process.exitCode=1
  } else throw Error('Use pixels or metrics')
} finally { await browser.close() }
