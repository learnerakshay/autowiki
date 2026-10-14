import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { PillNav } from '../shell/PillNav.jsx'
import { actions, routes, sections } from '../../data/landingCopy.js'
import { scrollToSection } from './scrollToSection.js'

/** Which on-page section is under the middle of the viewport (or -1 while the hero is up). */
function useScrollSpy(ids) {
  const [active, setActive] = useState(-1)
  useEffect(() => {
    const elements = ids.map((id) => document.getElementById(id)).filter(Boolean)
    if (!elements.length || !('IntersectionObserver' in window)) return undefined
    const live = new Set()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? live.add(entry.target.id) : live.delete(entry.target.id)))
      let current = -1
      ids.forEach((id, index) => { if (live.has(id)) current = index })
      setActive(current)
    }, { rootMargin: '-45% 0px -50% 0px' })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [ids])
  return active
}

/** True while a dark section (the chapters carousel, the footer) is behind the nav zone at the top of the viewport. */
function useDarkUnderNav() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const targets = [document.getElementById('explore'), document.querySelector('.lf')].filter(Boolean)
    if (!targets.length || !('IntersectionObserver' in window)) return undefined
    const live = new Set()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => (entry.isIntersecting ? live.add(entry.target) : live.delete(entry.target)))
      setDark(live.size > 0)
    }, { rootMargin: '0px 0px -88% 0px' })
    targets.forEach((target) => observer.observe(target))
    return () => observer.disconnect()
  }, [])
  return dark
}

/** Scroll progress, "past the hero" and "scrolled at all", written without re-rendering per frame. */
function useScrollState({ barRef, progressRef }) {
  const [scrolled, setScrolled] = useState(false)
  const [pastHero, setPastHero] = useState(false)
  useEffect(() => {
    let frame = 0
    let heroHeight = 0
    const measure = () => { heroHeight = document.querySelector('.landing-hero')?.offsetHeight ?? 0 }
    const update = () => {
      frame = 0
      const doc = document.documentElement
      const progress = Math.min(1, Math.max(0, window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight)))
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`
      setScrolled(window.scrollY > 24)
      setPastHero(heroHeight > 0 && window.scrollY > heroHeight * 0.55)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    measure()
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', measure)
    const resize = new ResizeObserver(measure)
    const hero = document.querySelector('.landing-hero')
    if (hero) resize.observe(hero)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', measure)
      resize.disconnect()
    }
  }, [barRef, progressRef])
  return { scrolled, pastHero }
}

export function LandingNav() {
  const barRef = useRef(null)
  const progressRef = useRef(null)
  const ids = sections.map((section) => section.id)
  const spy = useScrollSpy(ids)
  const { scrolled, pastHero } = useScrollState({ barRef, progressRef })
  const dark = useDarkUnderNav()

  const items = [
    ...sections.map((section) => ({
      key: section.id,
      label: section.label,
      href: `#${section.id}`,
      onClick: (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
        event.preventDefault()
        scrollToSection(section.id)
      },
    })),
    { key: 'architecture', label: 'Architecture', to: routes.architecture },
  ]

  return (
    <PillNav
      brand={<BrandLink animated />}
      items={items}
      activeIndex={spy}
      current="location"
      linksLabel="Page sections"
      inertSelectors="#main-content, .lf"
      barRef={barRef}
      progressRef={progressRef}
      headerProps={{ 'data-scrolled': scrolled, 'data-past-hero': pastHero, 'data-tone': dark ? 'dark' : 'light' }}
      cta={(
        <>
          <Link to={routes.sample} className="ln__sample" inert={pastHero}>{actions.secondary}</Link>
          <Link to={routes.workspace} className="ln__primary" inert={!pastHero}>{actions.primary} <ArrowRight aria-hidden="true" /></Link>
        </>
      )}
      sheetActions={(
        <>
          <Link to={routes.workspace} className="ln__primary ln__primary--sheet">{actions.primary} <ArrowRight aria-hidden="true" /></Link>
          <Link to={routes.sample} className="ln__sample ln__sample--sheet">{actions.secondary}</Link>
        </>
      )}
    />
  )
}
