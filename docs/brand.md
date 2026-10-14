# Brand and logo

The product name is not final, so the logo is built to work without it and to be renamed in one file.

## The mark

A commit graph (a rail, one branch, three nodes) whose rows resolve into ordered text lines. The branch row is
indented like an outline level, so the picture reads as **repository structure becoming a readable document**: the
hero motto, “Your repository, beautifully documented.”, drawn as a symbol.

It is deliberately not a page glyph (it would read as a generic file icon) and not a letterform (the name may change).
It does not borrow the Octocat, the GitHub mark or the Git logo.

| Rule | Value |
|---|---|
| Grid | 32 units, tile radius 8 |
| Glyph | graph path + lines path + 3 nodes (5 shapes, plus the tile) |
| Stroke | 2.4 units, round caps and joins (3.2 in the 16px favicon drawing) |
| Nodes | radius 2 (2.7 in the favicon drawing) |
| Colour | Two tones, no gradients: dark tile + mint glyph on pale surfaces, mint tile + deep-green glyph on dark ones |

## Sources of truth

| File | Purpose |
|---|---|
| `design/brand/logo-mark.svg` | The mark on pale surfaces. `<Logo>` inlines this file. |
| `design/brand/logo-mark-on-dark.svg` | Inverted tile for dark surfaces (the footer). |
| `design/brand/logo-mark-mono.svg` | Silhouette only, `currentColor`, no tile. |
| `design/brand/logo-mark-favicon.svg` | Simplified drawing for 16–32px: larger glyph, heavier stroke. |
| `design/brand/explorations/` | The two concepts not chosen (A branch-page, B open-book spine), kept as swappable alternates. |
| `web/src/config/brand.js` | Name, motto, tagline, colours. Nothing about the name or palette is hardcoded in the logo files. |

The SVGs colour themselves with `--logo-tile` and `--logo-glyph` and fall back to the default palette when opened on
their own.

## Using it

Always render through `<Logo>` (`web/src/components/brand/Logo.jsx`); link it home with `<BrandLink>`.

```jsx
<Logo variant="mark | lockup | stacked" tone="auto | light | dark | mono" size="2rem" animated loading />
```

- `lockup` is the mark plus the product name as live text. The mark is `aria-hidden` there. A standalone `mark` gets an
  accessible name (`brand.name`, or `label`); pass `decorative` to hide it. A logo that links home is named
  “<Name> home” by `BrandLink`.
- `tone="auto"` is the light tone, switching to on-dark inside an ancestor with `data-logo-surface="dark"`.
- **Clear space:** one quarter of the mark's width on every side.
- **Minimum size:** 24px beside a wordmark; below that (down to 16px) use the favicon drawing.
- **Only brand positions:** nav, footer, favicon and app icons, OG image, loading states. Anything that just means
  “a document” (preview window headers, file rows) uses a generic file icon, never the mark.
- Don't recolour, stretch, rotate, outline or add effects. Don't use a different tile colour. Don't combine it with the
  GitHub or Git logos.

## Motion

All timing comes from the shared springs in `web/src/lib/motion.js` (`--spring`, `--spring-duration`).

- **Entrance** (landing nav, once per page load): the graph draws in, the nodes pop on a short stagger, then the text
  lines draw; about 0.56s in total.
- **Hover / focus** on the logo link: the branch node leans out and every node swells; the box never changes size.
- **Loading** (`loading`): the nodes breathe in sequence, indeterminate by design. It is used for the app's route
  loading state.
- **Reduced motion:** everything is static.

## Renaming the product

1. Edit `web/src/config/brand.js` (`name`, and `motto`/`tagline`/`colors` if they change).
2. Run `npm run assets` in `web/`.
3. Rebuild. The nav, footer, app header, `<title>`, meta tags, manifest, icons and OG image all follow.

## Regenerating assets

```bash
cd web
npm run assets
```

`web/scripts/generate-brand-assets.mjs` reads `brand.js` and the SVGs in `design/brand/`, rasterizes with the
Playwright in `e2e/`, and writes to `web/public/`: `favicon.svg` (dark-mode aware), `favicon.ico` (16/32/48),
`favicon-16.png`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192/512(.png, -maskable.png)`,
`safari-pinned-tab.svg` and `og-image.jpg`. No dev server is needed. Set `PLAYWRIGHT_EXECUTABLE_PATH` to use a
specific Chrome.

## Brand board

`npm run dev`, then open `/dev/brand`. It shows the construction grid, lockups, clear space and minimum sizes, colour
and mono variants, favicon renders, the app icon, the OG image, the three animations (with Replay) and a do/don't list.
The route only exists in development: it is behind `import.meta.env.DEV`, so production bundles do not contain it, and
it sets `noindex` regardless.
