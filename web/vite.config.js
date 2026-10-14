import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { brand } from './src/config/brand.js'

const escapeHtml = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const absolute = (path) => (brand.origin ? new URL(path, brand.origin).href : path)

// Head tags derived from src/config/brand.js. Tags whose value is not configured are omitted, never invented.
function headTags() {
  const title = `${brand.name}: ${brand.tagline}`
  const tags = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(brand.description)}" />`,
    `<meta name="theme-color" content="${brand.themeColor}" />`,
    `<meta name="application-name" content="${escapeHtml(brand.name)}" />`,
    `<link rel="mask-icon" href="/safari-pinned-tab.svg" color="${brand.colors.tile}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(brand.name)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(brand.description)}" />`,
    `<meta property="og:image" content="${absolute(brand.ogImage)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${escapeHtml(`${brand.name} turns a GitHub repository into a structured technical wiki`)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(brand.description)}" />`,
    `<meta name="twitter:image" content="${absolute(brand.ogImage)}" />`,
  ]
  if (brand.origin) {
    tags.push(`<link rel="canonical" href="${new URL('/', brand.origin).href}" />`)
    tags.push(`<meta property="og:url" content="${new URL('/', brand.origin).href}" />`)
  }
  return tags.map((tag) => `    ${tag}`).join('\n')
}

const manifest = () => JSON.stringify({
  name: brand.name,
  short_name: brand.name,
  description: brand.description,
  start_url: '/',
  display: 'standalone',
  background_color: brand.themeColor,
  theme_color: brand.themeColor,
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2)

// The landing page is lazy-loaded (so every other route stays light), which would put its chunk behind the
// main bundle in the request waterfall. Hint it from index.html instead: the browser fetches the landing
// chunk, its shared imports and its CSS in parallel with the entry, and React.lazy resolves immediately.
function landingPreloadHints(bundle) {
  if (!bundle) return []
  const chunks = Object.values(bundle).filter((file) => file.type === 'chunk')
  const landing = chunks.find((chunk) => chunk.facadeModuleId?.endsWith('src/pages/Landing.jsx'))
  if (!landing) return []
  const byName = new Map(chunks.map((chunk) => [chunk.fileName, chunk]))
  const entry = chunks.find((chunk) => chunk.isEntry)
  // Chunks the entry already preloads (React runtime and friends) are not repeated.
  const seen = new Set(entry?.imports ?? [])
  const walk = (chunk) => {
    if (!chunk || seen.has(chunk.fileName) || chunk === entry) return
    seen.add(chunk.fileName)
    chunk.imports.forEach((name) => walk(byName.get(name)))
  }
  walk(landing)
  const wanted = [...seen].filter((name) => !entry?.imports.includes(name))
  const tags = wanted.map((name) => ({ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: '', href: `/${name}` }, injectTo: 'head' }))
  const css = new Set(wanted.flatMap((name) => [...(byName.get(name)?.viteMetadata?.importedCss ?? [])]))
  css.forEach((name) => tags.push({ tag: 'link', attrs: { rel: 'stylesheet', crossorigin: '', href: `/${name}` }, injectTo: 'head' }))
  return tags
}

function brandPlugin() {
  return {
    name: 'brand-head',
    transformIndexHtml: {
      order: 'post',
      handler: (html, context) => ({ html: html.replace('<!--BRAND_HEAD-->', headTags()), tags: landingPreloadHints(context.bundle) }),
    },
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_request, response) => {
        response.setHeader('Content-Type', 'application/manifest+json')
        response.end(manifest())
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest() })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), brandPlugin()],
  server: {
    // The logo imports its SVG source from ../design/brand, which sits outside this package.
    fs: { allow: ['..'] },
    proxy: {
      '/api': 'http://localhost:5555',
    },
  },
})
