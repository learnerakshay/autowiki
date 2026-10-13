// Single data source for the landing-page hero mockup.
//
// To show a different repository, generate it in the workspace, copy the resulting
// `wiki-output/<owner>-<repo>.json` to `src/data/samples/`, add the `id`, `sourceRepositoryUrl`
// and `provenance` fields the Spoon-Knife file has, and change the import below.
// Nothing in the hero hard-codes the repo name, chapter titles, file paths or diagram nodes.
import sampleWiki from './samples/spoon-knife.json'
import { buildDiagram } from '../lib/mermaidGraph.js'

export { sampleWiki }

// Chapter shown first. Lead with the most substantive chapter, not necessarily the first one.
const FEATURED_CHAPTER = 1

// Upper bounds that keep a large generated graph legible inside the preview.
const DIAGRAM_LIMITS = { maxDepth: 4, maxPerLevel: 5 }

const proseParagraphs = (markdown) => markdown
  .replace(/^# .+\n+/, '')
  .split('\n\n')
  .map((paragraph) => paragraph.trim())
  .filter((paragraph) => paragraph && !/^(#|-|\d+\.|```|\|)/.test(paragraph))
  .map((paragraph) => paragraph.replace(/[`*_]/g, ''))

const [owner, name] = sampleWiki.repo.split('/')

export const heroSample = {
  slug: sampleWiki.id,
  repo: sampleWiki.repo,
  owner,
  name,
  featuredChapter: Math.min(FEATURED_CHAPTER, sampleWiki.chapters.length - 1),
  chapters: sampleWiki.chapters.map((chapter) => ({
    title: chapter.title,
    description: chapter.description,
    filePaths: chapter.filePaths,
    excerpt: proseParagraphs(chapter.markdown).slice(0, 2),
    mermaidPreview: chapter.mermaid.split('\n').slice(0, 3).join('\n'),
    diagram: buildDiagram(chapter.mermaid, DIAGRAM_LIMITS),
  })),
}
