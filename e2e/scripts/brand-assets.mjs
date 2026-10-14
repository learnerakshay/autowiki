// Regenerates every brand asset that contains pixels: favicon set, apple-touch-icon, manifest icons and the
// 1200x630 Open Graph image (a real screenshot of the finished hero). Run from ./web with a server up:
//   npm run build && npm run preview   (then, in another terminal)   npm run assets
// BASE_URL defaults to the preview server. Output goes to ../web/public.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(here, '../../web/public')
const baseUrl = process.env.BASE_URL ?? 'http://localhost:4173/'

const BG = '#111918'
const FG = '#7ef0c6'
// The same document-with-nodes mark as the in-app brand icon (src/components/AutoWikiBrand.jsx).
const glyph = (stroke) => `
  <path d="M6.5 3.75h7l4 4v12.5h-11z" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M13.5 3.75v4h4M9 9.5v5.25m0-2.75h3.25m0 0v3.25" fill="none" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="9" cy="8.75" r="1" fill="${stroke}"/><circle cx="9" cy="15.5" r="1" fill="${stroke}"/><circle cx="13" cy="15.5" r="1" fill="${stroke}"/>`
const svg = ({ radius = 6, scale = 1 } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" rx="${radius}" fill="${BG}"/>
  <g transform="translate(${12 - 12 * scale} ${12 - 12 * scale}) scale(${scale})">${glyph(FG)}</g>
</svg>`

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svg({ radius: 6 }))

// Use a downloaded Playwright Chromium if there is one, otherwise the system Chrome.
const launch = async () => {
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) return chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH })
  try { return await chromium.launch() } catch { return chromium.launch({ channel: 'chrome' }) }
}
const browser = await launch()
const page = await browser.newPage({ deviceScaleFactor: 1 })

async function png(size, markup) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<html><body style="margin:0;background:transparent"><div style="width:${size}px;height:${size}px">${markup}</div></body></html>`)
  return page.screenshot({ omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } })
}
const sized = (size, source) => source.replace('<svg ', `<svg width="${size}" height="${size}" `)

const write = (name, buffer) => fs.writeFileSync(path.join(publicDir, name), buffer)
const rounded = svg({ radius: 6 })
const square = svg({ radius: 0 }) // opaque, for apple-touch-icon and maskable
const maskable = svg({ radius: 0, scale: 0.72 }) // glyph inside the 80% maskable safe zone

const icon16 = await png(16, sized(16, rounded))
const icon32 = await png(32, sized(32, rounded))
const icon48 = await png(48, sized(48, rounded))
write('favicon-32.png', icon32)
write('apple-touch-icon.png', await png(180, sized(180, square)))
write('icon-192.png', await png(192, sized(192, rounded)))
write('icon-512.png', await png(512, sized(512, rounded)))
write('icon-512-maskable.png', await png(512, sized(512, maskable)))

// favicon.ico: three PNG-compressed images in one ICO container.
const images = [[16, icon16], [32, icon32], [48, icon48]]
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

// Open Graph: the real hero, in its static (reduced-motion) final state, at 1200x630.
const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await og.goto(baseUrl)
await og.waitForSelector('.landing-hero h1')
await og.waitForTimeout(1500)
await og.screenshot({ path: path.join(publicDir, 'og-image.jpg'), type: 'jpeg', quality: 88, clip: { x: 0, y: 0, width: 1200, height: 630 } })

await browser.close()
console.log('brand assets written to', publicDir)
