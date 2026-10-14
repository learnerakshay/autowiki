import { useReducedMotion } from '../ui/kit/hooks.js'
import { motionPreference } from '../../lib/motion.js'
import { useEffect } from 'react'
import { reducedMotionQuery } from '../../lib/motion.js'

const finePointer = '(hover: hover) and (pointer: fine)'

/**
 * A subtle magnetic pull on one element: while the pointer is within `radius` px it drifts up to `max` px
 * toward it, eased with a frame-rate-independent lerp, and settles back when the pointer leaves. Writes the
 * offset to --mx/--my (consumed by the element's CSS transform, so press feedback still composes).
 * Pointer-fine devices only; skipped under reduced motion; its loop sleeps whenever settled.
 */
export function useMagnetic(rootRef, selector, { max = 6, radius = 150 } = {}) {
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    const root = rootRef.current
    const target = root?.querySelector(selector)
    if (!root || !target) return undefined
    if (!window.matchMedia(finePointer).matches || motionPreference(reducedMotionQuery).matches) return undefined

    const state = { x: 0, y: 0, tx: 0, ty: 0 }
    let frame = 0
    let last = 0
    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = 1 - Math.exp(-12 * dt)
      state.x += (state.tx - state.x) * k
      state.y += (state.ty - state.y) * k
      target.style.setProperty('--mx', `${state.x.toFixed(2)}px`)
      target.style.setProperty('--my', `${state.y.toFixed(2)}px`)
      frame = Math.abs(state.tx - state.x) < 0.05 && Math.abs(state.ty - state.y) < 0.05 ? 0 : requestAnimationFrame(tick)
    }
    const wake = () => { if (!frame) { last = performance.now(); frame = requestAnimationFrame(tick) } }
    const onMove = (event) => {
      const rect = target.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const distance = Math.hypot(dx, dy)
      const pull = distance < radius ? 1 - distance / radius : 0
      state.tx = Math.max(-max, Math.min(max, dx * 0.2)) * pull
      state.ty = Math.max(-max, Math.min(max, dy * 0.2)) * pull
      wake()
    }
    const onLeave = () => { state.tx = 0; state.ty = 0; wake() }
    root.addEventListener('pointermove', onMove, { passive: true })
    root.addEventListener('pointerleave', onLeave)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      root.removeEventListener('pointermove', onMove)
      root.removeEventListener('pointerleave', onLeave)
      target.style.removeProperty('--mx')
      target.style.removeProperty('--my')
    }
  }, [rootRef, selector, max, radius, reducedMotion])
}
