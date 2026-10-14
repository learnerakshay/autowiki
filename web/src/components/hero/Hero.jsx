import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { FileCode2, Network } from 'lucide-react'
import { brand } from '../../config/brand.js'
import { heroSample } from '../../data/heroSample.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { AnimatedHeading } from './AnimatedHeading.jsx'
import { GithubMark } from './GithubMark.jsx'
import { HeroBackground } from './HeroBackground.jsx'
import { RepoDemoInput } from './RepoDemoInput.jsx'
import { useHeroActive, useHeroMotion } from './useHeroMotion.js'
import { useHeroDemo } from './useHeroDemo.js'
import './hero.css'

// The preview window is the heaviest part of the hero (three panels, two diagrams, streaming text). It is fetched
// at once but mounted when the browser is idle, behind a skeleton of the same size, so the headline and the
// repo field are never waiting on it.
const loadWindow = () => import('./PreviewWindow.jsx')
// The headline is the brand motto, broken after its comma so it can never drift from brand.js.
const headlineLines = brand.motto.split(/(?<=,)\s+/)
const PreviewWindow = lazy(() => loadWindow().then((module) => ({ default: module.PreviewWindow })))
const idle = (callback) => ('requestIdleCallback' in window ? requestIdleCallback(callback, { timeout: 500 }) : setTimeout(callback, 120))
const cancelIdle = (handle) => ('cancelIdleCallback' in window ? cancelIdleCallback(handle) : clearTimeout(handle))

function WindowSkeleton() {
  return <div className="product-proof" aria-hidden="true"><div className="product-window pw-skeleton" /></div>
}

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
  const [windowReady, setWindowReady] = useState(false)
  useEffect(() => {
    loadWindow()
    const handle = idle(() => setWindowReady(true))
    return () => cancelIdle(handle)
  }, [])

  const demo = useHeroDemo({
    text: heroSample.repo,
    chapterCount: heroSample.chapters.length,
    enabled: !reducedMotion,
    visible: active,
  })

  useHeroMotion({ heroRef, stageRef, planeRef, spotRef, sheenRef, backdropRef }, active && !reducedMotion)

  return (
    <section ref={heroRef} className="landing-hero" aria-labelledby="landing-title" data-hero-active={active}>
      <HeroBackground backdropRef={backdropRef} spotRef={spotRef} />

      <div className="landing-hero__copy">
        <AnimatedHeading as="h1" id="landing-title" hero lines={headlineLines} />
        <p className="landing-hero__lede">Transform a public GitHub repository into a structured technical wiki with generated chapters, source context, and Mermaid diagrams.</p>
        <RepoDemoInput demo={demo} exploreHref={`/wiki/sample/${heroSample.slug}`} />
        <ul className="hero-facts" aria-label="What AutoWiki supports">
          {FACTS.map(({ icon: Icon, label }) => <li key={label}><Icon aria-hidden="true" />{label}</li>)}
        </ul>
      </div>

      <div ref={stageRef} className="hero-stage">
        <div ref={planeRef} className="hero-stage__plane">
          {windowReady ? (
            <Suspense fallback={<WindowSkeleton />}><PreviewWindow demo={demo} sheenRef={sheenRef} /></Suspense>
          ) : <WindowSkeleton />}
        </div>
      </div>
    </section>
  )
}
