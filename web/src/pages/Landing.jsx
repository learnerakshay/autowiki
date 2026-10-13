import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenText, FileCode2, Menu, MessageSquareText, Network, X } from 'lucide-react'
import { AutoWikiBrand, AutoWikiMark } from '../components/AutoWikiBrand.jsx'
import { Button } from '../components/ui/button.jsx'
import { AnimatedHeading } from '../components/hero/AnimatedHeading.jsx'
import { Hero } from '../components/hero/Hero.jsx'
import { Diagram } from '../components/hero/StaticDiagram.jsx'
import { sampleWiki } from '../data/heroSample.js'
import { buildDiagram } from '../lib/mermaidGraph.js'
import { motionQuery, prefersReducedMotion } from '../lib/motion.js'
import './Landing.css'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const diagramLevels = [
  [['README.md'], ['Forking a Repository', 'Pull Requests'], ['Personal Copy', 'Contribute to Original Project']],
  [['index.html'], ['head', 'body'], ['meta', 'title', 'link', 'img', 'p']],
  [['styles.css'], ['* selector', '#octocat', 'p'], ['display: block', 'width: 384px', 'margin: 50px auto']],
]

const previewChapters = sampleWiki.chapters.map((chapter, index) => ({
  ...chapter,
  excerpt: chapter.markdown.replace(/^# .+\n+/, '').split('\n\n')[0].replace(/[`*_]/g, ''),
  excerptParagraphs: chapter.markdown
    .replace(/^# .+\n+/, '')
    .split('\n\n')
    .filter((paragraph) => paragraph && !paragraph.startsWith('#') && !paragraph.startsWith('```'))
    .slice(0, 2)
    .map((paragraph) => paragraph.replace(/[`*_]/g, '')),
  diagramLevels: diagramLevels[index] ?? buildDiagram(chapter.mermaid, { maxDepth: 3, maxPerLevel: 5 }).levels.map((level) => level.map((node) => node.label)),
}))

const processSteps = [
  { number: '01', title: 'Connect the repository', text: 'Point AutoWiki at a public GitHub repository using its owner and repository name.' },
  { number: '02', title: 'Shape the chapters', text: 'Repository files become a focused outline before any chapter prose is generated.' },
  { number: '03', title: 'Read the generated wiki', text: 'Explanations, source paths, and Mermaid diagrams arrive as one navigable document.' },
]

const pipeline = ['GitHub repository', 'Repository files', 'Outline generation', 'Chapter generation', 'Mermaid diagrams', 'Structured wiki']

function ProcessVisual({ activeStage }) {
  const chapter = previewChapters[0]

  return (
    <div className="process-visual" aria-hidden="true">
      <div className="process-visual__bar">
        <span><AutoWikiMark /> AutoWiki pipeline</span>
        <code>octocat/Spoon-Knife</code>
      </div>
      <div className="process-visual__canvas">
        <div className={`process-visual__layer process-visual__repository${activeStage === 0 ? ' is-active' : ''}`}>
          <p>Public repository</p>
          <strong>octocat/Spoon-Knife</strong>
          <div className="process-file-tree">
            {chapter.filePaths.concat(['index.html', 'styles.css']).map((path, index) => (
              <span key={`${path}-${index}`}><FileCode2 />{path}</span>
            ))}
          </div>
        </div>
        <div className={`process-visual__layer process-visual__outline${activeStage === 1 ? ' is-active' : ''}`}>
          <p>Planned outline</p>
          <div className="process-outline-list">
            {previewChapters.map((item, index) => (
              <div key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong><code>{item.filePaths[0]}</code></div>
            ))}
          </div>
        </div>
        <div className={`process-visual__layer process-visual__document${activeStage === 2 ? ' is-active' : ''}`}>
          <div><span>Generated chapter</span><code>{chapter.filePaths[0]}</code></div>
          <h3>{chapter.title}</h3>
          <p>{chapter.excerpt}</p>
          <Diagram chapter={chapter} compact />
        </div>
      </div>
      <div className="process-visual__footer"><span>Repository source</span><i /><span>Structured wiki</span></div>
    </div>
  )
}

function HorizontalStory({ activeScene, onSelect }) {
  return (
    <section id="explore" className="horizontal-story" aria-labelledby="horizontal-story-title">
      <div className="horizontal-story__sticky">
        <div className="horizontal-story__heading">
          <div>
            <AnimatedHeading id="horizontal-story-title" lines={['Three chapters.', 'One repository story.']} />
            <p>Move across the real Spoon-Knife sample—from purpose, to structure, to presentation.</p>
          </div>
          <div className="horizontal-story__controls" aria-label="Sample chapter controls">
            <button type="button" aria-label="Previous chapter" disabled={activeScene === 0} onClick={() => onSelect(activeScene - 1)}><ArrowLeft aria-hidden="true" /></button>
            <div role="group" aria-label="Choose a sample chapter">
              {previewChapters.map((chapter, index) => (
                <button
                  key={chapter.title}
                  type="button"
                  className={activeScene === index ? 'is-active' : ''}
                  aria-label={`Open ${chapter.title}`}
                  aria-pressed={activeScene === index}
                  onClick={() => onSelect(index)}
                ><span>{index + 1}</span></button>
              ))}
            </div>
            <button type="button" aria-label="Next chapter" disabled={activeScene === previewChapters.length - 1} onClick={() => onSelect(activeScene + 1)}><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>

        <div className="horizontal-story__frame">
          <div className="horizontal-story__track">
            {previewChapters.map((chapter, index) => (
              <article id={`horizontal-scene-${index}`} className={`horizontal-scene horizontal-scene--${index + 1}${activeScene === index ? ' is-active' : ''}`} key={chapter.title}>
                <div className="horizontal-scene__copy">
                  <p>Chapter {String(index + 1).padStart(2, '0')} / {String(previewChapters.length).padStart(2, '0')}</p>
                  <h3>{chapter.title}</h3>
                  <p>{chapter.description}</p>
                  <div className="horizontal-scene__paths"><span>Grounded in</span>{chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
                </div>

                {index === 0 ? (
                  <div className="horizontal-scene__artifact horizontal-source-artifact">
                    <div><FileCode2 aria-hidden="true" /><span>README.md</span><small>repository source</small></div>
                    <blockquote>“This repo is for demonstration purposes only.”</blockquote>
                    <div className="horizontal-source-artifact__route"><span>Fork repository</span><i /><span>Make changes</span><i /><span>Open pull request</span></div>
                  </div>
                ) : null}

                {index === 1 ? (
                  <div className="horizontal-scene__artifact horizontal-outline-artifact">
                    <div className="horizontal-outline-artifact__bar"><span>index.html</span><small>generated structure</small></div>
                    <Diagram chapter={chapter} />
                  </div>
                ) : null}

                {index === 2 ? (
                  <div className="horizontal-scene__artifact horizontal-document-artifact">
                    <div className="horizontal-document-artifact__bar"><span>Generated chapter</span><code>styles.css</code></div>
                    <h4>Styling the Octocat</h4>
                    <p>The source sets a block layout, a fixed image width, and centered margins.</p>
                    <pre><code>{'#octocat {\n  display: block;\n  width: 384px;\n  margin: 50px auto;\n}'}</code></pre>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </div>

        <p className="horizontal-story__status" aria-live="polite">Showing {previewChapters[activeScene].title}. Scroll to move between chapters, or use the chapter controls.</p>
      </div>
    </section>
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
      <nav className="landing-nav landing-nav--desktop" aria-label="Landing navigation"><a href="#how-it-works">How it works</a><a href="#explore">Explore</a><a href="#features">Features</a><Link to="/architecture">Architecture</Link><Link to="/workspace">Workspace</Link><Link to="/chat">Chat</Link></nav>
      <Button asChild className="landing-header__cta"><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button>
      <button className="landing-menu-button" type="button" aria-expanded={open} aria-controls="landing-mobile-navigation" aria-label={open ? 'Close navigation' : 'Open navigation'} onClick={() => setOpen((value) => !value)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      {open && <nav id="landing-mobile-navigation" className="landing-nav landing-nav--mobile" aria-label="Mobile navigation"><a href="#how-it-works" onClick={close}>How it works</a><a href="#explore" onClick={close}>Explore</a><a href="#features" onClick={close}>Features</a><Link to="/architecture" onClick={close}>Architecture</Link><Link to="/workspace" onClick={close}>Workspace</Link><Link to="/chat" onClick={close}>Chat</Link></nav>}
    </div></header>
  )
}

export default function Landing() {
  const pageRef = useRef(null)
  const [activeStory, setActiveStory] = useState(0)
  const [activeHorizontalScene, setActiveHorizontalScene] = useState(0)
  const activeHorizontalSceneRef = useRef(0)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ motion: motionQuery, compact: '(max-width: 760px)', desktop: '(min-width: 901px)' }, ({ conditions }) => {
      if (!conditions.motion) return
      const distance = conditions.compact ? 10 : 18
      gsap.utils.toArray('[data-motion-heading="section"]').forEach((heading) => {
        gsap.from(heading.querySelectorAll('.motion-heading__word'), {
          autoAlpha: 0,
          yPercent: 85,
          duration: 0.58,
          stagger: 0.038,
          ease: 'power3.out',
          clearProps: 'all',
          scrollTrigger: { trigger: heading, start: 'top 82%', once: true },
        })
      })

      gsap.utils.toArray('.landing-reveal').forEach((section) => gsap.from(section, {
        autoAlpha: 0,
        y: distance,
        duration: 0.52,
        ease: 'power3.out',
        clearProps: 'all',
        scrollTrigger: { trigger: section, start: 'top 84%', once: true },
      }))

      if (conditions.desktop) {
        ScrollTrigger.create({
          trigger: '.process-flow',
          start: 'top center',
          end: 'bottom center',
          onUpdate: ({ progress }) => {
            setActiveStory(Math.min(processSteps.length - 1, Math.round(progress * (processSteps.length - 1))))
          },
        })
        gsap.fromTo('.process-story__progress', { scaleY: 0 }, {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: '.process-story', start: 'top 62%', end: 'bottom 42%', scrub: 0.35 },
        })

        const horizontalStory = pageRef.current?.querySelector('.horizontal-story')
        const horizontalTrack = horizontalStory?.querySelector('.horizontal-story__track')
        const horizontalFrame = horizontalStory?.querySelector('.horizontal-story__frame')
        if (horizontalStory && horizontalTrack && horizontalFrame) {
          horizontalStory.classList.add('is-enhanced')
          gsap.to(horizontalTrack, {
            x: () => -(horizontalTrack.scrollWidth - horizontalFrame.clientWidth),
            ease: 'none',
            scrollTrigger: {
              trigger: horizontalStory,
              start: 'top top',
              end: 'bottom bottom',
              scrub: 0.45,
              invalidateOnRefresh: true,
              onUpdate: ({ progress }) => {
                const nextScene = Math.min(previewChapters.length - 1, Math.round(progress * (previewChapters.length - 1)))
                if (activeHorizontalSceneRef.current !== nextScene) {
                  activeHorizontalSceneRef.current = nextScene
                  setActiveHorizontalScene(nextScene)
                }
              },
            },
          })
        }
      }

      gsap.fromTo('.pipeline__path', { scaleX: 0 }, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: '.pipeline', start: 'top 78%', end: 'bottom 58%', scrub: 0.45 },
      })
    })
    return () => {
      pageRef.current?.querySelector('.horizontal-story')?.classList.remove('is-enhanced')
      media.revert()
    }
  }, { scope: pageRef })

  function selectHorizontalScene(index) {
    const nextScene = Math.max(0, Math.min(previewChapters.length - 1, index))
    activeHorizontalSceneRef.current = nextScene
    setActiveHorizontalScene(nextScene)

    const story = pageRef.current?.querySelector('.horizontal-story')
    if (story?.classList.contains('is-enhanced')) {
      const start = window.scrollY + story.getBoundingClientRect().top
      const distance = story.offsetHeight - window.innerHeight
      window.scrollTo({ top: start + distance * (nextScene / (previewChapters.length - 1)), behavior: 'smooth' })
      return
    }

    document.getElementById(`horizontal-scene-${nextScene}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
  }

  return (
    <div ref={pageRef} className="landing-shell"><a className="skip-link" href="#main-content">Skip to content</a><LandingNavigation />
      <main id="main-content" className="landing-main">
        <Hero />

        <section id="how-it-works" className="landing-section landing-process" aria-labelledby="process-title"><div className="landing-section__heading"><AnimatedHeading id="process-title" lines={['From repository', 'to documentation.']} /><p>One deliberate path turns repository structure into a wiki people can actually navigate.</p></div><div className="process-story"><div className="process-story__narrative"><span className="process-story__rail" aria-hidden="true"><i className="process-story__progress" /></span><ol className="process-flow">{processSteps.map((step, index) => <li className={`process-step${activeStory === index ? ' is-active' : ''}`} aria-current={activeStory === index ? 'step' : undefined} key={step.title}><span className="process-flow__number">{step.number}</span><div><span className="process-step__eyebrow">Stage {step.number}</span><h3>{step.title}</h3><p>{step.text}</p></div></li>)}</ol></div><div className="process-story__visual"><ProcessVisual activeStage={activeStory} /></div></div></section>

        <HorizontalStory activeScene={activeHorizontalScene} onSelect={selectHorizontalScene} />

        <section id="features" className="landing-section landing-features" aria-labelledby="features-title"><div className="landing-section__heading landing-section__heading--wide"><AnimatedHeading id="features-title" lines={['A technical document', 'with the evidence', 'still attached.']} /><p>Chapters lead the reading experience. Diagrams and source paths make the generated explanation easier to inspect.</p></div><div className="feature-composition landing-reveal">
          <article className="feature-proof feature-proof--chapters"><div className="feature-proof__copy"><BookOpenText aria-hidden="true" /><h3>Structured wiki chapters</h3><p>A navigable document replaces a pile of disconnected repository notes.</p></div><div className="feature-chapters" aria-label="Sample generated Spoon-Knife chapters">{previewChapters.map((chapter, index) => <div key={chapter.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{chapter.title}</strong><code>{chapter.filePaths[0]}</code></div>)}</div></article>
          <article className="feature-proof feature-proof--diagram"><div className="feature-proof__copy"><Network aria-hidden="true" /><h3>Relationships made visible</h3><p>Each chapter can pair explanation with a Mermaid diagram generated from the same context.</p></div><Diagram chapter={previewChapters[0]} compact /></article>
          <article className="feature-proof feature-proof--chat"><div className="feature-proof__copy"><MessageSquareText aria-hidden="true" /><h3>Grounded follow-up questions</h3><p>After separate indexing, chat can answer focused questions and point back to source paths.</p></div><div className="feature-chat"><span>What does this repository demonstrate?</span><code>README.md</code></div></article>
        </div></section>

        <section className="landing-section architecture" aria-labelledby="architecture-title"><div className="architecture__heading"><div><AnimatedHeading id="architecture-title" lines={['A generation pipeline', 'you can follow.']} /><p>The product story mirrors the current implementation instead of simulating a fictional live process.</p></div><Button asChild variant="secondary"><Link to="/architecture">Explore the architecture <ArrowRight aria-hidden="true" /></Link></Button></div><div className="pipeline-wrap landing-reveal"><i className="pipeline__path" aria-hidden="true" /><ol className="pipeline" aria-label="Wiki generation pipeline">{pipeline.map((stage, index) => <li key={stage}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage}</strong></li>)}</ol></div><p className="architecture__note">Repository-grounded chat uses a separate embeddings and vector-search pipeline.</p></section>

        <section className="landing-cta landing-reveal" aria-labelledby="cta-title"><div><AnimatedHeading id="cta-title" lines={['Let the repository', 'explain itself.']} /><p>Generate structured chapters and Mermaid diagrams from a public GitHub repository.</p></div><Button asChild><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button></section>
      </main>
      <footer className="landing-footer"><div className="landing-footer__inner"><div><AutoWikiBrand /><p>Structured technical wikis generated from public GitHub repositories.</p></div><nav aria-label="Footer navigation"><a href="#how-it-works">How it works</a><Link to="/architecture">Architecture</Link><Link to="/workspace">Workspace</Link><Link to="/chat">Chat</Link></nav></div></footer>
    </div>
  )
}
