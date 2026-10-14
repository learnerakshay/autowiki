// Regenerates every brand asset in web/public from two inputs:
//   - src/config/brand.js          name, motto, tagline, colours
//   - ../design/brand/*.svg        the logo drawings
// Outputs: favicon.svg (dark-mode aware), favicon.ico (16/32/48), favicon-16.png, favicon-32.png,
// apple-touch-icon.png, icon-192/512(.png + -maskable.png), safari-pinned-tab.svg and og-image.jpg.
//
//   npm run assets          (from ./web; needs no dev server)
//
// Rasterising uses the Playwright that lives in ../e2e. Set PLAYWRIGHT_EXECUTABLE_PATH to use a specific Chrome.
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { brand } from '../src/config/brand.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(here, '../public')
const brandDir = path.resolve(here, '../../design/brand')
const { chromium } = createRequire(path.resolve(here, '../../e2e/package.json'))('@playwright/test')

const read = (name) => fs.readFileSync(path.join(brandDir, name), 'utf8')
const write = (name, data) => fs.writeFileSync(path.join(publicDir, name), data)
const c = brand.colors

const mark = read('logo-mark.svg')
const markFavicon = read('logo-mark-favicon.svg')
const markMono = read('logo-mark-mono.svg')

// The sources colour themselves with CSS custom properties; baking a palette into the root element resolves them.
const paint = (svg, tile, glyph) => svg.replace('<svg ', `<svg style="--logo-tile:${tile};--logo-glyph:${glyph}" `)
const light = (svg) => paint(svg, c.tile, c.glyph)
const square = (svg) => svg.replace('rx="8"', 'rx="0"') // opaque, full-bleed: apple-touch-icon and maskable
const inner = (svg) => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))

// Maskable icons are cropped to a shape by the OS, so the glyph must sit inside the central 80% safe zone.
function maskable(svg) {
  const body = inner(square(svg))
  const split = body.indexOf('<g ')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${body.slice(0, split)}<g transform="translate(16 16) scale(0.74) translate(-16 -16)">${body.slice(split)}</g></svg>`
}

// favicon.svg: the simplified 16px variant, with a dark-browser-chrome palette (mint tile, deep glyph).
write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<style>:root{--logo-tile:${c.tile};--logo-glyph:${c.glyph}}@media (prefers-color-scheme:dark){:root{--logo-tile:${c.tileOnDark};--logo-glyph:${c.glyphOnDark}}}</style>${inner(markFavicon)}</svg>
`)

// Safari pinned tab: one flat colour, no tile (Safari tints it with the `color` attribute from the head).
write('safari-pinned-tab.svg', markMono.replaceAll('currentColor', '#000000').replaceAll(/ class="[^"]*"/g, '').replace(/ pathLength="1"/g, ''))

const launch = async () => {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) return chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH })
  try { return await chromium.launch() } catch { return chromium.launch({ channel: 'chrome' }) }
}
const browser = await launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

async function png(size, svg) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" style="display:block" `)}</body></html>`)
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
}

const fav16 = await png(16, light(markFavicon))
const fav32 = await png(32, light(markFavicon))
const fav48 = await png(48, light(mark))
write('favicon-16.png', fav16)
write('favicon-32.png', fav32)
write('apple-touch-icon.png', await png(180, light(square(mark))))
write('icon-192.png', await png(192, light(mark)))
write('icon-512.png', await png(512, light(mark)))
write('icon-192-maskable.png', await png(192, light(maskable(mark))))
write('icon-512-maskable.png', await png(512, light(maskable(mark))))

// favicon.ico: three PNG-compressed images in one ICO container.
const images = [[16, fav16], [32, fav32], [48, fav48]]
const header = Buffer.alloc(6)
header.writeUInt16LE(1, 2)
header.writeUInt16LE(images.length, 4)
let offset = 6 + images.length * 16
const entries = images.map(([size, data]) => {
  const entry = Buffer.alloc(16)
  entry.writeUInt8(size, 0)
  entry.writeUInt8(size, 1)
  entry.writeUInt16LE(1, 4)
  entry.writeUInt16LE(32, 6)
  entry.writeUInt32LE(data.length, 8)
  entry.writeUInt32LE(offset, 12)
  offset += data.length
  return entry
})
write('favicon.ico', Buffer.concat([header, ...entries, ...images.map(([, data]) => data)]))

// Open Graph image: the mark, the lockup and the motto on the mint wash. No UI, no claims beyond the brand config.
const font = fs.readFileSync(path.join(publicDir, 'fonts/Manrope-Variable-latin.woff2')).toString('base64')
const motto = brand.motto.split(/(?<=,)\s+/)
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 })
await og.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Brand; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 200 800; }
* { box-sizing: border-box; }
body { margin: 0; width: 1200px; height: 630px; overflow: hidden; position: relative; font-family: Brand, system-ui, sans-serif; color: #0b1211;
  background:
    radial-gradient(900px 560px at 92% 8%, rgba(126, 240, 198, 0.55), transparent 62%),
    radial-gradient(700px 520px at 0% 108%, rgba(126, 240, 198, 0.32), transparent 60%),
    ${c.wash}; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(70,128,112,.09) 1px, transparent 1px), linear-gradient(90deg, rgba(70,128,112,.09) 1px, transparent 1px); background-size: 48px 48px; mask-image: linear-gradient(115deg, transparent 20%, #000 90%); }
.lockup { position: absolute; left: 80px; top: 72px; display: flex; align-items: center; gap: 18px; font-size: 34px; font-weight: 760; letter-spacing: -0.035em; }
.lockup svg { width: 60px; height: 60px; display: block; }
h1 { position: absolute; left: 80px; top: 224px; margin: 0; font-size: 72px; line-height: 1.02; font-weight: 720; letter-spacing: -0.058em; }
h1 span { display: block; }
.tagline { position: absolute; left: 82px; bottom: 76px; margin: 0; max-width: 620px; font-size: 26px; line-height: 1.4; font-weight: 520; color: #33433f; }
.big { position: absolute; right: 76px; bottom: 76px; width: 224px; height: 224px; filter: drop-shadow(0 28px 40px rgba(14, 100, 78, 0.28)); }
</style></head><body>
<div class="grid"></div>
<div class="lockup">${light(mark).replace('<svg ', '<svg width="60" height="60" ')}<span>${brand.name}</span></div>
<h1>${motto.map((line) => `<span>${line}</span>`).join('')}</h1>
<p class="tagline">${brand.tagline}</p>
<div class="big">${light(mark).replace('<svg ', '<svg width="224" height="224" ')}</div>
</body></html>`)
await og.evaluate(() => document.fonts.ready)
await og.screenshot({ path: path.join(publicDir, 'og-image.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } })

await browser.close()
console.log('brand assets written to', publicDir)
