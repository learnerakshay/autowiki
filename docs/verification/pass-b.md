# Pass B verification

Date: 2026-10-15, Asia/Calcutta. Started 2026-10-14. Base: committed Pass A `4f21681`, with the user's independently verified `pass-a.md` read first. System Chrome 155.0.8059.40. UI implementation is complete for the principal flows; verification remains **partial**, with the explicit failures and unverified areas below. No commit, push, new project dependency, or backend behavior change. `web/src/api.js` only adds response/error normalization.

## Leftovers

| Request | Result | Evidence / limit |
|---|---|---|
| 1.1 stable Generate/Index button focus | Fixed | Same native node and focused element asserted after keyboard activation; stable unwrapped Tooltip/aria-disabled/described reason. `pass-b-leftovers.spec.js`. |
| 1.1 pending Wiki → reader focus | Fixed | Focus transfers once when it was inside pending; later focus is not reclaimed. Keyboard test passes. |
| 1.2 real wheel zoom | Fixed in Chrome input tests | Native passive:false listener; plain inline wheel scrolls, Ctrl wheel zooms, expanded plain wheel zooms. Mouse/trackpad hardware and macOS Command wheel unverified. |
| 1.3 response errors | Fixed | Non-JSON/HTML/status normalization; failed-job messages sanitized. HTTP contract unit tests cover 400/404/429/500/502. No raw response body in UI or aria. |
| 1.3 failed job / polling error / 404 | Fixed | Generation failed requires API status failed. Status check failed retries GET. Process-local missing job explains restart loss and offers Start over without Retry. |
| §3.7 saved:false | Fixed | Index Succeeded requires saved:true; false is neutral Finished, not saved. Wiki completion uses Generated. |
| §3.8 truncated copy | Fixed | Describes a limited file list: 200-file cap or incomplete GitHub tree, not truncated source content. Backend interfaces retained. |
| §3.9 triple failure announcement | Fixed structurally | One inline live region; duplicate alert/toast paths removed. Spoken output still requires NVDA/VoiceOver. |
| §3.10 dead Generated diagram action | Fixed | Hidden for invalid/failed definitions; source fallback shown. Error cleanup test passes. |
| §3.11 forced-colors nav | Fixed in emulation | Active aria-current item has a 2px system-color border. Chat/Architecture/Workspace captures retained. Actual Windows themes remain manual. |
| §3.12 pending wording / duplicate sheet title | Fixed | Generating…; only the overlay owns the mobile Chapters heading. Reader checks pass. |
| §3.13 mobile bar over heading | Fixed | Controls moved into flow, sticky beneath navigation. Closing geometry at 1440/390/360 reports no heading/toolbar overlap. |
| §3.14 dead primitives / re-export | Fixed | Removed orphaned EmptyState, JobSkeleton, PageHeading, JobStatus, ErrorNotice, input/label/card/badge/skeleton, notifications hook and dead WikiReader re-export. Landing Button/Radix Tabs have live consumers and remain. |
| §3.15 weak tests | Fixed/strengthened, with failures retained | Real kit toast selectors, actual diagram-label arrays, viewport-expanded axe, active nav checks, CLS/mount assertions. See full disclosure. |
| 1.4 stray Mermaid nodes / latest wins | Fixed | Failed render cleans its temporary body node; at most one SVG in viewer; stale cleanup results ignored. Explicit expansion loads deferred source and preserves node identity on return. |
| 1.5 reduced JS motion | Fixed in code; manual coverage partial | OS and dev override share subscriptions; GSAP, spring, carousel and route paths honor them. Gestures lose inertia/spatial transition under reduced motion; CSS uses 0.18s opacity. No screen-reader/device verification. |
| 1.5 :has fallback | Fixed by replacement | Explicit shell data-route-ready attribute replaces the inert fallback. |
| 1.6 Wiki first-visit mount goals | Partial | ELK deferred until viewport/user expansion, current layout retained; measured 1× 50/53 and 4× 202/205 miss targets. |
| 1.7 deterministic landing interaction | Fixed | 10/10 consecutive normal-motion runs, waiting for finite entrance animations/fonts before sampling tab coordinates. |
| 1.7 visual regression gate | Partial | Compares to a calibrated screenshot of committed Pass A source. Production control passes; deliberate regression fails. Dev suite consistently differs by 2,111 pipeline-text pixels. New baseline is uncommitted per instruction. |
| 1.7 live Wiki / mock content | Fixed coverage | Live generation test restored with E2E_LIVE=1 opt-in and explicit skip reason; mock asserts A/B → C/D labels. Live Wiki was not run. |
| 1.7 Firefox | Not fixed, intentionally | Owner Windows launch problem; smoke skipped with mozglue/spawn UNKNOWN reason. No host repair attempted. |

## Chat

Uses Page/PageHeader, raised Surface, mono TextField, autosizing TextareaField capped at eight rows, non-submitting suggestion Chips, Kbd, SkeletonText and stable Button. Ctrl/Command+Enter focuses Ask; Retry preserves submitted inputs and deliberately transfers focus to the answer heading when its button disappears. Ask another focuses the textarea. A newer request replaces the prior answer, and late older responses cannot relabel it.

The request exposes pending/completed/failed only. Retrieve/Answer share one indeterminate in-flight state; no retrieval completion is inferred. Index remains neutral. The no-index guard derives only from the exact no-vectors result in `service/rag.js`; empty sources alone do not imply no index. Workspace links prefill repo. Returned paths are copyable chips, Markdown uses CodeBlock and skipHtml, and the retrieved-files/model-output caveat is visible beside the answer. API returns no source ref, so no GitHub blob links were invented. Scoped chat.css replaces legacy Chat rules.

## Architecture

Uses kit tracks, headers, surfaces, tabs, disclosures, code blocks, chips and buttons, with a commit-graph hero. Computed orthogonal SVG routes avoid node interiors (independent unit assertion), real-direction arrowheads and data-backed labels. Node hover/focus and connection list share one active-id state. Keyboard arrows/Enter work; file chips copy with toast feedback. Canvas flow pauses when the actual canvas leaves view. Detail stacks at 1024; 768 and below uses a vertical node list.

RAG active content reveals through the shared spring; hidden heavy panes are not mounted. The asynchronous backbone reuses the landing pipeline controller and is explicitly structural, with both terminal branches and its warning. Decisions support arrows and mobile disclosures. Sections/code are split and mounted near the viewport with reserved geometry. All facts and limitations in architecture.js remain verbatim, including 200 files / 200 KB, namespace collisions, fixed two-second polling, model-output caveat and the Pending is intentionally indeterminate warning.

index.css contains foundation only. Existing landing rules were preserved in legacy-landing.css; obsolete Chat/Architecture/wiki-pipeline/wiki-stage rules and shell page overrides were removed. The design-system migration map and workspace copy are updated.

## Production performance

Isolated production builds of committed Pass A and the migration, same host/dependencies/Chrome, 1440×900, reduced motion, 3 runs for each route/CPU/visit. Each number is **median / worst maximum long task per run, milliseconds**, observed for 1.2s after navigation; this is not total work or a pure React render metric. Revisit reuses browser context/cache. Deferred work beyond the observation window is not counted. Raw rows: `pass-b-artifacts/before-metrics.json` and `after-metrics.json`.

| Route | 1× first before → after | 1× revisit before → after | 4× first before → after | 4× revisit before → after |
|---|---:|---:|---:|---:|
| Landing | 0/0 → 0/0 | 0/0 → 0/0 | 165/169 → 170/250 | 90/94 → 87/92 |
| Workspace | 0/0 → 0/0 | 0/0 → 0/0 | 126/130 → 125/126 | 0/0 → 0/0 |
| Sample Wiki | 53/53 → 50/53 | 0/0 → 0/0 | 313/313 → 202/205 | 126/131 → 65/65 |
| Chat | 0/0 → 0/0 | 0/0 → 0/0 | 175/176 → 160/164 | 52/53 → 0/0 |
| Architecture | 95/98 → 0/0 | 50/51 → 0/0 | 553/557 → 135/145 | 331/341 → 0/0 |

CLS: **0 in all 60 before and 60 after observation windows**. These measurements preceded the final small keyboard/ARIA/toolbar/explicit-expansion refinements; performance was not re-profiled after those refinements.

Architecture meets the measured 1×=0, 4× first≤250 and revisit≤150 goals. Wiki misses 1×=0 and 4× first≤150, though its 4× first maximum dropped 313→205 and revisit 131→65. Mermaid/ELK is deferred rather than switched to Dagre; remaining startup includes reader/Markdown/application code. No new attribution profile was taken, so the exact remaining contributor is unverified. Mermaid v12 bundles ELK as its default; see [official layouts documentation](https://mermaid.js.org/config/layouts).

Workspace shows no measured mount regression. Landing's 4× first median increases 165→170 and worst 169→250; the requested no-regression condition is **not established**. Do not dismiss the outlier as proven host noise; no attribution profile was taken. Landing revisits are 90/94→87/92.

## Verification results

- Final build and lint pass; large Mermaid chunk warning remains. Unit/contracts: **23/23**.
- Batched matrix: **42 Chat captures (7 state families × 6 widths) + 6 Architecture captures**, at 1920/1440/1024/768/390/360. Settled axe: **0 violations**; horizontal overflow: **0**; page errors: **0**. Raw matrix.json and PNGs retained locally. This covers the seven requested state families, not every error/copy substate at every width.
- Forced-colors emulation: active nav border **2px** on three app pages; screenshots retained. Keyboard checks cover Chat shortcut/retry/Ask another, Architecture node/tab/decision flow and Phase 1 button/pending-reader focus.
- Closing healthy-route sweep at 1440/390/360: **0 console warnings/errors, 0 page errors, 0 first-heading toolbar overlaps**. Chrome 155.0.8059.40. quality.json records results.
- Honesty scan: no numeric percent, estimated/remaining copy, progressbar role or Cancel/Resume controls in Chat/Architecture. The preserved Architecture negations necessarily contain percentage/ETA/cancellation/resume; they are not features or timing claims. Those mandatory facts were not deleted to manufacture a clean string scan.
- Landing production full-page comparison against an isolated build of committed 4f21681: **0 changed pixels above a one-channel-value tolerance** at 1440/768/390; dimensions match. This is not PNG byte equality. New calibrated PNG is saved under e2e/screenshots/pass-a-4f21681-landing-full.png; existing committed goldens depicting an older UI were preserved.
- Production snapshot gate: unmodified control **passes in 5.0s**. Test-only hero opacity regression **fails with 59,926 changed pixels**; closing page/removing env flag reverts it. Earlier background-regression proof was confounded by the control mismatch and is not counted as proof.
- Existing real-backend Chat integration **passed in 12.5s**, indexing public octocat/Spoon-Knife and asking its existing question through the running API/Inngest/OpenAI/Pinecone stack. Also passed in both full confirmations. GITHUB_TOKEN is empty; unauthenticated GitHub rate-limit risk remains. A first explicit live command was rejected by automatic approval review; inspecting the user's authorization and exact existing payload/provider path resolved it before the successful check.

### Full suites — not identical, not green

| Run | Passed | Failed | Skipped | Flaky |
|---|---:|---:|---:|---:|
| Confirmation 1 | 79 | 1 | 2 | 0 |
| Confirmation 2 | 77 | 3 | 2 | 0 |

Both contain 82 tests. Failure in both: dev-server visual gate, **2,111 pipeline-text pixels** versus calibrated production baseline. Additional second-run failures: Architecture's globally ambiguous Copy vectorStore.js locator (three legitimate chip instances), and Workspace navigation **ERR_NETWORK_IO_SUSPENDED** from Chrome. Thus identical results and a clean full suite were not achieved. JSONs and failure attachments are preserved as confirmed-suite-1/2.

The Architecture locator was then scoped to the intended detail pane. Closing targeted checks: **9 passed in 36.6s**, then **7 passed in 26.0s**, plus the SVG identity test. Final focus/ARIA/toolbar/explicit-expansion guards were checked in those targeted runs/builds, not by another full suite. The new expansion identity test increases the current suite beyond the 82-test full-run revision. Do not merge targeted passes into full-run totals.

The requested review/fix/confirm budget was exceeded while repairing fixture mismatches; interrupted attempts and additional targeted checks occurred. One complete broad review had 73 passed / 7 failed / 2 skipped before corrections. Initial sandbox checks also failed on localhost access (18/21 unit tests; browser network denial/timeout); the authorized localhost setup resolved those. These are not hidden green runs. No further full-suite loop was performed after the final failures.

## Test disclosure — replacements, loosenings, skips, removals

| Test(s) | Change and reason |
|---|---|
| visual-stability.spec.js, original three-session self-comparison | **Replaced** with source-based calibrated screenshot comparison. **Numeric/color tolerance changed** from ≤32 exact-channel self-differences to maxDiffPixels:100, threshold:0.1; this is a looser pixel/color tolerance but a stronger comparison target. It permits antialiasing differences. Dev control still fails; no tolerance was raised to hide 2,111 pixels. Baseline screenshot itself is new/uncommitted. |
| landing.spec.js “landing motion: tab swaps…” | Replaced moving-position sampling with font/finite-animation settled-state wait before coordinate sampling. Normal motion remains enabled. 10/10 consecutive runs. Assertions retained. |
| wiki.spec.js mocked chapter replacement | Restored previously dropped diagram-content coverage with actual node-label arrays A/B→C/D and stale-label exclusion, plus existing exactly-one-SVG assertions. No expectation removed. |
| wiki.spec.js new live generation flow | Restored opt-in live generation/chapter/diagram-change coverage. **Skipped** in full runs because E2E_LIVE is not 1; explicit reason names required services/env flag. |
| cross-browser.spec.js Firefox smoke | **Skipped** on owner's launch-broken Windows host with explicit mozglue/spawn UNKNOWN reason; no host fix attempted. WebKit smoke remains and passes. |
| wiki-reader.spec.js completed/mobile checks; chat-ui.spec.js secure-answer/responsive checks | **Replaced vacuous Sonner selector assertions** with actual .ui-toast checks. Their other security, source, focus and SVG assertions remain. |
| wiki-reader.spec.js pending and failed/unknown cases | Expected Generating… instead of generating..., Job not found instead of Wiki job unavailable, and Start over/no Retry for 404. This follows required UI honesty, not a weakened recovery assertion. |
| chat-ui.spec.js no-vectors and failed/unknown cases | Explicit no-index response now expects its guard/prefilled Workspace link. Actual failed/unknown messages target inline answer context rather than removed duplicate alert/toast paths. Added separate empty-sources-with-ordinary-answer coverage so empty sources cannot falsely claim no index. |
| workspace.spec.js concurrent jobs / terminal/network failure | Visible Index paragraph/error text explicitly scoped, avoiding its matching live announcement. Expected error text retained; duplicate alert role removed to honor one-live-region requirement. |
| architecture.spec.js explorer/copy/keyboard | Migrated selectors; copy feedback uses kit toast plus actual clipboard value. Copy locator scoped to intended detail panel after duplicate-path ambiguity. Keyboard/workflow/source assertions retained. |
| perf-mount.spec.js | Previously measurement-only; now asserts CLS=0 and catastrophic dev mount ceilings (<300ms 1×, <1200ms 4×). Those guards are **not** claims that the stricter production targets passed. |
| contrast.spec.js | Expanded routes and asserts active aria-current border width/style, focus outline and overflow, instead of only one button outline. |
| axe-routes.spec.js | Expanded from five routes/one viewport to six (including /wiki entry) at 1440 and 390; deferred content visited before audit. |
| sample-wiki, wiki-reader, wiki-experience, wiki, axe, cross-browser, Prompt 11/12/13/14 visual specs | Healthy diagram waits now visit the deferred section (including svg alias locator). Existing SVG counts remain; no sleeps substituted for render completion. |
| architecture/chat and Prompt 11/12/13/15 visual, sample-wiki, wiki-experience, wiki-generation, live Chat captures | Output moved to ignored local capture/results paths so tests cannot overwrite committed goldens. Screenshot assertions/functional checks retained. |
| Added pass-b-leftovers, pass-b-chat, UI HTTP normalization / routing tests | New behavioral checks for focus/node identity, real wheel, cleanup, error classes, saved:false, URL normalization, same-input retry, no-index distinction, expansion node identity and non-crossing graph routes. |

No other test or expectation was removed/loosened in this pass. The old exact 24px dialog-top assertion dropped in Pass A was **not restored**; the current kit dialog has responsive geometry, and physical containment review remains manual. Existing dev-gallery skip guard remains for production-only servers; it did not skip gallery checks in these dev full runs.

## Open issues and owner manual steps

1. Resolve dev/production pipeline-text snapshot parity (2,111 pixels) and Chrome's network suspension; rerun the current complete suite twice on a stable, awake host. The copy locator is already scoped, but no full rerun after that fix was performed. Keep failure evidence; do not simply raise visual tolerance.
2. Review the source-provenance baseline and commit it only after agreement. This task makes no commits. Strict use of an already committed current baseline was not possible: existing goldens show an older UI.
3. Profile remaining Wiki startup and Landing's 4× first-visit outlier. Wiki targets and Landing no-regression requirement remain open. Deferred scroll-time work and final small-refinement performance were not profiled.
4. Live services are running locally: UI at http://127.0.0.1:5180, API 5555, Inngest 8288; production preview 4180. If stopped, use separate terminals for npm run dev, npm run dev:inngest, and npm --prefix web run dev -- --host 127.0.0.1 --port 5180. Configure optional GITHUB_TOKEN locally before many live runs.
5. Firefox: use a host where it launches. Do not treat the skip as a browser pass. Safari/macOS/iOS remains unverified; Windows Playwright WebKit is not Safari.
6. NVDA+Chrome and VoiceOver+Safari: check one job-state announcement, pending-reader focus, Ask shortcut/retry, chapter sheet and diagram/source fallback. Spoken announcements were not verified.
7. Physical mouse/trackpad: inline plain wheel scroll, Ctrl/Command wheel and pinch cursor zoom, expanded plain-wheel zoom, pan/fit, touch drag and toolbar/heading visibility. Playwright Chrome input is not hardware validation. Check actual Windows high-contrast themes and the mobile menu's active item.

PowerShell verification examples (no credentials in output):

```powershell
cd C:\Users\aksha\Desktop\autowiki\e2e
$env:BASE_URL='http://127.0.0.1:5180'
npx playwright test
npx playwright test
$env:BASE_URL='http://127.0.0.1:4180'
npx playwright test visual-stability.spec.js
$env:E2E_LIVE='1'
$env:BASE_URL='http://127.0.0.1:5180'
npx playwright test wiki.spec.js --grep 'live Wiki'
```

Artifacts are local under docs/verification/pass-b-artifacts (ignored by Git); the report and calibrated baseline remain reviewable. No deployment or merge-readiness claim.
