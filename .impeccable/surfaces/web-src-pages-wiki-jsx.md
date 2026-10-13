---
version: 1
slug: "web-src-pages-wiki-jsx"
primary_target: "web/src/pages/Wiki.jsx"
related_targets: ["web/src/pages/MermaidDiagram.jsx","web/src/index.css"]
---

Scope: Operational Wiki reader at `/wiki`; Read mode. The brief pins the established white-cyan system, semantic Markdown, accessible chapter navigation, and one authoritative Mermaid rendering surface.

THESIS: The generated document is the product. Repository identity and chapter wayfinding frame a quiet reading canvas; generation controls and job diagnostics recede once the Wiki is complete. This rejects the old form-first dashboard and raw Markdown block.

OWN-WORLD: Bright white document paper on the existing icy-cyan canvas, crisp neutral rules, restrained teal selection, indigo only for primary actions, Manrope only for document identity, workhorse sans for reading, and mono only for code and file paths.

STORY: Readers identify the repository, understand the chapter structure, move through semantic technical prose, inspect authentic source paths and Mermaid relationships, then continue to Workspace or indexed Chat without confusing those workflows.

FIRST VIEWPORT: A compact repository/document header sits above a two-column reader. A sticky, numbered chapter rail anchors the left; the active article begins immediately on the right with its title, summary, source files, Markdown, and diagram. On mobile, a native chapter selector replaces the rail.

FORM: Brief-pinned established-world extension in Read mode; no concept seed was required because the information architecture, palette, and interaction priorities are explicit. The signature interaction is immediate chapter replacement with a short continuity transition while one guarded Mermaid surface remains authoritative.

## Prompt 11 consolidation

Wiki is the Read-mode destination of the shared journey and owns one production reader. `/wiki?jobId=...` supplies live job output; `/wiki/sample/spoon-knife` imports a checked-in copy of the verified `wiki-output/octocat-Spoon-Knife.json` artifact and passes it to the same `WikiReader`. Sample mode is read-only, clearly labeled `Pre-generated sample`, includes the source artifact and repository provenance, offers `Generate your own`, makes zero backend/provider calls, and renders an honest unavailable state for unknown or invalid samples.

Pending, failure, missing-job, completed, and sample states retain factual copy and never imply unavailable progress. At 900px the chapter rail becomes a labeled native selector; at 760px identity and actions stack; at 520px controls become full-width and pagination preserves chapter position; 320px remains overflow-safe. Chapter and Mermaid continuity motion is short and optional, with all content immediately visible under reduced motion.

FINISH: Prompt 11 final reviewer disposition is SHIP. Shared-reader behavior, exactly-one-SVG protection, provenance, sample zero-call behavior, desktop/mobile reflow, and accessible navigation are documented and verified.
