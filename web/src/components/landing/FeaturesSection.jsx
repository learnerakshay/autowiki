import { useEffect, useRef, useState } from 'react'
import { BookOpenText, FileCode2, Network } from 'lucide-react'
import { DiagramGraph } from '../hero/DiagramGraph.jsx'
import { StreamText } from '../hero/StreamText.jsx'
import { features as copy } from '../../data/landingCopy.js'
import { landingSample as sample } from '../../data/landingSample.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { FeatureCard } from './FeatureCard.jsx'
import { SectionHeading } from './SectionHeading.jsx'
import { useReveal } from './useReveal.js'
import './features.css'

const pad = (value) => String(value).padStart(2, '0')
const calm = () => window.matchMedia(reducedMotionQuery).matches

/** Chapter rows slide in one by one, then the featured row highlights. */
function ChaptersMini({ played, run }) {
  return (
    <ol key={run} className="mini-rows" data-playing={played}>
      {sample.chapters.map((chapter, index) => (
        <li key={chapter.title} className="mini-row" data-featured={chapter === sample.featured} style={{ '--i': index }}>
          <span className="tnum">{pad(index + 1)}</span>
          <strong>{chapter.title}</strong>
          <code>{chapter.filePaths[0]}</code>
        </li>
      ))}
    </ol>
  )
}

/** The Mermaid graph draws itself: edges stroke in, nodes pop. */
function GraphMini({ played, run }) {
  const [drawn, setDrawn] = useState(() => calm())
  useEffect(() => {
    if (calm() || !played) return undefined
    let second = 0
    // Reset on the next frame, draw on the one after, so the stroke/pop transitions restart cleanly.
    const first = requestAnimationFrame(() => { setDrawn(false); second = requestAnimationFrame(() => setDrawn(true)) })
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second) }
  }, [played, run])
  return <DiagramGraph diagram={sample.featured.diagram} drawn={drawn} size="large" label="" />
}

/** Each chapter's source path types in, with the chapter it grounds. */
function SourcesMini({ played, run }) {
  return (
    <ul key={run} className="mini-sources">
      {sample.chapters.map((chapter, index) => (
        <li key={chapter.title} className="mini-source" style={{ '--i': index }}>
          <FileCode2 />
          <StreamText as="code" text={chapter.filePaths[0]} live={!calm()} active={played} delay={140 + index * 260} />
          <span>{chapter.title}</span>
        </li>
      ))}
    </ul>
  )
}

export default function FeaturesSection() {
  const rootRef = useRef(null)
  useReveal(rootRef)

  return (
    <section ref={rootRef} className="lp-section features" aria-labelledby="features-title">
      <div className="lp-container" data-reveal-group>
        <SectionHeading id="features-title" eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
        <div className="features__grid">
          <FeatureCard className="fc--chapters" icon={BookOpenText} title={copy.cards.chapters.title} text={copy.cards.chapters.text}>
            {(state) => <ChaptersMini {...state} />}
          </FeatureCard>
          <FeatureCard className="fc--diagram" icon={Network} title={copy.cards.diagram.title} text={copy.cards.diagram.text}>
            {(state) => <GraphMini {...state} />}
          </FeatureCard>
          <FeatureCard className="fc--sources" icon={FileCode2} title={copy.cards.sources.title} text={copy.cards.sources.text}>
            {(state) => <SourcesMini {...state} />}
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
