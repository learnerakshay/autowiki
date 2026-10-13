---
version: 1
slug: "web-src-pages-architecture-jsx"
primary_target: "web/src/pages/Architecture.jsx"
related_targets: ["web/src/data/architecture.js", "web/src/App.jsx", "web/src/pages/Landing.jsx", "web/src/index.css", "e2e/architecture.spec.js"]
---

# Architecture Explorer surface

Mode: Read

Audience: Developers and college evaluators who need to understand AutoWiki's real engineering without reading the whole repository.

Job: Distinguish the flagship Wiki-generation pipeline from the separate repository-indexing and grounded-Q&A pipeline, then inspect their shared asynchronous coordination, reliability decisions, source evidence, and current limitations.

Primary action: Explore the selectable architecture and continue to `/workspace` to see it operate.

Proof: Verified repository-relative source paths, real event and progress-stage names, current OpenAI and Pinecone behavior, process-local job constraints, the Mermaid stale-render guard, and regression tests.

Constraints: Preserve the Clean Light white/cyan system, existing routes and backend APIs, factual copy, route-level lazy loading, keyboard access, reduced motion, mobile usability down to 320px, and the distinction between explanatory flow and runtime monitoring. Add no dependencies, provider calls, privileged endpoints, invented metrics, or Prompt 11 features.

## Direction contract

THESIS: AutoWiki is more than a repository chatbot because its primary mechanism is a bounded source-to-outline-to-chapter Wiki pipeline; the first major visual makes that system legible and inspectable.

OWN-WORLD: Extend the established documentation studio with white reading surfaces, icy-cyan operational fields, repository ink, restrained indigo connection logic, compact geometry, precise rules, Manrope display type, and monospace only for literal paths and states.

STORY: Establish the two-workflow thesis, let visitors inspect the complete system boundary, give Wiki generation the dominant walkthrough, separate Index from Question inside the supporting RAG surface, expose the shared job backbone, then close with engineering decisions and honest limitations.

FIRST VIEWPORT: A compact application header sits above an asymmetric technical hero. The system-overview heading and a meaningful portion of the selectable architecture canvas appear early enough that the page reads as an explorer rather than a marketing header followed by documentation.

FORM: Code-led, brief-pinned extension. Signature interaction: selecting a system node highlights related connections and replaces the adjacent responsibility and evidence panel; on narrow screens the same interaction uses a vertical node sequence without SVG dependency. The user supplied the complete Prompt 10 direction, so no concept-seed round or seed key was created.

FINISH: The build ends with desktop and mobile browser captures, meaningful Playwright interaction and overflow coverage, mechanical design detection, a fresh finish review, truthful bundle reporting, and this maintained surface brief. Final finish-review disposition: ship.

## Prompt 11 consolidation

Architecture remains the Read-mode blueprint of the same `repository → planned chapters → navigable technical wiki` journey, with the Wiki pipeline visually dominant and RAG explicitly separate. Prompt 11 aligns the surface with the brighter white/cyan system, deeper navy type, and restrained cyan selection language while preserving all verified Prompt 10 responsibilities, event names, limitations, reliability decisions, and source paths.

The mechanical grid-pattern advisory is accepted only for the real selectable Architecture blueprint canvas, where the grid communicates an inspectable diagram. It is not a project-wide detector exemption. Desktop uses the canvas plus evidence panel; at 760px SVG connectors disappear and nodes form two columns; at 520px they become one vertical sequence; 320px remains keyboard- and overflow-safe. GSAP is limited to the first-view blueprint and one-time section continuity, while reduced motion reveals all content with no transition dependency.

PROMPT 11 FINISH: Final reviewer disposition remains SHIP.
