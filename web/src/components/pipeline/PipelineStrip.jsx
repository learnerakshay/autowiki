import { useRef } from 'react'
import { usePipelineScroll } from './usePipelineScroll.js'
import './pipeline.css'

/**
 * The generation pipeline: stages along a connector that fills with scroll (see usePipelineScroll).
 * It becomes a vertical timeline on narrow screens. The nodes are not interactive, so they are not
 * focusable; hover and press still give feedback for pointer users.
 */
export function PipelineStrip({ stages }) {
  const wrapRef = useRef(null)
  usePipelineScroll({ wrapRef, count: stages.length })

  return (
    <div ref={wrapRef} className="pipeline-wrap">
      <i className="pipeline__track" aria-hidden="true" />
      <i className="pipeline__path" aria-hidden="true" />
      <i className="pipeline__glint" aria-hidden="true" />
      <ol className="pipeline" aria-label="Wiki generation pipeline">
        {stages.map((stage, index) => (
          <li key={stage}>
            <span><b className="tnum">{String(index + 1).padStart(2, '0')}</b></span>
            <strong>{stage}</strong>
          </li>
        ))}
      </ol>
    </div>
  )
}
