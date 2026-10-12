import mermaid from 'mermaid'
import { useEffect, useId, useRef, useState } from 'react'
import { AlertTriangle, MoveHorizontal } from 'lucide-react'
import { Skeleton } from '../components/ui/skeleton.jsx'

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: '#edf1ff',
    primaryTextColor: '#182033',
    primaryBorderColor: '#8ea3e6',
    lineColor: '#52617a',
    secondaryColor: '#f5f7fb',
    tertiaryColor: '#ffffff',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
})

export default function MermaidDiagram({ source, valid, titleId }) {
  const id = `mermaid-${useId().replaceAll(':', '')}`
  const containerRef = useRef(null)
  const [rendered, setRendered] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setRendered(false)
    setError('')

    if (containerRef.current) containerRef.current.replaceChildren()
    if (!source || !valid || !containerRef.current) return () => { active = false }

    mermaid.render(id, source)
      .then((result) => {
        if (active && containerRef.current) {
          containerRef.current.innerHTML = result.svg
          setRendered(true)
        }
      })
      .catch((renderError) => {
        if (active) setError(renderError.message)
      })

    return () => { active = false }
  }, [id, source, valid])

  if (!source) return null
  if (!valid || error) {
    return (
      <div className="rounded-lg border border-danger-border bg-danger-soft p-4">
        <p className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle aria-hidden="true" className="size-4" />Diagram could not be validated or rendered.</p>
        <p className="mt-1 text-sm text-danger/85">The raw Mermaid source is available below for inspection.</p>
        <pre className="mt-4">{source}</pre>
      </div>
    )
  }

  return (
    <div className="diagram-card">
      <div className="diagram-header">
        <div>
          <h3 id={titleId} className="text-sm font-semibold">Repository map</h3>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">Relationships described by this chapter.</p>
        </div>
        <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><MoveHorizontal aria-hidden="true" className="size-3.5" />Scroll to inspect</span>
      </div>
      {!rendered && <div className="space-y-3 p-5" role="status"><span className="sr-only">Rendering diagram…</span><Skeleton className="h-4 w-1/3" /><Skeleton className="h-40 w-full" /></div>}
      <div ref={containerRef} className="diagram" role="img" aria-label="Mermaid repository diagram" />
    </div>
  )
}
