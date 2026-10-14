import { useReducedMotion } from '../ui/kit/hooks.js'
import { motionPreference } from '../../lib/motion.js'
import { useEffect, useRef, useState } from 'react'
import { reducedMotionQuery } from '../../lib/motion.js'

const finePointer = '(hover: hover) and (pointer: fine)'

/**
 * Card chrome plus two behaviours shared by every feature card:
 *  - a cursor-following border glow (pointer-fine only; transform-only, eased with a frame-rate
 *    independent lerp that sleeps when settled),
 *  - a miniature that plays once when the card enters view and replays on hover.
 * `children` receives `{ played, run }`: `played` flips true on first view, `run` increments on every replay,
 * so a miniature can restart itself by keying on it.
 */
export function FeatureCard({ className = '', title, text, icon: Icon, children }) {
  const reducedMotion = useReducedMotion()
  const ref = useRef(null)
  const orbRef = useRef(null)
  const [played, setPlayed] = useState(false)
  const [run, setRun] = useState(0)
  const lastReplay = useRef(0)

  // Play once when the card is meaningfully in view.
  useEffect(() => {
    const card = ref.current
    if (!card || !('IntersectionObserver' in window)) { setPlayed(true); return undefined }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      setPlayed(true)
      setRun((value) => value + 1)
      lastReplay.current = performance.now()
      observer.disconnect()
    }, { threshold: 0.35 })
    observer.observe(card)
    return () => observer.disconnect()
  }, [reducedMotion])

  // Spotlight: only on devices with a real hover pointer, never under reduced motion.
  useEffect(() => {
    const card = ref.current
    const orb = orbRef.current
    if (!card || !orb) return undefined
    if (!window.matchMedia(finePointer).matches || motionPreference(reducedMotionQuery).matches) return undefined
    let frame = 0
    let last = 0
    const state = { x: 0, y: 0, tx: 0, ty: 0, seeded: false }
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = 1 - Math.exp(-14 * dt)
      state.x += (state.tx - state.x) * k
      state.y += (state.ty - state.y) * k
      orb.style.transform = `translate3d(${state.x.toFixed(1)}px, ${state.y.toFixed(1)}px, 0)`
      frame = Math.abs(state.tx - state.x) < 0.3 && Math.abs(state.ty - state.y) < 0.3 ? 0 : requestAnimationFrame(tick)
    }
    const onMove = (event) => {
      const rect = card.getBoundingClientRect()
      state.tx = event.clientX - rect.left
      state.ty = event.clientY - rect.top
      if (!state.seeded) { state.x = state.tx; state.y = state.ty; state.seeded = true }
      if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick) }
    }
    const onEnter = () => {
      const now = performance.now()
      if (now - lastReplay.current < 1400) return // don't restart a miniature that is still playing
      lastReplay.current = now
      setRun((value) => value + 1)
    }
    card.addEventListener('pointermove', onMove, { passive: true })
    card.addEventListener('pointerenter', onEnter)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      card.removeEventListener('pointermove', onMove)
      card.removeEventListener('pointerenter', onEnter)
    }
  }, [reducedMotion])

  return (
    <article ref={ref} className={`fc ${className}`.trim()} data-reveal="item" data-played={played}>
      <span className="fc__glow" aria-hidden="true"><i ref={orbRef} className="fc__orb" /></span>
      <div className="fc__copy">
        {Icon ? <span className="fc__icon" aria-hidden="true"><Icon /></span> : null}
        <h3 className="lp-card-title">{title}</h3>
        <p className="lp-card-text">{text}</p>
      </div>
      <div className="fc__demo" aria-hidden="true">{children({ played, run })}</div>
    </article>
  )
}
