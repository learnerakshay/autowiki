# AutoWiki UI and animation handoff

Use this note when asking Claude Code to improve the interface. Preserve the real workflows, accessibility fallbacks, and source-backed content.

## Where motion is implemented

- `web/src/pages/Landing.jsx`: GSAP hero and section-heading word reveals, section entrances, the three-stage vertical Repository → Outline → Wiki story, the horizontal chapter story, and the architecture-pipeline connector. Desktop uses scoped `ScrollTrigger`; cleanup is handled through `gsap.matchMedia().revert()`.
- `web/src/pages/Landing.css`: bounded `300vh` desktop horizontal story with CSS sticky positioning; mobile and reduced-motion modes display all scenes as ordinary vertical content.
- `web/src/pages/Home.jsx`: Workspace page entrance and job-panel state changes.
- `web/src/pages/Wiki.jsx`: Wiki shell entrance and chapter-change transition.
- `web/src/pages/Chat.jsx`: intro/composer entrance, Index → Retrieve → Answer sequence, result reveal, and source-item stagger.
- `web/src/pages/Architecture.jsx`: hero/section reveals, selected-node emphasis, active connector drawing, and detail-panel updates.
- `web/src/pages/MermaidDiagram.jsx`: diagram render and expanded-view entrance.
- `web/src/components/WikiGenerationProgress.jsx` and `JobStatus.jsx`: truthful job-stage/status feedback.
- `web/src/index.css`: small hover/focus transitions and pending indicators. Its `prefers-reduced-motion` rules disable continuous or decorative motion.
- `web/src/lib/motion.js`: shared timing, easing, breakpoint, and reduced-motion helpers.

## Important constraints for improvements

Keep scrolling native: do not intercept the wheel, trap users, or add global smooth scrolling. Keep the vertical and horizontal stories bounded, preserve keyboard previous/next/scene controls, expose every scene on mobile and with reduced motion, measure horizontal travel from the real track width, and clean up all ScrollTriggers after route changes. Do not animate fictional backend telemetry or replace the verified Spoon-Knife content with placeholder data.

## Suggested request for Claude Code

“Audit AutoWiki’s current UI and motion using the supplied screenshots and the files listed above. Improve hierarchy, spacing, typography, transitions, and responsive composition while preserving the mint documentation-SaaS identity, real application behavior, keyboard access, reduced-motion fallbacks, ScrollTrigger cleanup, and source-backed content. Prefer focused refinements over a redesign, and verify changes at 1920, 1440, 1280, 1024, 768, 390, and 320 pixels.”
