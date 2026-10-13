# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers evaluating or exploring a public GitHub repository who need a structured explanation of its purpose, files, and architecture. The product is also demonstrated as a college minor project, so first-time clarity and credible technical proof matter.

## Product Purpose

AutoWiki turns a public GitHub repository into a navigable technical wiki with planned chapters, generated explanations, and chapter-specific Mermaid diagrams. Success means a visitor can move from repository source to useful technical documentation without mistaking the product for a generic chatbot.

## Positioning

AutoWiki's primary mechanism is a multi-stage repository-to-wiki generation pipeline: repository files inform an outline, the outline drives chapter generation, and each chapter includes an explanatory diagram. Repository indexing and grounded chat are separate supporting capabilities.

## Operating Context

Users provide a public repository in `owner/repository` form, start wiki generation, wait for a pending/completed/failed job, and read the resulting chapters at `/wiki?jobId=...`. They can separately index a repository and ask grounded questions in Chat. Evaluators can also open the pre-generated Spoon-Knife Wiki at `/wiki/sample/spoon-knife` to inspect the real reader without starting a backend job.

## Capabilities and Constraints

- Routes use React Router; backend work is exposed through existing Express and Inngest APIs.
- Wiki jobs expose only pending, completed, and failed states.
- Wiki deep links depend on the `jobId` query parameter.
- Mermaid rendering has an exactly-one-SVG race-condition guarantee that must remain protected.
- Sample mode is deliberately narrow: `/wiki/sample/spoon-knife` imports a checked-in copy of the verified `wiki-output/octocat-Spoon-Knife.json` artifact, renders it through the shared production Wiki reader, identifies it as pre-generated, and makes zero backend or provider calls.
- No authentication, billing, additional sample catalog, or granular backend progress tracking currently exists.

## Brand Commitments

The visible product name is AutoWiki; “AutoWiki for Git” is appropriate for descriptive metadata. The identity combines repository branching with documentation geometry. Product language is concise, technical, factual, and free of inflated performance or adoption claims.

## Evidence on Hand

- Verified generated wiki output: `wiki-output/octocat-Spoon-Knife.json` and `wiki-output/octocat-Hello-World.json`.
- The shipping Spoon-Knife sample is provenance-linked to `wiki-output/octocat-Spoon-Knife.json`; the checked-in sample data records that no new generation occurred for sample mode.
- Verified product captures include the Prompt 11 Landing, Workspace, Wiki, Chat, Architecture, pending, and sample-reader desktop/mobile screenshots under `e2e/screenshots/`.
- No customer logos, testimonials, adoption metrics, benchmarks, or commercial claims are available and none should be fabricated.

## Product Principles

- Wiki generation is the flagship capability.
- Show concrete generated documentation instead of generic AI claims.
- Keep indexing and grounded chat useful but visually secondary.
- Preserve real routes, APIs, job behavior, and accessibility.
- Keep loading, failure, pending, and unavailable states honest; never replace absent backend facts with decorative progress or inferred evidence.
- Prefer precise, maintainable implementation over ornamental complexity.

## Accessibility & Inclusion

Target WCAG AA contrast, semantic landmarks and headings, visible keyboard focus, 44px touch targets, meaningful diagram alternatives, responsive layouts down to 320px, and reduced-motion support.
