---
name: AutoWiki
description: Clean Light documentation studio for repository-to-wiki experiences.
colors:
  cool-canvas: "#f6f8fb"
  reading-white: "#ffffff"
  repository-ink: "#172033"
  cool-mist: "#f1f4f8"
  slate-copy: "#596579"
  quiet-rule: "#d7dee9"
  strong-rule: "#8490a3"
  restrained-indigo: "#3657d6"
  deep-indigo: "#2947bd"
  indigo-wash: "#edf1ff"
  indigo-rule: "#c7d2fb"
  operational-cyan: "#0e7490"
  operational-cyan-wash: "#ecf9fc"
  operational-cyan-rule: "#b9e4ee"
  verified-green: "#176b43"
  verified-wash: "#eaf7f0"
  danger-red: "#9f2835"
  danger-wash: "#fff0f2"
typography:
  display:
    fontFamily: '"Manrope AutoWiki", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(3.75rem, 5.2vw, 4.75rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  headline:
    fontFamily: '"Manrope AutoWiki", "Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(2.35rem, 4vw, 3.75rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  title:
    fontFamily: '"Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Segoe UI Variable", "Segoe UI", ui-sans-serif, system-ui, sans-serif'
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
  full: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "0.75rem"
  base: "1rem"
  lg: "1.5rem"
  xl: "2rem"
  2xl: "3rem"
  section: "8rem"
components:
  button-primary:
    backgroundColor: "{colors.restrained-indigo}"
    textColor: "{colors.reading-white}"
    rounded: "{rounded.md}"
    padding: "0 1rem"
    height: "2.75rem"
  button-primary-hover:
    backgroundColor: "{colors.deep-indigo}"
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
    backgroundColor: "{colors.indigo-wash}"
    textColor: "{colors.deep-indigo}"
    rounded: "{rounded.md}"
    padding: "0 0.875rem"
    height: "2.75rem"
---

# Design System: AutoWiki

## Overview

**Creative North Star: "The Documentation Studio"**

AutoWiki is a clean, light workspace where repository structure becomes readable documentation. The visual system feels editorial and technical at once: cool canvas surrounds white reading surfaces, crisp rules establish hierarchy, and restrained indigo marks action, state, and connective logic.

The interface is evidence-led rather than ornamental. Dense technical material stays approachable through clear grouping, generous section rhythm, compact monospace metadata, and product proof that looks and behaves like the real reader. The result should feel precise, credible, and calm—not like a generic chatbot or a decorative AI landing template.

**Key Characteristics:**

- Clean Light surfaces with cool tonal separation.
- Strong editorial hierarchy with technical, factual detail.
- Restrained indigo reserved for action, state, icons, and connectors.
- Truthful worker status with cyan operational signals and no invented completion data.
- Border-led structure with quiet, exceptional elevation.
- Authentic repository paths, chapters, diagrams, and product evidence.
- Grounded Chat keeps each submitted repository and question visibly bound to one answer and its returned source paths.

## Colors

The palette is a cool neutral document field with one disciplined indigo voice and semantic green and red reserved for verified and failure states.

### Primary

- **Restrained Indigo:** Drives primary actions, active navigation, focus, key icons, and diagram connectors.
- **Deep Indigo:** Gives interactive hover and selected states a firmer endpoint.
- **Indigo Wash:** Creates selected, explanatory, and call-to-action surfaces without competing with content.
- **Indigo Rule:** Defines indigo-tinted boundaries for active and pending states.

### Neutral

- **Repository Ink:** Anchors headings, body emphasis, dark feature surfaces, and the brand mark.
- **Cool Canvas:** Provides the page field and the visual breathing room around documents.
- **Reading White:** Keeps documents, cards, navigation, and inputs crisp and legible.
- **Cool Mist:** Separates rails, diagram fields, code-adjacent content, and secondary surfaces.
- **Slate Copy:** Carries explanatory copy, inactive navigation, captions, and metadata.
- **Quiet Rule:** Provides the default one-pixel structural divider.
- **Strong Rule:** Defines inputs and high-salience boundaries without introducing heavy contrast.

### Secondary

- **Operational Cyan / Operational Cyan Wash / Operational Cyan Rule:** Identify live worker boundaries and current generation activity without competing with indigo actions or implying completion.
- **Verified Green / Verified Wash:** Communicate authentic, completed, or verified output.
- **Danger Red / Danger Wash:** Communicate failures and blocking errors only.

### Named Rules

**The Restrained Indigo Rule.** Indigo is a navigational and semantic signal, not a decorative fill; reserve it for decisions, state, and connective logic.

**The Cool Neutral Rule.** Reading white belongs inside cool canvas and mist fields so sections remain visible without beige warmth or heavy gray blocks.

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

The system uses centered content frames with an operational maximum width of 72rem and a wider landing frame of 80rem. Editorial landing sections settle at 76rem and use an 8rem desktop section rhythm. The hero and major section headings are deliberately asymmetric: message and proof, or statement and explanation, occupy unequal columns instead of a centered stack.

The landing composition shifts at four observed breakpoints: 1120px tightens the split hero, 900px stacks the hero and hides the long landing navigation, 760px converts multi-column product structures to compact grids, and 520px creates a dedicated phone composition with full-width actions, horizontal chapter tabs, vertical proof flows, and one-column pipeline stages. Touch targets remain at least 2.75rem high, and the layout never assumes more than a 320px viewport.

The operational Wiki reader uses a wider 84rem frame than the general application shell. At 900px, its sticky chapter rail becomes a labeled native chapter selector; at 760px, document identity and actions stack; at 520px, actions become full-width and the chapter position moves above the adjacent-chapter controls. Horizontal chapter tabs remain appropriate for the compact landing-page proof, where they preview the product rather than carry the reader's primary navigation.

Wiki generation status is one shared operational component across Workspace and the `/wiki` pending route. Workspace uses its compact expression beneath the submitted repository context; the pending route gives the same component a calm 48rem reading measure inside the wider Wiki frame. At 520px, the heading stacks, long repository identifiers wrap, and the five-stage overview becomes two columns without changing the reported state.

Grounded Chat stays inside the standard 72rem application frame. Its repository context and question share one substantial composer rather than separate cards. A completed request becomes a two-column evidence view: Markdown answer in the flexible reading column and a 16–19rem source-path rail beside it. The rail moves below the answer at 900px, the repository row stacks at 760px, and 520px turns suggestions, actions, and answer controls into full-width rows. Pending, failed, and completed states all repeat the submitted repository and question so composer edits cannot visually rewrite the active request.

Spacing follows a four-pixel base with recurring 0.5rem, 0.75rem, 1rem, 1.5rem, 2rem, and 3rem steps. Dense product proof uses the smaller steps; editorial sections use the larger steps and preserve visible breathing room between narrative beats.

## Elevation & Depth

AutoWiki is flat and border-led by default. Depth comes first from canvas-to-surface tonal changes and one-pixel rules; shadows are reserved for the hero documentation preview, ordinary cards, and transient toasts.

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

Navigation uses compact 2.75rem touch targets, semibold Segoe labels, transparent borders at rest, cool-mist hover surfaces, and indigo-wash active states. Landing navigation becomes a concise primary action below 900px; application navigation becomes icon-led below 520px while labels remain available to assistive technology.

### Documentation Reader

The reader has two expressions. The compact landing-page proof combines a muted browser bar, repository identity row, horizontal chapter preview, white document surface, path metadata, and a bordered diagram field. The operational reader uses a document header, sticky numbered rail, source-path chips, semantic Markdown, an independent diagram card, and adjacent-chapter pagination.

Chapter switching is keyboard-operable. Generated prose keeps its headings subordinate to the chapter title and stays within a focused reading measure; wide tables, code blocks, and Mermaid diagrams scroll inside their own bounded regions instead of widening the page. Below 900px, the operational rail becomes a labeled native selector rather than shrinking into an unreadable sidebar.

### Generation Activity

The shared generation status reports the latest boundary entered by the real worker: queued, repository retrieval, outline planning, combined chapter-and-diagram generation, and persistence. Repository identity stays visible when known; the opaque job identifier remains secondary inside disclosure rather than competing with the current operation.

The chapter count appears only while the worker supplies a valid current chapter and total. Missing or unrecognized progress remains an explicit running-but-unavailable state; it never backfills an inferred stage, percentage, elapsed estimate, or completion time.

**The Honest Activity Rule.** The continuous line is an indeterminate activity signal, never a completion meter. The current-operation panel enters once and repeats its restrained 240ms response only when its resolved worker stage or validated chapter boundary changes; under reduced motion, remove the line entirely and show the same status content statically so no frozen segment can be mistaken for a percentage.

### Grounded Repository Q&A

Chat is a focused single-request tool, not a transcript. The composer combines editable repository context, a generous question field, lightweight prompt suggestions, and one indigo Ask action. While a request runs, show the submitted repository and question with a cyan indeterminate line; do not invent retrieval stages. On completion, render the returned answer through the same semantic Markdown rules as the Wiki reader and place only the service-returned file paths in the adjacent cyan evidence rail. If no paths arrive, state that none were returned rather than inferring citations.

Draft edits may coexist with an active request, but a visible notice must explain that they do not alter it. “Ask another question” clears the prior result instead of extending a conversational thread. The result enters as one short 240ms response, source rows follow at 180ms with a 25ms stagger, and reduced-motion users receive the same content without those transitions.

**The Bound Evidence Rule.** Each Chat submission keeps its submitted repository and question attached to the pending state, final Markdown answer, and only the source paths the service actually returns; draft edits cannot rewrite the active request.

### Brand Mark

The AutoWiki mark combines document geometry with repository branching inside an indigo-wash square. Keep the wordmark compact and dark; do not detach the mark from the visible AutoWiki name in primary navigation contexts.

## Do's and Don'ts

### Do:

- **Do** put authentic repository paths, chapter names, diagrams, and generated output at the center of product proof.
- **Do** use borders, tonal surfaces, and spacing as the primary hierarchy tools.
- **Do** preserve Manrope for landing displays, generated-document identity, and operational state headings, with Segoe for body copy and controls.
- **Do** keep interactive targets at least 2.75rem high with visible keyboard focus.
- **Do** provide purpose-built desktop and mobile compositions and honor reduced-motion preferences.
- **Do** share the real worker status between Workspace and `/wiki`, preserving its five backend-reported boundaries and factual chapter counts.
- **Do** preserve the one-to-one binding between a Chat submission, its Markdown answer, and the actual source paths returned for that request.

### Don't:

- **Don't** turn AutoWiki into a generic chatbot visual language; the structured wiki is the flagship artifact.
- **Don't** flood screens with indigo, gradients, decorative glow, or unsupported AI spectacle.
- **Don't** use large shadows where a one-pixel border or cool surface change already defines structure.
- **Don't** introduce oversized pills or corner radii beyond the established compact document geometry.
- **Don't** fabricate metrics, testimonials, repositories, progress states, or product capabilities as visual filler.
- **Don't** turn indeterminate Wiki activity into a percentage, elapsed-time estimate, completion forecast, or reduced-motion segment that looks like progress.
- **Don't** present grounded Chat as a conversational transcript, infer missing citations, or let draft edits relabel an in-flight or completed request.
