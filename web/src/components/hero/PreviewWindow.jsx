import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, FileCode2, FileText, GitFork, Network, Pause, Play } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx'
import { heroSample } from '../../data/heroSample.js'
import { motion, prefersReducedMotion } from '../../lib/motion.js'
import { DiagramGraph } from './DiagramGraph.jsx'
import { StreamText } from './StreamText.jsx'
import { useTabSwap } from './useTabSwap.js'
import { streamDuration } from './streamTiming.js'

const TABS = [
  { value: 'chapters', label: 'Wiki chapters', short: 'Chapters', icon: BookOpenText },
  { value: 'architecture', label: 'Architecture diagrams', short: 'Diagrams', icon: Network },
  { value: 'sources', label: 'Source context', short: 'Source', icon: FileCode2 },
]

const TAB_ORDER = TABS.map((tab) => tab.value)

const LIVE_PHASES = new Set(['generating', 'done', 'resetting'])

/** Cumulative stream start times (ms) for the description and each excerpt paragraph. */
function streamPlan(chapter) {
  let clock = 260
  const description = clock
  clock += streamDuration(chapter.description) + 140
  return {
    description,
    excerpt: chapter.excerpt.map((paragraph) => {
      const start = clock
      clock += streamDuration(paragraph) + 140
      return start
    }),
  }
}

export function PreviewWindow({ demo, sheenRef }) {
  const [activeMode, setActiveMode] = useState('chapters')
  const [activeChapter, setActiveChapter] = useState(heroSample.featuredChapter)
  const documentRef = useRef(null)
  const panelsRef = useRef(null)
  const { chapters } = heroSample
  const chapter = chapters[activeChapter]
  const plan = useMemo(() => streamPlan(chapter), [chapter])
  const live = LIVE_PHASES.has(demo.phase)
  const generating = demo.running && live && demo.phase !== 'done'

  // Tab swap: directional, interruptible, springy (see useTabSwap).
  useTabSwap({ containerRef: panelsRef, mode: activeMode, order: TAB_ORDER })

  // Picking another chapter inside the same tab keeps the lighter in-place refresh.
  const firstChapter = useRef(true)
  useGSAP(() => {
    if (firstChapter.current) { firstChapter.current = false; return }
    if (prefersReducedMotion() || !panelsRef.current) return
    const active = panelsRef.current.querySelector('[data-state="active"]')
    if (active) gsap.fromTo(active.children, { autoAlpha: 0.3, y: 8 }, { autoAlpha: 1, y: 0, duration: motion.selection, stagger: 0.025, ease: motion.ease, clearProps: 'all' })
  }, { scope: documentRef, dependencies: [activeChapter], revertOnUpdate: true })

  // Any deliberate interaction with the mockup ends the autoplay so it never fights the reader.
  const selectChapter = (index) => { demo.stop(); setActiveChapter(index) }
  const selectMode = (mode) => { demo.stop(); setActiveMode(mode) }

  const diagramLabel = `Generated Mermaid structure for ${chapter.title}`
  const statusText = generating ? 'Replaying sample' : 'Pre-generated example'
  const running = demo.mode === 'running'

  return (
    <Tabs value={activeMode} onValueChange={selectMode} className="product-proof">
      <div className="product-window" data-demo={demo.phase} onPointerDown={demo.stop}>
        <div className="pw-sheen" aria-hidden="true"><span ref={sheenRef}><i /></span></div>

        <div className="product-window__bar">
          <div className="pw-bar__id">
            <span className="pw-bar__brand"><span className="file-glyph" aria-hidden="true"><FileText /></span> Generated wiki</span>
            <span className="product-window__repo"><GitFork aria-hidden="true" /> {heroSample.owner} / <strong>{heroSample.name}</strong></span>
          </div>

          <TabsList className="pw-tabs" aria-label="Explore the generated output" data-active={activeMode}>
            <span className="pw-tabs__indicator" aria-hidden="true" />
            {TABS.map(({ value, label, short, icon: Icon }) => (
              <TabsTrigger key={value} value={value} className="pw-tab">
                <Icon aria-hidden="true" />
                <span className="pw-tab__long">{label}</span>
                <span className="pw-tab__short" aria-hidden="true">{short}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="pw-bar__tools">
            <span className="pw-status" data-live={generating}>{statusText}</span>
            {demo.enabled ? (
              <button
                type="button"
                className="pw-tool"
                aria-label={running ? 'Pause demo animation' : 'Play demo animation'}
                onClick={running ? demo.pause : demo.resume}
              >
                {running ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
              </button>
            ) : null}
            <Link className="pw-explore" to={`/wiki/sample/${heroSample.slug}`}>Explore Wiki <ArrowRight aria-hidden="true" /></Link>
          </div>
        </div>

        <div className="product-window__layout">
          <aside className="product-window__rail" aria-label="Sample wiki chapters">
            <p>Chapters</p>
            <div className="product-window__chapter-list">
              {chapters.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  className={activeChapter === index ? 'is-active' : ''}
                  data-shown={index < demo.chapters}
                  aria-pressed={activeChapter === index}
                  onClick={() => selectChapter(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span><strong>{item.title}</strong>
                </button>
              ))}
            </div>
            <div className="product-window__meta"><span>{chapters.length} chapters</span><span>Read-only</span></div>
          </aside>

          <div ref={documentRef} className="product-window__document">
            <div ref={panelsRef} className="pw-panels">
            <TabsContent value="chapters" forceMount data-swap-panel="chapters">
              <h2 className="pw-reveal" data-on={demo.doc}>{chapter.title}</h2>
              <StreamText className="product-window__description" text={chapter.description} live={live} active={demo.doc} delay={plan.description} />
              <div className="product-window__source-line pw-reveal" data-on={demo.doc}><span>Source path</span>{chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
              <h3 className="pw-reveal" data-on={demo.doc}>Chapter excerpt</h3>
              <div className="product-window__excerpt">
                {chapter.excerpt.map((paragraph, index) => (
                  <StreamText key={paragraph} text={paragraph} live={live} active={demo.doc} delay={plan.excerpt[index]} />
                ))}
              </div>
              <div className="product-window__reading-meta pw-reveal" data-on={demo.doc}><span>{String(activeChapter + 1).padStart(2, '0')} / {chapters.length}</span><span>Generated explanation</span></div>
            </TabsContent>
            <TabsContent value="architecture" forceMount data-swap-panel="architecture">
              <h2>{chapter.title}</h2><p className="product-window__description">The chapter diagram is generated from the same source context as the explanation.</p>
              <DiagramGraph diagram={chapter.diagram} drawn={demo.diagram} size="large" label={diagramLabel} />
            </TabsContent>
            <TabsContent value="sources" forceMount data-swap-panel="sources">
              <h2>Source context</h2><p className="product-window__description">Every sample chapter names the repository files used to create it.</p>
              <div className="source-ledger">{chapters.map((item, index) => (
                <button type="button" key={item.title} onClick={() => selectChapter(index)}><FileCode2 aria-hidden="true" /><span><strong>{item.filePaths.join(', ')}</strong><small>{item.title}</small></span><ArrowRight aria-hidden="true" /></button>
              ))}</div>
            </TabsContent>
            </div>
          </div>

          <aside className="product-window__context" aria-label="Generated chapter context">
            <div className="product-window__context-head"><Network aria-hidden="true" /><span>Diagram context</span></div>
            <DiagramGraph diagram={chapter.diagram} drawn={demo.diagram} size="compact" label={diagramLabel} />
            <div className="product-window__context-source pw-reveal" data-on={demo.diagram}><span>Grounded in</span>{chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
            <pre className="product-window__context-code pw-reveal" data-on={demo.diagram}><code>{chapter.mermaidPreview}</code></pre>
          </aside>
        </div>
      </div>
    </Tabs>
  )
}
