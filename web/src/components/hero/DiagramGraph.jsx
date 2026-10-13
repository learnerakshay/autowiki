import { useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * The generated Mermaid graph, drawn from its real nodes and edges. Edges are measured from the DOM
 * (on mount and whenever the box resizes), then revealed with a stroke-dashoffset transition and a
 * per-node delay (`--i`), so nodes pop in just after the line that leads to them.
 */
export function DiagramGraph({ diagram, drawn = true, size = 'compact', label }) {
  const rootRef = useRef(null)
  const nodeRefs = useRef(new Map())
  const [paths, setPaths] = useState([])
  const order = useMemo(() => new Map(diagram.levels.flat().map((node, index) => [node.id, index])), [diagram])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return undefined

    const measure = () => {
      const next = diagram.edges.map(({ from, to }) => {
        const parent = nodeRefs.current.get(from)
        const child = nodeRefs.current.get(to)
        if (!parent || !child) return null
        const x1 = parent.offsetLeft + parent.offsetWidth / 2
        const y1 = parent.offsetTop + parent.offsetHeight
        const x2 = child.offsetLeft + child.offsetWidth / 2
        const y2 = child.offsetTop
        const bend = (y2 - y1) * 0.55
        return { key: `${from}-${to}`, to, d: `M${x1} ${y1} C${x1} ${y1 + bend} ${x2} ${y2 - bend} ${x2} ${y2}` }
      }).filter(Boolean)
      setPaths((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next))
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => observer.disconnect()
  }, [diagram])

  return (
    <div ref={rootRef} className={`product-diagram diagram-graph diagram-graph--${size}`} data-drawn={drawn} role="img" aria-label={label}>
      <svg className="diagram-graph__edges" aria-hidden="true" focusable="false">
        {paths.map(({ key, to, d }) => <path key={key} d={d} pathLength="1" style={{ '--i': order.get(to) }} />)}
      </svg>
      {diagram.levels.map((level, levelIndex) => (
        <div className="diagram-graph__level" key={level.map((node) => node.id).join('-')}>
          {level.map((node) => (
            <span
              key={node.id}
              ref={(element) => { if (element) nodeRefs.current.set(node.id, element); else nodeRefs.current.delete(node.id) }}
              className="diagram-graph__node"
              data-root={levelIndex === 0}
              style={{ '--i': order.get(node.id) }}
            >{node.label}</span>
          ))}
        </div>
      ))}
    </div>
  )
}
