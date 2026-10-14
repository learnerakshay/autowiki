import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { AlertTriangle, Download, Maximize2, Minus, Plus, RotateCcw } from 'lucide-react'
import { CodeBlock, Dialog, IconButton, Sheet, Skeleton } from '../components/ui/kit/index.js'
import { projectDistance } from '../lib/carouselEngine.js'
import { prefersReducedMotion } from '../lib/motion.js'
import { renderSource } from './mermaidRuntime.js'

function svgNode(markup, label) {
  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
  if (parsed.querySelector('parsererror') || parsed.documentElement.nodeName !== 'svg') throw new Error('Mermaid returned an invalid SVG document')
  const svg = document.importNode(parsed.documentElement, true)
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', label)
  return svg
}

function useMobile() {
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 640px)').matches)
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const change = () => setMobile(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])
  return mobile
}

function DiagramCanvas({ hostRef, view, setView, interacted, setInteracted, expanded = false }) {
  const canvasRef = useRef(null)
  const pointers = useRef(new Map())
  const gesture = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [wheelHint, setWheelHint] = useState(false)
  const wheelHandler = useRef(null)
  const zoom = (factor, clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const next = Math.max(1, Math.min(4, view.scale * factor))
    const x = clientX - rect.left - rect.width / 2
    const y = clientY - rect.top - rect.height / 2
    setView({ scale: next, x: x - (x - view.x) * next / view.scale, y: y - (y - view.y) * next / view.scale })
    setInteracted(true)
  }
  useLayoutEffect(() => { wheelHandler.current = (event) => {
    if (!expanded && !event.ctrlKey && !event.metaKey) { setWheelHint(true); return }
    event.preventDefault()
    zoom(Math.exp(-event.deltaY * 0.002), event.clientX, event.clientY)
  } })
  useEffect(() => {
    const canvas = canvasRef.current
    const wheel = (event) => wheelHandler.current(event)
    canvas.addEventListener('wheel', wheel, { passive: false })
    return () => canvas.removeEventListener('wheel', wheel)
  }, [])
  useEffect(() => {
    if (!wheelHint) return undefined
    const timer = setTimeout(() => setWheelHint(false), 2200)
    return () => clearTimeout(timer)
  }, [wheelHint])
  const onPointerDown = (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current = { time: performance.now(), velocityX: 0, velocityY: 0 }
    setDragging(true)
    setInteracted(true)
  }
  const onPointerMove = (event) => {
    if (!pointers.current.has(event.pointerId)) return
    const previous = pointers.current.get(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const state = gesture.current
    if (!state) return
    if (pointers.current.size === 2) {
      const points = [...pointers.current.values()]
      const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y)
      if (state.distance) zoom(distance / state.distance, (points[0].x + points[1].x) / 2, (points[0].y + points[1].y) / 2)
      state.distance = distance
      return
    }
    const now = performance.now()
    const elapsed = Math.max(1, now - state.time)
    state.velocityX = (event.clientX - previous.x) / elapsed * 1000
    state.velocityY = (event.clientY - previous.y) / elapsed * 1000
    state.time = now
    setView((current) => ({ ...current, x: current.x + event.clientX - previous.x, y: current.y + event.clientY - previous.y }))
  }
  const onPointerUp = (event) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size) { gesture.current = null; return }
    setDragging(false)
    const state = gesture.current
    gesture.current = null
    if (!state) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    setView((current) => {
      const boundX = rect.width * Math.max(0, current.scale - 1) / 2 + 72
      const boundY = rect.height * Math.max(0, current.scale - 1) / 2 + 72
      return { ...current, x: Math.max(-boundX, Math.min(boundX, current.x + (prefersReducedMotion() ? 0 : projectDistance(state.velocityX)))), y: Math.max(-boundY, Math.min(boundY, current.y + (prefersReducedMotion() ? 0 : projectDistance(state.velocityY)))) }
    })
  }
  const onKeyDown = (event) => {
    const pan = { ArrowLeft: [40, 0], ArrowRight: [-40, 0], ArrowUp: [0, 40], ArrowDown: [0, -40] }[event.key]
    if (pan) { event.preventDefault(); setView((current) => ({ ...current, x: current.x + pan[0], y: current.y + pan[1] })) }
    if (event.key === '+' || event.key === '=') { event.preventDefault(); const rect = canvasRef.current.getBoundingClientRect(); zoom(1.25, rect.left + rect.width / 2, rect.top + rect.height / 2) }
    if (event.key === '-') { event.preventDefault(); const rect = canvasRef.current.getBoundingClientRect(); zoom(0.8, rect.left + rect.width / 2, rect.top + rect.height / 2) }
    if (event.key === '0') { event.preventDefault(); setView({ scale: 1, x: 0, y: 0 }) }
  }
  const onMouseOver = (event) => {
    const node = event.target.closest?.('g.node')
    const svg = hostRef.current?.querySelector('svg')
    if (!node || !svg) return
    const id = node.id.replace(/^flowchart-/, '').replace(/-\d+$/, '')
    const edges = [...svg.querySelectorAll('.edgePath')].filter((edge) => edge.id?.includes(`_${id}_`))
    const neighbors = new Set([id])
    edges.forEach((edge) => svg.querySelectorAll('g.node').forEach((candidate) => {
      const name = candidate.id.replace(/^flowchart-/, '').replace(/-\d+$/, '')
      if (edge.id?.includes(`_${name}_`)) neighbors.add(name)
    }))
    svg.querySelectorAll('g.node').forEach((part) => part.classList.toggle('is-related', neighbors.has(part.id.replace(/^flowchart-/, '').replace(/-\d+$/, ''))))
    svg.querySelectorAll('.edgePath').forEach((part) => part.classList.toggle('is-related', edges.includes(part)))
    svg.classList.add('has-hover')
  }
  const onMouseOut = (event) => {
    if (event.relatedTarget?.closest?.('g.node') === event.target.closest?.('g.node')) return
    const svg = hostRef.current?.querySelector('svg')
    svg?.classList.remove('has-hover')
    svg?.querySelectorAll('.is-related').forEach((part) => part.classList.remove('is-related'))
  }
  return (
    <div ref={canvasRef} className={`diagram${expanded ? ' diagram--expanded' : ''}`} role="group" aria-label={expanded ? 'Diagram canvas. Drag to pan; use wheel or plus and minus to zoom; press 0 to fit.' : 'Diagram canvas. Drag to pan; use Ctrl/Command plus wheel, or plus and minus to zoom; press 0 to fit.'} tabIndex={0}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
      onDoubleClick={(event) => zoom(1.5, event.clientX, event.clientY)} onKeyDown={onKeyDown} onMouseOver={onMouseOver} onMouseOut={onMouseOut}>
      <div ref={hostRef} className="diagram-stage" data-dragging={dragging} style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }} />
      {!interacted || wheelHint ? <span className="diagram-hint">{expanded ? 'Drag to pan · scroll to zoom' : 'Drag to pan · Ctrl/⌘ + scroll to zoom'}</span> : null}
    </div>
  )
}

export default function MermaidDiagram({ source, valid, titleId, label = 'Repository architecture diagram', onFailure }) {
  const renderId = `mermaid-${useId().replaceAll(':', '')}`
  const inlineHostRef = useRef(null)
  const cardRef = useRef(null)
  const renderRef = useRef(null)
  const expandedHostRef = useRef(null)
  const triggerRef = useRef(null)
  const [svg, setSvg] = useState(null)
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 })
  const [interacted, setInteracted] = useState(false)
  const [sourceCopied, setSourceCopied] = useState(false)
  const copyTimer = useRef(0)
  const mobile = useMobile()

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  useEffect(() => {
    if (!source || !valid) return undefined
    let active = true
    let requested = false
    let currentSvg
    async function render() {
      if (requested || !active) return
      requested = true
      try {
        const markup = await renderSource(source, renderId)
        if (!active || !inlineHostRef.current) return
        currentSvg = svgNode(markup, label)
        inlineHostRef.current.replaceChildren(currentSvg)
        setSvg(currentSvg)
      } catch {
        if (active) { setError('The generated Mermaid source could not be rendered. Review the source below.'); onFailure?.(source) }
      }
    }
    renderRef.current = render
    let idle
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      idle = window.requestIdleCallback ? requestIdleCallback(render, { timeout: 500 }) : setTimeout(render, 0)
    }, { rootMargin: '150px' })
    observer.observe(cardRef.current.closest('.wiki-diagram-section') || cardRef.current)
    return () => { active = false; renderRef.current = null; observer.disconnect(); if (window.cancelIdleCallback) cancelIdleCallback(idle); else clearTimeout(idle); currentSvg?.remove() }
  }, [renderId, source, valid, label, onFailure])

  useEffect(() => { if (expanded && !svg) void renderRef.current?.() }, [expanded, svg])

  useLayoutEffect(() => {
    if (!svg) return
    const target = expanded ? expandedHostRef.current : inlineHostRef.current
    target?.appendChild(svg)
  }, [expanded, svg, mobile])

  if (!source) return null
  const failure = !valid || Boolean(error)
  const controls = (
    <div className="diagram-controls" aria-label="Diagram controls">
      <IconButton label="Zoom out" icon={Minus} tooltip={false} onClick={() => setView((state) => ({ ...state, scale: Math.max(1, state.scale / 1.25) }))} />
      <span aria-live="polite">{Math.round(view.scale * 100)}%</span>
      <IconButton label="Zoom in" icon={Plus} tooltip={false} onClick={() => setView((state) => ({ ...state, scale: Math.min(4, state.scale * 1.25) }))} />
      <IconButton label="Fit diagram" icon={RotateCcw} tooltip={false} onClick={() => setView({ scale: 1, x: 0, y: 0 })} />
    </div>
  )
  const Overlay = mobile ? Sheet : Dialog
  const downloadSvg = () => {
    if (!svg) return
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'architecture-diagram.svg'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const copySource = async () => {
    try {
      await navigator.clipboard.writeText(source)
      setSourceCopied(true)
      clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setSourceCopied(false), 2000)
    } catch { setSourceCopied(false) }
  }

  return (
    <div ref={cardRef} className="diagram-card">
      <div className="diagram-header">
        <div><h3 id={titleId}>Architecture diagram</h3><p>Relationships described by this chapter’s generated Mermaid definition.</p></div>
        {!failure ? <IconButton ref={triggerRef} label="Expand diagram" icon={Maximize2} tooltip={false} onClick={() => setExpanded(true)} /> : null}
      </div>
      {failure ? (
        <div className="wiki-diagram-error" role="alert"><AlertTriangle aria-hidden="true" /><div><strong>Diagram could not be rendered.</strong><p>{error || 'The Mermaid source could not be validated.'}</p><CodeBlock code={source} language="Mermaid" /></div></div>
      ) : (
        <>
          {!svg ? <div className="wiki-diagram-loading" role="status"><span className="ui-sr-only">Rendering diagram…</span><Skeleton height="14rem" /></div> : null}
          <DiagramCanvas hostRef={inlineHostRef} view={view} setView={setView} interacted={interacted} setInteracted={setInteracted} />
          <div className="diagram-footer">{controls}<div><button type="button" onClick={copySource}>{sourceCopied ? 'Copied Mermaid source' : 'Copy Mermaid source'}</button><button type="button" onClick={downloadSvg}>Download SVG <Download size={14} aria-hidden="true" /></button></div></div>
          <Overlay open={expanded} onOpenChange={setExpanded} title="Architecture diagram" description="Drag to pan, scroll to zoom, or use the controls." triggerRef={triggerRef} size="lg" side="bottom" className="wiki-diagram-overlay">
            <DiagramCanvas hostRef={expandedHostRef} view={view} setView={setView} interacted={interacted} setInteracted={setInteracted} expanded />
            <div className="diagram-footer">{controls}<div><button type="button" onClick={copySource}>{sourceCopied ? 'Copied Mermaid source' : 'Copy Mermaid source'}</button><button type="button" onClick={downloadSvg}>Download SVG <Download size={14} aria-hidden="true" /></button></div></div>
          </Overlay>
        </>
      )}
    </div>
  )
}
