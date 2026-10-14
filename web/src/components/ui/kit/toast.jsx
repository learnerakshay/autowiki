import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { AlertCircle, Check, Info, X } from 'lucide-react'
import clsx from 'clsx'
import { projectDistance } from '../../../lib/carouselEngine.js'
import { FLICK_VELOCITY } from '../../../lib/motion.js'
import { snapshot, subscribe, toast } from './toastStore.js'
import './toast.css'

const ICONS = { success: Check, error: AlertCircle, info: Info }

function ToastItem({ item }) {
  const ref = useRef(null)
  const [paused, setPaused] = useState(false)
  const remaining = useRef(item.duration)
  const drag = useRef(null)

  // Auto-dismiss, paused while hovered or focused (the remaining time is kept, not reset).
  useEffect(() => {
    if (paused || item.leaving || item.duration === Infinity) return undefined
    const started = performance.now()
    const timer = window.setTimeout(() => toast.dismiss(item.id), remaining.current)
    return () => { window.clearTimeout(timer); remaining.current -= performance.now() - started }
  }, [paused, item.leaving, item.duration, item.id])

  const onPointerDown = (event) => {
    if (event.target.closest('button, a') || event.button !== 0) return
    const element = ref.current
    drag.current = { pointer: event.pointerId, x0: event.clientX, x: 0, last: event.clientX, time: performance.now(), velocity: 0, width: element.offsetWidth }
    element.setPointerCapture(event.pointerId)
    element.dataset.dragging = 'true'
    setPaused(true)
  }
  const onPointerMove = (event) => {
    const state = drag.current
    if (!state || event.pointerId !== state.pointer) return
    const now = performance.now()
    const dt = Math.max(1, now - state.time)
    state.velocity = 0.8 * state.velocity + 0.2 * ((event.clientX - state.last) / dt) * 1000
    state.last = event.clientX
    state.time = now
    state.x = event.clientX - state.x0
    ref.current.style.transform = `translate3d(${state.x}px, 0, 0)`
    ref.current.style.opacity = String(1 - Math.min(Math.abs(state.x) / state.width, 0.6))
  }
  const onPointerUp = (event) => {
    const state = drag.current
    if (!state || event.pointerId !== state.pointer) return
    drag.current = null
    const element = ref.current
    delete element.dataset.dragging
    element.releasePointerCapture?.(event.pointerId)
    // Dismiss when the throw would carry it past half its width (position + projected velocity), or it was flicked.
    const projected = state.x + projectDistance(state.velocity)
    const dismiss = Math.abs(projected) > state.width * 0.5 || Math.abs(state.velocity) > FLICK_VELOCITY * 1.5
    element.style.transform = ''
    element.style.opacity = ''
    if (dismiss) toast.dismiss(item.id, Math.sign(projected || state.x || 1) * (state.width + 48))
    else setPaused(false)
  }

  const Icon = ICONS[item.tone] ?? Info
  return (
    <div className="ui-toast-wrap" data-state={item.leaving ? 'leaving' : 'open'}>
      <div
        ref={ref}
        className={clsx('ui-toast', `ui-toast--${item.tone}`)}
        style={item.swipe ? { '--swipe-x': `${item.swipe}px` } : undefined}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => { if (!drag.current) setPaused(false) }}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <span className="ui-toast__icon" aria-hidden="true"><Icon /></span>
        <div className="ui-toast__copy">
          <p className="ui-toast__title">{item.title}</p>
          {item.description ? <p className="ui-toast__description">{item.description}</p> : null}
          {item.action ? <button type="button" className="ui-toast__action" onClick={() => { item.action.onClick?.(); toast.dismiss(item.id) }}>{item.action.label}</button> : null}
        </div>
        <button type="button" className="ui-toast__close" aria-label="Dismiss notification" onClick={() => toast.dismiss(item.id)}><X aria-hidden="true" /></button>
      </div>
    </div>
  )
}

/** Renders the toast stack (bottom-right, bottom-centre on phones). Mount it once. Announced politely. */
export function Toaster({ limit = 4 }) {
  const current = useSyncExternalStore(subscribe, snapshot, () => [])
  if (typeof document === 'undefined') return null
  return createPortal(
    <div className="ui-toaster" role="region" aria-label="Notifications" aria-live="polite" aria-relevant="additions text">
      {current.slice(-limit).map((item) => <ToastItem key={item.id} item={item} />)}
    </div>,
    document.body,
  )
}
