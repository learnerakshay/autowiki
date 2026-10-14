// All landing-page copy in one place. Product statements are about what the code does; everything
// specific to the demo repository comes from landingSample.js, and the product name from brand.js.
import { brand } from '../config/brand.js'
import { countWord, landingSample as sample } from './landingSample.js'

/** One vocabulary for the two actions, used by the hero, nav, final CTA and footer. */
export const actions = {
  primary: 'Generate a Wiki',
  secondary: 'Explore Sample Wiki',
}

export const routes = {
  workspace: '/workspace',
  sample: `/wiki/sample/${sample.slug}`,
  architecture: '/architecture',
  chat: '/chat',
}

/** On-page sections, in order. `id` is the anchor, `label` the nav/footer text. */
export const sections = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'explore', label: 'Chapters' },
  { id: 'features', label: 'Features' },
  { id: 'pipeline', label: 'Pipeline' },
]

const steps = [
  { title: 'Connect the repository', text: `Paste an owner/repo or a GitHub URL. ${brand.name} reads the repository's public files.` },
  { title: 'Shape the chapters', text: 'The files become a chapter outline before any prose is generated.' },
  { title: 'Read the generated wiki', text: 'Explanations, source paths, and Mermaid diagrams arrive as one navigable document.' },
]

export const stepper = {
  eyebrow: 'How it works',
  title: 'From repository to documentation.',
  lede: `${countWord(steps.length)} steps take a public repository from its files to a wiki you can read, with every chapter tied to its source.`,
  steps,
  frameLabel: `${brand.name} pipeline`,
  labels: { repository: 'Public repository', outline: 'Planned outline', chapter: 'Generated chapter' },
}

export const chapters = {
  eyebrow: 'Chapters',
  title: `${sample.countWord} chapters. One repository story.`,
  lede: `Browse a real generated wiki for ${sample.repo}, one chapter at a time.`,
  hint: 'Drag, scroll or use ← →',
}

export const features = {
  eyebrow: 'Features',
  title: 'A technical document with the evidence still attached.',
  lede: 'Every chapter stays tied to the files it was written from, so you can check an explanation against the source.',
  cards: {
    chapters: { title: 'Chapters you can navigate', text: 'The repository becomes an ordered set of chapters, each with a title, a summary, and the files it covers.' },
    diagram: { title: 'Diagrams drawn from the same context', text: 'Each chapter can include a Mermaid diagram generated alongside its explanation.' },
    sources: { title: 'Source paths stay attached', text: 'Every chapter lists the repository files it was written from.' },
  },
}

const pipelineStages = ['GitHub repository', 'Repository files', 'Outline generation', 'Chapter generation', 'Mermaid diagrams', 'Structured wiki']

export const pipeline = {
  eyebrow: 'Pipeline',
  title: 'A generation pipeline you can follow.',
  lede: `${countWord(pipelineStages.length)} stages take a repository from GitHub to a structured wiki.`,
  link: 'Explore the architecture',
  stages: pipelineStages,
  chat: {
    label: 'Repository-grounded chat uses a separate embeddings and vector-search pipeline.',
    stages: ['Embeddings', 'Vector search'],
  },
}

export const finale = {
  title: 'Let the repository explain itself.',
  lede: 'Generate structured chapters and Mermaid diagrams from a public GitHub repository.',
  note: 'Public GitHub repositories only. Paste owner/repo or a GitHub URL.',
}

export const footer = {
  product: [
    { label: actions.primary, to: routes.workspace },
    { label: actions.secondary, to: routes.sample },
    { label: 'Architecture', to: routes.architecture },
    { label: 'Chat', to: routes.chat },
  ],
}
