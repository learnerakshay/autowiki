# Pass B independent verification

Verifier: Claude (independent of Codex). Date: 2026-10-15. Verified commit: `898f21c` ("Rebuilt Chat and Architecture; fixed leftovers; verification partial"). Compared against baseline `4f21681` (Pass A).

**Brief vs reality:** the brief said Pass B was uncommitted. It is **committed** as `898f21c` and the working tree was clean (`git status` empty); `git diff 4f21681` is therefore the diff of that commit (89 files, +1971/−2386). Nothing in the repo was edited except this report. Test runs happened in throwaway worktrees (removed afterwards); scripts and screenshots are in the session scratchpad, outside the repo.

Method: system Chrome 155 via Playwright; Playwright WebKit (not Safari); production builds of both commits built into temp dirs (`vite build --outDir`) and served by throwaway servers; a dev server from the HEAD worktree; the user's already-running API + Inngest (5555/8288, real OpenAI/Pinecone keys, empty `GITHUB_TOKEN`). A second throwaway API (port 5556, Inngest URL deliberately dead) produced the real Express HTML 500. Firefox: not attempted (known `spawn UNKNOWN` on this host) → COULD NOT VERIFY.

---

## 1. Verdict table

| # | Claim | Verdict | Evidence (one line) |
|---|---|---|---|
| 1 | Focus fixed (Generate/Index buttons, pending→reader) | **VERIFIED** | Real keyboard on the real stack: same DOM node and still focused 3 s after Enter on both buttons; "Open wiki" lands focus on the reader `h1`; pending→reader moves focus to `h1` only if it was inside pending, not stolen from `body`. |
| 2 | Error normalisation | **VERIFIED** | Real HTML 500 (Inngest down), 404 poll, 503-HTML poll, failed job with HTML message: no raw HTML/stack/lowercase "job not found" in panel, toast or live regions; "generation failed" only for API-reported `failed`; 404 → Start over, no Retry; 5xx → Retry status check. |
| 3 | Mermaid failure cleanup + latest-render-wins | **VERIFIED** | 5 different broken definitions: 0 stray nodes in `<body>`, 0 SVG, no Expand button, source fallback shown; 9 mixed good/bad chapter switches and a rapid 7-click burst end on the right diagram, ≤1 SVG. |
| 4 | Real wheel zoom | **VERIFIED** (Chrome input only) | Plain wheel scrolls the page (1290→1530), Ctrl+wheel and ⌘(Meta)+wheel zoom (1→1.82→3.32, page does not scroll), expanded view zooms on plain wheel and clamps at 1. No physical device. |
| 5 | Succeeded pill never with `saved:false` | **VERIFIED** | `saved:false`, `saved` missing, `saved:false+truncated` → grey "Finished, not saved"; green "Succeeded" only for `saved:true`. |
| 6 | Forced-colors nav active state | **VERIFIED** (emulation) | Active item has a 2 px solid border (others 0) on Workspace, Chat, Architecture, Wiki, and the 390 px menu. |
| 7 | Reduced-motion toggle stops GSAP, spring and route motion | **PARTIAL** | OS `prefers-reduced-motion` works. The dev toggle (`html[data-reduced-motion]`) cuts landing scroll motion 174→21 changed elements and matches OS behaviour on route changes, but CSS animations keep running: peak 28–40 document animations vs 6 under OS reduce, 5–10 still running at end vs 0. |
| 8 | Architecture long tasks 0 ms at 1× and on revisit; 135/145 at 4× first | **PARTIAL** | 1× first/revisit 0/0 ✓; 4× first 147/148 ✓ (within 9%); **4× revisit 56/61, not 0** (Codex 0/0). Cost really removed: zero long tasks while scrolling, in the 2 s after each section mounts, and during node/tab interaction. |
| 9 | Sample Wiki 4× first 313→202 (target 150) | **VERIFIED as measured, goal missed, cost deferred** | I get 324→213 (target 150 still missed). ELK/Mermaid no longer load on mount ✓, but the 324 ms (4×) / 53 ms (1×) task now lands on first scroll to the diagram; session max long task unchanged (327→324). |
| 10 | Landing has no regression | **VERIFIED** | 5 runs 4× first: Pass B 170/173, baseline 173/**248** — the 250 ms spike is noise (the baseline produces it too). Anchors land at 72 px with 0 CLS in 8/8 first clicks at 4×. Pixels vs baseline are within the capture noise floor at 1440/1024/390. |
| 11 | Visual gate fails on real regressions | **PARTIAL** | Control passes 5/5. Fails on 12 px shift (41,843 px), 1 px shift (2,420), icon opacity (830), hero opacity (59,901), h1 colour (35,133), footer link colour (2,810). **Passes** an h1 colour lightened ~+16–31 per channel and a 1 px logo shift. Dev server fails by 2,111 px (gate flaw, §4). |
| 12 | Full suites 79/1/2 then 77/3/2 | **NOT REPRODUCED (better)** | Mine: 83 tests, **80/1/2 in both runs**, per-test outcomes identical. The one failure is the dev-server visual gate. |
| 13 | Every changed test is disclosed | **PARTIAL** | Most are; undisclosed items in §3. |
| 14 | No backend / no new dependencies | **VERIFIED** | `git diff 4f21681 -- src package.json */package*.json` is empty. `api.js` does more than error normalisation (also rejects non-object 200 bodies, sanitises failed-job messages). |
| 15 | Chat states and honesty | **VERIFIED** (one nit) | All states behave (see §6). |
| 16 | Architecture diagram and layout | **PARTIAL** | Edges/arrowheads/sync/keyboard ✓; but label collisions, dead grid space ≥1100 px, illegible backbone titles, and **a blank page in WebKit** (§5). |
| 17 | Legacy CSS deleted; index.css has no page CSS | **VERIFIED** | No `.chat-*`, `.wiki-pipeline-*`, `.wiki-stage-*`, `.architecture-*` selectors or references remain; `index.css` = skip-link, shell-boot, brand, file-glyph. 8 unreferenced rules survive in `legacy-landing.css`. |

---

## 2. Defects (ranked)

### Critical
1. **`/architecture` renders a blank page in WebKit (Safari, all iOS browsers).** `web/src/pages/Architecture.jsx:40–43` calls bare `requestIdleCallback` / `cancelIdleCallback` inside `useEffect`; every other call site is feature-checked. Playwright WebKit: `ReferenceError: Can't find variable: requestIdleCallback`, h1 count 0, body text length 0. Baseline `4f21681` renders in WebKit (h1 1, 7,096 chars). **Regression introduced by Pass B.** Simulating a browser without rIC in Chrome reproduces it (`requestIdleCallback is not defined`). The WebKit cross-browser smoke does not cover `/architecture`, which is why it was missed.

### Major
2. **Edge labels collide in the flagship diagram** (all desktop widths 900–1920). `fetch files`, `generate / embed`, `upsert / query` are drawn at the same spot (50–70 × 14 px overlaps, each line passes through the other two labels) and `persist Wiki` overlaps `result / failure`. Label position comes from `middle` in `web/src/lib/architectureGraph.js`. The unit test only checks edges vs node interiors, so it cannot see this.
3. **Backbone stage titles are illegible.** `Submit / Dispatch / Execute / Poll / Settle` render `rgb(47,69,64)` on the dark surface (≈1.6:1, my estimate); axe does not flag it. The caption "Structure only—not live status or timing." touches the first step circle (caption bottom 24 px = circle top 24 px), the first step's text sits 16–33 px lower than the others, and the connector runs past step 05 into empty space. `web/src/pages/architecture.css` (`.arch-backbone`) / `components/pipeline/pipeline.css`.
4. **"Dead grid space is gone" is false at ≥1100 px.** `.arch-overview` is two columns with `align-items:start`; with the default Inngest node selected the detail panel is 1,293 px tall against a 612 px canvas, leaving ≈680 px empty under the canvas at 1440 and 1920. (Wiki/decisions columns leave 41–162 px; ≤1024 stacks cleanly.)

### Minor
5. Live Wiki E2E (`E2E_LIVE=1`) failed 2 of 6 attempts. Cause: the model emitted a Mermaid with labels like `B[<head>]`; the backend marks it `diagramValid:true` (regex on the first token only, `src/service/wiki.js:171`), the browser cannot render it, the reader correctly shows the fallback, and the test's `toHaveCount(1)` waits 120 s. Same behaviour on the baseline build. Pre-existing product weakness plus a brittle live test.
6. Reduced-motion dev toggle leaves CSS animations running (see claim 7).
7. RAG tab switch moves content below by 27 px; under normal motion, stage/decision switches log layout-shift entries of 0.001–0.015 (0 under reduced motion).
8. Main JS grew: 286,543 → 317,408 B (gzip 91,275 → 101,196, +10.9%); CSS shrank 118,102 → 69,198 B (gzip 23,378 → 15,665, −33%).
9. Architecture lost its in-page "Skip to architecture" link and the `Interactive AutoWiki system overview` label (global skip link remains). "Explore the system" moves the viewport to `#system-overview` but `document.activeElement` is `body`.
10. `legacy-landing.css` carries 8 unreferenced rules (`landing-loading`, `job-reference`, `result-grid`, `preserve`, `animate-spin`, `animate-pulse`, `product-window__bar-actions`, `product-window__label`).
11. 360 px sample Wiki: a button and chevron inside `main` extend past the viewport edge (document itself does not overflow).
12. Chat nits: "Answer settled" appears twice in the mini-visual; the answer card is narrower than the composer; a bare owner (`octocat`) is not flagged inline (Ask stays disabled with a reason); the caveat sits after the answer body (y≈1473 vs heading y≈1006 at 1280×900), not above the fold on long answers.
13. `e2e/playwright.config.js` now hard-codes `C:\Program Files\Google\Chrome\Application\chrome.exe` as the default browser.
14. Three `e2e/test-results/*` files are tracked in git (also at `4f21681`, so not new).

---

## 3. Where Codex overstated or omitted

**Overstated**
- "Architecture … dropped to 0 ms … on revisit": 4× revisit is 56/61 ms here (baseline 344/360). Only 1× revisit is 0.
- "Wiki 313→202 at 4× first": true for the mount window, but the same long task simply moves to the first scroll to the diagram (324 ms at 4×, 53 ms at 1×). Total worst long task in a session is unchanged.
- Chat 4× first "175→160": I see 187→188 (no improvement beyond noise).
- Landing "250 worst, no-regression not established": it is established — the baseline gave 248 in 5 runs; Pass B 5-run worst is 173.
- Architecture "commit-graph hero / dead grid space gone": see defects 2–4; label collisions and illegible backbone titles are not mentioned anywhere in `pass-b.md`.
- "Safari … unverified" is listed as manual work, but a WebKit check Codex already had available would have exposed defect 1.
- The visual gate "now fails on real regressions": true for visible changes, but it passes small colour shifts, and the "calibrated" baseline only works against a production build.

**Omitted from the disclosure list**
- `e2e/playwright.config.js`: hard-coded Chrome path default and a new `snapshotPathTemplate`.
- `.impeccable/review/*` capture outputs dropped from `chat-ui`, `prompt-13-visual`.
- `chat-ui.spec.js` failed/unknown job: `getByRole('alert')` replaced by `.qa-error` (the role assertion is gone; partially covered by "removed duplicate alert").
- `visual-stability.spec.js`: the "Uncontrolled mismatches" diagnostic log was removed, and a test-only `E2E_STYLE_REGRESSION` hook was added to a committed test.
- `perf-mount`, `contrast`, `axe` additions are disclosed; their effect is fine.
- 22+ specs now `scrollIntoView` before counting SVGs. Disclosed in aggregate ("healthy diagram waits"), but it encodes the deferred-render behaviour into every test.

**Disclosed and confirmed:** the 32 px → 100 px / threshold 0.1 change; the Firefox and live Wiki skips; the Pass A 24 px dialog-top assertion not restored (the expanded diagram dialog now sits at top 45 px at 1280×900, 30 px at 1280×600, all inside the viewport at 1280×900/1280×600/768×1024/390×844/360×640); toast/sonner selector replacements; copy-locator scoping; no assertion removed in `landing.spec.js`, `workspace.spec.js`, `wiki-reader.spec.js` beyond what is listed.

---

## 4. Evidence

### 4.1 Scope and honesty
- Deleted: `EmptyState`, `ErrorNotice`, `JobSkeleton`, `JobStatus`, `PageHeading`, `ui/{badge,card,input,label,skeleton}`, `useJobNotifications` (all confirmed unreferenced). Added: `architectureGraph.js`, `ArchitectureSections.jsx`, `architectureShared.jsx`, `architecture.css`, `chat.css`, `legacy-landing.css`, two Pass B specs, `tests/uiContracts.test.js`, `review-pass-b.mjs`.
- Secret scan of the diff (OpenAI/Pinecone/GitHub/AWS/bearer/PEM patterns): no hits. `.env` untracked.
- `src/` and all `package*.json`: no diff.

### 4.2 Performance (production builds, 1440×900, reduced motion, CDP CPU throttle, max long task per run, median/worst ms, 3 runs; same harness for both builds)

| Route / condition | Baseline 4f21681 (mine) | Pass B (mine) | Codex before → after |
|---|---|---|---|
| Landing 1× first | 0/0 | 0/50 | 0/0 → 0/0 |
| Landing 4× first | 176/208 | 172/172 | 165/169 → 170/250 |
| Landing 4× first, 5 runs | 173/248 | 170/173 | — |
| Landing 4× revisit | 93/99 | 92/122 (5 runs: 93/138) | 90/94 → 87/92 |
| Workspace 4× first / revisit | 137/142 / 0/0 | 141/143 / 0/0 | 126/130 → 125/126 / 0 → 0 |
| Sample Wiki 1× first | 53/54 | 0/0 | 53/53 → 50/53 |
| Sample Wiki 4× first | 324/421 | 213/224 | 313/313 → 202/205 |
| Sample Wiki 4× revisit | 142/155 | 70/71 | 126/131 → 65/65 |
| Chat 4× first / revisit | 187/195 / 58/58 | 188/208 / 0/0 | 175/176 → 160/164 / 52/53 → 0/0 |
| Architecture 1× first / revisit | 102/105 / 55/55 | 0/0 / 0/0 | 95/98 → 0/0 / 50/51 → 0/0 |
| Architecture 4× first | 587/608 | 147/148 | 553/557 → 135/145 |
| Architecture 4× revisit | 344/360 | 56/61 | 331/341 → **0/0** |

CLS: 0 in every run. Reproduces within ~10%: all baseline numbers, Workspace, Sample Wiki first/revisit, Architecture 4× first. Does not reproduce: Architecture 4× revisit, Chat 4× first improvement, Landing 250 ms spike, Wiki 1× first (mine is 0 at mount).

**Whole-session accounting at 4×** (mount 1.5 s, then a step scroll of the full page, 2.5 s settle, then interaction):

| | Baseline | Pass B |
|---|---|---|
| Architecture mount max / sum | 589 / 693 | 144 / 318 |
| Architecture scroll, each section's 2 s after mount, node/tab interaction | 0 | 0 (5 sections mounted at 3.7–7.0 s, 0 long tasks, 0 CLS) |
| Sample Wiki mount max / sum | 327 / 1,554 (11 tasks) | 210 / 513 |
| Sample Wiki scroll to diagram | 0 | **324 max, 838 sum** (Mermaid + ELK load) |
| Sample Wiki chapter interaction | 178 / 578 | 163 / 283 |
| Sample Wiki session max / sum | 327 / 2,130 | 324 / 1,634 |

Verdict on Architecture: cost **removed** (sub-50 ms slices, nothing deferred into a long task). Verdict on sample Wiki: total work reduced about 23%, worst task **deferred**, not removed; ELK is no longer requested on mount (first requested at ≈3.3 s, when the diagram nears the viewport at 1440×900; a taller viewport that shows the diagram on mount would load it on mount).

Anchors (4×, first click, normal and reduced motion): How it works / Chapters / Features / Pipeline all land at 72 px (71 once), drift 0, CLS 0, on both builds.

### 4.3 Visual gate
- Landing pixel comparison needs a noise floor: in one early pass baseline-vs-baseline differed by 1.2 M px at 1440 and head-vs-head by 352 k px at 390 (two of twelve captures, both builds). An 8-capture matrix then showed pairs differing 0–51 px (≤24 px above one channel level) regardless of build; 1024: baseline vs Pass B 0 px; 390: all 0 except one 40 px capture. Committed golden vs one Pass B capture: 0 px. **Landing pixels unchanged at 1440, 1024, 390 within noise.** The occasional mass-diff capture also means the gate could fail spuriously; it passed 5/5 here.
- Dev failure (2,111 px, reproduced exactly twice): diff is confined to y≈6,980–7,080 (pipeline step numbers and six labels). DOM, computed styles and fonts of all 65 pipeline elements are identical between dev and production; the crops look the same. It is glyph anti-aliasing of composited text (the labels carry a leftover `transform: matrix(1,0,0,1,0,0)`), i.e. a **gate flaw / environment difference, not a product defect**. The gate is only valid on a production build.
- Gate sensitivity table above (claim 11). Tolerance `maxDiffPixels:100, threshold:0.1` hides 1 px shifts of small elements and low-contrast colour shifts.

### 4.4 Test suites (dev server 5190 from a HEAD worktree, API + Inngest + keys present)

| Run | Passed | Failed | Skipped |
|---|---|---|---|
| 1 (7.1 min) | 80 | 1 | 2 |
| 2 (7.2 min) | 80 | 1 | 2 |

Per-test differences between runs: **0**. Classification: `visual-stability.spec.js:4` on dev = **test/gate flaw** (dev vs production rendering, not a product defect); Firefox smoke skipped = **environment**; live Wiki skipped = opt-in (`E2E_LIVE`). `landing.spec.js:53`: 10/10 on dev, 10/10 on production. Live Chat (`chat.spec.js`) passed in both full runs and a third time (13.1 s, 14.1 s, 11.1 s) against the real backend. Live Wiki (`E2E_LIVE=1`): 4 of 6 attempts passed (≈23 s); 2 failed at `wiki.spec.js:45` for the reason in defect 5 (test brittleness + pre-existing backend validation, not a Pass B product defect). Also run: `npx oxlint` clean; production build OK; unit tests were not re-run by me.

### 4.5 Phase 1 probes
Scripts: focus (real stack, 3 real generations + 1 real index, all completed in ~25 s), errors (above), wheel, Mermaid. Console errors: none in any of them; no page errors.

### 4.6 Chat (production build, mocked API for determinism, plus real-backend focus run)
- Idle: Ask disabled, described by "Enter a repository and a question"; index guard card shown (always, before any request).
- Validation: `bad owner/repo`, extra path segments, SSH URL, `../../etc/passwd` → `aria-invalid`, inline message "Repository names cannot contain spaces."; URL with `.git` normalised; Ask reason updates ("Enter a question").
- Suggestion chip fills the textarea and focuses it; 0 POSTs. Ctrl+Enter submits once, focus moves to Ask ("Answering…"). ⌘/Ctrl+Enter shortcut text shown.
- Loading: `Retrieve → Answer` shows "Indeterminate request"; "Index" is static; Retrieve is never marked done before a result; no %, ETA, estimated, remaining, Cancel/Resume, progressbar (scan of Chat in idle/pending/completed: 0 hits).
- Answer: Markdown + source chips (deduplicated), copy buttons put the path on the clipboard and raise a toast; chips are not links (the API returns no ref, so nothing is invented); caveat and "Model-generated answers may contain errors." visible; Copy Answer works.
- Not-indexed (exact backend sentence): guard heading, link `/workspace?repo=acme%2Fnoindex`; empty sources with an ordinary answer shows "No source paths were returned…" and not the guard.
- Error → Retry resends the original `{repo, question}` even after the draft was edited; focus moves to the answer heading. A second independent submission replaces the first (no stale answer during pending).
- Axe 0 violations and 0 horizontal overflow in all seven state families × 1920/1440/1024/768/390/360 (42 captures; I eyeballed 1280×900 idle, validation, loading; the rest by metrics).

### 4.7 Architecture
- Copy: `web/src/data/architecture.js` has **no diff**; all six limitations render verbatim in both builds (200 files / 200 KB, hyphen collision, fixed two-second polling, model-output caveat); "Pending is intentionally indeterminate" present. Changed page copy: "Skip to architecture" and one aria-label removed; "Structure only—not live status or timing." and the tab-list label "RAG workflow" added; inline "Copied / Copy failed…" replaced by toast text; uppercase labels now CSS-less (mixed case). All five section headings and ledes identical.
- Edges (real DOM, 1920/1440/1100/1024/900): 9/9 edges start at the `from` node and end at the `to` node (arrowhead at target), 0 cross a node, 0 gaps. ≤768 hides the SVG and shows an 8-item vertical node list (legible at 390, no overflow).
- Sync: hover/focus on nodes updates panel, `aria-pressed` and active edges together; connection list hover/focus highlights one edge without changing the panel; leaving restores. Arrow keys/Home/End move and focus; roving tabindex; group labelled "System components. Use arrow keys to move between nodes."; decisions list labelled and arrow-navigable (Home/End not supported); RAG tabs arrow/Home/End work.
- Motion: dash flow runs only while the canvas is in view (`data-in-view`), stops off-screen, and is off under reduced motion.
- Headings: h2 650 / h3 650 consistent; CTA icons centred (0 dy) at all widths. Overflow 0 at 1920/1440/1024/768/390/360.
- Tab order: 48 unique stops, no focus loss, no trap.
- Axe: 0 violations on Architecture at all six widths (but see defect 3, which axe misses).

### 4.8 Quality sweep
Axe (wcag2a/aa/21/22 + best-practice) after settling: Chat ×7 states, Architecture, Workspace, sample Wiki at 6 widths each: **0 violations**. CLS 0.0000 first and revisit (full-page scroll) for Chat, Architecture, Workspace, sample Wiki at 1440 and 390. Console/network: only the 500s I injected on purpose; no other failed request. Honesty scan on Architecture finds only the intentional negations (percentage/ETA/cancellation/resume, "Percentages and completion estimates are discarded", "progress metadata", "progress contracts").

---

## 5. Not tested
- Firefox (not attempted); real Safari/iOS (WebKit here is Playwright's Windows build); NVDA/VoiceOver/spoken announcements; a physical mouse/trackpad/touch; macOS ⌘ key on real hardware; real Windows high-contrast themes; real GPUs; a viewport tall enough to show the Wiki diagram on mount.
- Decisions disclosures at ≤768 px (my selector did not match); mobile Chat visuals only by metrics, not by eye; Workspace/Wiki visuals beyond axe/overflow/CLS.
- Performance after scroll at 1× for Architecture (0 at 4×, so not repeated); no CPU profile attributing the remaining Wiki/landing cost.
- Unit tests (`node --test`) were not re-run.
- `GITHUB_TOKEN` was empty; unauthenticated GitHub worked for ~6 jobs within the rate limit.

## 6. Fix list for the next pass
1. Guard `requestIdleCallback`/`cancelIdleCallback` in `Architecture.jsx:40–43` (reuse the helper pattern from `LazySection.jsx`); add `/architecture` to the WebKit smoke test; add an error boundary so a render error cannot blank the whole app.
2. Spread diagram edge labels (distinct anchor per edge, or label only the active edge) and extend `uiContracts.test.js` with label-label and label-node overlap checks.
3. Fix backbone title colour (`.arch-backbone .pipeline strong`) and spacing under the caption; align step 01; end the connector at step 05; add a contrast assertion for the dark surface.
4. Cap or restructure the overview detail panel (collapse the file list or make the canvas sticky) so no 680 px void remains at ≥1100 px.
5. Make the visual gate stricter (lower `maxDiffPixels`/threshold with region masks, or per-region tolerances), force it to run against a production build only, and document the occasional whole-page capture flake.
6. Make the dev reduced-motion toggle also gate the CSS animations (selectors on `html[data-reduced-motion]`), or drop the toggle claim.
7. Backend: validate Mermaid with the real parser (or at least reject `<`/`>` in labels) before setting `diagramValid:true`; make the live Wiki test tolerate a fallback diagram.
8. Disclose/undo the hard-coded Chrome path in `playwright.config.js`; remove the 8 dead rules in `legacy-landing.css`; untrack `e2e/test-results`.
9. Re-profile Wiki: the 324 ms Mermaid/ELK task on first scroll is the real remaining cost (prefetch on idle, or smaller layout engine).

### What you should do manually
- **Firefox** on a host where it launches: landing, Workspace, sample Wiki, **Architecture** (also check the removed `:has()` fallback).
- **Safari (macOS and iOS)**: confirm `/architecture` is blank before fix 1 and fine after; also wheel/pinch zoom on the diagram.
- **Screen readers (NVDA+Chrome, VoiceOver+Safari)**: one job-state announcement (should be a single message), pending→reader focus, Chat Ctrl/⌘+Enter and Retry, chapter sheet, diagram fallback.
- **Physical mouse/trackpad**: plain wheel scroll over the inline diagram, Ctrl/⌘ wheel and pinch zoom, expanded plain-wheel zoom, pan/fit, touch drag.
- Real **Windows High Contrast** themes (nav active item, node selection outlines).
- Set **`GITHUB_TOKEN`** locally before running the live Wiki/Chat/Index tests repeatedly.
