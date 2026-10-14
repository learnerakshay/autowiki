import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Menu, X } from 'lucide-react'
import { BrandLink } from '../brand/BrandLink.jsx'
import { actions, routes, sections } from '../../data/landingCopy.js'
import { scrollToSection } from './scrollToSection.js'
import './nav.css'

const FOCUSABLE = 'a[href], button:not([disabled])'

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
  const [open, setOpen] = useState(false)
  const barRef = useRef(null)
  const progressRef = useRef(null)
  const menuRef = useRef(null)
  const sheetRef = useRef(null)
  const ids = sections.map((section) => section.id)
  const spy = useScrollSpy(ids)
  const { scrolled, pastHero } = useScrollState({ barRef, progressRef })
  const dark = useDarkUnderNav()
  const close = useCallback(() => setOpen(false), [])

  // Mobile sheet: Esc closes, focus is trapped, the page behind is inert and doesn't scroll.
  useEffect(() => {
    if (!open) return undefined
    const menu = menuRef.current
    const behind = [...document.querySelectorAll('#main-content, .lf')]
    behind.forEach((element) => element.setAttribute('inert', ''))
    document.documentElement.style.overflow = 'hidden'
    sheetRef.current?.querySelector(FOCUSABLE)?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
      if (event.key !== 'Tab') return
      const items = [menuRef.current, ...sheetRef.current.querySelectorAll(FOCUSABLE)].filter(Boolean)
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      behind.forEach((element) => element.removeAttribute('inert'))
      document.documentElement.style.overflow = ''
      menu?.focus({ preventScroll: true })
    }
  }, [open])

  const onSectionClick = (event, id) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return
    event.preventDefault()
    setOpen(false)
    scrollToSection(id)
  }

  const links = sections.map((section, index) => (
    <a
      key={section.id}
      href={`#${section.id}`}
      className="ln__link"
      aria-current={spy === index ? 'location' : undefined}
      onClick={(event) => onSectionClick(event, section.id)}
    >{section.label}</a>
  ))

  return (
    <header className="ln" data-scrolled={scrolled} data-past-hero={pastHero} data-open={open} data-tone={dark ? 'dark' : 'light'}>
      <div className="ln__edge" aria-hidden="true" />
      <div ref={barRef} className="ln__bar">
        <BrandLink animated />

        <nav className="ln__links" aria-label="Page sections" style={{ '--count': sections.length + 1, '--spy': Math.max(0, spy) }}>
          <span className="ln__pill" aria-hidden="true" data-on={spy >= 0} />
          {links}
          <Link to={routes.architecture} className="ln__link">Architecture</Link>
        </nav>

        <div className="ln__cta">
          <Link to={routes.sample} className="ln__sample" inert={pastHero}>{actions.secondary}</Link>
          <Link to={routes.workspace} className="ln__primary" inert={!pastHero}>{actions.primary} <ArrowRight aria-hidden="true" /></Link>
        </div>

        <button
          ref={menuRef}
          type="button"
          className="ln__menu"
          aria-expanded={open}
          aria-controls="ln-sheet"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>

        <span ref={progressRef} className="ln__progress" aria-hidden="true" />
      </div>

      <div className="ln__scrim" aria-hidden="true" onClick={close} data-open={open} />
      <div ref={sheetRef} id="ln-sheet" className="ln__sheet" role="dialog" aria-modal="true" aria-label="Menu" data-open={open} inert={!open}>
        <nav aria-label="Menu sections">
          {links}
          <Link to={routes.architecture} className="ln__link" onClick={close}>Architecture</Link>
        </nav>
        <div className="ln__sheet-actions">
          <Link to={routes.workspace} className="ln__primary ln__primary--sheet" onClick={close}>{actions.primary} <ArrowRight aria-hidden="true" /></Link>
          <Link to={routes.sample} className="ln__sample ln__sample--sheet" onClick={close}>{actions.secondary}</Link>
        </div>
      </div>
    </header>
  )
}
