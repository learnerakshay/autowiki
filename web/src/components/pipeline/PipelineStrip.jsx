import { useRef } from 'react'
import { usePipelineScroll } from './usePipelineScroll.js'
import './pipeline.css'

/**
 * The six-stage generation pipeline. Markup and classes match the original strip; this adds a faint
 * track under the fill, a traveling-highlight element, and focusable nodes. Behavior lives in
 * usePipelineScroll.
 */
export function PipelineStrip({ stages }) {
  const wrapRef = useRef(null)
  usePipelineScroll({ wrapRef, count: stages.length })

  return (
    <div ref={wrapRef} className="pipeline-wrap landing-reveal">
      <i className="pipeline__track" aria-hidden="true" />
      <i className="pipeline__path" aria-hidden="true" />
      <i className="pipeline__glint" aria-hidden="true" />
      <ol className="pipeline" aria-label="Wiki generation pipeline">
        {stages.map((stage, index) => (
          <li key={stage} tabIndex={0}>
            <span><b>{String(index + 1).padStart(2, '0')}</b></span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}
