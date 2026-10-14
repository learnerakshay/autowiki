import { expect, test } from '@playwright/test'
import { limitations } from '../web/src/data/architecture.js'

test.use({ reducedMotion: 'reduce' })
test('Architecture preserves limitation copy, paragraph weight/contrast and reduced/forced selection', async ({ page }) => {
  for(const width of [1920,1440,1024,768,390,360]) {
    await page.setViewportSize({width,height:900});await page.goto('/architecture')
    await expect(page.getByRole('heading',{level:1})).toBeVisible()
    await page.evaluate(()=>window.dispatchEvent(new Event('architecture:load-all')))
    await expect(page.locator('.arch-backbone')).toBeAttached()
    for(const text of limitations)await expect(page.getByText(text,{exact:true})).toBeAttached()
    const values=await page.evaluate(()=>{
      const color=(value)=>value.match(/[\d.]+/g)?.map(Number)
      const l=(rgb)=>rgb.slice(0,3).map((v)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
      function backgrounds(el) {
        for(let current=el;current;current=current.parentElement) {
          const style=getComputedStyle(current)
          const stops=style.backgroundImage.match(/rgba?\([^)]+\)/g)
          if(stops?.length) return stops.map(color)
          const rgb=color(style.backgroundColor)
          if(rgb?.length&&rgb[3]!==0)return [rgb]
        }
        return [[255,255,255]]
      }
      return [...document.querySelectorAll('main p')].filter((el)=>el.getBoundingClientRect().width&&!el.closest('.ui-sr-only,svg')).map((el)=>{
        const style=getComputedStyle(el),fg=l(color(style.color))
        return {text:el.textContent.slice(0,80),weight:+style.fontWeight,ratio:Math.min(...backgrounds(el).map((rgb)=>{const bg=l(rgb);return (Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)}))}
      })
    })
    for(const item of values){expect(item.weight,item.text).toBeGreaterThanOrEqual(400);expect(item.ratio,item.text).toBeGreaterThanOrEqual(7)}
  }
  await page.emulateMedia({forcedColors:'active',reducedMotion:'reduce'})
  await page.locator('.arch-node').filter({hasText:'Pinecone index'}).click()
  expect(await page.locator('.arch-node[aria-pressed="true"]').evaluate((el)=>getComputedStyle(el).outlineWidth)).toBe('2px')
  await page.keyboard.press('Control+k');await page.getByRole('combobox').fill('workspace')
  expect(await page.getByRole('option',{selected:true}).evaluate((el)=>getComputedStyle(el).outlineWidth)).toBe('2px')
  await page.keyboard.press('Escape')
})
test('connection anchors and node text/strokes meet contrast without positive job progress claims', async ({ page }) => {
  await page.goto('/architecture');await expect(page.locator('.arch-detail')).toBeVisible()
  const metrics=await page.evaluate(()=>{
    const l=(value)=>value.match(/[\d.]+/g).slice(0,3).map(Number).map((v)=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
    const canvas=getComputedStyle(document.querySelector('.arch-canvas-stage')).backgroundColor,bg=l(canvas)
    const ratio=(value)=>(Math.max(l(value),bg)+.05)/(Math.min(l(value),bg)+.05)
    return {eyebrows:[...document.querySelectorAll('.arch-node small')].map((el)=>({size:parseFloat(getComputedStyle(el).fontSize),contrast:ratio(getComputedStyle(el).color)})),edges:[...document.querySelectorAll('.arch-connectors g > path')].map((el)=>ratio(getComputedStyle(el).stroke))}
  })
  for(const label of metrics.eyebrows){expect(label.size).toBeGreaterThanOrEqual(11);expect(label.contrast).toBeGreaterThanOrEqual(4.5)}
  for(const edge of metrics.edges)expect(edge).toBeGreaterThanOrEqual(3)
  await expect(page.getByRole('progressbar')).toHaveCount(0)
  expect(await page.getByRole('button',{name:/^(Cancel|Resume)\b/}).count()).toBe(0)
})
