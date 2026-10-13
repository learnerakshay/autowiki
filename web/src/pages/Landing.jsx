import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, FileCode2, GitFork, Menu, MessageSquareText, Network, X } from 'lucide-react'
import { AutoWikiBrand, AutoWikiMark } from '../components/AutoWikiBrand.jsx'
import { Button } from '../components/ui/button.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'
import sampleWiki from '../data/samples/spoon-knife.json'
import { motion, motionQuery, prefersReducedMotion } from '../lib/motion.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const diagramLevels = [
  [['README.md'], ['Forking a Repository', 'Pull Requests'], ['Personal Copy', 'Contribute to Original Project']],
  [['index.html'], ['head', 'body'], ['meta', 'title', 'link', 'img', 'p']],
  [['styles.css'], ['* selector', '#octocat', 'p'], ['display: block', 'width: 384px', 'margin: 50px auto']],
]

const previewChapters = sampleWiki.chapters.map((chapter, index) => ({
  ...chapter,
  excerpt: chapter.markdown.replace(/^# .+\n+/, '').split('\n\n')[0].replace(/[`*_]/g, ''),
  diagramLevels: diagramLevels[index],
}))

const processSteps = [
  { number: '01', title: 'Connect the repository', text: 'Point AutoWiki at a public GitHub repository using its owner and repository name.' },
  { number: '02', title: 'Shape the chapters', text: 'Repository files become a focused outline before any chapter prose is generated.' },
  { number: '03', title: 'Read the generated wiki', text: 'Explanations, source paths, and Mermaid diagrams arrive as one navigable document.' },
]

const pipeline = ['GitHub repository', 'Repository files', 'Outline generation', 'Chapter generation', 'Mermaid diagrams', 'Structured wiki']

function Diagram({ chapter, compact = false }) {
  return (
    <div className={`product-diagram${compact ? ' product-diagram--compact' : ''}`} role="img" aria-label={`Generated Mermaid structure for ${chapter.title}`}>
      {chapter.diagramLevels.map((level, levelIndex) => (
        <div className="product-diagram__level" key={level.join('-')}>
          <div>{level.map((node) => <span key={node}>{node}</span>)}</div>
          {levelIndex < chapter.diagramLevels.length - 1 && <i aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}

function ProductShowcase() {
  const [activeMode, setActiveMode] = useState('chapters')
  const [activeChapter, setActiveChapter] = useState(0)
  const documentRef = useRef(null)
  const chapter = previewChapters[activeChapter]

  useGSAP(() => {
    if (prefersReducedMotion() || !documentRef.current) return
    gsap.fromTo(documentRef.current.children, { autoAlpha: 0.3, y: 8 }, { autoAlpha: 1, y: 0, duration: motion.selection, stagger: 0.025, ease: motion.ease, clearProps: 'all' })
  }, { scope: documentRef, dependencies: [activeChapter, activeMode], revertOnUpdate: true })

  return (
    <Tabs value={activeMode} onValueChange={setActiveMode} className="product-proof">
      <TabsList className="product-proof__tabs" aria-label="Explore the generated output">
        <TabsTrigger value="chapters"><BookOpenText aria-hidden="true" />Wiki chapters</TabsTrigger>
        <TabsTrigger value="architecture"><Network aria-hidden="true" />Architecture diagrams</TabsTrigger>
        <TabsTrigger value="sources"><FileCode2 aria-hidden="true" />Source context</TabsTrigger>
      </TabsList>

      <div className="product-window">
        <div className="product-window__bar">
          <span><AutoWikiMark /> Generated wiki</span>
          <span className="product-window__repo"><GitFork aria-hidden="true" /> octocat / <strong>Spoon-Knife</strong></span>
          <span className="product-window__bar-actions"><span>Pre-generated example</span><Link to="/wiki/sample/spoon-knife">Explore Wiki <ArrowRight aria-hidden="true" /></Link></span>
        </div>
        <div className="product-window__layout">
          <aside className="product-window__rail" aria-label="Sample wiki chapters">
            <p>Chapters</p>
            <div className="product-window__chapter-list">
              {previewChapters.map((item, index) => (
                <button key={item.title} type="button" className={activeChapter === index ? 'is-active' : ''} aria-pressed={activeChapter === index} onClick={() => setActiveChapter(index)}>
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong>
                </button>
              ))}
            </div>
            <div className="product-window__meta"><span>3 chapters</span><span>Read-only</span></div>
          </aside>

          <div ref={documentRef} className="product-window__document">
            <TabsContent value="chapters" hidden={activeMode !== 'chapters'}>
              <h2>{chapter.title}</h2><p className="product-window__description">{chapter.description}</p>
              <div className="product-window__source-line"><span>Source path</span>{chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
              <h3>Chapter excerpt</h3><p className="product-window__excerpt">{chapter.excerpt}</p>
            </TabsContent>
            <TabsContent value="architecture" hidden={activeMode !== 'architecture'}>
              <h2>{chapter.title}</h2><p className="product-window__description">The chapter diagram is generated from the same source context as the explanation.</p><Diagram chapter={chapter} />
            </TabsContent>
            <TabsContent value="sources" hidden={activeMode !== 'sources'}>
              <h2>Source context</h2><p className="product-window__description">Every sample chapter names the repository files used to create it.</p>
              <div className="source-ledger">{previewChapters.map((item, index) => (
                <button type="button" key={item.title} onClick={() => setActiveChapter(index)}><FileCode2 aria-hidden="true" /><span><strong>{item.filePaths.join(', ')}</strong><small>{item.title}</small></span><ArrowRight aria-hidden="true" /></button>
              ))}</div>
            </TabsContent>
          </div>

          <aside className="product-window__context" aria-label="Generated chapter context">
            <div className="product-window__context-head"><Network aria-hidden="true" /><span>Diagram context</span></div>
            <Diagram chapter={chapter} compact />
            <div className="product-window__context-source"><span>Grounded in</span>{chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
            <pre className="product-window__context-code"><code>{chapter.mermaid.split('\n').slice(0, 3).join('\n')}</code></pre>
          </aside>
        </div>
      </div>
    </Tabs>
  )
}

function LandingNavigation() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    if (!open) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])
  const close = () => setOpen(false)

  return (
    <header className="landing-header"><div className="landing-header__inner">
      <AutoWikiBrand />
      <nav className="landing-nav landing-nav--desktop" aria-label="Landing navigation"><a href="#how-it-works">How it works</a><a href="#features">Features</a><Link to="/architecture">Architecture</Link><Link to="/workspace">Workspace</Link><Link to="/chat">Chat</Link></nav>
      <Button asChild className="landing-header__cta"><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button>
      <button className="landing-menu-button" type="button" aria-expanded={open} aria-controls="landing-mobile-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen((value) => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      {open && <nav id="landing-mobile-navigation" className="landing-nav landing-nav--mobile" aria-label="Mobile navigation"><a href="#how-it-works" onClick={close}>How it works</a><a href="#features" onClick={close}>Features</a><Link to="/architecture" onClick={close}>Architecture</Link><Link to="/workspace" onClick={close}>Workspace</Link><Link to="/chat" onClick={close}>Chat</Link></nav>}
    </div></header>
  )
}

export default function Landing() {
  const pageRef = useRef(null)
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ motion: motionQuery, compact: '(max-width: 760px)' }, ({ conditions }) => {
      if (!conditions.motion) return
      const distance = conditions.compact ? 10 : 18
      gsap.timeline().from('.landing-hero h1', { autoAlpha: 0, y: distance, duration: motion.entrance, ease: motion.ease, clearProps: 'all' }).from('.landing-hero__lede, .landing-hero__actions', { autoAlpha: 0, y: distance * 0.65, duration: motion.content, stagger: 0.06, ease: motion.ease, clearProps: 'all' }, '-=0.34').from('.product-proof', { autoAlpha: 0, y: distance, duration: 0.58, ease: 'power4.out', clearProps: 'all' }, '-=0.3')
      gsap.utils.toArray('.landing-section, .landing-cta').forEach((section) => gsap.from(section.children, { autoAlpha: 0, y: distance, duration: 0.52, stagger: 0.08, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: section, start: 'top 78%', once: true } }))
    })
    return () => media.revert()
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="landing-shell"><a className="skip-link" href="#main-content">Skip to content</a><LandingNavigation />
      <main id="main-content" className="landing-main">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero__copy"><h1 id="landing-title">Your repository,<br />beautifully documented.</h1><p className="landing-hero__lede">Transform a public GitHub repository into a structured technical wiki with generated chapters, source context, and Mermaid diagrams.</p><div className="landing-hero__actions"><Button asChild><Link to="/workspace">Generate a Wiki <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary"><Link to="/wiki/sample/spoon-knife">Explore Sample Wiki</Link></Button></div></div>
          <ProductShowcase />
        </section>

        <section id="how-it-works" className="landing-section landing-process" aria-labelledby="process-title"><div className="landing-section__heading"><h2 id="process-title">From repository to documentation.</h2><p>One deliberate path turns repository structure into a wiki people can actually navigate.</p></div><ol className="process-flow">{processSteps.map((step) => <li key={step.title}><span className="process-flow__number">{step.number}</span><div><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></section>

        <section id="features" className="landing-section landing-features" aria-labelledby="features-title"><div className="landing-section__heading landing-section__heading--wide"><h2 id="features-title">A technical document with the evidence still attached.</h2><p>Chapters lead the reading experience. Diagrams and source paths make the generated explanation easier to inspect.</p></div><div className="feature-composition">
          <article className="feature-proof feature-proof--chapters"><div className="feature-proof__copy"><BookOpenText aria-hidden="true" /><h3>Structured wiki chapters</h3><p>A navigable document replaces a pile of disconnected repository notes.</p></div><div className="feature-chapters" aria-label="Sample generated Spoon-Knife chapters">{previewChapters.map((chapter, index) => <div key={chapter.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{chapter.title}</strong><code>{chapter.filePaths[0]}</code></div>)}</div></article>
          <article className="feature-proof feature-proof--diagram"><div className="feature-proof__copy"><Network aria-hidden="true" /><h3>Relationships made visible</h3><p>Each chapter can pair explanation with a Mermaid diagram generated from the same context.</p></div><Diagram chapter={previewChapters[0]} compact /></article>
          <article className="feature-proof feature-proof--chat"><div className="feature-proof__copy"><MessageSquareText aria-hidden="true" /><h3>Grounded follow-up questions</h3><p>After separate indexing, chat can answer focused questions and point back to source paths.</p></div><div className="feature-chat"><span>What does this repository demonstrate?</span><code>README.md</code></div></article>
        </div></section>

        <section className="landing-section architecture" aria-labelledby="architecture-title"><div className="architecture__heading"><div><h2 id="architecture-title">A generation pipeline you can follow.</h2><p>The product story mirrors the current implementation instead of simulating a fictional live process.</p></div><Button asChild variant="secondary"><Link to="/architecture">Explore the architecture <ArrowRight aria-hidden="true" /></Link></Button></div><ol className="pipeline" aria-label="Wiki generation pipeline">{pipeline.map((stage, index) => <li key={stage}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong></li>)}</ol><p className="architecture__note">Repository-grounded chat uses a separate embeddings and vector-search pipeline.</p></section>

        <section className="landing-cta" aria-labelledby="cta-title"><div><h2 id="cta-title">Let the repository explain itself.</h2><p>Generate structured chapters and Mermaid diagrams from a public GitHub repository.</p></div><Button asChild><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button></section>
      </main>
      <footer className="landing-footer"><div className="landing-footer__inner"><div><AutoWikiBrand /><p>Structured technical wikis generated from public GitHub repositories.</p></div><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><Link to="/architecture">Architecture</Link><Link to="/workspace">Workspace</Link><Link to="/chat">Chat</Link></nav></div></footer>
    </div>
  )
}
