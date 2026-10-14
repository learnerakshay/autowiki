import { lazy, useEffect, useLayoutEffect } from 'react'
import { Hero } from '../components/hero/Hero.jsx'
import { EffectsBoundary } from '../components/landing/EffectsBoundary.jsx'
import { LandingFooter } from '../components/landing/LandingFooter.jsx'
import { LandingNav } from '../components/landing/LandingNav.jsx'
import { LazySection } from '../components/landing/LazySection.jsx'
import { scrollToSection } from '../components/landing/scrollToSection.js'
import { installMotionTokens } from '../lib/motion.js'
import '../styles/landing.css'

// Everything below the hero is code-split: its chunk (including the ScrollTrigger-heavy motion code) is
// fetched as the section approaches and mounted when the main thread is idle. `minHeight` reserves
// roughly the real height so the page doesn't jump while a section streams in.
const section = (id, preload, minHeight) => ({ id, preload, Section: lazy(preload), minHeight })
const SECTIONS = [
  section('how-it-works', () => import('../components/landing/ProcessStory.jsx'), 'calc(16rem + calc(240 * var(--svh)))'),
  section('explore', () => import('../components/landing/HorizontalStory.jsx'), 'calc(calc(100 * var(--svh)) + calc(144 * var(--svh)))'),
  section('features', () => import('../components/landing/FeaturesSection.jsx'), '58rem'),
  section('pipeline', () => import('../components/landing/PipelineSection.jsx'), '40rem'),
  section('get-started', () => import('../components/landing/FinalCta.jsx'), '32rem'),
]

export default function Landing() {
  // Publish the shared spring presets as CSS tokens before first paint so stylesheets use the same motion.
  useLayoutEffect(() => { installMotionTokens() }, [])

  // A deep link (/#features) needs the code-split sections mounted before it can land in the right place.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && SECTIONS.some((entry) => entry.id === id)) scrollToSection(id, { updateHash: false })
  }, [])

  return (
    <div className="landing-shell">
      <a className="skip-link" href="#main-content">Skip to content</a>
      <LandingNav />
      <main id="main-content" className="landing-main" tabIndex={-1}>
        <Hero />
        {SECTIONS.map(({ id, ...rest }, order) => <LazySection key={id} id={id} order={order} {...rest} />)}
      </main>
      <EffectsBoundary><LandingFooter /></EffectsBoundary>
    </div>
  )
}
