import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { PipelineStrip } from '../pipeline/PipelineStrip.jsx'
import { pipeline as copy, routes } from '../../data/landingCopy.js'
import { SectionHeading } from './SectionHeading.jsx'
import { useReveal } from './useReveal.js'
import './pipeline-section.css'

export default function PipelineSection() {
  const rootRef = useRef(null)
  useReveal(rootRef)

  return (
    <section ref={rootRef} className="lp-section pipeline-section" aria-labelledby="pipeline-title">
      <div className="lp-container" data-reveal-group>
        <div className="pl-head">
          <SectionHeading id="pipeline-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
          <Link className="lp-btn lp-btn--ghost pl-head__link" to={routes.architecture} data-reveal="item">{copy.link} <ArrowRight aria-hidden="true" /></Link>
        </div>

        <div className="pl-card" data-reveal="item">
          <PipelineStrip stages={copy.stages} />
          <div className="pl-chat">
            <p className="pl-chat__label">{copy.chat.label}</p>
            <ol className="pl-chat__stages" aria-label="Chat retrieval pipeline">
              {copy.chat.stages.map((stage) => <li key={stage}>{stage}</li>)}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}
