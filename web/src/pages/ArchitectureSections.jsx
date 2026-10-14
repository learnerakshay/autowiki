import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpenText, Database, GitBranch, KeyRound, MessageSquareText, Network, RefreshCw, ShieldCheck, TestTube2, TriangleAlert } from 'lucide-react'
import { Disclosure, CodeBlock, Surface, Tab, TabList, TabPanel, Tabs } from '../components/ui/kit/index.js'
import { useSpringReveal } from '../components/ui/kit/hooks.js'
import { usePipelineScroll } from '../components/pipeline/usePipelineScroll.js'
import { wikiStages, ragFlows, jobStages, engineeringDecisions, limitations } from '../data/architecture.js'
import { SourceList } from './architectureShared.jsx'
import '../components/pipeline/pipeline.css'
export function WikiPipeline() {
  const [selectedId, setSelectedId] = useState('chapters')
  const revealRef = useRef(null)
  useSpringReveal(revealRef, selectedId)
  const selected = wikiStages.find((stage) => stage.id === selectedId)

  return (
    <div className="arch-wiki">
      <ol className="arch-stage-list" aria-label="Wiki generation stages">
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
      <Surface ref={revealRef} as="article" variant="raised" className="arch-stage-detail" aria-live="polite">
        <div className="arch-stage-detail__heading">
          <span><BookOpenText aria-hidden="true" size={18} /></span>
          <div><small>Selected Wiki boundary</small><h3>{selected.label}</h3></div>
        </div>
        <dl>
          <div><dt>Input</dt><dd>{selected.input}</dd></div>
          <div><dt>Operation</dt><dd>{selected.operation}</dd></div>
          <div><dt>Output</dt><dd>{selected.output}</dd></div>
        </dl>
        <SourceList files={selected.files} />
      </Surface>
    </div>
  )
}


export function RagExplorer() {
  const [flowId, setFlowId] = useState('index')
  const flow = ragFlows[flowId]
  const ref = useRef(null)
  useSpringReveal(ref, flowId, { stagger: true })
  return <div className="arch-rag"><Tabs value={flowId} onValueChange={setFlowId}><TabList label="RAG workflow">{Object.entries(ragFlows).map(([id, item]) => <Tab key={id} value={id} icon={id === 'index' ? Database : MessageSquareText}>{item.label}</Tab>)}</TabList>{Object.keys(ragFlows).map((id) => <TabPanel key={id} value={id}>{id === flowId ? <div ref={ref} className="arch-flow"><header><h3>{flow.label}</h3><p>{flow.description}</p></header><ol>{flow.stages.map((stage, index) => <li key={stage.label} data-step><span>{index + 1}</span><div><strong>{stage.label}</strong><p>{stage.detail}</p><SourceList files={[stage.file]} /></div></li>)}</ol></div> : null}</TabPanel>)}</Tabs><p className="arch-independent"><GitBranch aria-hidden="true" size={17} /><strong>Independent by design.</strong> Starting a Wiki does not create vectors, and entering a repository in Chat does not index it.</p></div>
}

export function JobArchitecture() {
  const wrapRef = useRef(null)
  usePipelineScroll({ wrapRef, count: jobStages.length })
  return <Surface as="div" variant="dark" className="arch-backbone">
    <p>Structure only—not live status or timing.</p>
    <div ref={wrapRef} className="pipeline-wrap"><i className="pipeline__track" aria-hidden="true" /><i className="pipeline__path" aria-hidden="true" /><ol className="pipeline" aria-label="Shared asynchronous job lifecycle">{jobStages.map((stage, index) => <li key={stage.label}><span>{String(index + 1).padStart(2, '0')}</span><strong>{stage.label}</strong><p>{stage.detail}</p></li>)}</ol></div>
    <div className="arch-terminal"><div><strong>completed</strong><p>Result fields replace transient progress metadata.</p></div><div><strong>failed</strong><p>The terminal error is stored after the background retry lifecycle is exhausted.</p></div></div>
    <p className="arch-warning"><TriangleAlert aria-hidden="true" size={17} />Pending is intentionally indeterminate. The application does not invent queue depth, provider latency, a percentage, or an ETA.</p>
  </Surface>
}
const decisionIcons = { 'separate-pipelines': GitBranch, failure: RefreshCw, token: KeyRound, mermaid: Network, 'truthful-progress': ShieldCheck, tests: TestTube2 }
function DecisionDetail({ decision }) {
  const Icon = decisionIcons[decision.id]
  return <><Icon size={23} aria-hidden="true" /><h3>{decision.title}</h3><p>{decision.summary}</p>{decision.id === 'mermaid' ? <><ol className="arch-race" aria-label="Mermaid stale-render protection sequence"><li><span>1</span>Clear the existing container before rendering.</li><li><span>2</span>Lazy-load Mermaid with strict security.</li><li><span>3</span>Ignore a late result after effect cleanup.</li><li><span>4</span>Replace children with one parsed SVG.</li></ol><CodeBlock code="if (!active) return\ncontainer.replaceChildren(svg)" language="JavaScript" /></> : null}<SourceList files={decision.evidence} /></>
}
export function EngineeringDecisions() {
  const hashId = window.location.hash.replace('#decision-', '')
  const [selectedId, setSelectedId] = useState(() => engineeringDecisions.some((item) => item.id === hashId) ? hashId : 'mermaid')
  const [mobile, setMobile] = useState(() => matchMedia('(max-width: 768px)').matches)
  const ref = useRef(null)
  const list = useRef(null)
  useSpringReveal(ref, selectedId)
  useEffect(() => { const query = matchMedia('(max-width: 768px)'); const update = () => setMobile(query.matches); query.addEventListener('change', update); return () => query.removeEventListener('change', update) }, [])
  const select = (id) => { setSelectedId(id); history.replaceState(history.state, '', `#decision-${id}`) }
  if (mobile) return <div>{engineeringDecisions.map((item) => <Disclosure key={item.id} title={item.title} open={selectedId === item.id} onOpenChange={(open) => select(open ? item.id : '')}>{selectedId === item.id ? <DecisionDetail decision={item} /> : null}</Disclosure>)}</div>
  return <div className="arch-decisions"><div ref={list} className="arch-decision-list" role="group" aria-label="Engineering decisions">{engineeringDecisions.map((item, index) => <button className="press" type="button" key={item.id} aria-pressed={selectedId === item.id} tabIndex={selectedId === item.id ? 0 : -1} onClick={() => select(item.id)} onKeyDown={(event) => { const next = { ArrowDown: (index + 1) % engineeringDecisions.length, ArrowRight: (index + 1) % engineeringDecisions.length, ArrowUp: (index - 1 + engineeringDecisions.length) % engineeringDecisions.length, ArrowLeft: (index - 1 + engineeringDecisions.length) % engineeringDecisions.length }[event.key]; if (next !== undefined) { event.preventDefault(); select(engineeringDecisions[next].id); list.current.children[next].focus() } }}><strong>{item.title}</strong><span>{item.summary}</span><ArrowRight size={16} aria-hidden="true" /></button>)}</div><Surface ref={ref} variant="raised" as="article" className="arch-decision-detail" aria-live="polite"><DecisionDetail decision={engineeringDecisions.find((item) => item.id === selectedId)} /></Surface></div>
}
export function Limitations() {
  return <div className="arch-limits-groups">{[['Process', Database, limitations.slice(0,2)], ['Data', GitBranch, limitations.slice(2,4)], ['Delivery and output', MessageSquareText, limitations.slice(4)]].map(([title, Icon, items]) => <section key={title}><h3><Icon size={20} aria-hidden="true" />{title}</h3><ul className="arch-limitations">{items.map((item) => <li key={item}><span>{item}</span></li>)}</ul></section>)}</div>
}
