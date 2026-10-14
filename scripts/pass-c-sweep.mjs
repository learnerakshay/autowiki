import { chromium, expect } from '../e2e/node_modules/@playwright/test/index.mjs'
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { auditAxe } from '../e2e/helpers/axe.js'
import { stableVisual, stableScreenshot } from '../e2e/helpers/stableVisual.js'
const out=new URL('../docs/verification/pass-c-artifacts/',import.meta.url)
await mkdir(out,{recursive:true})
const baseURL=process.env.BASE_URL||'http://127.0.0.1:5192'
const browser=await chromium.launch(process.env.PLAYWRIGHT_CHROME_PATH?{executablePath:process.env.PLAYWRIGHT_CHROME_PATH}:{channel:'chrome'})
const sizes=[[2560,1440],[1920,1080],[1440,900],[1280,720],[1280,600],[1024,768],[768,1024],[844,390],[390,844],[360,640]]
const allCases=['landing','workspace-idle','workspace-pending','workspace-completed','workspace-failed','sample','chat-idle','chat-answer','chat-error','architecture','404','offline','palette']
const cases=process.env.SWEEP_CASES ? allCases.filter((name)=>process.env.SWEEP_CASES.split(',').includes(name)) : allCases
const reportName=process.env.SWEEP_CASES?'sweep-targeted.json':'sweep.json'
const rows=[],errors=[]
const json=(route,body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)})
const chapter={title:'Overview',description:'Source structure.',markdown:'# Overview\n\nA bounded source walkthrough.',mermaid:'graph TD; A-->B',diagramValid:true,filePaths:['README.md']}
try {
  for(const [width,height] of sizes) {
    const coarse=width<=844
    const context=await browser.newContext({baseURL,viewport:{width,height},reducedMotion:'reduce',hasTouch:coarse,isMobile:coarse})
    const page=await context.newPage();page.setDefaultTimeout(15000)
    page.on('pageerror',(error)=>errors.push({width,height,error:error.message}))
    page.on('console',(msg)=>{if(msg.type()==='error')errors.push({width,height,console:msg.text()})})
    let scenario
    await page.route('**/api/**',(route)=>{
      const path=new URL(route.request().url()).pathname
      if(route.request().method()==='POST') return json(route,{jobId:'sweep'},202)
      if(path.includes('/chat/')) return scenario==='chat-error'?json(route,{status:'failed',error:'The retrieval service could not complete this question.'}):json(route,{status:'completed',answer:'## Request boundary\n\nThe route validates inputs and dispatches an independent background job.\n\n```js\nconst job = createJob()\n```',sources:['src/routes/chat.routes.js']})
      return json(route,scenario==='workspace-pending'?{status:'pending',progress:{stage:'generating_chapter',chapter:1,totalChapters:2}}:scenario==='workspace-failed'?{status:'failed',error:'The generation service could not complete this Wiki.'}:{status:'completed',repo:'acme/repo',chapters:[chapter]})
    })
    for(scenario of cases) {
      const path=scenario==='landing'?'/':scenario.startsWith('workspace')||['offline','palette'].includes(scenario)?'/workspace?repo=acme%2Frepo':scenario==='sample'?'/wiki/sample/spoon-knife':scenario.startsWith('chat')?'/chat?repo=acme%2Frepo':scenario==='architecture'?'/architecture':'/wiki/missing-page'
      await page.goto(path);await expect(page.getByRole('heading',{level:1})).toBeVisible()
      if(scenario.startsWith('workspace-')&&scenario!=='workspace-idle') {
        await page.getByRole('button',{name:'Generate Wiki',exact:true}).click()
        await expect(page.locator('.workspace-preview')).toHaveAttribute('data-job-state',scenario==='workspace-completed'?'succeeded':scenario==='workspace-failed'?'failed':'pending')
      }
      if(scenario.startsWith('chat-')&&scenario!=='chat-idle') {
        await page.getByLabel('Question',{exact:true}).fill('How is a request dispatched?');await page.getByRole('button',{name:'Ask',exact:true}).click()
        await expect(page.locator('.qa-result')).toHaveAttribute('data-state',scenario==='chat-error'?'error':'completed')
      }
      if(scenario==='landing') await stableVisual(page,{loadLandingSections:true})
      if(scenario==='architecture') {
        await page.evaluate(()=>window.dispatchEvent(new Event('architecture:load-all')))
        await expect(page.locator('.arch-backbone')).toBeAttached()
        for(const section of await page.locator('.arch-section').all())await section.scrollIntoViewIfNeeded()
        await page.addStyleTag({content:'.arch-deferred { content-visibility: visible; }'})
        if(coarse) { await page.locator('.arch-node').filter({hasText:'Pinecone index'}).tap();await expect(page.locator('.arch-detail h2')).toHaveText('Pinecone index') }
      }
      if(scenario==='sample') {await page.locator('#wiki-diagram').scrollIntoViewIfNeeded();await expect(page.locator('.diagram svg')).toHaveCount(1)}
      if(scenario==='offline') {await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await expect(page.locator('.offline-banner')).toBeVisible()}
      if(scenario==='palette') {await page.keyboard.press('Control+k');await expect(page.getByRole('combobox')).toBeFocused()}
      await page.evaluate(async()=>{await document.fonts.ready;window.scrollTo(0,0)})
      const axe=[1920,1440,1024,768,390,360].includes(width)?await auditAxe(page):null
      const metrics=await page.evaluate(()=>{
        const visible=(el)=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return r.width&&r.height&&s.visibility==='visible'&&s.display!=='none'&&!el.closest('[hidden],[aria-hidden="true"],.ui-sr-only,.sr-only')}
        const describe=(el)=>({tag:el.tagName,classes:el.getAttribute('class'),text:(el.textContent||el.getAttribute('aria-label')||'').trim().slice(0,110)})
        const elements=[...document.querySelectorAll('main *, .ln button, .ln a, .ui-overlay *, .offline-banner *, .ui-toast *')].filter(visible)
        const overflow=elements.filter((el)=>{const r=el.getBoundingClientRect();return r.left<-1||r.right>innerWidth+1}).map(describe)
        const smallText=elements.filter((el)=>[...el.childNodes].some((node)=>node.nodeType===3&&node.textContent.trim())&&parseFloat(getComputedStyle(el).fontSize)<12).map((el)=>({...describe(el),size:getComputedStyle(el).fontSize}))
        const targets=elements.filter((el)=>el.matches('a[href],button,input,textarea,select,summary,[role="option"]')&&!el.closest('[inert]'))
        const smallTargets=targets.filter((el)=>{const r=el.getBoundingClientRect(),min=matchMedia('(pointer:coarse)').matches?44:24;return r.width<min-1||r.height<min-1}).map((el)=>({...describe(el),size:[el.getBoundingClientRect().width,el.getBoundingClientRect().height]}))
        const formText=elements.filter((el)=>el.matches('input,textarea,select')&&parseFloat(getComputedStyle(el).fontSize)<16).map(describe)
        const clipping=elements.filter((el)=>!el.matches('input,textarea,svg,path')&&el.clientWidth&&el.scrollWidth>el.clientWidth+2&&getComputedStyle(el).overflowX==='hidden').map(describe)
        const hoverOnly=elements.filter((el)=>getComputedStyle(el).cursor==='pointer'&&!el.closest('a[href],button,input,summary,[role="option"],[role="tab"],[role="radio"],[role="button"],.diagram,.pipeline,.ui-toast,[tabindex]')).map(describe)
        const controls=[...document.querySelectorAll('main button,main a,.command-palette li')].filter(visible).filter((el)=>/^\s*(Cancel|Resume)\b/i.test(el.textContent||el.getAttribute('aria-label')||'')).map(describe)
        return {overflow,smallText,smallTargets,formText,clipping,hoverOnly,forbiddenControls:controls,progressbars:document.querySelectorAll('[role="progressbar"]').length}
      })
      if([1920,1440,768,390].includes(width)) {
        await page.screenshot({path:new URL(`${scenario}-${width}x${height}.png`,out).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true,...stableScreenshot})
        await page.screenshot({path:new URL(`${scenario}-viewport-${width}x${height}.png`,out).pathname.replace(/^\/(\w:)/,'$1'),...stableScreenshot})
      }
      rows.push({scenario,width,height,coarse,axe,...metrics})
      await writeFile(new URL(reportName,out),JSON.stringify({rows,errors},null,2))
      if(scenario==='palette')await page.keyboard.press('Escape')
    }
    await context.close();console.log('Swept '+width+'x'+height)
  }
  const vh=[]
  async function scan(dir) {for(const item of await readdir(dir,{withFileTypes:true})){const child=new URL(item.name+(item.isDirectory()?'/':''),dir);if(item.isDirectory())await scan(child);else if(/\.(css|jsx)$/.test(item.name)){const lines=(await readFile(child,'utf8')).split('\n');lines.forEach((line,index)=>{if(/\b100vh\b/.test(line))vh.push({file:child.pathname,line:index+1,text:line.trim()})})}}}
  await scan(new URL('../web/src/',import.meta.url))
  await writeFile(new URL(reportName,out),JSON.stringify({rows,errors,vh},null,2))
  console.log(JSON.stringify({rows:rows.length,errors:errors.length,vh:vh.length,failures:rows.filter((row)=>Object.entries(row).some(([key,value])=>Array.isArray(value)&&value.length&&['axe','overflow','smallText','smallTargets','formText','clipping','hoverOnly','forbiddenControls'].includes(key))).map(({scenario,width,height,...row})=>({scenario,width,height,counts:Object.fromEntries(Object.entries(row).filter(([,v])=>Array.isArray(v)&&v.length).map(([k,v])=>[k,v.length]))}))}))
} finally {await browser.close()}
