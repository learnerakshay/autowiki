---
version: 2
slug: "web-src-pages-landing-jsx"
primary_target: "web/src/pages/Landing.jsx"
related_targets: ["web/src/App.jsx", "web/src/index.css", "web/src/data/samples/spoon-knife.json"]
---

# Landing surface

Mode: Persuade through authentic product proof.

Audience: Developers seeing AutoWiki for the first time, including a college project demonstration audience.

Job: Understand within seconds that AutoWiki turns a public GitHub repository into a structured technical wiki, inspect the product shape, and open the operational workspace or verified sample.

Primary action: Open `/workspace` to generate a wiki.

Proof: Checked-in `octocat/Spoon-Knife` output—three real chapters, real repository paths, excerpts, and Mermaid relationships—with no landing-page API request.

## Prompt 13 direction contract

THESIS: The generated document is the hero. A centered editorial promise and a large, authentic three-region reader replace the old left-copy/right-preview split.

OWN-WORLD: Mint and sea-glass atmosphere, warm white reading surfaces, near-black Manrope typography, deep-teal operational cues, and restrained shadows. Primary actions are dark rather than indigo. Atmosphere is layered and static, never a decorative particle field.

STORY: Visitors meet the promise, switch among Wiki chapters, Architecture diagrams, and Source context, follow the repository-to-document sequence, inspect an asymmetric capability composition, read the real generation pipeline, and open Workspace.

FIRST VIEWPORT: A compact floating navigation sits above a centered two-line headline, short lede, dark primary action, white sample action, compact product tabs, and the widest object on the page: the Spoon-Knife documentation window.

FORM: Comp-led semantic implementation. Selected critique reference: `.impeccable/mocks/prompt-13/landing-hero-approved.png`; the user delegated visual decision-making by requiring the run not to pause for approval. Seed key: `prompt-13-mint-document-field`.

RESPONSIVE: Desktop uses chapter rail, document, and diagram context. Mobile uses a menu with real links, horizontal tabs and chapters, one readable document column, hidden secondary context, full-width actions, and at least 44px targets. It is verified at 1440, 1280, 390, and 320px without document-level horizontal overflow.

MOTION: A short hierarchy entrance and one-time section reveals only. Chapter and capability changes use a brief continuity transition. Reduced-motion mode receives the complete static composition.

TRUTH: Copy and UI never invent files, repositories, metrics, progress, or live generation. The three product modes derive from `spoon-knife.json`; Chat remains explicitly described as a separate indexed workflow.

FINISH: Prompt 13 replaces the Landing identity and shared visual tokens. Prompt 14 remains responsible for deep Workspace/Wiki shell restructuring; Prompt 15 remains out of scope.

## Prompt 14 interaction contract

THESIS: Scroll reveals the real repository → outline → Wiki relationship. The hero remains product-first, while the process section becomes the one authored focal sequence instead of distributing generic fades across the page.

FIRST VIEWPORT: Accessible word groups reveal the two-line promise before a taller, application-scale Spoon-Knife window. The window preserves live tab and chapter selection, exposes two authentic excerpt paragraphs, and keeps the source/diagram context legible on wide screens.

STORY: Desktop uses a bounded sticky visualization beside three substantial narrative stages. ScrollTrigger changes only the active conceptual stage and draws one connector; it does not pin the page or imply live work. Mobile places the visualization above a linear sequence. Reduced motion keeps the full narrative visible with compressed stage height.

MOTION: Hero words enter at a 45ms stagger with a 680ms ease-out. Section headings use a 38ms word stagger. Product selections use the existing short continuity timing. All effects are scoped through `useGSAP` and `gsap.matchMedia()` and are reverted on route unmount.

ACCEPTANCE: CTA interaction is available during entrance; tabs remain keyboard-operable; returning to Landing creates exactly three story stages with no duplicated wrappers; 1440, 1280, 1024, 768, 390, and 320px remain overflow-safe.
