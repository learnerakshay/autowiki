// The single source of truth for the product's name and public identity.
//
// Renaming the product is a one-file edit: change `name` (and anything else below), then
// run `npm run assets` in ./web to regenerate the Open Graph image and icon files, which contain
// the name as pixels. The nav, footer, <title>, meta tags, manifest and brand mark all read this file.
//
// This file must stay plain ESM with no imports: vite.config.js loads it in Node to template index.html.
export const brand = {
  name: 'AutoWiki',
  // Short promise used in meta tags and social cards. Keep it a true statement about the product.
  tagline: 'Structured technical wikis from public GitHub repositories',
  description:
    'Turn a public GitHub repository into a structured technical wiki: generated chapters, source paths for every explanation, and Mermaid diagrams.',
  // Footer line under the wordmark.
  blurb: 'Structured technical wikis generated from public GitHub repositories.',

  // Optional. Empty string = the related UI / tag is omitted entirely. Nothing is ever invented.
  repoUrl: '', // e.g. 'https://github.com/owner/autowiki' -> adds a "Source" link to the footer
  credits: '', // e.g. 'Built by Jane Doe' -> adds a credits line to the footer
  origin: '', //  e.g. 'https://autowiki.example.com' -> enables <link rel="canonical">, og:url and an absolute og:image URL

  themeColor: '#f4fbf8',
  ogImage: '/og-image.jpg',
}
