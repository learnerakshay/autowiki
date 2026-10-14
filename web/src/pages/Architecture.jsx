import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, Code2, Database, FileArchive, GitBranch, Layers3, ServerCog, Sparkles, Workflow } from 'lucide-react'
import { Button, Disclosure, Page, PageHeader, SkeletonText, Surface } from '../components/ui/kit/index.js'
import { useSpringReveal } from '../components/ui/kit/hooks.js'
import { architectureConnections, architectureNodes } from '../data/architecture.js'
import { nodeBox, routedConnections } from '../lib/architectureGraph.js'
import { SourceList } from './architectureShared.jsx'
import { whenIdle, cancelIdle } from '../lib/idle.js'
import './architecture.css'

const icons = { react: Code2, express: ServerCog, jobs: Database, inngest: Workflow, github: GitBranch, openai: Sparkles, pinecone: Layers3, artifact: FileArchive }
const loadSections = () => import('./ArchitectureSections.jsx')
const bodies = Object.fromEntries(['WikiPipeline', 'RagExplorer', 'JobArchitecture', 'EngineeringDecisions', 'Limitations'].map((name) => [name, lazy(() => loadSections().then((module) => ({ default: module[name] })))]))

function DeferredBody({ name }) {
  const ref = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); setReady(true) } }, { rootMargin: '800px' })
    observer.observe(ref.current)
    const showAll = () => setReady(true)
    window.addEventListener('architecture:load-all', showAll)
    return () => { observer.disconnect(); window.removeEventListener('architecture:load-all', showAll) }
  }, [])
  const Body = bodies[name]
  return <div ref={ref} className={`arch-deferred arch-deferred--${name}`} data-ready={ready}>{ready ? <Suspense fallback={<SkeletonText lines={4} />}><Body /></Suspense> : <SkeletonText lines={4} />}</div>
}

function ArchitectureOverview() {
  const [activeId, setActiveId] = useState('inngest')
  const [interactive, setInteractive] = useState(false)
  const nodeRefs = useRef([])
  const ref = useRef(null)
  const detailRef = useRef(null)
  const [selectedId, edgeId] = activeId.split('|')
  const selected = architectureNodes.find((node) => node.id === selectedId)
  const related = architectureConnections.map((connection, index) => ({ ...connection, index })).filter((connection) => connection.from === selectedId || connection.to === selectedId)
  useSpringReveal(detailRef, selectedId)
  useEffect(() => {
    const idle = whenIdle(() => setInteractive(true))
    const observer = new IntersectionObserver(([entry]) => { ref.current?.setAttribute('data-in-view', String(entry.isIntersecting)) })
    observer.observe(ref.current.querySelector('.arch-canvas-stage'))
    return () => { cancelIdle(idle); observer.disconnect() }
  }, [])
  function move(event, index) {
    const next = { ArrowRight: (index + 1) % architectureNodes.length, ArrowDown: (index + 1) % architectureNodes.length, ArrowLeft: (index - 1 + architectureNodes.length) % architectureNodes.length, ArrowUp: (index - 1 + architectureNodes.length) % architectureNodes.length, Home: 0, End: architectureNodes.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault(); setActiveId(architectureNodes[next].id); nodeRefs.current[next]?.focus()
  }
  return <div ref={ref} className="arch-overview" data-interactive={interactive}>
    <Surface padding="none" className="arch-canvas"><div className="arch-canvas-bar"><strong>Architecture walkthrough</strong><span>Conceptual—not live monitoring</span></div>
      <div className="arch-canvas-stage">
        <svg className="arch-connectors" viewBox="0 0 1000 480" preserveAspectRatio="none" aria-hidden="true"><defs><marker id="architecture-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>{architectureConnections.map((connection, index) => {
          const active = edgeId === undefined ? connection.from === selectedId || connection.to === selectedId : index === Number(edgeId)
          const geometry = routedConnections[index]
          return <g onPointerEnter={() => setActiveId(`${selectedId}|${index}`)} onPointerLeave={() => setActiveId(selectedId)} key={index} className={active ? 'is-active' : ''} data-edge={index}><path d={geometry.path} markerEnd="url(#architecture-arrow)" />{edgeId !== undefined && Number(edgeId) === index ? <text x={geometry.label[0]} y={geometry.label[1]} textAnchor="middle">{connection.label}</text> : null}</g>
        })}</svg>
        <div className="arch-nodes" role="group" aria-label="System components. Use arrow keys to move between nodes.">{architectureNodes.map((node, index) => {
          const Icon = icons[node.id], box = nodeBox(node)
          const neighbor = related.some((connection) => connection.from === node.id || connection.to === node.id)
          return <Button key={node.id} ref={(element) => { nodeRefs.current[index] = element }} variant="secondary" className={`arch-node ${neighbor ? 'is-related' : ''}`} style={{ left: `${box.x / 10}%`, top: `${box.y / 4.8}%` }} aria-pressed={node.id === selectedId} tabIndex={node.id === selectedId ? 0 : -1} onPointerEnter={interactive ? () => setActiveId(node.id) : undefined} onFocus={interactive ? () => setActiveId(node.id) : undefined} onClick={() => setActiveId(node.id)} onKeyDown={(event) => move(event, index)}><Icon aria-hidden="true" /><span><small>{node.group}</small><strong>{node.label}</strong></span></Button>
        })}</div>
      </div>
      <p className="arch-alternative">The React client talks only to Express. Express creates a process-local job and dispatches an Inngest event. Workers call GitHub and OpenAI; only the Index and Chat workflows call Pinecone. Results return through the shared job store and polling endpoints.</p>
    </Surface>
    <Surface as="aside" padding="none" ref={detailRef} className="arch-detail" aria-labelledby="selected-node-title"><span>{selected.group}</span><h2 id="selected-node-title">{selected.label}</h2><p>{selected.description}</p><div><strong>Real responsibility</strong><p>{selected.responsibility}</p></div><div><strong>Highlighted connections</strong><ul>{related.map((connection) => <li key={connection.index}><button type="button" className="press" onPointerEnter={() => setActiveId(`${selectedId}|${connection.index}`)} onPointerLeave={() => setActiveId(selectedId)} onFocus={() => setActiveId(`${selectedId}|${connection.index}`)} onBlur={() => setActiveId(selectedId)} onClick={() => setActiveId(`${selectedId}|${connection.index}`)}><strong>{architectureNodes.find((node) => node.id === connection.from).shortLabel} <ArrowRight size={12} aria-hidden="true" /> {architectureNodes.find((node) => node.id === connection.to).shortLabel}</strong><small>{connection.label}</small></button></li>)}</ul></div><Disclosure key={selectedId} title="Implementation evidence"><SourceList files={selected.files} /></Disclosure></Surface>
  </div>
}

const sections = [
  ['wiki-pipeline-title', 'How AutoWiki builds technical knowledge.', 'The flagship pipeline reads source directly, plans a bounded outline, and generates each chapter’s prose and Mermaid definition together.', 'WikiPipeline'],
  ['rag-title', 'Grounded answers from repository context.', 'Indexing prepares searchable vectors. A later question retrieves the best matching source chunks and asks the model to answer from that context only.', 'RagExplorer'],
  ['jobs-title', 'The shared asynchronous backbone.', 'HTTP requests stay short while background functions perform provider work. One polling contract makes eventual results visible across Wiki, Index, and Chat.', 'JobArchitecture'],
  ['decisions-title', 'Engineering decisions you can inspect.', 'The important work is often invisible in the final Wiki. These source-backed cases expose the boundaries that keep the application accurate and recoverable.', 'EngineeringDecisions'],
  ['limits-title', 'Built for a local, single-process system.', 'Architectural honesty matters. These are current implementation boundaries, not hypothetical production guarantees.', 'Limitations'],
]
export default function Architecture() {
  return <Page track="wide" className="arch-page">
    <a className="skip-link" href="#system-overview-title">Skip to architecture</a><header className="arch-hero"><PageHeader title="Understand the system behind the Wiki." lede="AutoWiki combines a multi-stage Wiki-generation pipeline with a separate retrieval-based Q&A system. Express and Inngest coordinate both through asynchronous jobs without exposing provider credentials to the browser." actions={<><Button as="a" href="#system-overview" onClick={() => requestAnimationFrame(() => document.getElementById("system-overview-title")?.focus({ preventScroll: true }))} iconTrailing={ArrowDown}>Explore the system</Button><Button as={Link} to="/workspace" variant="secondary" iconTrailing={ArrowRight}>Open Workspace</Button></>} /><ol className="arch-commit-flow" aria-hidden="true">{['repository', 'outline', 'wiki'].map((item) => <li key={item}><span /><strong>{item}</strong></li>)}</ol></header>
    <dl className="arch-stack" aria-label="Verified implementation stack"><div><dt>Interface</dt><dd>React 19 + Vite</dd></div><div><dt>Execution</dt><dd>Express + Inngest</dd></div><div><dt>Knowledge</dt><dd>OpenAI + Pinecone</dd></div></dl>
    <section id="system-overview" className="arch-section" aria-labelledby="system-overview-title"><PageHeader as="h2" id="system-overview-title" tabIndex={-1} title="One interface. Two distinct workflows." lede="Select a component to trace its real responsibility, connections, and implementation evidence. Highlighted lines are explanatory architecture paths—not runtime telemetry." /><ArchitectureOverview /></section>
    {sections.map(([id, title, lede, name]) => <section key={id} className={`arch-section arch-section--${name}`} aria-labelledby={id}><PageHeader as="h2" id={id} title={title} lede={lede} /><DeferredBody name={name} /></section>)}
    <Surface className="arch-close"><div><h2>See the architecture do real work.</h2><p>Generate a chaptered Wiki, or index a repository and ask a grounded question.</p></div><div><Button as={Link} to="/workspace" iconTrailing={ArrowRight}>Open Workspace</Button><Button as={Link} to="/chat" variant="secondary" iconTrailing={ArrowRight}>Open Chat</Button></div></Surface>
  </Page>
}
