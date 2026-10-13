import { useRef, useSyncExternalStore } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { FileCode2, Network } from 'lucide-react'
import { heroSample } from '../../data/heroSample.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { AnimatedHeading } from './AnimatedHeading.jsx'
import { GithubMark } from './GithubMark.jsx'
import { HeroBackground } from './HeroBackground.jsx'
import { PreviewWindow } from './PreviewWindow.jsx'
import { RepoDemoInput } from './RepoDemoInput.jsx'
import { useHeroActive, useHeroMotion } from './useHeroMotion.js'
import { useHeroDemo } from './useHeroDemo.js'
import './hero.css'

// Only facts that are true of the current implementation.
const FACTS = [
  { icon: GithubMark, label: 'Public GitHub repositories' },
  { icon: Network, label: 'Mermaid diagrams' },
  { icon: FileCode2, label: 'Source-grounded chapters' },
]

const subscribeReducedMotion = (notify) => {
  const query = window.matchMedia(reducedMotionQuery)
  query.addEventListener('change', notify)
  return () => query.removeEventListener('change', notify)
}
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches

export function Hero() {
  const heroRef = useRef(null)
  const stageRef = useRef(null)
  const planeRef = useRef(null)
  const spotRef = useRef(null)
  const sheenRef = useRef(null)
  const backdropRef = useRef(null)

  const reducedMotion = useSyncExternalStore(subscribeReducedMotion, getReducedMotion, () => false)
  const active = useHeroActive(heroRef)

  const demo = useHeroDemo({
    text: heroSample.repo,
    chapterCount: heroSample.chapters.length,
    enabled: !reducedMotion,
    visible: active,
  })

  useHeroMotion({ heroRef, stageRef, planeRef, spotRef, sheenRef, backdropRef }, active && !reducedMotion)

  // Entrance: nav, headline (masked word rise), then lede / input / facts at ~75ms steps, then the window.
  // Total ~1.3s and nothing overlays the page, so the field is usable the whole time.
  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add({ calm: '(prefers-reduced-motion: no-preference)', reduced: reducedMotionQuery }, ({ conditions }) => {
      const hero = heroRef.current
      const header = hero.closest('.landing-shell')?.querySelector('.landing-header__inner')
      const copy = hero.querySelectorAll('.landing-hero__lede, .hero-actions, .hero-facts')
      const stage = stageRef.current

      if (conditions.reduced) {
        gsap.from([header, ...hero.querySelectorAll('.landing-hero__copy > *'), stage], { autoAlpha: 0, duration: 0.3, ease: 'power1.out', clearProps: 'all' })
        return
      }

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(header, { autoAlpha: 0, y: -16, duration: 0.5, clearProps: 'all' }, 0)
        .from(hero.querySelectorAll('[data-motion-heading="hero"] .motion-heading__word'), { autoAlpha: 0, yPercent: 110, duration: 0.62, stagger: 0.05, clearProps: 'all' }, 0.06)
        .from(copy, { autoAlpha: 0, y: 14, duration: 0.46, stagger: 0.075, clearProps: 'all' }, 0.5)
        .from(stage, { autoAlpha: 0, y: 44, scale: 0.965, duration: 0.72, ease: 'power4.out', clearProps: 'all' }, 0.62)
    })
    return () => media.revert()
  }, { scope: heroRef })

  return (
    <section ref={heroRef} className="landing-hero" aria-labelledby="landing-title" data-hero-active={active}>
      <HeroBackground backdropRef={backdropRef} spotRef={spotRef} />

      <div className="landing-hero__copy">
        <AnimatedHeading as="h1" id="landing-title" hero lines={['Your repository,', 'beautifully documented.']} />
        <p className="landing-hero__lede">Transform a public GitHub repository into a structured technical wiki with generated chapters, source context, and Mermaid diagrams.</p>
        <RepoDemoInput demo={demo} exploreHref={`/wiki/sample/${heroSample.slug}`} />
        <ul className="hero-facts" aria-label="What AutoWiki supports">
          {FACTS.map(({ icon: Icon, label }) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}
        </ul>
      </div>

      <div ref={stageRef} className="hero-stage">
        <div ref={planeRef} className="hero-stage__plane">
          <PreviewWindow demo={demo} sheenRef={sheenRef} />
        </div>
      </div>
    </section>
  )
}
