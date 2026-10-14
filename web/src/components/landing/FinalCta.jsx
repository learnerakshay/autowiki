import { useEffect, useRef, useState } from 'react'
import { RepoDemoInput } from '../hero/RepoDemoInput.jsx'
import { finale, routes } from '../../data/landingCopy.js'
import { EffectsBoundary } from './EffectsBoundary.jsx'
import { SectionHeading } from './SectionHeading.jsx'
import { useMagnetic } from './useMagnetic.js'
import { useReveal } from './useReveal.js'
import './cta.css'

/** A cheap echo of the hero's mesh + grain: two drifting blobs and a static grain, paused off-screen. */
function CtaBackground() {
  return (
    <div className="cta__bg" aria-hidden="true">
      <span className="cta__blob cta__blob--a" />
      <span className="cta__blob cta__blob--b" />
      <i className="cta__grain" />
    </div>
  )
}

/** Finale: the same real action as the hero (compact input), nothing else competing for attention. */
export default function FinalCta() {
  const rootRef = useRef(null)
  const [active, setActive] = useState(false)
  useReveal(rootRef)
  useMagnetic(rootRef, '.repo-pill__submit')

  useEffect(() => {
    const element = rootRef.current
    if (!element || !('IntersectionObserver' in window)) return undefined
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { rootMargin: '100px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={rootRef} className="cta" aria-labelledby="cta-title" data-active={active}>
      <EffectsBoundary><CtaBackground /></EffectsBoundary>
      <div className="lp-container cta__inner" data-reveal-group>
        <SectionHeading id="cta-title" title={finale.title} lede={finale.lede} className="cta__head" />
        <div data-reveal="item"><RepoDemoInput id="cta-repo" compact exploreHref={routes.sample} /></div>
        <p className="cta__note" data-reveal="item">{finale.note}</p>
      </div>
    </section>
  )
}
