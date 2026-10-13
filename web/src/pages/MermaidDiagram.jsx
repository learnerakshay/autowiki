import { useEffect, useId, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { AlertTriangle, Maximize2, MoveHorizontal, Network, X } from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton.jsx'
import { Button } from '../components/ui/button.jsx'
import { motion, prefersReducedMotion } from '../lib/motion.js'

let mermaidPromise

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: '#ecfafd',
          primaryTextColor: '#142638',
          primaryBorderColor: '#58bfd0',
          lineColor: '#506579',
          secondaryColor: '#f7fcfe',
          tertiaryColor: '#ffffff',
          fontFamily: 'Segoe UI Variable, Segoe UI, ui-sans-serif, system-ui, sans-serif',
        },
      })
      return mermaid
    })
  }

  return mermaidPromise
}

function svgNode(markup) {
  const documentNode = new DOMParser().parseFromString(markup, 'image/svg+xml')
  if (documentNode.querySelector('parsererror') || documentNode.documentElement.nodeName !== 'svg') {
    throw new Error('Mermaid returned an invalid SVG document')
  }
  return document.importNode(documentNode.documentElement, true)
}

function MermaidRender({ source, label }) {
  const id = `mermaid-${useId().replaceAll(':', '')}`
  const containerRef = useRef(null)
  const [rendered, setRendered] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const container = containerRef.current
    container?.replaceChildren()

    async function render() {
      try {
        const mermaid = await loadMermaid()
        const result = await mermaid.render(id, source)
        if (!active || !containerRef.current) return

        const svg = svgNode(result.svg)
        svg.setAttribute('role', 'img')
        svg.setAttribute('aria-label', label)
        containerRef.current.replaceChildren(svg)
        setRendered(true)
      } catch (renderError) {
        if (active) setError(renderError.message)
      }
    }

    render()
    return () => {
      active = false
      container?.replaceChildren()
    }
  }, [id, label, source])

  useGSAP(() => {
    if (!rendered || !containerRef.current) return
    const reduced = prefersReducedMotion()

    gsap.fromTo(
      containerRef.current,
      { autoAlpha: reduced ? 1 : 0.72, y: reduced ? 0 : 6 },
      { autoAlpha: 1, y: 0, duration: reduced ? 0.1 : motion.selection, ease: reduced ? 'none' : motion.ease },
    )
  }, { scope: containerRef, dependencies: [rendered] })

  if (error) {
    return (
      <div className="wiki-diagram-error" role="alert">
        <AlertTriangle aria-hidden="true" size={18} />
        <div>
          <strong>Diagram could not be rendered.</strong>
          <p>{error}</p>
          <details>
            <summary>Inspect Mermaid source</summary>
            <pre>{source}</pre>
          </details>
        </div>
      </div>
    )
  }

  return (
    <>
      {!rendered ? (
        <div className="wiki-diagram-loading" role="status">
          <span className="sr-only">Rendering diagram…</span>
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-56 w-full" />
        </div>
      ) : null}
      <div
        ref={containerRef}
        className="diagram"
        role="group"
        aria-label={`${label}. Scroll horizontally when the diagram is wider than the reading area.`}
        tabIndex={0}
      />
    </>
  )
}

export default function MermaidDiagram({ source, valid, titleId, label = 'Repository architecture diagram' }) {
  const cardRef = useRef(null)
  const toggleRef = useRef(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return undefined

    const toggle = toggleRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setExpanded(false)
        return
      }

      if (event.key !== 'Tab' || !cardRef.current) return
      const focusable = [...cardRef.current.querySelectorAll('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      requestAnimationFrame(() => toggle?.focus())
    }
  }, [expanded])

  useGSAP(() => {
    if (!expanded || !cardRef.current || prefersReducedMotion()) return
    gsap.fromTo(
      cardRef.current,
      { autoAlpha: 0.84, scale: 0.985, y: 8 },
      { autoAlpha: 1, scale: 1, y: 0, duration: motion.content, ease: motion.ease, clearProps: 'opacity,visibility,transform' },
    )
  }, { scope: cardRef, dependencies: [expanded] })

  if (!source) return null

  return (
    <>
      {expanded ? <div className="diagram-backdrop" aria-hidden="true" /> : null}
      <div
        ref={cardRef}
        id={`${titleId}-viewer`}
        className={`diagram-card${expanded ? ' is-expanded' : ''}`}
        role={expanded ? 'dialog' : undefined}
        aria-modal={expanded ? 'true' : undefined}
        aria-labelledby={titleId}
        aria-describedby={`${titleId}-description`}
      >
      <div className="diagram-header">
        <div className="diagram-header__identity">
          <span aria-hidden="true"><Network size={18} /></span>
          <div>
            <h3 id={titleId}>Architecture diagram</h3>
            <p id={`${titleId}-description`}>Relationships described by this chapter’s generated Mermaid definition.</p>
          </div>
        </div>
        <div className="diagram-header__actions">
          <span className="diagram-header__hint"><MoveHorizontal aria-hidden="true" size={15} />Scroll to explore</span>
          {valid ? (
            <Button
              ref={toggleRef}
              type="button"
              variant="secondary"
              size="sm"
              aria-expanded={expanded}
              aria-controls={`${titleId}-viewer`}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <X aria-hidden="true" size={16} /> : <Maximize2 aria-hidden="true" size={16} />}
              {expanded ? 'Close diagram' : 'Expand diagram'}
            </Button>
          ) : null}
        </div>
      </div>

      {!valid ? (
        <div className="wiki-diagram-error" role="alert">
          <AlertTriangle aria-hidden="true" size={18} />
          <div>
            <strong>Diagram could not be validated.</strong>
            <p>The raw Mermaid source remains available for inspection.</p>
            <details>
              <summary>Inspect Mermaid source</summary>
              <pre>{source}</pre>
            </details>
          </div>
        </div>
      ) : (
        <MermaidRender key={source} source={source} label={label} />
      )}
      </div>
    </>
  )
}
