import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, Braces, FileCode2, GitFork, Layers3, MessageSquareText, Network, Workflow } from 'lucide-react'
import { AutoWikiBrand, AutoWikiMark } from '../components/AutoWikiBrand.jsx'
import { Button } from '../components/ui/button.jsx'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const previewChapters = [
  {
    title: 'Introduction',
    description: 'Overview of the project and its purpose.',
    sourcePaths: ['README.md'],
    body: 'This chapter provides an overview of the project and its purpose. The primary goal of this repository is to serve as an example for users looking to understand the process of forking a repository on GitHub. Forking allows users to create a personal copy of an existing project, enabling them to experiment with changes without affecting the original codebase.',
    diagramLabel: 'README.md describes repository forking, which leads to a personal copy or a pull request.',
    diagramLevels: [['README.md'], ['Forking a Repository'], ['Creating a Personal Copy', 'Submitting Pull Requests']],
  },
  {
    title: 'Web Structure',
    description: 'The main HTML structure of the web application.',
    sourcePaths: ['index.html'],
    body: 'The index.html file serves as the main entry point for the web application. It defines the overall structure and content that users will see when they visit the site. Below is a breakdown of its components.',
    diagramLabel: 'index.html contains the head and body sections.',
    diagramLevels: [['index.html'], ['head', 'body']],
  },
  {
    title: 'Styling',
    description: 'CSS styles used to enhance the appearance of the web application.',
    sourcePaths: ['styles.css'],
    body: 'The styles.css file is responsible for defining the visual appearance of the web application. It contains CSS rules that apply to various HTML elements, ensuring a consistent and appealing layout across the application.',
    diagramLabel: 'styles.css defines the universal reset, Octocat image, and paragraph rules.',
    diagramLevels: [['styles.css'], ['*', '#octocat', 'p']],
  },
]

function ProductPreview() {
  const [activeChapter, setActiveChapter] = useState('0')
  const documentRef = useRef(null)
  const previousChapterRef = useRef(activeChapter)
  const chapter = previewChapters[Number(activeChapter)]

  useGSAP(() => {
    if (previousChapterRef.current === activeChapter) return
    previousChapterRef.current = activeChapter
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.fromTo(
      documentRef.current.children,
      { autoAlpha: 0.25, y: 8 },
      { autoAlpha: 1, y: 0, duration: 0.24, stagger: 0.025, ease: 'power3.out', clearProps: 'all' },
    )
  }, { scope: documentRef, dependencies: [activeChapter], revertOnUpdate: true })

  return (
    <Tabs value={activeChapter} onValueChange={setActiveChapter} className="landing-preview" aria-label="Generated wiki preview">
      <div className="landing-preview__bar">
        <span className="landing-preview__identity"><AutoWikiMark /><span>Generated wiki</span></span>
        <span className="landing-preview__address">autowiki / octocat / Spoon-Knife</span>
        <span className="landing-preview__proof">Generated from Spoon-Knife</span>
      </div>
      <div className="landing-preview__repo">
        <div>
          <GitFork aria-hidden="true" />
          <span>octocat / <strong>Spoon-Knife</strong></span>
        </div>
        <span>3 chapters · read-only</span>
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
        <div ref={documentRef} className="landing-preview__document" role="tabpanel" aria-labelledby={`landing-chapter-${activeChapter}`}>
          <div className="landing-preview__document-head">
            <div>
              <p>Generated chapter</p>
              <h2>{chapter.title}</h2>
              <span>{chapter.description}</span>
            </div>
          </div>
          <div className="landing-preview__sources">
            <span>Source paths</span>
            <div>{chapter.sourcePaths.map((path) => <code key={path}>{path}</code>)}</div>
          </div>
          <div className="landing-preview__copy">
            <h3>Chapter excerpt</h3>
            <p>{chapter.body}</p>
          </div>
          <figure className="landing-preview__diagram">
            <figcaption>
              <span>Mermaid diagram excerpt</span>
              <Braces aria-hidden="true" />
            </figcaption>
            <div className="landing-preview__flow" role="img" aria-label={chapter.diagramLabel}>
              {chapter.diagramLevels.map((level, index) => (
                <div className="landing-preview__flow-level" key={level.join('-')}>
                  {level.map((node) => <span key={node}>{node}</span>)}
                  {index < chapter.diagramLevels.length - 1 && <i aria-hidden="true" />}
                </div>
              ))}
            </div>
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
    const media = gsap.matchMedia()

    media.add({
      motion: '(prefers-reduced-motion: no-preference)',
      compact: '(max-width: 760px)',
    }, ({ conditions }) => {
      if (!conditions.motion) return

      const distance = conditions.compact ? 10 : 18
      const enter = { autoAlpha: 1, y: 0, duration: conditions.compact ? 0.38 : 0.5, ease: 'power3.out', clearProps: 'all' }

      gsap.timeline()
        .fromTo('.landing-hero__sequence', { autoAlpha: 0, y: distance * 0.6 }, enter)
        .fromTo('.landing-hero h1', { autoAlpha: 0, y: distance }, enter, '-=0.38')
        .fromTo('.landing-hero__lede', { autoAlpha: 0, y: distance * 0.8 }, enter, '-=0.34')
        .fromTo('.landing-hero__actions, .landing-hero__note', { autoAlpha: 0, y: distance * 0.6 }, { ...enter, stagger: 0.06 }, '-=0.32')
        .fromTo('.landing-preview',
          { autoAlpha: 0, y: distance, clipPath: 'inset(0 0 8% 0 round 12px)' },
          { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0% 0 round 12px)', duration: conditions.compact ? 0.45 : 0.66, ease: 'power4.out', clearProps: 'all' },
          '-=0.3',
        )

      gsap.timeline({ scrollTrigger: { trigger: '.landing-process', start: 'top 72%', once: true } })
        .from('.landing-process .landing-section__heading', { autoAlpha: 0, y: distance, duration: 0.46, ease: 'power3.out', clearProps: 'all' })
        .fromTo('.process-flow', { '--connector-progress': 0 }, { '--connector-progress': 1, duration: 0.62, ease: 'power2.out', clearProps: '--connector-progress' }, '-=0.12')
        .from('.process-flow > li', { autoAlpha: 0, y: distance, duration: 0.42, stagger: 0.11, ease: 'power3.out', clearProps: 'all' }, '-=0.46')

      gsap.timeline({ scrollTrigger: { trigger: '.landing-features', start: 'top 70%', once: true } })
        .from('.landing-features .landing-section__heading', { autoAlpha: 0, y: distance, duration: 0.46, ease: 'power3.out', clearProps: 'all' })
        .from('.feature-block--chapters', { autoAlpha: 0, y: distance, duration: 0.52, ease: 'power3.out', clearProps: 'all' }, '-=0.18')
        .from('.feature-block--diagram, .feature-block--chat', { autoAlpha: 0, y: distance * 0.75, duration: 0.46, stagger: 0.1, ease: 'power3.out', clearProps: 'all' }, '-=0.34')

      gsap.timeline({ scrollTrigger: { trigger: '.architecture', start: 'top 74%', once: true } })
        .from('.architecture__heading', { autoAlpha: 0, y: distance, duration: 0.46, ease: 'power3.out', clearProps: 'all' })
        .from('.pipeline > li', { autoAlpha: 0.35, y: distance * 0.6, duration: 0.38, stagger: 0.07, ease: 'power3.out', clearProps: 'all' }, '-=0.2')
        .from('.architecture__note', { autoAlpha: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' }, '-=0.12')
    })

    return () => media.revert()
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
            <Link to="/architecture">Architecture</Link>
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
              <div className="landing-hero__sequence" aria-label="Repository to documentation sequence">
                <span>Repository</span><i aria-hidden="true" /><span>Chapters</span><i aria-hidden="true" /><span>Wiki</span>
              </div>
              <h1 id="landing-title">Your repository.<br />Beautifully documented.</h1>
              <p className="landing-hero__lede">Transform GitHub repositories into structured technical wikis with AI-generated chapters, clear explanations, and Mermaid diagrams.</p>
              <div className="landing-hero__actions">
                <Button asChild>
                  <Link to="/workspace">Generate a Wiki <ArrowRight aria-hidden="true" /></Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link to="/wiki/sample/spoon-knife">Explore Sample Wiki</Link>
                </Button>
              </div>
              <p className="landing-hero__note"><Workflow aria-hidden="true" /> Real generated output, or <a href="#how-it-works">Explore How It Works</a>.</p>
            </div>
            <ProductPreview />
          </div>
        </section>

        <section id="how-it-works" className="landing-section landing-process" aria-labelledby="process-title">
          <div className="landing-section__heading">
            <h2 id="process-title">From repository to documentation.</h2>
            <p>Source files become a planned chapter outline, grounded explanations, and per-chapter diagrams. Chat indexing remains a separate workflow.</p>
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
                <h3>Structured Wiki Generation</h3>
                <p>AutoWiki proactively organizes repository knowledge into a navigable technical document with focused chapters.</p>
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
                <h3>Per-Chapter Mermaid Diagrams</h3>
                <p>Each generated chapter can pair its explanation with a Mermaid diagram grounded in the same source files.</p>
              </div>
              <div className="diagram-proof" role="img" aria-label="README.md leads to the forking process, then to a personal copy">
                <span>README.md</span><i aria-hidden="true" /><span>Forking Process</span><i aria-hidden="true" /><span>Personal Copy</span>
              </div>
            </article>

            <article className="feature-block feature-block--chat">
              <div className="feature-block__copy">
                <MessageSquareText aria-hidden="true" />
                <h3>Grounded Follow-Up Questions</h3>
                <p>After separate indexing, ask focused questions and inspect source paths without replacing the generated wiki.</p>
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
              <p className="architecture__label">Conceptual processing order</p>
              <h2 id="architecture-title">Designed around a real generation pipeline.</h2>
              <p>The landing story reflects the current implementation rather than a fictional live progress tracker.</p>
            </div>
          </div>
          <ol className="pipeline" aria-label="Wiki generation pipeline">
            {pipeline.map((stage) => <li key={stage}>{stage}</li>)}
          </ol>
          <div className="architecture__footer">
            <p className="architecture__note">Repository-grounded chat uses a separate embeddings and vector-search pipeline.</p>
            <Button asChild variant="secondary"><Link to="/architecture">Explore the architecture <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
        </section>

        <section className="landing-cta" aria-labelledby="cta-title">
          <div>
            <h2 id="cta-title">Turn your next repository into documentation.</h2>
            <p>Generate structured chapters and Mermaid diagrams from a public GitHub repository.</p>
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
            <Link to="/architecture">Architecture</Link>
            <Link to="/workspace">Workspace</Link>
            <Link to="/chat">Chat</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
