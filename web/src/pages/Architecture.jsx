import { useEffect, useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'
import {
  ArrowDown,
  ArrowRight,
  BookOpenText,
  Boxes,
  Check,
  Clipboard,
  CloudCog,
  Code2,
  Database,
  FileArchive,
  FileCode2,
  GitBranch,
  KeyRound,
  Layers3,
  MessageSquareText,
  Network,
  RefreshCw,
  Route,
  ServerCog,
  ShieldCheck,
  Sparkles,
  TestTube2,
  TriangleAlert,
  Workflow,
} from 'lucide-react'
import { Button } from '../components/ui/button.jsx'
import {
  architectureConnections,
  architectureNodes,
  engineeringDecisions,
  jobStages,
  limitations,
  ragFlows,
  wikiStages,
} from '../data/architecture.js'

gsap.registerPlugin(useGSAP, ScrollTrigger)

const nodeIcons = {
  react: Code2,
  express: ServerCog,
  jobs: Database,
  inngest: Workflow,
  github: GitBranch,
  openai: Sparkles,
  pinecone: Layers3,
  artifact: FileArchive,
}

const decisionIcons = {
  'separate-pipelines': GitBranch,
  failure: RefreshCw,
  token: KeyRound,
  mermaid: Network,
  'truthful-progress': ShieldCheck,
  tests: TestTube2,
}

function SourcePath({ path }) {
  const [copyState, setCopyState] = useState('idle')
  const resetTimer = useRef()

  useEffect(() => () => window.clearTimeout(resetTimer.current), [])

  async function copyPath() {
    window.clearTimeout(resetTimer.current)
    try {
      await navigator.clipboard.writeText(path)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 2400)
  }

  return (
    <button type="button" className="architecture-source" onClick={copyPath} aria-label={`Copy source path ${path}`}>
      <FileCode2 aria-hidden="true" size={14} />
      <code>{path}</code>
      <span className={`architecture-source__feedback architecture-source__feedback--${copyState}`} role={copyState === 'failed' ? 'alert' : 'status'} aria-live="polite">
        {copyState === 'copied' ? <><Check aria-hidden="true" size={13} /><span>Copied</span></> : null}
        {copyState === 'failed' ? <><TriangleAlert aria-hidden="true" size={13} /><span>Copy failed. Select the path text and copy it manually.</span></> : null}
        {copyState === 'idle' ? <Clipboard aria-hidden="true" size={13} /> : null}
      </span>
    </button>
  )
}

function SourceList({ files, label = 'Implementation evidence' }) {
  return (
    <div className="architecture-sources" aria-label={label}>
      {files.map((file) => <SourcePath key={file} path={file} />)}
    </div>
  )
}

function connectorPath(connection) {
  const from = architectureNodes.find((node) => node.id === connection.from)
  const to = architectureNodes.find((node) => node.id === connection.to)
  const x1 = from.position.x + 11
  const y1 = from.position.y + 8
  const x2 = to.position.x + 11
  const y2 = to.position.y + 8

  if (connection.curved) return `M ${x1} ${y1} C ${x1} 1, ${x2} 1, ${x2} ${y2}`
  return `M ${x1} ${y1} L ${x2} ${y2}`
}

function ArchitectureOverview() {
  const [selectedId, setSelectedId] = useState('inngest')
  const nodeRefs = useRef([])
  const selected = architectureNodes.find((node) => node.id === selectedId)
  const relatedConnections = useMemo(
    () => architectureConnections.filter((connection) => connection.from === selectedId || connection.to === selectedId),
    [selectedId],
  )

  function handleNodeKey(event, index) {
    const last = architectureNodes.length - 1
    let next
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = index === 0 ? last : index - 1
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = last
    if (next === undefined) return
    event.preventDefault()
    setSelectedId(architectureNodes[next].id)
    nodeRefs.current[next]?.focus()
  }

  return (
    <div className="architecture-overview">
      <div className="architecture-canvas" aria-label="Interactive AutoWiki system overview">
        <div className="architecture-canvas__bar">
          <span><Network aria-hidden="true" size={15} />Architecture walkthrough</span>
          <span>Conceptual—not live monitoring</span>
        </div>
        <div className="architecture-canvas__stage">
          <svg className="architecture-connectors" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <marker id="architecture-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" />
              </marker>
            </defs>
            {architectureConnections.map((connection) => {
              const active = connection.from === selectedId || connection.to === selectedId
              return (
                <path
                  key={`${connection.from}-${connection.to}`}
                  className={active ? 'is-active' : ''}
                  d={connectorPath(connection)}
                  markerEnd="url(#architecture-arrow)"
                  vectorEffect="non-scaling-stroke"
                />
              )
            })}
          </svg>
          <div className="architecture-nodes" role="group" aria-label="System components. Use arrow keys to move between nodes.">
            {architectureNodes.map((node, index) => {
              const Icon = nodeIcons[node.id]
              const related = relatedConnections.some((connection) => connection.from === node.id || connection.to === node.id)
              return (
                <button
                  ref={(element) => { nodeRefs.current[index] = element }}
                  key={node.id}
                  type="button"
                  className={`architecture-node${node.id === selectedId ? ' is-selected' : ''}${related && node.id !== selectedId ? ' is-related' : ''}`}
                  style={{ '--node-x': `${node.position.x}%`, '--node-y': `${node.position.y}%` }}
                  aria-pressed={node.id === selectedId}
                  onClick={() => setSelectedId(node.id)}
                  onKeyDown={(event) => handleNodeKey(event, index)}
                >
                  <span className="architecture-node__icon" aria-hidden="true"><Icon size={18} /></span>
                  <span><small>{node.group}</small><strong>{node.label}</strong></span>
                </button>
              )
            })}
          </div>
        </div>
        <p className="architecture-canvas__alternative">
          The React client talks only to Express. Express creates a process-local job and dispatches an Inngest event. Workers call GitHub and OpenAI; only the Index and Chat workflows call Pinecone. Results return through the shared job store and polling endpoints.
        </p>
      </div>

      <aside className="architecture-detail" aria-live="polite" aria-labelledby="selected-node-title">
        <span className="architecture-detail__group">{selected.group}</span>
        <h2 id="selected-node-title">{selected.label}</h2>
        <p>{selected.description}</p>
        <div className="architecture-detail__responsibility">
          <strong>Real responsibility</strong>
          <p>{selected.responsibility}</p>
        </div>
        {relatedConnections.length ? (
          <div className="architecture-detail__connections">
            <strong>Highlighted connections</strong>
            <ul>
              {relatedConnections.map((connection) => (
                <li key={`${connection.from}-${connection.to}`}>{connection.label}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <SourceList files={selected.files} />
      </aside>
    </div>
  )
}

function WikiPipeline() {
  const [selectedId, setSelectedId] = useState('chapters')
  const selected = wikiStages.find((stage) => stage.id === selectedId)

  return (
    <div className="wiki-pipeline-explorer">
      <ol className="wiki-pipeline-track" aria-label="Wiki generation stages">
        {wikiStages.map((stage, index) => (
          <li key={stage.id}>
            <button type="button" aria-pressed={stage.id === selectedId} className={stage.id === selectedId ? 'is-active' : ''} onClick={() => setSelectedId(stage.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{stage.label}</strong>
              <code>{stage.progress}</code>
            </button>
          </li>
        ))}
      </ol>
      <article className="wiki-stage-detail" aria-live="polite">
        <div className="wiki-stage-detail__heading">
          <span><BookOpenText aria-hidden="true" size={18} /></span>
          <div><small>Selected Wiki boundary</small><h3>{selected.label}</h3></div>
        </div>
        <dl>
          <div><dt>Input</dt><dd>{selected.input}</dd></div>
          <div><dt>Operation</dt><dd>{selected.operation}</dd></div>
          <div><dt>Output</dt><dd>{selected.output}</dd></div>
        </dl>
        <SourceList files={selected.files} />
      </article>
    </div>
  )
}

function RagExplorer() {
  const [flowId, setFlowId] = useState('index')
  const tabRefs = useRef([])
  const flow = ragFlows[flowId]
  const flowEntries = Object.entries(ragFlows)

  function handleTabKey(event, index) {
    let next
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = (index + 1) % flowEntries.length
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = (index - 1 + flowEntries.length) % flowEntries.length
    if (event.key === 'Home') next = 0
    if (event.key === 'End') next = flowEntries.length - 1
    if (next === undefined) return
    event.preventDefault()
    setFlowId(flowEntries[next][0])
    tabRefs.current[next]?.focus()
  }

  return (
    <div className="rag-explorer">
      <div className="rag-switch" role="tablist" aria-label="RAG workflow">
        {flowEntries.map(([id, item], index) => (
          <button
            ref={(element) => { tabRefs.current[index] = element }}
            id={`rag-tab-${id}`}
            key={id}
            type="button"
            role="tab"
            aria-selected={flowId === id}
            aria-controls="rag-workflow-panel"
            tabIndex={flowId === id ? 0 : -1}
            onClick={() => setFlowId(id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            {id === 'index' ? <Database aria-hidden="true" size={17} /> : <MessageSquareText aria-hidden="true" size={17} />}
            {item.label}
          </button>
        ))}
      </div>
      <div id="rag-workflow-panel" role="tabpanel" aria-labelledby={`rag-tab-${flowId}`} className="rag-flow">
        <header><h3>{flow.label}</h3><p>{flow.description}</p></header>
        <ol>
          {flow.stages.map((stage, index) => (
            <li key={stage.label}>
              <span>{index + 1}</span>
              <div><strong>{stage.label}</strong><p>{stage.detail}</p><code>{stage.file}</code></div>
            </li>
          ))}
        </ol>
      </div>
      <p className="rag-separation"><GitBranch aria-hidden="true" size={17} /><strong>Independent by design.</strong> Starting a Wiki does not create vectors, and entering a repository in Chat does not index it.</p>
    </div>
  )
}

function JobArchitecture() {
  return (
    <div className="job-architecture">
      <ol aria-label="Shared asynchronous job lifecycle">
        {jobStages.map((stage, index) => (
          <li key={stage.label}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <div><strong>{stage.label}</strong><p>{stage.detail}</p></div>
            {index < jobStages.length - 1 ? <ArrowRight aria-hidden="true" /> : <Check aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <div className="job-terminal-states">
        <div><strong>completed</strong><p>Result fields replace transient progress metadata.</p></div>
        <div><strong>failed</strong><p>The terminal error is stored after the background retry lifecycle is exhausted.</p></div>
      </div>
      <p className="job-honesty"><TriangleAlert aria-hidden="true" size={17} />Pending is intentionally indeterminate. The application does not invent queue depth, provider latency, a percentage, or an ETA.</p>
    </div>
  )
}

function EngineeringDecisions() {
  const [selectedId, setSelectedId] = useState('mermaid')
  const selected = engineeringDecisions.find((decision) => decision.id === selectedId)
  const Icon = decisionIcons[selected.id]

  return (
    <div className="engineering-decisions">
      <div className="engineering-decision-list" role="group" aria-label="Engineering decisions">
        {engineeringDecisions.map((decision) => {
          const DecisionIcon = decisionIcons[decision.id]
          return (
            <button key={decision.id} type="button" aria-pressed={decision.id === selectedId} onClick={() => setSelectedId(decision.id)}>
              <DecisionIcon aria-hidden="true" size={18} />
              <span><strong>{decision.title}</strong><small>{decision.summary}</small></span>
              <ArrowRight aria-hidden="true" size={16} />
            </button>
          )
        })}
      </div>
      <article className="engineering-decision-detail" aria-live="polite">
        <span aria-hidden="true"><Icon size={23} /></span>
        <h3>{selected.title}</h3>
        <p>{selected.summary}</p>
        {selected.id === 'mermaid' ? (
          <ol className="mermaid-race" aria-label="Mermaid stale-render protection sequence">
            <li><span>1</span>Clear the existing container before rendering.</li>
            <li><span>2</span>Lazy-load Mermaid with strict security.</li>
            <li><span>3</span>Ignore a late result after effect cleanup.</li>
            <li><span>4</span>Replace children with one parsed SVG.</li>
          </ol>
        ) : null}
        <SourceList files={selected.evidence} />
      </article>
    </div>
  )
}

export default function Architecture() {
  const pageRef = useRef(null)

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .fromTo('.architecture-hero__copy > *', { autoAlpha: 0.78, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.055, clearProps: 'all' })
        .fromTo('.architecture-overview', { autoAlpha: 0.84, y: 18, clipPath: 'inset(0 0 7% 0 round 12px)' }, { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0 0 round 12px)', duration: 0.62, clearProps: 'all' }, '-=0.28')
        .fromTo('.architecture-connectors path', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.58, stagger: 0.025, ease: 'power2.out', clearProps: 'stroke-dasharray,stroke-dashoffset' }, '-=0.48')

      gsap.utils.toArray('.architecture-section').forEach((section) => {
        gsap.fromTo(
          section.querySelectorAll(':scope > .architecture-section__heading, :scope > .architecture-section__body'),
          { autoAlpha: 0.84, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.45, stagger: 0.08, ease: 'power3.out', clearProps: 'all', scrollTrigger: { trigger: section, start: 'top 78%', once: true } },
        )
      })
    })
    media.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set('.architecture-page *', { clearProps: 'opacity,visibility,transform,clip-path,stroke-dasharray,stroke-dashoffset' })
    })
    return () => media.revert()
  }, { scope: pageRef })

  return (
    <div ref={pageRef} className="architecture-page">
      <a className="skip-link" href="#architecture-content">Skip to architecture</a>
      <div id="architecture-content">
        <header className="architecture-hero">
          <div className="architecture-hero__copy">
            <h1>Understand the system behind the Wiki.</h1>
            <p>AutoWiki combines a multi-stage Wiki-generation pipeline with a separate retrieval-based Q&amp;A system. Express and Inngest coordinate both through asynchronous jobs without exposing provider credentials to the browser.</p>
            <div className="architecture-hero__actions">
              <Button asChild><a href="#system-overview">Explore the system <ArrowDown aria-hidden="true" size={17} /></a></Button>
              <Button asChild variant="secondary"><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" size={17} /></Link></Button>
            </div>
            <dl className="architecture-stack" aria-label="Verified implementation stack">
              <div><dt>Interface</dt><dd>React 19 + Vite</dd></div>
              <div><dt>Execution</dt><dd>Express + Inngest</dd></div>
              <div><dt>Knowledge</dt><dd>OpenAI + Pinecone</dd></div>
            </dl>
          </div>
          <div className="architecture-hero__signal" aria-hidden="true">
            <span>repository</span><i /><span>outline</span><i /><span>wiki</span>
          </div>
        </header>

        <section id="system-overview" className="architecture-overview-section" aria-labelledby="system-overview-title">
          <div className="architecture-section__heading architecture-section__heading--overview">
            <div><h2 id="system-overview-title">One interface. Two distinct workflows.</h2></div>
            <p>Select a component to trace its real responsibility, connections, and implementation evidence. Highlighted lines are explanatory architecture paths—not runtime telemetry.</p>
          </div>
          <ArchitectureOverview />
        </section>

        <section className="architecture-section architecture-section--wiki" aria-labelledby="wiki-pipeline-title">
          <div className="architecture-section__heading">
            <div><span className="architecture-section__icon" aria-hidden="true"><BookOpenText /></span><h2 id="wiki-pipeline-title">How AutoWiki builds technical knowledge.</h2></div>
            <p>The flagship pipeline reads source directly, plans a bounded outline, and generates each chapter’s prose and Mermaid definition together.</p>
          </div>
          <div className="architecture-section__body"><WikiPipeline /></div>
        </section>

        <section className="architecture-section architecture-section--rag" aria-labelledby="rag-title">
          <div className="architecture-section__heading">
            <div><span className="architecture-section__icon" aria-hidden="true"><MessageSquareText /></span><h2 id="rag-title">Grounded answers from repository context.</h2></div>
            <p>Indexing prepares searchable vectors. A later question retrieves the best matching source chunks and asks the model to answer from that context only.</p>
          </div>
          <div className="architecture-section__body"><RagExplorer /></div>
        </section>

        <section className="architecture-section architecture-section--jobs" aria-labelledby="jobs-title">
          <div className="architecture-section__heading">
            <div><span className="architecture-section__icon" aria-hidden="true"><CloudCog /></span><h2 id="jobs-title">The shared asynchronous backbone.</h2></div>
            <p>HTTP requests stay short while background functions perform provider work. One polling contract makes eventual results visible across Wiki, Index, and Chat.</p>
          </div>
          <div className="architecture-section__body"><JobArchitecture /></div>
        </section>

        <section className="architecture-section architecture-section--decisions" aria-labelledby="decisions-title">
          <div className="architecture-section__heading">
            <div><span className="architecture-section__icon" aria-hidden="true"><Boxes /></span><h2 id="decisions-title">Engineering decisions you can inspect.</h2></div>
            <p>The important work is often invisible in the final Wiki. These source-backed cases expose the boundaries that keep the application accurate and recoverable.</p>
          </div>
          <div className="architecture-section__body"><EngineeringDecisions /></div>
        </section>

        <section className="architecture-section architecture-section--limits" aria-labelledby="limits-title">
          <div className="architecture-section__heading">
            <div><span className="architecture-section__icon" aria-hidden="true"><TriangleAlert /></span><h2 id="limits-title">Built for a local, single-process system.</h2></div>
            <p>Architectural honesty matters. These are current implementation boundaries, not hypothetical production guarantees.</p>
          </div>
          <div className="architecture-section__body">
            <ul className="architecture-limitations">
              {limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
            </ul>
          </div>
        </section>

        <section className="architecture-close" aria-labelledby="architecture-close-title">
          <div><Route aria-hidden="true" /><h2 id="architecture-close-title">See the architecture do real work.</h2><p>Generate a chaptered Wiki, or index a repository and ask a grounded question.</p></div>
          <div><Button asChild><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button><Button asChild variant="secondary"><Link to="/chat">Open Chat</Link></Button></div>
        </section>
      </div>
    </div>
  )
}
