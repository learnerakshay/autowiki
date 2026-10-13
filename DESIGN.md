---
name: AutoWiki
description: Mint editorial documentation world for repository-to-wiki journeys.
colors:
  mint-canvas: "#f7fbf9"
  reading-white: "#ffffff"
  repository-ink: "#101a19"
  sea-glass-mist: "#f0f7f4"
  slate-copy: "#526361"
  quiet-rule: "#dfece9"
  strong-rule: "#8aa49f"
  mint-surface: "#f3faf6"
  skeleton-mint: "#dceae6"
  action-ink: "#111918"
  action-ink-hover: "#26312f"
  pending-mint-wash: "#e2f8f2"
  pending-mint-rule: "#b8e4da"
  active-mint-wash: "#ddfce9"
  operational-teal: "#087f75"
  operational-mint-wash: "#e7faf2"
  sea-glass-highlight: "#45d9b2"
  operational-mint-rule: "#bce7dc"
  verified-green: "#176b43"
  verified-wash: "#eaf7f0"
  verified-rule: "#b8dfc9"
  danger-red: "#9f2835"
  danger-wash: "#fff0f2"
  danger-rule: "#efc1c7"
typography:
  display:
    fontFamily: '"Manrope AutoWiki", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(3.25rem, 6.1vw, 5.8rem)"
    fontWeight: 720
    lineHeight: 0.98
    letterSpacing: "-0.066em"
  headline:
    fontFamily: '"Manrope AutoWiki", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(2.7rem, 5vw, 4.8rem)"
    fontWeight: 680
    lineHeight: 0.98
    letterSpacing: "-0.06em"
  title:
    fontFamily: '"Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Manrope AutoWiki", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: '"Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "0.75rem"
    fontWeight: 800
    lineHeight: 1.4
    letterSpacing: "0.12em"
  code:
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", monospace'
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
rounded:
  xs: "0.25rem"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.75rem"
  2xl: "1.15rem"
  full: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  base: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  section: "clamp(7rem, 12vw, 11rem)"
components:
  button-primary:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.reading-white}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.action-ink-hover}"
    textColor: "{colors.reading-white}"
  button-secondary:
    backgroundColor: "{colors.reading-white}"
    textColor: "{colors.repository-ink}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.75rem"
  input:
    backgroundColor: "{colors.reading-white}"
    textColor: "{colors.repository-ink}"
    rounded: "{rounded.md}"
    padding: "0 0.875rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.reading-white}"
    textColor: "{colors.repository-ink}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
  tab-active:
    backgroundColor: "{colors.active-mint-wash}"
    textColor: "{colors.repository-ink}"
    rounded: "{rounded.md}"
    padding: "0 0.875rem"
    height: "2.75rem"
---

# Design System: AutoWiki

## Overview

**Creative North Star: "The Living Documentation Field"**

AutoWiki is a mint editorial world where a repository becomes planned chapters and then a navigable technical Wiki. Warm white reading surfaces sit inside a luminous sea-glass atmosphere, near-black type carries the hierarchy, and deep teal marks operational context. The landing page now leads with one centered promise and a large, authentic document window rather than a conventional copy-and-card split.

The interface is evidence-led rather than ornamental. Dense technical material stays approachable through clear grouping, generous section rhythm, compact monospace metadata, and product proof built directly from the checked-in Spoon-Knife fixture. Landing, Workspace, Wiki, Chat, and Architecture keep distinct compositions while sharing the new mint, near-black, and Manrope foundation. The result should feel precise, credible, and calm—not like a generic chatbot or a decorative AI landing template.

**Key Characteristics:**

- Warm white and mint surfaces with near-black type.
- Strong editorial hierarchy with technical, factual detail.
- Deep teal for operational context; near-black for primary actions and selected navigation.
- Truthful worker status with cyan operational signals and no invented completion data.
- Border-led structure with quiet, exceptional elevation.
- Authentic repository paths, chapters, diagrams, and product evidence.
- Grounded Chat keeps each submitted repository and question visibly bound to one answer and its returned source paths.
- A provenance-labeled Spoon-Knife sample reuses the production reader without calling the backend.

## Colors

### Prompt 13 landing composition

The Landing route uses a compact floating navigation, a centered two-line display, paired dark and white actions, and a wide three-region product window. The window exposes three real modes—Wiki chapters, Architecture diagrams, and Source context—and all labels, paths, excerpts, and relationships come from the checked-in Spoon-Knife sample. Desktop preserves chapter rail, document, and diagram context; phone layouts replace the squeeze with horizontal chapter navigation, one focused document column, and hidden secondary context.

Lower sections follow an editorial sequence instead of repeating a card grid: an open vertical process line, one dominant chapter proof with two supporting capabilities, a pale-mint six-stage architecture ribbon, and an unboxed sea-glass closing horizon. Large atmosphere is static and tonal. Motion is limited to short entrance and state-continuity transitions and is removed under reduced motion.

**The Product-Is-The-Hero Rule.** The generated document must remain the largest and most concrete object in the first viewport; atmosphere, copy, and motion support it rather than compete with it.

**The Mobile Recomposition Rule.** At phone widths, remove secondary context and restack the reading flow; never preserve a desktop multi-rail layout by shrinking it until the text becomes ornamental.

### Prompt 14 immersive product system

Prompt 14 turns the established visual direction into an authored repository-to-document experience. The Landing hero uses accessible word-group markup and a deliberate entrance sequence, the real Spoon-Knife product window gains enough vertical presence to read as an application, and the former static process list becomes a bounded three-stage scroll story. The visual changes discretely at repository, outline, and document boundaries; its connector progress is decorative and never implies a running generation job.

Workspace is now one command stage rather than a dashboard of equivalent cards. Wiki generation owns the raised white surface, the verified sample output provides dark editorial contrast beside it, and independent indexing recedes into a quiet horizontal supporting workflow. Only backend state can change the job surfaces.

The Wiki reader is a low-frame documentation shell: compact repository header, sticky chapter rail, wide article paper, and an evidence-backed context rail containing only the active chapter description and returned source paths. At narrower desktop sizes the context rail disappears; below 900px the chapter rail becomes the native selector and the document remains a single readable column.

Motion follows a three-tier rhythm: 580–680ms for authored heading/product entrances, 220–300ms for selection continuity, and immediate React state changes underneath every animation. Desktop receives the bounded sticky story and connector drawing. Tablet and mobile use a linear composition without pinning. Reduced-motion mode exposes all content immediately, shortens the process sequence, removes spatial choreography, and hides indeterminate activity where a frozen line could look like percentage progress.

**The Scroll Explains Relationship Rule.** Scroll motion is permitted only where it reveals repository → outline → Wiki continuity; it must never simulate worker progress or hijack navigation.

**The Calm Reader Rule.** Marketing can choreograph arrival, but the documentation reader animates only chapter continuity, successful diagram arrival, and direct interaction feedback.

The palette is a warm-white and mint document field with near-black type and one disciplined deep-teal operational voice. Semantic green and red remain limited to verified and failure states.

### Primary

- **Restrained Indigo:** Drives primary actions, global focus, selected navigation, and the few connection states that must read as decisions rather than ambient operation.
- **Deep Indigo:** Gives interactive hover and selected states a firmer endpoint.
- **Indigo Wash:** Creates selected, explanatory, and call-to-action surfaces without competing with content.
- **Indigo Rule:** Defines indigo-tinted boundaries for active and pending states.

### Neutral

- **Repository Ink:** Anchors deep-navy headings, body emphasis, dark feature surfaces, and the brand mark.
- **Cool Canvas:** Provides the page field and the visual breathing room around documents.
- **Reading White:** Keeps documents, cards, navigation, and inputs crisp and legible.
- **Cool Mist / Subtle Surface / Skeleton Cyan:** Separate rails, diagram fields, code-adjacent content, secondary surfaces, and honest loading placeholders without turning the app gray.
- **Slate Copy:** Carries explanatory copy, inactive navigation, captions, and metadata.
- **Quiet Rule:** Provides the default one-pixel structural divider.
- **Strong Rule:** Defines inputs and high-salience boundaries without introducing heavy contrast.

### Secondary

- **Active Cyan Wash / Operational Cyan / Operational Cyan Wash / Operational Cyan Highlight / Operational Cyan Rule:** Identify selected navigation, repository context, live worker boundaries, evidence, active reader wayfinding, and current generation activity without competing with indigo actions or implying completion.
- **Verified Green / Verified Wash:** Communicate authentic, completed, or verified output.
- **Danger Red / Danger Wash:** Communicate failures and blocking errors only.

### Named Rules

**The Restrained Indigo Rule.** Indigo is a decision signal, not the default decoration; reserve it for primary actions, focus, selected global navigation, and connective logic that cyan cannot carry clearly.

**The White-and-Cyan Rule.** Reading white belongs inside the icy-cyan canvas and pale cyan fields so sections remain visible without beige warmth, heavy gray blocks, or cyan flooding the page.

## Typography

**Display Font:** Manrope AutoWiki (with Segoe UI and system sans-serif fallbacks)

**Body Font:** Segoe UI Variable (with Segoe UI and system sans-serif fallbacks)

**Label/Mono Font:** SFMono-Regular (with Consolas and Liberation Mono fallbacks)

**Character:** Manrope gives landing displays, document identity, and operational state headings an editorial, compact voice, while Segoe keeps product controls and long-form reading familiar and efficient. Monospace is used as evidence for paths, sequence numbers, code, and repository metadata.

### Hierarchy

- **Display:** Bold, tightly tracked, near-solid leading; reserved for the landing hero.
- **Headline:** Bold and tightly tracked; used for landing section statements and the final call to action.
- **Title:** Compact product and proof headings, typically one or two lines.
- **Body:** Neutral, open-leading prose with reading measures generally capped between 58 and 65 characters.
- **Label:** Small, bold, widely tracked uppercase text for eyebrows and verified-state labels.
- **Code:** Compact monospace text for repository paths, chapter numbers, code samples, and technical metadata.

### Named Rules

**The Identity Display Rule.** Manrope identifies the product, generated document, or current operational state; body copy, navigation, controls, and dense workspace UI remain Segoe.

**The Metadata Is Evidence Rule.** Use monospace sparingly where literal paths, code, sequence, or repository structure make the interface more trustworthy.

## Layout

The system uses centered content frames with an operational maximum width of 72rem, a 78rem Workspace frame, an 88rem Wiki frame, and an 86rem landing hero. Editorial landing sections settle at 76rem and use generous 6.75rem–8rem desktop section rhythm. Hero and major section headings are deliberately asymmetric: message and proof, or statement and explanation, occupy unequal columns instead of a centered stack.

The composition shifts at four shared breakpoints: 1120px tightens wide editorial splits, 900px stacks the landing hero and collapses wide evidence layouts, 760px converts multi-column product structures to compact grids, and 520px creates a dedicated phone composition with icon-led application navigation, full-width actions, horizontal proof tabs, and one-column sequences. The system is verified at 1440, 1280, 768, 390, and 320px where relevant; touch targets remain at least 2.75rem high, content reflows without document-level horizontal overflow, and no layout assumes more than a 320px viewport.

The operational Wiki reader uses a wider 84rem frame than the general application shell. At 900px, its sticky chapter rail becomes a labeled native chapter selector; at 760px, document identity and actions stack; at 520px, actions become full-width and the chapter position moves above the adjacent-chapter controls. Horizontal chapter tabs remain appropriate for the compact landing-page proof, where they preview the product rather than carry the reader's primary navigation.

Wiki generation status is one shared operational component across Workspace and the `/wiki` pending route. Workspace uses its compact expression beneath the submitted repository context; the pending route gives the same component a calm 48rem reading measure inside the wider Wiki frame. At 520px, the heading stacks, long repository identifiers wrap, and the five-stage overview becomes two columns without changing the reported state.

Grounded Chat stays inside the standard 72rem application frame. Its repository context and question share one substantial composer rather than separate cards. A completed request becomes a two-column evidence view: Markdown answer in the flexible reading column and a 16–19rem source-path rail beside it. The rail moves below the answer at 900px, the repository row stacks at 760px, and 520px turns suggestions, actions, and answer controls into full-width rows. Pending, failed, and completed states all repeat the submitted repository and question so composer edits cannot visually rewrite the active request.

Architecture uses an 80rem technical-reading frame and permits a real source-grid treatment only inside the selectable blueprint canvas, where the grid communicates an inspectable system diagram. At 760px the connector SVG disappears and nodes become a two-column grid; at 520px they become a single vertical sequence with detail immediately below. A detector advisory for grid styling is accepted only for this blueprint canvas and must not become a blanket exception for other surfaces.

The five routes share one journey but not one template: Landing persuades with source-to-chapter-to-Wiki proof; Workspace operates through a dominant generation command and secondary indexing; Wiki reads as a document; Chat operates as one grounded request with bound evidence; Architecture reads as an inspectable system explanation. Loading, pending, failure, unavailable, completed, and sample states retain each route's structure instead of becoming generic centered cards.

Spacing follows a four-pixel base with recurring 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, and 3rem steps. Dense product proof uses the smaller steps; editorial sections use the larger steps and preserve visible breathing room between narrative beats.

## Elevation & Depth

AutoWiki is flat and border-led by default. Depth comes first from cyan-canvas-to-white-surface tonal changes and one-pixel rules; low-opacity cyan/navy shadows are reserved for hero proof, dominant operational surfaces, the Architecture canvas, and transient toasts.

### Shadow Vocabulary

- **Hairline Card:** A nearly imperceptible shadow supports cards already defined by a border.
- **Floating Reader:** A broad, low-opacity shadow lifts the verified documentation preview above the hero canvas.
- **Transient Toast:** A compact ambient shadow separates temporary feedback from the workspace.

### Named Rules

**The Border-Before-Shadow Rule.** Establish hierarchy with surface tone and a one-pixel rule before adding elevation; shadows must explain physical separation, not decorate a container.

## Shapes

The form language uses gently rounded rectangles and precise rules. Controls and navigation use an 0.5rem corner; internal proof modules use 0.625rem; major cards, previews, and calls to action use 0.75rem. Small state labels use 0.375rem, code uses 0.25rem, and circular geometry is reserved for process steps and true round indicators.

Borders are structural and usually one pixel. Clipping is purposeful on document windows and diagram frames; avoid oversized pills, excessive capsules, and inflated corner radii that weaken the technical tone.

## Components

Components are refined and restrained: quiet at rest, explicit on hover and focus, and never detached from the documentation context.

### Buttons

- **Shape:** Gently rounded, 2.75rem-high controls with an 0.5rem radius and compact horizontal padding.
- **Primary:** Restrained indigo with white text and a matching border; used for the single leading action in a region.
- **Secondary:** Reading white with a strong neutral border; gains an indigo wash and indigo text on hover.
- **Ghost:** Transparent with muted copy; intended for low-priority utility actions.
- **Hover / Focus:** Hover shifts color or surface in 150ms, active state moves down one pixel, and keyboard focus uses a visible indigo outline or ring. Disabled controls retain legible neutral styling and remove motion.

### Chips

- **Style:** Compact 0.375rem-radius badges use a tinted wash, related border, and semibold text.
- **State:** Indigo represents default or pending context, green represents completed or verified output, red represents failure, and neutral gray represents metadata.

### Cards / Containers

- **Corner Style:** Major containers use an 0.75rem radius; nested modules step down to 0.625rem or 0.5rem.
- **Background:** Reading white is the default; cool mist marks supporting content; repository ink is reserved for the flagship chapter proof.
- **Shadow Strategy:** Cards rely on borders and tonal separation; only physically lifted or transient surfaces use stronger shadows.
- **Border:** One-pixel quiet rules are the default, with indigo or semantic borders used only for state.
- **Internal Padding:** Product cards use 1.25rem to 1.5rem; editorial feature blocks expand to 1.75rem.

### Inputs / Fields

- **Style:** White, 2.75rem-high fields with a strong neutral stroke, an 0.5rem radius, and 0.875rem horizontal padding.
- **Focus:** Border shifts to indigo and gains a two-layer visible ring.
- **Error / Disabled:** Error messaging uses the danger family; disabled fields use cool mist, quiet rules, and muted copy without dropping opacity into illegibility.

### Navigation

Navigation uses compact 2.75rem touch targets, semibold Segoe labels, transparent borders at rest, pale cyan hover/active surfaces, and a firmer indigo label for the selected global destination. Landing navigation becomes a concise primary action below 900px; application navigation becomes icon-led below 520px while labels remain available to assistive technology.

### Documentation Reader

The reader has two expressions. The compact landing-page proof combines a cyan-tinted browser bar, repository identity row, chapter preview, white document surface, path metadata, and a bordered diagram field. The operational reader uses a document header, sticky numbered rail, source-path chips, semantic Markdown, an independent diagram card, and adjacent-chapter pagination.

Chapter switching is keyboard-operable. Generated prose keeps its headings subordinate to the chapter title and stays within a focused reading measure; wide tables, code blocks, and Mermaid diagrams scroll inside their own bounded regions instead of widening the page. Below 900px, the operational rail becomes a labeled native selector rather than shrinking into an unreadable sidebar.

### Pre-generated Sample

`/wiki/sample/spoon-knife` is a read-only demonstration state, not a second reader implementation. It imports the checked-in Spoon-Knife data copied from `wiki-output/octocat-Spoon-Knife.json`, validates the expected shape, and passes it to the shared `WikiReader` with a “Pre-generated sample” status, provenance note, source repository link, and “Generate your own” action. This path starts no Wiki job, performs no backend fetch, and makes no model, embeddings, vector-store, or other provider call. An unknown or invalid sample slug renders an honest unavailable state.

**The One Reader Rule.** Live jobs and verified samples use the same chapter navigation, Markdown, diagram, responsive, and accessibility behavior; sample-specific UI is limited to provenance and calls to generate a new Wiki.

### Generation Activity

The shared generation status reports the latest boundary entered by the real worker: queued, repository retrieval, outline planning, combined chapter-and-diagram generation, and persistence. Repository identity stays visible when known; the opaque job identifier remains secondary inside disclosure rather than competing with the current operation.

The chapter count appears only while the worker supplies a valid current chapter and total. Missing or unrecognized progress remains an explicit running-but-unavailable state; it never backfills an inferred stage, percentage, elapsed estimate, or completion time.

**The Honest Activity Rule.** The continuous line is an indeterminate activity signal, never a completion meter. The current-operation panel enters once and repeats its restrained 240ms response only when its resolved worker stage or validated chapter boundary changes; under reduced motion, remove the line entirely and show the same status content statically so no frozen segment can be mistaken for a percentage.

### Grounded Repository Q&A

Chat is a focused single-request tool, not a transcript. The composer combines editable repository context, a generous question field, lightweight prompt suggestions, and one indigo Ask action. While a request runs, show the submitted repository and question with a cyan indeterminate line; do not invent retrieval stages. On completion, render the returned answer through the same semantic Markdown rules as the Wiki reader and place only the service-returned file paths in the adjacent cyan evidence rail. If no paths arrive, state that none were returned rather than inferring citations.

Draft edits may coexist with an active request, but a visible notice must explain that they do not alter it. “Ask another question” clears the prior result instead of extending a conversational thread. The result enters as one short 240ms response, source rows follow at 180ms with a 25ms stagger, and reduced-motion users receive the same content without those transitions.

**The Bound Evidence Rule.** Each Chat submission keeps its submitted repository and question attached to the pending state, final Markdown answer, and only the source paths the service actually returns; draft edits cannot rewrite the active request.

### Architecture Explorer

The `/architecture` route is a Read-mode technical walkthrough inside the existing documentation-studio world. Its first major surface is a selectable system canvas: component nodes sit on a faint source-grid field, relevant connections gain indigo emphasis, and an adjacent evidence panel explains the selected responsibility with copyable repository-relative paths. The diagram is explicitly conceptual and never implies live telemetry.

Wiki generation remains visually dominant through a connected vertical pipeline and a focused input/operation/output panel. RAG indexing and question answering use one segmented secondary surface so their relationship is clear without suggesting that either is required for Wiki generation. The shared job lifecycle moves to a dark repository-ink band to mark the coordination boundary without turning the route into a dark theme.

At 760px and below, the overview becomes a two-column node grid with no SVG connector dependency; at 520px it becomes a single vertical sequence. Detail content stays directly below the selectable nodes, source paths wrap, all controls retain 44px targets, and the full technical explanation remains available without hover, animation, or horizontal panning.

Architecture facts live in `web/src/data/architecture.js` rather than being scattered through the page. Update that module only after verifying responsibilities, inputs, outputs, event names, progress stages, source paths, and limitations against the implementation. Motion is one restrained GSAP page entrance plus section reveals; reduced motion keeps all content visible and removes transition timing.

### Accessibility and Motion

Every mode keeps semantic landmarks, ordered headings, keyboard-operable chapter/node/tab controls, visible focus, 44px minimum targets, and text or list alternatives for diagrams and conceptual flows. Status and error copy uses appropriate live-region semantics without relying on color alone; literal paths wrap or scroll inside their own bounded region.

GSAP is reserved for short continuity cues: first-view hierarchy, one-time section reveals, chapter/result replacement, and selected worker-stage response. Motion never supplies missing information, blocks interaction, or fakes progress. Under `prefers-reduced-motion: reduce`, page and state content is immediately visible, scroll behavior becomes static, transition timing is removed, and indeterminate activity lines are hidden when a frozen segment could imply a percentage.

**The Purposeful Motion Rule.** Animate the relationship a user needs to notice—never the whole interface merely because GSAP is available.

### Brand Mark

The AutoWiki mark combines document geometry with repository branching inside a cyan-wash square, with one bright cyan node as the operational spark. Keep the wordmark compact and deep navy; do not detach the mark from the visible AutoWiki name in primary navigation contexts.

## Do's and Don'ts

### Do:

- **Do** put authentic repository paths, chapter names, diagrams, and generated output at the center of product proof.
- **Do** use borders, tonal surfaces, and spacing as the primary hierarchy tools.
- **Do** preserve Manrope for landing displays, generated-document identity, and operational state headings, with Segoe for body copy and controls.
- **Do** keep interactive targets at least 2.75rem high with visible keyboard focus.
- **Do** provide purpose-built desktop and mobile compositions and honor reduced-motion preferences.
- **Do** share the real worker status between Workspace and `/wiki`, preserving its five backend-reported boundaries and factual chapter counts.
- **Do** preserve the one-to-one binding between a Chat submission, its Markdown answer, and the actual source paths returned for that request.
- **Do** render the verified Spoon-Knife sample through the shared production Wiki reader and keep its provenance and zero-call behavior explicit.
- **Do** treat Landing, Workspace, Wiki, Chat, and Architecture as distinct modes of one connected repository-to-chapters-to-Wiki journey.

### Don't:

- **Don't** turn AutoWiki into a generic chatbot visual language; the structured wiki is the flagship artifact.
- **Don't** flood screens with indigo, gradients, decorative glow, or unsupported AI spectacle.
- **Don't** use large shadows where a one-pixel border or cool surface change already defines structure.
- **Don't** introduce oversized pills or corner radii beyond the established compact document geometry.
- **Don't** fabricate metrics, testimonials, repositories, progress states, or product capabilities as visual filler.
- **Don't** turn indeterminate Wiki activity into a percentage, elapsed-time estimate, completion forecast, or reduced-motion segment that looks like progress.
- **Don't** present grounded Chat as a conversational transcript, infer missing citations, or let draft edits relabel an in-flight or completed request.
- **Don't** let sample mode submit a job, call a backend/provider, hide its provenance, or drift into a separate reader implementation.
- **Don't** generalize the Architecture blueprint's accepted grid-pattern detector advisory to unrelated surfaces.
- **Don't** add ambient GSAP choreography; every motion must clarify entrance, state change, navigation continuity, or evidence arrival and must disappear safely under reduced motion.
