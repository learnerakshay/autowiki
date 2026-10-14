import { useReducedMotion } from './hooks.js'
import { motionPreference } from '../../../lib/motion.js'
import { useEffect, useRef } from 'react'
import clsx from 'clsx'
import { reducedMotionQuery } from '../../../lib/motion.js'
import './surface.css'

const finePointer = '(hover: hover) and (pointer: fine)'

/**
 * Card / panel surface.
 *   variant  flat (hairline), raised (layered shadow, the landing's card), dark (the dark-section scale; nested
 *            buttons and the focus ring invert automatically)
 *   spotlight  a glow that follows the cursor along the 1px border (the features section's card). Pointer-fine only,
 *            never under reduced motion; transform-only and it sleeps when settled.
 *   interactive  adds spring hover lift and pointer-down press. Leave it off for non-clickable cards.
 */
export function Surface({ variant = 'flat', spotlight = false, interactive = false, padding = 'md', as: Tag = 'div', className, children, ...rest }) {
  const reducedMotion = useReducedMotion()
  const ref = useRef(null)
  const orbRef = useRef(null)

  useEffect(() => {
    const card = ref.current
    const orb = orbRef.current
    if (!spotlight || !card || !orb) return undefined
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
    card.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      card.removeEventListener('pointermove', onMove)
    }
  }, [spotlight, reducedMotion])

  return (
    <Tag
      ref={ref}
      className={clsx('ui-surface', `ui-surface--${variant}`, `ui-surface--pad-${padding}`, interactive && 'is-interactive', spotlight && 'has-spotlight', className)}
      data-surface={variant === 'dark' ? 'dark' : undefined}
      {...rest}
    >
      {spotlight ? <span className="ui-surface__glow" aria-hidden="true"><i ref={orbRef} className="ui-surface__orb" /></span> : null}
      {children}
    </Tag>
  )
}
