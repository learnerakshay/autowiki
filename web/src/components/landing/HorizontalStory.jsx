import { useReducedMotion } from '../ui/kit/hooks.js'
import { motionPreference } from '../../lib/motion.js'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowLeft, ArrowRight, FileCode2 } from 'lucide-react'
import { DiagramGraph } from '../hero/DiagramGraph.jsx'
import { useDragCarousel } from '../story/useDragCarousel.js'
import { chapters as copy } from '../../data/landingCopy.js'
import { landingSample } from '../../data/landingSample.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { SectionHeading } from './SectionHeading.jsx'
import { useReveal } from './useReveal.js'
import '../story/story.css'

gsap.registerPlugin(ScrollTrigger)

const { slides } = landingSample
const pad = (value) => String(value).padStart(2, '0')

/** The right-hand card of a slide, built only from what the chapter really has. */
function Artifact({ slide }) {
  const { chapter, kind } = slide
  return (
    <div className={`horizontal-scene__artifact hs-artifact hs-artifact--${kind}`}>
      <div className="hs-artifact__bar">
        <FileCode2 aria-hidden="true" />
        <span>{chapter.filePaths[0]}</span>
        <small>generated chapter</small>
      </div>
      <div className="hs-artifact__body">
        {kind === 'code' && chapter.code ? (
          <>
            <p className="hs-artifact__lead">{chapter.lead}</p>
            <pre><code>{chapter.code.code}</code></pre>
          </>
        ) : null}
        {kind === 'lead' ? (
          <>
            <p className="hs-artifact__lead hs-artifact__lead--big">{chapter.lead}</p>
            <DiagramGraph diagram={chapter.diagram} size="compact" label={`Generated Mermaid structure for ${chapter.title}`} />
          </>
        ) : null}
        {kind === 'graph' ? <DiagramGraph diagram={chapter.diagram} size="large" label={`Generated Mermaid structure for ${chapter.title}`} /> : null}
      </div>
    </div>
  )
}

/**
 * Scroll-linked gradient bands at the section's two edges, so the white -> dark -> light hand-offs
 * are soft and move with the page instead of cutting. Static when motion is reduced.
 */
function useBoundaryBridges(rootRef) {
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const top = root.querySelector('.hs__bridge--top')
    const bottom = root.querySelector('.hs__bridge--bottom')
    if (motionPreference(reducedMotionQuery).matches) { gsap.set([top, bottom], { opacity: 1 }); return undefined }
    const context = gsap.context(() => {
      gsap.fromTo(top, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'top bottom', end: 'top 45%', scrub: 0.4 } })
      gsap.fromTo(bottom, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: root, start: 'bottom 90%', end: 'bottom 40%', scrub: 0.4 } })
    }, root)
    return () => context.revert()
  }, [rootRef, reducedMotion])
}

export default function HorizontalStory() {
  const rootRef = useRef(null)
  const topRef = useRef(null)
  const [activeScene, setActiveScene] = useState(0)
  const { enhanced, interacted, goTo } = useDragCarousel({ rootRef, count: slides.length, onActive: setActiveScene })
  const total = slides.length
  useReveal(topRef)
  useBoundaryBridges(rootRef)

  return (
    <section ref={rootRef} className="horizontal-story" aria-labelledby="chapters-title" style={{ '--count': total }}>
      <div className="hs__bridge hs__bridge--top" aria-hidden="true" />
      <div className="horizontal-story__sticky">
        <div ref={topRef} className="lp-wide hs__top" data-reveal-group>
          <SectionHeading id="chapters-title" compact eyebrow={copy.eyebrow} title={copy.title} lede={copy.lede} />
          <div className="horizontal-story__controls" role="group" aria-label="Chapter controls" data-reveal="item">
            <button type="button" aria-label="Previous chapter" disabled={activeScene === 0} onClick={() => goTo(activeScene - 1)}><ArrowLeft aria-hidden="true" /></button>
            <div className="pager-group" role="group" aria-label="Choose a chapter" style={{ '--active': activeScene }}>
              <i className="pager-pill" aria-hidden="true" />
              {slides.map(({ chapter }, index) => (
                <button
                  key={chapter.title}
                  type="button"
                  className={activeScene === index ? 'is-active' : ''}
                  aria-label={`Chapter ${index + 1}: ${chapter.title}`}
                  aria-pressed={activeScene === index}
                  aria-current={activeScene === index ? 'true' : undefined}
                  onClick={() => goTo(index)}
                ><span className="tnum">{index + 1}</span></button>
              ))}
            </div>
            <button type="button" aria-label="Next chapter" disabled={activeScene === total - 1} onClick={() => goTo(activeScene + 1)}><ArrowRight aria-hidden="true" /></button>
          </div>
        </div>

        <div
          className="lp-wide horizontal-story__frame"
          role="region"
          aria-roledescription="carousel"
          aria-label="Chapters"
          tabIndex={enhanced ? 0 : undefined}
        >
          <div className="horizontal-story__track">
            {slides.map((slide, index) => (
              <div
                id={`horizontal-scene-${index}`}
                className={`horizontal-scene horizontal-scene--${index + 1}${activeScene === index ? ' is-active' : ''}`}
                key={slide.chapter.title}
                role="group"
                aria-roledescription="slide"
                aria-label={`${index + 1} of ${total}`}
                aria-hidden={enhanced && activeScene !== index ? 'true' : undefined}
              >
                <div className="horizontal-scene__copy">
                  <p className="hs-kicker tnum">Chapter {pad(index + 1)} / {pad(total)}</p>
                  <h3>{slide.chapter.title}</h3>
                  <p className="hs-desc">{slide.chapter.description}</p>
                  <div className="horizontal-scene__paths"><span>Grounded in</span>{slide.chapter.filePaths.map((path) => <code key={path}>{path}</code>)}</div>
                </div>
                <Artifact slide={slide} />
              </div>
            ))}
          </div>
        </div>

        <p className="horizontal-story__status sr-only" aria-live="polite">Showing {slides[activeScene].chapter.title}. Scroll to move between chapters, or use the chapter controls.</p>
        <p className="lp-wide horizontal-story__hint" aria-hidden="true" data-hidden={interacted}>{copy.hint}</p>
      </div>
      <div className="hs__bridge hs__bridge--bottom" aria-hidden="true" />
    </section>
  )
}
