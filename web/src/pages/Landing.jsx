import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, Braces, FileCode2, GitFork, Layers3, MessageSquareText, Network, Workflow } from 'lucide-react'
import { AutoWikiBrand } from '../components/AutoWikiBrand.jsx'
import { Button } from '../components/ui/button.jsx'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'

gsap.registerPlugin(useGSAP)

const previewChapters = [
  {
    title: 'Introduction',
    description: 'Overview of the project and its purpose.',
    file: 'README.md',
    heading: 'A practical guide to repository forking',
    body: 'This project serves as a practical example for users looking to understand the process of forking a repository on GitHub. When a user forks this repository, they create a personal version that allows them to experiment with changes without affecting the original project.',
    flow: ['README.md', 'Forking Process', 'Personal Copy'],
  },
  {
    title: 'Web Structure',
    description: 'The main HTML structure of the web application.',
    file: 'index.html',
    heading: 'How the page is assembled',
    body: 'The index.html file serves as the main entry point for the web application. It defines the overall structure and content that users will see when they visit the site, separating document metadata from the visible body content.',
    flow: ['index.html', 'head', 'body'],
  },
  {
    title: 'Styling',
    description: 'CSS styles used to enhance the appearance of the web application.',
    file: 'styles.css',
    heading: 'The visual rules behind the page',
    body: 'The styles.css file creates a clean and organized layout. Global resets establish a consistent starting point, while dedicated selectors control the Octocat image and paragraph presentation.',
    flow: ['styles.css', '#octocat', 'p selector'],
  },
]

function ProductPreview() {
  const [activeChapter, setActiveChapter] = useState('0')
  const chapter = previewChapters[Number(activeChapter)]

  return (
    <Tabs value={activeChapter} onValueChange={setActiveChapter} className="landing-preview" aria-label="Generated wiki preview">
      <div className="landing-preview__bar">
        <span className="landing-preview__traffic" aria-hidden="true"><i /><i /><i /></span>
        <span className="landing-preview__address">autowiki / octocat / Spoon-Knife</span>
        <span className="landing-preview__proof">Verified output</span>
      </div>
      <div className="landing-preview__repo">
        <div>
          <GitFork aria-hidden="true" />
          <span>octocat / <strong>Spoon-Knife</strong></span>
        </div>
        <span>3 chapters</span>
      </div>
      <div className="landing-preview__body">
        <aside className="landing-preview__rail" aria-label="Preview chapters">
          <p>Chapters</p>
          <TabsList className="landing-preview__chapters">
            {previewChapters.map((item, index) => (
              <TabsTrigger id={`landing-chapter-${index}`} key={item.title} value={String(index)} className="landing-preview__chapter">
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </aside>
        <div className="landing-preview__document" role="tabpanel" aria-labelledby={`landing-chapter-${activeChapter}`}>
          <div className="landing-preview__document-head">
            <div>
              <p>Generated chapter</p>
              <h2>{chapter.title}</h2>
              <span>{chapter.description}</span>
            </div>
            <code>{chapter.file}</code>
          </div>
          <div className="landing-preview__copy">
            <h3>{chapter.heading}</h3>
            <p>{chapter.body}</p>
          </div>
          <figure className="landing-preview__diagram">
            <figcaption>
              <span>Mermaid diagram excerpt</span>
              <Braces aria-hidden="true" />
            </figcaption>
            <ol className="landing-preview__flow" aria-label={`${chapter.flow.join(' leads to ')}`}>
              {chapter.flow.map((node) => <li key={node}>{node}</li>)}
            </ol>
          </figure>
        </div>
      </div>
    </Tabs>
  )
}

const processSteps = [
  { icon: GitFork, title: 'Connect your repository', text: 'Provide a public GitHub repository in owner/repository format.' },
  { icon: Layers3, title: 'Plan the structure', text: 'AutoWiki analyzes repository files and organizes them into a focused chapter outline.' },
  { icon: BookOpenText, title: 'Generate the wiki', text: 'Each chapter receives a technical explanation and a Mermaid diagram grounded in the source.' },
]

const pipeline = ['GitHub Repository', 'Repository Files', 'Outline Generation', 'Chapter Generation', 'Mermaid Diagrams', 'Structured Wiki']

export default function Landing() {
  const pageRef = useRef(null)

  useGSAP(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    gsap.fromTo('.landing-hero__copy > *', { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out', clearProps: 'all' })
    gsap.fromTo('.landing-preview', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.72, delay: 0.14, ease: 'power4.out', clearProps: 'all' })
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="landing-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <header className="landing-header">
        <div className="landing-header__inner">
          <AutoWikiBrand />
          <nav className="landing-nav" aria-label="Landing navigation">
            <a href="#how-it-works">How it works</a>
            <a href="#features">Features</a>
            <Link to="/workspace">Workspace</Link>
            <Link to="/chat">Chat</Link>
          </nav>
          <Button asChild className="landing-header__cta">
            <Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </header>

      <main id="main-content" className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__inner">
            <div className="landing-hero__copy">
              <p className="landing-eyebrow">AI-powered repository documentation</p>
              <h1 id="landing-title">Your repository.<br />Beautifully documented.</h1>
              <p className="landing-hero__lede">Transform GitHub repositories into structured technical wikis with AI-generated chapters, clear explanations, and Mermaid diagrams.</p>
              <div className="landing-hero__actions">
                <Button asChild>
                  <Link to="/workspace">Generate a Wiki <ArrowRight aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="secondary">
                  <a href="#how-it-works">Explore How It Works</a>
                </Button>
              </div>
              <p className="landing-hero__note"><Workflow aria-hidden="true" /> From source code to structured documentation.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-process" aria-labelledby="process-title">
          <div className="landing-section__heading">
            <h2 id="process-title">From repository to documentation.</h2>
            <p>A deliberate generation pipeline turns source files into a chaptered technical narrative—without making chat indexing a prerequisite.</p>
          </div>
          <ol className="process-flow">
            {processSteps.map(({ icon: Icon, title, text }, index) => (
              <li key={title}>
                <div className="process-flow__number">{String(index + 1).padStart(2, '0')}</div>
                <Icon aria-hidden="true" />
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="features" className="landing-section landing-features" aria-labelledby="features-title">
          <div className="landing-section__heading landing-section__heading--wide">
            <h2 id="features-title">Everything your repository needs to explain itself.</h2>
            <p>Wiki generation leads. Diagrams make relationships visible. Grounded questions remain available as a separate supporting workflow.</p>
          </div>
          <div className="feature-grid">
            <article className="feature-block feature-block--chapters">
              <div className="feature-block__copy">
                <BookOpenText aria-hidden="true" />
                <h3>Structured Wiki Chapters</h3>
                <p>Repository understanding becomes a navigable sequence instead of one long, unstructured response.</p>
              </div>
              <div className="chapter-proof" aria-label="Example chapter navigation from generated Spoon-Knife output">
                <div><span>01</span><strong>Introduction</strong><FileCode2 aria-hidden="true" /></div>
                <div><span>02</span><strong>Web Structure</strong><FileCode2 aria-hidden="true" /></div>
                <div><span>03</span><strong>Styling</strong><FileCode2 aria-hidden="true" /></div>
              </div>
            </article>

            <article className="feature-block feature-block--diagram">
              <div className="feature-block__copy">
                <Network aria-hidden="true" />
                <h3>Visual Architecture Diagrams</h3>
                <p>Each generated chapter can include a Mermaid diagram that explains relationships alongside the prose.</p>
              </div>
              <div className="diagram-proof" role="img" aria-label="README.md leads to the forking process, then to a personal copy">
                <span>README.md</span><i aria-hidden="true" /><span>Forking Process</span><i aria-hidden="true" /><span>Personal Copy</span>
              </div>
            </article>

            <article className="feature-block feature-block--chat">
              <div className="feature-block__copy">
                <MessageSquareText aria-hidden="true" />
                <h3>Repository-Grounded Questions</h3>
                <p>Index a repository separately, then ask focused questions whose answers include source paths.</p>
              </div>
              <div className="chat-proof">
                <span>What does this repository contain?</span>
                <code>README.md</code>
              </div>
            </article>
          </div>
        </section>

        <section className="landing-section architecture" aria-labelledby="architecture-title">
          <div className="architecture__heading">
            <Network aria-hidden="true" />
            <div>
              <h2 id="architecture-title">Designed around a real generation pipeline.</h2>
              <p>The landing story reflects the current implementation rather than a fictional live progress tracker.</p>
            </div>
          </div>
          <ol className="pipeline" aria-label="Wiki generation pipeline">
            {pipeline.map((stage) => <li key={stage}>{stage}</li>)}
          </ol>
          <p className="architecture__note">Repository-grounded chat uses a separate embeddings and vector-search pipeline.</p>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">Your next repository deserves better documentation.</h2>
            <p>Start with a public GitHub repository and explore its generated technical wiki.</p>
          </div>
          <Button asChild>
            <Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div>
            <AutoWikiBrand />
            <p>Structured technical wikis generated from public GitHub repositories.</p>
          </div>
          <nav aria-label="Footer navigation">
            <a href="#how-it-works">How it works</a>
            <Link to="/workspace">Workspace</Link>
            <Link to="/chat">Chat</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
