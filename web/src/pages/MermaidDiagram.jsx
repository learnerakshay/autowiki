import { useEffect, useId, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { AlertTriangle, MoveHorizontal, Network } from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton.jsx'

let mermaidPromise

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: {
          primaryColor: '#ecf9fc',
          primaryTextColor: '#172033',
          primaryBorderColor: '#77b9c8',
          lineColor: '#52617a',
          secondaryColor: '#f6f8fb',
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
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    gsap.fromTo(
      containerRef.current,
      { autoAlpha: reduced ? 1 : 0.72, y: reduced ? 0 : 6 },
      { autoAlpha: 1, y: 0, duration: reduced ? 0.1 : 0.24, ease: reduced ? 'none' : 'power3.out' },
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
  if (!source) return null

  return (
    <div className="diagram-card">
      <div className="diagram-header">
        <div className="diagram-header__identity">
          <span aria-hidden="true"><Network size={18} /></span>
          <div>
            <h3 id={titleId}>Architecture diagram</h3>
            <p>Relationships described by this chapter’s generated Mermaid definition.</p>
          </div>
        </div>
        <span className="diagram-header__hint"><MoveHorizontal aria-hidden="true" size={15} />Scroll to explore</span>
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
  )
}
