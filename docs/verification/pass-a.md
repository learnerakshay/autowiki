# Pass A independent verification

Verifier: Claude (independent of Codex). Date: 2026-10-14. Verified commit: `4f21681` (single commit on top of `d4cf58c`, working tree clean, 53 files, +1632/−2225).
Method: real Chrome (system), Playwright WebKit 27.2, real backend stack (Express + Inngest dev server, real OpenAI and Pinecone keys), a baseline worktree of `d4cf58c`, and 20+ throwaway scripts. Nothing in the repo was edited except this report; no goldens were regenerated; every test output went to a throwaway worktree.

All scripts, logs and screenshots are outside the repo in
`C:\Users\aksha\AppData\Local\Temp\claude\C--Users-aksha-Desktop-autowiki\664abfed-6466-4a65-9853-475f6e619ee5\scratchpad\vf\` (`shots\ws`, `shots\wiki`, `shots\toast`, `shots\a11y`, `shots\real`, `shots\webkit`, `px\`). Called **VF/** below.

---

## 1. Verdict table

| Item | Verdict | One-line reason |
|---|---|---|
| Flag 1: lazy anchors | **VERIFIED** | At 4× CPU every first click lands at 72px (nav offset), 0 CLS, 0 drift; baseline lands up to 629px off with CLS up to 0.50. Fix is in product code. |
| Flag 2: mount performance | **PARTIAL** | Codex's numbers reproduce within about 10%; the 4× targets are still unmet. Top Wiki cost is Mermaid's ELK chunk. |
| Flag 3: migration | **VERIFIED** | Workspace and Wiki use only the kit; `index.css` keeps only Architecture's `.wiki-pipeline-*`/`.wiki-stage-*`; `shell.css` has no overrides for them. Dead legacy files remain. |
| Flag 4: toasts | **VERIFIED** (with defects) | Sonner is gone everywhere; all 6 toast paths render. No success toast exists, and the HTML-500 text leaks into toasts. |
| Flag 5: Wiki track | **VERIFIED** | Not cramped at 1440, 1366, 1280, 1024; sensible reflow at 768, 390 and 360; no horizontal scroll. |
| Flag 6: accessibility | **PARTIAL** | axe: 0 violations in 18 audits and label-in-name is fixed, but focus is lost after the Generate and Index buttons and after "Open wiki". Forced-colors is mostly fine. |
| Flag 7: cross-browser and misc | **PARTIAL** | WebKit passes. Firefox COULD NOT VERIFY. The `:has()` fallback exists but does nothing; the reduced-motion toggle only partly changes JS motion. |
| Flag 8: visual stability | **PARTIAL** | The helper works, but its gate compares a build to itself and failed 2 of 3 of my runs (37 px > 32). Landing pixels vs baseline are unchanged. |
| Workspace | **PARTIAL** | Flows are correct and honest, but 5 defects (below), including lost keyboard focus and a misleading "generation failed" for a failed status check. |
| Wiki | **PARTIAL** | Navigation, deep links, source links, expand, copy and download all work. Wheel zoom does not work with real input, and a failed render leaves a stray Mermaid node. |
| Real backend run | **VERIFIED** | The whole stack runs here; a real Wiki and a real Index ran concurrently from the UI in about 24s. The 502 is a backend that was not running. |
| Quality sweep | **VERIFIED** | Console clean, 0 failed requests, CLS 0 on first and revisit for 6 routes at 2 widths; Chat and Architecture are pixel-identical to baseline. |

---

## 2. Evidence appendix

### 2.1 Integrity and baseline
- `git status` clean; `git log`: `4f21681` (Pass A) on `d4cf58c`. A baseline worktree of `d4cf58c` was built. It needed its own `node_modules` with `sonner` re-added (Pass A correctly removed it), otherwise its app routes do not render.
- `npx oxlint src` exit 0, no warnings. `npm run build` OK. Vite large-chunk warning: `elk-IJKZMXRS` 1,462.51 kB (gzip 455.73), `chunk-NGNAAXSQ` 629.04 kB (gzip 127.32); next is `cytoscape.esm` 434.61 kB.
- Bundle, baseline → Pass A: main JS 316,987 B → 286,523 B (gzip 101,189 → 91,461); main CSS 160,531 B → 118,102 B (gzip 30,692 → 23,597). New lazy route CSS: `Home` 9.2 kB (2.2 gzip), `WikiReader` 15.2 kB (3.6 gzip). Pass A's notes say a before/after bundle claim "is not possible"; it was.
- **Full Playwright suite, Chrome, dev server, API + Inngest running** (run in a throwaway worktree of HEAD):

| | passed | failed | skipped |
|---|---|---|---|
| Run 1 | 71 | 1 | 1 |
| Run 2 | 71 | 1 | 1 |

  Tests whose result differs between runs: **0**. Skipped: the Firefox smoke. Failed in both: `landing.spec.js:53` (hero tab swap, see below). Live Chat integration `chat.spec.js:16`: **passed**, 16.2s and 13.1s, with a real index and a real chat answer.
- `landing.spec.js:53` is a **pre-existing flaky test, not a Pass A regression** (I first suspected a regression and retracted it after repeats). It measures the hero tab centres while the entrance animation is still moving them. Failure rate over 8 runs: baseline build 4/8, Pass A production 3/8, Pass A dev server 7/8.
- prompt-15 diff vs Codex's description: matches. `prompt-15-motion`: explicit `landing:load-all` + `data-ready` waits, stage scroll math, `Open Styling` → `Chapter 3: Styling`, per-test output paths, `waitForTimeout` 350 → 700. **No `expect` was removed or loosened** in prompt-15. `prompt-15-visual` now routes through `stableVisual` (forces reduced motion, disables animation, so those screenshots no longer show normal motion). Results of the prompt-15 specs in my runs: all pass. Weakened assertions elsewhere are in 2.8.

### 2.2 Flag 1: lazy anchors (production, 4× CPU, fresh load, first click)
Script `VF/flag1.mjs`. Section top should be 72px (88px nav minus offset).

| Anchor | Pass A (normal / reduced) | Baseline (normal / reduced) |
|---|---|---|
| How it works | 72 / 72, CLS 0 | 72 / 71, CLS 0 |
| Chapters | 72 / 72, CLS 0 | **233** (CLS 0.065) / **−162** (0.162) |
| Features | 72 / 72, CLS 0 | 72 / **−409** (0.497) |
| Pipeline | 72 / 72, CLS 0 | **629** (0.112) / **468** (0.497) |

Drift after settling: 0px in all 8 Pass A cases. Architecture link: first click navigates to `/architecture` on both builds. Product code: `web/src/components/landing/LazySection.jsx:14-15,34,68,72` (`ReadySection` layout effect, `ready` state, `data-ready`, `minHeight` held until ready) and `web/src/components/landing/scrollToSection.js:9-18,28-29` (`whenReady`, waits for every section up to the target).

### 2.3 Flag 2: mount long tasks, PRODUCTION build, 3 runs each (`VF/flag2.mjs`), max long task in ms, median / worst

| Route | 1× first | 1× revisit | 4× first | 4× revisit | Codex 4× first / revisit |
|---|---|---|---|---|---|
| `/` | 0 / 0 | 0 / 0 | 165 / 166 | 89 / 93 | 167 / 86 |
| `/workspace` | 0 / 0 | 0 / 0 | 136 / 136 | 0 / 0 | 151 / 0 |
| `/chat` | 0 / 0 | 0 / 0 | 185 / 190 | 57 / 59 | 173 / 52 |
| `/wiki/sample/spoon-knife` | 52 / 53 | 0 / 0 | 323 / 333 | 142 / 143 | 312 / 130 |
| `/architecture` | 98 / 100 | 51 / 52 | 589 / 610 | 345 / 366 | 559 / 332 |

CLS worst across all runs: 0. Codex's 1× numbers (Workspace 0, sample Wiki 50, Architecture 95) match.

**Where the Wiki's mount goes** (CDP CPU profile, 4×, 3 runs, mean self time per run, throttled clock): `elk-IJKZMXRS` 800ms; `chunk-VPRB5NB3` (another Mermaid chunk) 402ms; `WikiReader` 204ms; main bundle (React) 189ms; `MarkdownDocument` 88ms; `mermaid.core` 43ms. Long-animation-frame attribution agrees: `elk…` user-callback 334ms, `mermaid.core…` resolve-promise 254ms, `AppShell…` (React route swap) 187ms, `WikiReader` 127ms. **Top cost: Mermaid / ELK chunk evaluation (about 1.3s combined across Mermaid chunks), about three times the React and reader code.** Workspace at 4×: 136ms, mostly main-bundle module evaluation (101ms) plus 43ms in the shell.

Lazy Mermaid verified (`VF/sweep.mjs`): `mermaid.core` and `elk` load only on the sample Wiki, not on the landing, Workspace, `/wiki`, Chat or Architecture. Idle prefetch of other route chunks is observed on every route.

### 2.4 Flag 3: migration
- `Home.jsx`, `Wiki.jsx`, `WikiReader.jsx`, `SampleWiki.jsx`, `MermaidDiagram.jsx`, `MarkdownDocument.jsx` import only `components/ui/kit/*`, `lucide-react`, router and local modules.
- `index.css`: 26 `.wiki-`/`.workspace-` rules remain, all `.wiki-pipeline-*` / `.wiki-stage-*`. `shell.css`: no Workspace or Wiki overrides (the `.workspace-page` line was removed).
- Legacy primitives still present, with importers: `button` (landing `RepoDemoInput`, Chat, Architecture), `tabs` (hero `PreviewWindow`), `input` + `label` (Chat), `card` (ErrorNotice via Chat, plus dead EmptyState and JobSkeleton), `badge` (JobStatus via Chat). `skeleton.jsx` is now used only by the dead `JobSkeleton`. `EmptyState.jsx`, `JobSkeleton.jsx`, `PageHeading.jsx` have no importers (they were already dead at baseline). `Wiki.jsx` re-exports `WikiReader` with no importer.
- Limitation: my automated unused-export scan was broken (regex escaping) and is discarded; I did not do a complete dead-export audit. The CSS scan found 2 unreferenced classes in `workspace.css` (`ui-btn--primary/--secondary`, kit classes) and 2 in `wiki-reader.css` (Mermaid-internal names): effectively no dead CSS.

### 2.5 Flag 4: toasts
- `sonner`: 0 hits in `package.json`, `package-lock.json` (web and root), `web/src`, `node_modules`; no `.toast-surface/-title/-description` CSS.
- Real toast triggered and looked at (`VF/toasts.mjs`, shots `VF/shots/toast/`) for every path in the code (all are error toasts): wiki submit 429, wiki submit network failure, index submit 502, wiki job failed (1440 and 390), index job failed, Wiki page job failed. All render bottom-right, `aria-live="polite"`, auto-dismiss in about 8.5–9s. A completed job raises **no** toast: `useJobNotifications` only handles failures and ignores its `completed` label.

### 2.6 Flag 6: accessibility (`VF/a11y.mjs`, axe-core 4.x tags wcag2a/aa/21/22 + best-practice, settled)
- 18 audits (landing, Workspace, `/wiki` entry, sample Wiki, Chat, Architecture × 1440 settled, 390 settled, 1440 reduced motion): **0 violations** in all.
- label-in-name (visible text must be in `aria-label`): no mismatches on any of the 6 routes. The earlier Workspace finding is fixed.
- Forced-colors + `prefers-contrast: more` on Workspace and the sample Wiki at 1280 and 390 (screenshots `VF/shots/a11y/forced-*.png`): fields, buttons and chips keep borders, focus outlines are 2px system colours, icons visible, current chapter outlined, no horizontal overflow. **Not preserved:** the app nav's active page (the sliding pill is a background, so all four nav items look identical).
- Keyboard-only (`VF/keyboard.mjs`, `focusloss.mjs`, `openwiki.mjs`): see defects 1 and 6.

### 2.7 Flag 7: other
- Firefox: `firefox.exe` fails with `spawn UNKNOWN`. Windows event log: `SideBySide` "Dependent Assembly mozglue,type=win32 … could not be found". `mozglue.dll` is present; `npx playwright install firefox --force` did not fix it. Host/build problem. **COULD NOT VERIFY.**
- WebKit 27.2 (Playwright, Windows): landing, Workspace (validation + concurrent mocked jobs + completion), sample Wiki (chapters, one diagram, expand + Esc, focus returns), at 1280 and 390: all pass, no console errors (`VF/webkit.mjs`). Not real Safari.
- `:has()` fallback: `route-viewport.css:5-6` `@supports not selector(:has(*)) { … visibility: visible }`. It exists, but in a browser without `:has()` the main rule is already dropped, so the fallback changes nothing and the original footer jump would remain.
- `/dev/ui` reduced-motion toggle (`VF/rmtoggle.mjs`): sets `html[data-reduced-motion]`, which `prefersReducedMotion()` reads. Disclosure animations: 1 with toggle off, 0 with it on (a real JS change). The spotlight Surface still moves its orb with the toggle on, as do ~15 other JS paths that read the media query directly. **Partial.**
- `docs/manual-qa.md` exists and is actionable (6 numbered checks).

### 2.8 Flag 8: visual stability
- `stableVisual()` (`e2e/helpers/stableVisual.js`): emulates reduced motion, loads all lazy landing sections, waits for fonts/images, injects `animation:none; transition:none`, waits two frames. `visual-stability.spec.js` takes three fresh sessions and requires the other two to differ from the first by **≤ 32 pixels**.
- It compares the build to itself. It cannot detect a regression against any baseline, and 32 px (0.0003% of the page) is large enough to hide a small icon colour change (an earlier 16×16 icon shift in this project was 113 px). It also forces reduced motion and disables animation.
- It failed 2 of 3 of my runs on the dev server: pixel differences (32, 37), (2, 16), (9, 37). Raw uncontrolled captures mismatched 2/2 every time.
- Specs that do not use it are still non-deterministic: the same spec twice differed by 1.06–1.26M pixels (laptop) and 0.43–0.56M (mobile) for `prompt-13-after-landing-*`; `prompt-15-landing-full` (uses it) differed by 19–39 px.
- Landing vs baseline (`VF/pxcap2.mjs`, production, reduced motion, 1440 / 768 / 390, `landing:load-all`, 38 frames covering 11–15 scroll positions per width): **31 identical; 7 differ by ≤1/255 in 27–50 px in the nav band at 390**. The baseline against itself shows the same 7 frames; Pass A against itself shows 0. **Landing unchanged.**

### 2.9 Real backend run (`VF/realflow.mjs`, dev server proxying to the API)
Stack: `node src/index.js` + `npx inngest-cli@1.46.0 dev` started here; keys present (OpenAI, Pinecone, index name set; `GITHUB_TOKEN` empty, so GitHub calls are unauthenticated). Landing hero → `/workspace?repo=…` prefilled and focused `#repo`.

UI timeline, Wiki and Index started back to back for `octocat/Spoon-Knife`:

| t | Wiki panel | Index |
|---|---|---|
| +1.8s | "Generation is still running" (before first poll; unavailable-activity text shown) | idle |
| +2.1s | Queued | pending |
| +4.1s | Repository (Queued ✓) | pending |
| +6.0s | Outline | pending |
| +10.3s | "Generating chapter 1 of 2" | **succeeded** |
| +14.1s | "Generating chapter 2 of 2" | succeeded |
| +24.2s | "Wiki is ready" | succeeded |

Real API: `POST /api/wiki` 202 `{jobId,status}`; polls `{status:"pending",repo,progress:{stage}}` through `queued`, `fetching_repository`, `planning_outline`, `generating_chapter{chapter,totalChapters}`; completed `{status,repo,generatedAt,chapters[]}` (2 chapters). Index completed `{status:"completed",fileCount:3,chunkCount:3,saved:true,truncated:false}` (12 + 5 polls total). All match `src/routes` and `jobStore.js`; the UI shows only these fields. "Open wiki" → reader with "Generated just now" chip, model-output caveat, URL `/wiki?jobId=…#chapter-1`. Console clean.

Error shapes: 400 `{error}`, 404 `{error:"job not found"}`, failed `{status:"failed",error}` are all handled.

**The 502**: with the stack up, the live Chat test passes. With the API stopped, `POST /api/index` through the dev proxy returns **502** and `GET /api/health` 502 (reproduced). So Codex's 502 was a backend that was not running (local setup), not a code bug. With the API up but Inngest down, Express returns an **HTML 500 page** (`TypeError: fetch failed`): see defect 3.

### 2.10 Workspace states (`VF/wsstates.mjs`, `VF/idxstates.mjs`, shots `VF/shots/ws/`)
Looked at: idle, invalid, submitting (3s slow POST), pending-queued, pending with chapter count, concurrent Wiki + Index pending, succeeded, job-failed, network error, rate limit (429), poll not-found (404), server 500, 502, Index succeeded / truncated / not saved / zero files / failed, and the disabled Index button with its reason (inline text "Enter a valid repository first"). At 1440 and 390 for all; 1280, 768, 360 for idle, invalid, pending and concurrent.

Honesty scan of rendered `main` text over every state and width: **no percentages, ETA, "estimated", "remaining", progress bars, Cancel or Resume.** Only matches: the negative sentence "No percentage or completion estimate is available." and the Wiki zoom label (`100%`, see 2.11; a zoom level, not job progress). Source grep agrees (`MermaidDiagram.jsx:169` is the only `%`). The pending activity hairline is `aria-hidden` and looks like an indeterminate sweep, not progress.
`docs/workspace-copy.md`: 64 strings, 63 found verbatim; the 64th is built from JSX pieces (`<strong>` counts). Dynamic claims backed by the API: stage labels, chapter `n of m`, `fileCount`, `chunkCount`, `saved`. The "200 eligible files / 200 KB" help text is correct (`src/service/github.js:42-48,98-103`). Not supported: the `truncated` sentence (defect 8) and the "notification headings" (defect list, discrepancy 6).

### 2.11 Wiki reader (`VF/wikireader.mjs`, `VF/dbg*.mjs`, shots `VF/shots/wiki/`)
Passing: chapter click/arrow/Home/End/wrap and focus follow; rapid next,next,prev ends consistent (title, `aria-current`, one SVG); diagram text follows the chapter (latest render wins); `#chapter-3` deep link; visited marks; reading-progress hairline (`scaleX 0 → 0.10`); heading-based TOC (with a chapter that has `##`/`###`: 3 headings = 3 TOC items, scroll-spy `aria-current="location"`; chapters without headings show "No section headings in this chapter."); source links `https://github.com/octocat/Spoon-Knife/blob/HEAD/README.md` with `target=_blank rel="noopener noreferrer"`, copy path works; Copy Markdown copies the chapter; Copy Mermaid source copies the definition; Expand: exactly **1** mermaid SVG before / during / after, it moves into the dialog and back, Esc closes, focus returns to the trigger; Download SVG: `architecture-diagram.svg`, 14,354 B, valid SVG (root `svg`, correct namespace, 5 nodes); generated wiki via Workspace: arrival chip + header animation; caveat "…may contain errors" visible at all 7 widths; mobile 390 and 360: chapters Sheet from the fixed bottom bar, selection closes it, Details disclosure opens, no horizontal scroll. The four Mermaid contract tests in `wiki-reader.spec.js` pass; their assertions are unchanged except locators (diff in 2.1).
Failing: wheel zoom (defect 2), stray SVG after a render failure (defect 5). Render-failure fallback itself works: error message + copyable source, then recovers on the next good chapter (no stale error, because `MermaidDiagram` is keyed by `chapter.mermaid`).

### 2.12 Quality sweep (`VF/sweep.mjs`, production)
6 routes × 1440 / 390 × first + revisit: console errors/warnings **none**, failed or 4xx requests **none**, CLS **0 / 0** everywhere. Chat and Architecture vs baseline, full page, reduced motion, 1440 and 390 (`VF/chatarch.mjs`): **4 of 4 pixel-identical**. Secrets: no key/token patterns in the Pass A diff; `.env` is git-ignored and untracked. Toast, route-change and shell regressions from my earlier shell pass: none seen.

---

## 3. Defects (ranked)

### Critical
None found.

### Major
1. **Keyboard focus is dropped to `<body>` after activating "Generate Wiki" or "Index Repository".** Tab to the button, press Enter: focus goes to `BODY` within 50ms (instant mocks) or within 1.2s (600ms responses) and stays. Cause: the kit `Button` returns a different element tree when `disabled && disabledReason` (`Button.jsx` wraps in `Tooltip` + extra span), so React remounts the button when the job goes pending. `web/src/pages/Home.jsx:132,139` trigger it. Expected: focus stays on (or returns to) the button, or moves to a deliberate target. Repro: `VF/focusloss.mjs`.
2. **Diagram wheel zoom does not work with real wheel input.** `MermaidDiagram.jsx:115` uses React's `onWheel` with `preventDefault()`; React registers wheel passively, so Chrome scrolls the page (observed −300px, `cancelable:false`, target = whatever ends up under the pointer) and the diagram stays at `scale(1)`. A synthetic cancelable event logs `Unable to preventDefault inside passive event listener invocation`. Button, keyboard and drag-pan work (drag pans are clamped to ±72px at 100%). Not covered by any test (`wiki-experience.spec.js:25-47` uses buttons and keys). Expected: native non-passive wheel listener on the canvas. Repro: `VF/dbg2.mjs`–`dbg6.mjs`. Verified through Chrome's input pipeline, not a physical mouse.
3. **Raw HTML shown as the error message when the API cannot reach Inngest.** Express returns a `text/html` 500; `api.js` uses the body text, so the Workspace error panel and toast print `<!DOCTYPE html> … <pre>TypeError: fetch failed</pre> …` (149 chars, both 1440 and 390). `web/src/api.js` (unchanged) + `Home.jsx:26-31`. Expected: a short message such as "The service returned an unexpected error (500)". Repro: stop `inngest dev`, submit; `VF/inngestdown.mjs`, shots `VF/shots/ws/inngest-down-html-error-*.png`.
4. **A failed status check is reported as "Wiki generation failed".** After 3 failed polls (network blip, or 404 after a server restart) the Live panel title is "Wiki generation failed" and shows the 200-file help text, although the API never said the job failed (`Home.jsx:60,70`). A 404 poll also shows the raw lowercase `job not found` (the friendly 404 copy only runs on submit) with a "Retry status check" that cannot succeed because in-memory jobs are gone. Violates the "only what the API returns" rule.
5. **A Mermaid parse failure leaves a stray node in `<body>`.** `mermaid.render` leaves `div#dmermaid-…` with an error `svg#mermaid-…` outside `#root`; it persists after switching to a good chapter, so the document has 2 mermaid SVGs and a blank gap under the footer (repro: chapter with `A[[[ broken -->`, `VF/dbg1.mjs`, `VF/strayshot.mjs`, shot `VF/shots/wiki/stray-svg-bottom.png`). Breaks the "exactly one SVG" contract on the failure path. `mermaidRuntime.js:25` / `MermaidDiagram.jsx:145`. (Baseline comparison was inconclusive, so it may predate Pass A.)
6. **Route-change focus is lost on the generated Wiki.** "Open wiki" focuses the *pending* page's `h1`; when the job resolves the reader replaces it and focus falls to `BODY`; the reader h1 is never announced. Instant and 700ms-delayed job responses both reproduce (`VF/openwiki.mjs`). The static sample route and `/wiki` entry focus correctly. `RouteViewport.jsx` + `Wiki.jsx:72-78`.

### Minor
7. Index panel shows a green "Succeeded" pill when `saved:false` ("processed but not saved") (`Home.jsx:36`).
8. The `truncated` sentence says "large source content truncated to service limits"; the backend means the file list was capped at 200 or the GitHub tree was incomplete (`github.js:70-100`).
9. Over-announcement on failure: `role="alert"` message + sr-only live text + toast all announce.
10. The "Generated diagram / Expand this chapter's diagram" button in the context rail stays when the diagram failed; it does nothing (`WikiReader.jsx:165`).
11. App nav active item is indistinguishable in forced-colors (pill is a background).
12. `Wiki.jsx:28` copy `generating...` (lowercase, ASCII dots); the "Chapters" sheet shows its title twice.
13. Fixed mobile bar covers the top of the chapter heading on first view at 390.
14. `Wiki.jsx:13` dead `WikiReader` re-export; dead `EmptyState`, `JobSkeleton`, `PageHeading`, and the now-orphaned `ui/skeleton.jsx`.
15. Test quality: `[data-sonner-toast]` assertions in `wiki-reader.spec.js:109,160` are vacuous now; `perf-mount.spec.js` asserts nothing; `contrast.spec.js` checks only one button's outline; `axe-routes.spec.js` covers one viewport and not the `/wiki` entry state; `visual-stability.spec.js` is flaky (above); `landing.spec.js:53` is flaky on every build.

---

## 4. Discrepancies (Codex's report vs reality)

1. **"Controlled captures pass a ≤32-pixel gate."** Failed 2 of 3 of my runs (37 px). The gate also measures determinism, not regressions.
2. **Suite status.** Codex's notes list six first-run failures and a 10/10 targeted rerun and never mention `landing.spec.js:53`, which fails 88% on the dev server (and about 40–50% on production builds, including baseline).
3. **"Generated `wiki.spec.js` passed."** The baseline test was a *live* generation flow (Workspace → real job → reader → chapter switching, asserting the diagram text changes). It was replaced by a mocked test and the "diagram content changed" assertion was dropped. That is lost live coverage, undisclosed. `sample-wiki.spec.js` also lost the dialog `top === 24` check.
4. **"No before/after bundle claim is possible."** It is possible; numbers in 2.1 (main gzip JS −9.7 kB, CSS −7.1 kB).
5. **"Cursor-centred wheel zoom."** Does not work with real wheel input (defect 2).
6. **`docs/workspace-copy.md` lists "Wiki is ready" / "Repository index is ready" as notification headings.** No completion notification exists; the labels are passed to `useJobNotifications` and ignored. "Successful Wiki and Index notification headings" is therefore untrue.
7. **Expand via reparenting keeps exactly one SVG.** True while healthy; false after a parse error (defect 5).
8. **Undisclosed change:** `RepoDemoInput.jsx` dropped the hero → Workspace View Transition handoff (now a plain `navigate` with `state.focus`). It is defensible (I measured View Transitions dropping clicks), but it is not in the notes. The `useJobPoll` retry change to a fixed 2s is disclosed.
9. **`/dev/ui` "actual reduced-motion override."** Real for some JS paths, not for others (2.7).
10. **"`:has()` footer fallback."** Present but inert (2.7).
11. **"The Chat 502 … remains unverified."** It is explained: the API was not running (2.9).
12. **"Firefox could not launch."** Accurate; root cause is a Windows side-by-side error on `mozglue`, not a download problem.
13. Accurate as claimed: lazy anchors, mount numbers (within ~10%), axe, label-in-name, sonner removal, migration, Wiki 82rem frame with 46rem reading column, concurrent Wiki and Index, branded Mermaid, expand/copy/download, WebKit smoke, CLS 0.

---

## 5. Leftovers for the next pass

| Item | Suggested direction |
|---|---|
| Wiki 4× mount (323 ms first, 142 ms revisit; targets unmet) | Mermaid ELK chunk is the top cost: confirm why `elk` loads for `graph TD` (set the renderer/layout explicitly or avoid the ELK registration), then render in an idle/`startTransition` slice or behind an `IntersectionObserver`; consider SVG pre-rendering. |
| Workspace 4× first mount 136 ms; Architecture 589 ms | Split main-bundle module evaluation; defer GSAP setup; Architecture needs its own pass. |
| Focus loss after button activation (defect 1) | Keep one stable button element in `Button`; render the disabled reason without changing the tree. |
| Wheel zoom (2) | Attach a native `wheel` listener with `{passive:false}`; add a wheel/pinch e2e test. |
| Error text (3, 4) | Normalise non-JSON bodies; split "status check failed" from "generation failed"; handle poll 404 as "job no longer exists". |
| Stray Mermaid node (5) | Remove `#d${id}` after a failed render; add a contract test for the failure path. |
| Route focus (6) | Re-target focus when a route's heading is replaced by async content. |
| Test stability | Fix `landing.spec.js:53` (wait for tab positions to settle); make the visual gate compare against a baseline, not itself; restore a live Wiki generation e2e. |
| Firefox | Fix the host (reinstall the Windows App Runtime / newer Windows, or test on another machine); keep the smoke spec. |
| Misc | Defects 7–15 above; consider real `hashchange` support for chapter deep links. |

---

## 6. Manual steps for the owner

1. **Backend for live tests:** two terminals, `npm run dev` and `npm run dev:inngest` (root `package.json`); keys must be set in `.env` (OpenAI, Pinecone, index name). `GITHUB_TOKEN` is empty, so GitHub rate limits will apply. Then `cd e2e; $env:BASE_URL='http://127.0.0.1:5173'; npx playwright test`. The live Chat test needs both services; without the API you get the proxy 502.
2. **Real devices and browsers:** Safari (macOS/iOS), Firefox on a machine where it launches, Android Chrome (touch drag of diagrams and sheets, vertical page scroll over a diagram, maskable icon).
3. **Screen readers:** NVDA + Chrome and VoiceOver + Safari through Workspace (invalid field, both jobs, completion, failure) and the Wiki reader (chapters, TOC, expand, sheets). Pay attention to defects 1, 6 and the triple announcement.
4. **OS settings:** Windows high-contrast themes, reduced motion, reduced transparency; check the nav's active item.
5. **Physical wheel / trackpad pinch** on a diagram, to confirm defect 2 outside Chrome's emulated input.
6. **Judgment calls:** whether the hero → Workspace handoff should regain a View Transition (it blocks clicks for about 450ms), and whether a green "Succeeded" for `saved:false` is acceptable.
