# Design system

The landing page was built first and is the reference. This pass promoted its design language into a system the whole
app uses: one set of tokens, width tracks, interaction rules, a motion vocabulary, a UI kit, and an app shell (nav,
footer, background, route transitions) that Workspace, Chat, Wiki and Architecture now sit in. The four pages' own
internals are redesigned in later passes; this document is what those passes build on.

```
web/src/
  styles/tokens.css        every token (colour, type, space, shape, depth, layers, time, layout, interaction)
  styles/layout.css        the width tracks
  styles/interaction.css   focus ring, press, lift, sr-only, selection, scrollbar
  lib/motion.js, spring.js, carouselEngine.js   the motion vocabulary (unchanged API; `springCss` added)
  components/ui/kit/       the primitives (+ index.js barrel)
  components/shell/        PillNav, AppNav, AppFooter, AppBackground, RouteViewport, AppShell, routes
  components/brand/        <Logo>, <BrandLink>  (see docs/brand.md)
  pages/dev/UiGallery.jsx  /dev/ui   (dev server only)
  pages/dev/BrandBoard.jsx /dev/brand (dev server only)
```

## Tokens

`styles/tokens.css` is the only place tokens are defined. The first block is exactly what the landing shipped with, so
landing CSS resolves to identical values (verified pixel-for-pixel, see "Verification").

| Group | Tokens |
|---|---|
| Surface, ink, accent | `--paper --mint-50/100/200 --ink --ink-2 --ink-3 --accent --accent-ink --accent-soft --btn-dark --btn-dark-hover --line --line-strong` |
| Dark sections | `--dark --dark-2 --dark-ink --dark-ink-2 --dark-accent --dark-line` |
| Status (always icon + text) | `--status-{pending,success,danger,info,idle}` and `-soft` / `-line` |
| Type | `--fs-display --fs-h2 --fs-h2-compact --fs-h3 --fs-card --fs-body --fs-small --fs-caption --fs-mono --fw-display --track-display --fw-card --track-card` |
| Space, shape, depth | `--space-1..5 --r-xs/s/m/l/pill --shadow-1/2/3 --blur-sm/md` |
| Layers | `--z-bg 0 · --z-content 1 · --z-sticky 30 · --z-nav 60 · --z-scrim 70 · --z-dialog 80 · --z-toast 90 · --z-tooltip 95 · --z-skip 100` |
| Time | `--ease-out --dur-press 90ms --dur-fast 180ms --dur-base 250ms --dur-slow 500ms --spring --spring-duration --spring-momentum --spring-momentum-duration` |
| Layout | `--gutter --content-w --wide-w --reading-w --content --wide --reading --nav-h` |
| Interaction | `--ring --ring-width --ring-offset --press-scale --lift-y --lift-shadow --selection --scrollbar-* --disabled-ink/bg/line` |
| Background intensity | `--bg-mesh --bg-grid --bg-grain` (0..1; all 0 under `prefers-contrast: more`) |

`--spring` / `--spring-duration` hold a fallback ease until `installMotionTokens()` (called in `main.jsx` before the first
render) overwrites them with the real spring curves.

**Value changes to legacy app tokens** (kept for the page passes, defined in the second block of `tokens.css`):
`--accent-soft` is no longer redefined for the app (it uses the landing's `#dff9ef`, was `#ddfce9`);
`--pending #087f75 → #077068` (4.4:1 on its tint background, now 5.4:1). `--cyan-accent` keeps `#087f75` for the landing
(some landing icons use it, and the landing must stay pixel-identical) and is `#07766d` inside `.app-shell` (4.49:1 → 4.9:1 on its tint).

## Width tracks

| Track | Class / token | Max width | Use |
|---|---|---|---|
| content | `.ui-container--content`, `--content` | 72rem | the default: forms, cards, most pages (the nav bar and the footer sit on it too, so every left edge aligns) |
| wide | `.ui-container--wide`, `--wide` | 82rem | dashboards, a sidebar plus a document |
| reading | `.ui-container--reading`, `--reading` | 46rem (about 68 characters) | long-form text |

All three are centred and keep the fluid gutter `clamp(1.25rem, 4.2vw, 3rem)` on narrow screens. React: `<Container track>`
and `<Page track>` (adds the vertical rhythm). The landing's `.lp-container` / `.lp-wide` are the same tracks.

## Interaction rules (`styles/interaction.css`)

- **One focus ring**: `outline: var(--ring-width) solid var(--ring)` at `--ring-offset`, on every interactive element
  (`:where()`, so a component can override). `--ring` is the accent (>= 3:1 on white, the mint washes and the accent
  pill) and switches to the mint accent inside `[data-surface="dark"]`. Programmatic focus targets (h1, `<main>`) get no ring.
- **Press**: `transform: scale(var(--press-scale))` (0.97) on pointer-down, 90ms. `.press` opts any element in.
- **Hover lift**: `translateY(var(--lift-y))` plus `--lift-shadow`. `.lift` opts any element in.
- **Disabled** stays legible (`--disabled-ink` on `--disabled-bg`, 4.9:1). `Button` takes `disabledReason`: the button
  stays focusable (`aria-disabled`) and the reason is shown as a tooltip and exposed via `aria-describedby`.
- `::selection`, quiet scrollbars, `<meta name="color-scheme" content="light">`.
- Reduced motion, reduced transparency and high contrast are handled in every kit and shell component.

## Motion vocabulary

All motion uses `lib/motion.js` and nothing else. `springs.default` (damping 1, response 0.35s) for everything that is
not a throw; `springs.momentum` (damping 0.8) only after a flick; `reduced.fade` (0.18s) replaces every spring under
reduced motion. In CSS: `var(--spring)` with `var(--spring-duration)`. In the Web Animations API: `springCss.default`
with `springDuration.default * 1000`. Gestures (toast swipe, bottom-sheet drag) release through `projectDistance` and
`FLICK_VELOCITY` from `carouselEngine`. Animate transform and opacity (plus SVG stroke offsets); the one exception is the
disclosure panel's height, which is out of flow while it moves.

## Primitives (`components/ui/kit`)

| Component | Notes |
|---|---|
| `Button`, `IconButton` | primary / secondary / ghost; sm md lg icon; `iconLeading` / `iconTrailing`; `loading` (breathing dot, no percentage); `disabledReason`; `as={Link}`. `IconButton` needs `label`; 44px target |
| `TextField`, `TextareaField`, `Input` | label, hint, prefix / suffix slots, `mono` (repo fields), autosizing textarea. `validate(value)` runs while typing (after a pause) and on blur, never only on submit; the `aria-live` message line is always reserved |
| `Surface` | `flat`, `raised`, `dark`, `spotlight` (cursor-following border glow, pointer-fine only), `interactive` (spring lift and press) |
| `Badge`, `Chip`, `StatusPill` | `StatusPill` states: idle / pending / succeeded / failed / info, each with icon and text |
| `Tabs`, `SegmentedControl` | roving tabindex, arrows / Home / End, sliding spring indicator |
| `Tooltip` | hover and focus, delay with a warm window, portalled and clamped (no clipping), Esc closes, never on touch |
| `Kbd`, `Divider` | |
| `Disclosure`, `Accordion` | spring height, interruptible |
| `toast()` + `<Toaster />` | stack, spring enter / exit, swipe with velocity, pause on hover or focus, `aria-live="polite"` |
| `Skeleton`, `SkeletonText` | shimmer sweep, static under reduced motion |
| `CodeBlock` | path / language label, copy with confirmation, edge fades only where there is more to scroll, focusable scroll region |
| `Dialog`, `Sheet` | focus trap, Esc, scrim, inert app root, scroll lock, focus returns to the trigger. Dialog scales out of its trigger; Sheet is a right edge panel and a bottom sheet with drag-to-dismiss on phones |
| `PageHeader`, `EmptyState`, `EmptyStateSkeleton` | the landing's headline recipe with the shared `useReveal`; zero state and its same-geometry placeholder |
| `Container`, `Page` | the tracks |

Import from `components/ui/kit/index.js` (or a file); each primitive brings only its own stylesheet.

### The honesty rule

> Pending is intentionally indeterminate. The application does not invent queue depth, provider latency, a percentage,
> or an ETA.

No component here can show a percentage, a queue position or an ETA: `Button` loading is a breathing dot, `StatusPill`
pending is a breathing ring and a word, the route loader and `<Logo loading>` breathe, and `toast` has no progress
field. Do not add one.

## App shell

`AppShell` = skip link, `AppBackground`, `AppNav`, `<main id="main-content">` with the page region, `AppFooter`, toasts.
The nav, background and footer persist; only the page region changes.

- **`PillNav`** is the landing nav's pill bar, brand slot, equal-width item list with the sliding active pill, CTA slot,
  hairline progress, soft edge and mobile sheet. `LandingNav` (scroll-spy, past-hero CTA swap) and `AppNav` (route) are thin
  wrappers. The `ln` class prefix is historical.
- **`AppNav`**: the active pill follows the route and the item gets `aria-current="page"`, including nested routes
  (`/wiki/sample/spoon-knife` highlights Wiki). "Generate a Wiki" routes to the Workspace and focuses its repository
  field; it is hidden on the Workspace. Mobile: a menu sheet with a focus trap and Esc.
- **`AppFooter`**: the landing footer's dark bookend, compact: logo, section links, back to top, optional source and credits from
  `brand.js`. It is hidden (still laid out) until the first page has rendered, so it never jumps.
- **`AppBackground`**: one fixed layer, the hero's mesh / grid / grain at a fraction of the strength. No backdrop-filter, paused while the tab is
  hidden, static under reduced motion, flat under reduced transparency.

### Route transitions (`RouteViewport`)

1. A location change invalidates any swap still in flight (so A to B to A cannot land on B).
2. The next page's chunk loads while the current page stays on screen and interactive. The breathing-mark "Loading
   workspace…" pill appears only if it takes longer than 150ms.
3. The swap: the old page fades out in 90ms, the new one rises 12px and fades in on `springs.default`, the page's h1
   follows 70ms later. Reduced motion: a 0.18s cross-fade. Nothing blocks input and any navigation interrupts it.
4. Scroll: new routes go to the top; back / forward restore the saved position (`history.scrollRestoration` is
   `manual`); a `#hash` scrolls to its element.
5. Focus: the new page's h1 (or the element the navigation asked for, e.g. `state: { focus: '#repo' }`); the title is
   written to `document.title` and announced through a polite live region. The first render of the shell is a page load,
   not a route change: focus stays at the start of the document so the skip link is the first tab stop.
6. Same page, different query or state: no transition.

**The View Transitions API was measured and not used.** With `document.startViewTransition`, Chrome dropped a second click
made within about 450ms of the first (0 of 3 landed at 20 to 300ms; with the Web Animations path every click landed), and rapid
click sequences left the nav and page out of step. That breaks "never block input, interruptible", so the transition is
Web Animations only.

## Dev routes

`/dev/ui` shows every primitive in a state matrix (default, forced hover / focus / pressed, disabled, loading, error, success;
light and dark), toast triggers, dialog / sheet, and the nav, footer and background in frames. `/dev/brand` is the logo board.
Both are behind `import.meta.env.DEV`, so production bundles do not contain them; both set `noindex`.

## Migration map after Pass B

| Page | Scoped styling | Controls |
|---|---|---|
| Workspace | pages/workspace.css | Kit Page, Surface, fields, buttons and status pills |
| Chat | pages/chat.css | Kit composer, answer, source chips and error states |
| Wiki reader | pages/wiki-reader.css | Shared reader for sample/generated Wiki; kit overlays and code |
| Architecture | pages/architecture.css | Kit tracks, tabs, disclosures, source chips and surfaces |
| Landing | styles/landing.css and component styles | Existing live hero Button/Radix Tabs retained |

index.css contains global foundation only; preserved landing rules live in styles/legacy-landing.css before the current landing layer. Shared generation activity styling remains components/wiki-generation-progress.css. Shell page overrides and obsolete page selectors have been removed. Legacy input, label, card, badge, skeleton, JobStatus, ErrorNotice, page helper components and useJobNotifications are deleted. Failure announcements are inline; completion is page-local because polling stops on route departure. Legacy token aliases remain for the existing landing layers and global Tailwind map.

## Pass B migration

Chat now uses Page/PageHeader, Surface, TextField, capped autosizing TextareaField, Chip, Kbd, SkeletonText and stable Button. Its scoped styles live in pages/chat.css; request state derives only from submission and job responses. Source ref is not returned by the API, so Chat does not invent GitHub blob links.
Architecture now uses the same width tracks and heading scale, kit surfaces/tabs/disclosures/code blocks/file chips/buttons. pages/architecture.css owns its layout; ArchitectureSections is split and bodies mount near the viewport with reserved geometry. The SVG uses orthogonal routing around node rectangles and a vertical node list at 768px. Shared source chips copy with kit toasts.
index.css contains global foundation only. Existing landing rules moved unchanged into styles/legacy-landing.css before the current landing layer; obsolete Chat, Architecture, wiki-pipeline and wiki-stage selectors were removed. Legacy input/label/card/badge/skeleton and unused page components were deleted. Landing still uses the legacy Button and Radix Tabs; those two files are live and retained to preserve pixels.
Button always keeps its element tree and uses aria-disabled; its described reason is stable. Callers expose visible helper text. The ineffective :has fallback was replaced with data-route-ready. Failure notifications are page-local inline regions; polling does not survive route departure.
