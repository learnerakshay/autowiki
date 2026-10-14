import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import gsap from 'gsap'
import { createCarouselEngine } from '../../lib/carouselEngine.js'
import { prefersReducedMotion } from '../../lib/motion.js'

gsap.registerPlugin(ScrollTrigger)

// Same breakpoint/motion gate as the CSS that pins the section and lays the slides out in a row.
const ENHANCED_QUERY = '(min-width: 901px) and (prefers-reduced-motion: no-preference)'
const DRAG_SLOP = 10 // px of travel before a gesture is classified
const VELOCITY_WINDOW = 100 // ms of pointer history used for release velocity
// Text drifts outward 5% of the slide shift, the card lags 3% (8% apart). The card's lag stays smaller than the
// slide padding so a neighbouring card never pokes into view at rest.
const PARALLAX_COPY = 0.05
const PARALLAX_ART = 0.03
const DIM = 0.35
const SCALE_DROP = 0.03
const PASSTHROUGH = 'button, a, input, select, textarea, [data-no-drag]'
const CATCH_UP_MS = 100 // after recognition, the content eases onto the pointer instead of trailing it by the slop

/**
 * Direct-manipulation controller for the pinned chapters carousel.
 *
 * One engine owns the position. The pinned page scroll, pointer drag, pagination buttons and arrow
 * keys are all just inputs to it, rendered by a single rAF loop that only runs while something moves.
 * Nothing here hardcodes a size: slide step, viewport width and pager pitch are measured at runtime.
 *
 * @returns {{ enhanced: boolean, interacted: boolean, goTo: (index: number) => void }}
 */
export function useDragCarousel({ rootRef, count, onActive }) {
  const [enhanced, setEnhanced] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const api = useRef(null)
  const onActiveRef = useRef(onActive)

  useEffect(() => { onActiveRef.current = onActive }, [onActive])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return undefined
    const query = window.matchMedia(ENHANCED_QUERY)
    let teardown = null

    const enhance = () => {
      const frame = root.querySelector('.horizontal-story__frame')
      const track = root.querySelector('.horizontal-story__track')
      const pill = root.querySelector('.pager-pill')
      const pagerButtons = [...root.querySelectorAll('.pager-group button')]
      const slides = [...root.querySelectorAll('.horizontal-scene')].map((scene) => ({
        scene,
        copy: scene.querySelector('.horizontal-scene__copy'),
        art: scene.querySelector('.horizontal-scene__artifact'),
      }))
      if (!frame || !track || slides.length < 2) return null

      root.classList.add('is-enhanced')
      const engine = createCarouselEngine({ count })
      let pitch = 0
      let lastActive = -1
      let frameId = 0
      let last = 0
      let expectedScrollY = null
      let suppressClick = false
      let pointer = null
      const samples = []
      let notedInteraction = false

      const interact = () => {
        if (notedInteraction) return
        notedInteraction = true
        setInteracted(true)
      }

      const measure = () => {
        const travel = track.scrollWidth - frame.clientWidth
        engine.configure({ step: travel / (count - 1), dimension: frame.clientWidth })
        pitch = pagerButtons.length > 1 ? pagerButtons[1].offsetLeft - pagerButtons[0].offsetLeft : 0
      }

      const render = () => {
        const { position, step } = engine
        track.style.transform = `translate3d(${(-position * step).toFixed(2)}px, 0, 0)`
        for (let i = 0; i < slides.length; i += 1) {
          const { scene, copy, art } = slides[i]
          const d = i - position
          const away = Math.min(1, Math.abs(d))
          scene.style.opacity = away ? (1 - DIM * away).toFixed(3) : ''
          scene.style.transform = away ? `scale(${(1 - SCALE_DROP * away).toFixed(4)})` : ''
          if (copy) copy.style.transform = away ? `translate3d(${(d * step * PARALLAX_COPY).toFixed(2)}px, 0, 0)` : ''
          if (art) art.style.transform = away ? `translate3d(${(-d * step * PARALLAX_ART).toFixed(2)}px, 0, 0)` : ''
        }
        if (pill) pill.style.transform = `translate3d(${(position * pitch).toFixed(2)}px, 0, 0)`
        if (engine.active !== lastActive) {
          if (lastActive !== -1) interact() // scrolling to another chapter counts as having found the controls
          lastActive = engine.active
          onActiveRef.current?.(lastActive)
        }
      }

      const loop = (now) => {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        const moving = engine.tick(dt)
        render()
        frameId = moving ? requestAnimationFrame(loop) : 0
        if (!moving) expectedScrollY = null
      }
      const wake = () => {
        if (frameId) return
        last = performance.now()
        frameId = requestAnimationFrame(loop)
      }

      // ── Pinned scroll ⇄ engine ────────────────────────────────────────────────────────────
      const trigger = ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        invalidateOnRefresh: true,
        onRefresh: measure,
        onUpdate: (self) => {
          const position = self.progress * (count - 1)
          if (engine.mode === 'scroll') {
            engine.setScrollTarget(position)
            wake()
          } else if (engine.mode === 'settle' && !(expectedScrollY !== null && Math.abs(window.scrollY - expectedScrollY) < 3)) {
            engine.takeOverScroll(position) // the user scrolled mid-settle: scroll wins, velocity carries
            wake()
          }
          // mode === 'drag': the pointer owns the position; scroll must not fight it
        },
      })

      /** Keep the page scroll in step with the snapped slide so scrolling resumes from here. */
      const syncScroll = (index) => {
        const y = trigger.start + (trigger.end - trigger.start) * (index / (count - 1))
        if (window.scrollY >= trigger.start - 2 && window.scrollY <= trigger.end + 2) {
          expectedScrollY = y
          window.scrollTo({ top: y, behavior: 'instant' }) // invisible: the section is pinned across this range
        } else {
          engine.takeOverScroll(index) // not pinned yet: let a normal smooth scroll bring the page and the slide
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }

      // ── Pointer ───────────────────────────────────────────────────────────────────────────
      let catchFrame = 0
      const blockSelection = (event) => event.preventDefault()

      /**
       * Content offset for the pointer at `x`. It is true 1:1 from the pointer-down point, minus the slop
       * travelled before the gesture was recognised, which decays to zero over CATCH_UP_MS (ease-out), so
       * there is neither a jump at recognition nor a constant trailing lag afterwards.
       */
      const applyDrag = (x) => {
        const t = Math.min(1, (performance.now() - pointer.lagStart) / CATCH_UP_MS)
        const lag = pointer.lag0 * (1 - (1 - (1 - t) ** 3))
        engine.dragBy(x - pointer.anchor - lag)
        render()
        return t < 1
      }
      const catchUp = () => {
        catchFrame = 0
        if (!pointer?.dragging) return
        if (applyDrag(pointer.lastX)) catchFrame = requestAnimationFrame(catchUp)
      }

      const releaseVelocity = (now) => {
        const recent = samples.filter((sample) => sample.t >= now - VELOCITY_WINDOW)
        if (recent.length < 2) return 0
        const first = recent[0]
        const lastSample = recent[recent.length - 1]
        if (now - lastSample.t > 80) return 0 // the pointer rested before letting go
        const seconds = (lastSample.t - first.t) / 1000
        return seconds > 0 ? (lastSample.x - first.x) / seconds : 0
      }

      const endSelectionBlock = () => {
        if (catchFrame) cancelAnimationFrame(catchFrame)
        catchFrame = 0
        document.removeEventListener('selectstart', blockSelection)
      }

      const finishPointer = (event, velocity) => {
        const finished = pointer
        pointer = null
        endSelectionBlock()
        frame.classList.remove('is-dragging')
        if (finished?.captured && frame.hasPointerCapture?.(finished.id)) frame.releasePointerCapture(finished.id)
        if (!finished || (!finished.dragging && !finished.froze)) return
        const resolved = engine.endDrag(finished.dragging ? velocity ?? releaseVelocity(event.timeStamp) : 0)
        syncScroll(resolved.target)
        wake()
      }

      const onPointerDown = (event) => {
        if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
        suppressClick = false
        if (event.target.closest(PASSTHROUGH)) return
        const moving = frameId !== 0
        if (moving) engine.beginDrag() // grabbing mid-settle freezes it right here
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, anchor: event.clientX, lastX: event.clientX, lag0: 0, lagStart: 0, dragging: false, captured: false, froze: moving }
        samples.length = 0
        samples.push({ t: event.timeStamp, x: event.clientX })
      }

      const onPointerMove = (event) => {
        if (!pointer || event.pointerId !== pointer.id) return
        if (!pointer.dragging) {
          const dx = event.clientX - pointer.x
          const dy = event.clientY - pointer.y
          if (Math.hypot(dx, dy) < DRAG_SLOP) return
          if (Math.abs(dy) > Math.abs(dx)) {
            // Vertical intent: not ours. Let the page scroll (touch-action: pan-y) and resume if we had frozen a settle.
            const froze = pointer.froze
            pointer = null
            if (froze) { engine.endDrag(0); wake() }
            return
          }
          pointer.dragging = true
          pointer.captured = true
          pointer.lag0 = dx // the slop travelled before recognition; eased away below
          pointer.lagStart = performance.now()
          if (!pointer.froze) engine.beginDrag()
          frame.setPointerCapture(event.pointerId)
          frame.classList.add('is-dragging')
          // A drag was recognised: drop any text selection the press started, and keep it from growing.
          window.getSelection()?.removeAllRanges()
          document.addEventListener('selectstart', blockSelection)
          interact()
        }
        pointer.lastX = event.clientX
        samples.push({ t: event.timeStamp, x: event.clientX })
        if (samples.length > 12) samples.shift()
        if (applyDrag(event.clientX) && !catchFrame) catchFrame = requestAnimationFrame(catchUp)
      }

      const onPointerUp = (event) => {
        if (!pointer || event.pointerId !== pointer.id) return
        if (pointer.dragging) suppressClick = true
        finishPointer(event)
      }
      const onPointerCancel = (event) => {
        if (!pointer || event.pointerId !== pointer.id) return
        finishPointer(event, 0)
      }
      // Touch pointers are implicitly captured by the touched child; taking explicit capture makes that child
      // fire a bubbling lostpointercapture, which is a hand-off, not the end of the gesture.
      const onLostCapture = (event) => { if (event.target === frame) onPointerCancel(event) }
      const onClickCapture = (event) => {
        if (!suppressClick) return
        suppressClick = false
        event.preventDefault()
        event.stopPropagation()
      }

      // ── Keyboard / buttons ────────────────────────────────────────────────────────────────
      const goTo = (index) => {
        const next = Math.max(0, Math.min(count - 1, index))
        interact()
        if (pointer?.dragging) {
          // A button pressed mid-drag retargets with the drag's own velocity instead of snapping.
          const carried = releaseVelocity(performance.now())
          pointer = null
          endSelectionBlock()
          frame.classList.remove('is-dragging')
          engine.mode = 'settle'
          engine.velocity = -carried / engine.step
        }
        engine.snapTo(next)
        syncScroll(next)
        wake()
      }

      const onKeyDown = (event) => {
        if (event.target !== frame) return
        const keys = { ArrowLeft: engine.active - 1, ArrowRight: engine.active + 1, Home: 0, End: count - 1 }
        if (!(event.key in keys)) return
        event.preventDefault()
        goTo(keys[event.key])
      }

      measure()
      engine.jump(trigger.progress * (count - 1))
      render()
      const resize = new ResizeObserver(() => { measure(); render() })
      resize.observe(frame)

      frame.addEventListener('pointerdown', onPointerDown)
      frame.addEventListener('pointermove', onPointerMove)
      frame.addEventListener('pointerup', onPointerUp)
      frame.addEventListener('pointercancel', onPointerCancel)
      frame.addEventListener('lostpointercapture', onLostCapture)
      frame.addEventListener('click', onClickCapture, true)
      frame.addEventListener('keydown', onKeyDown)

      api.current = { goTo }
      return () => {
        api.current = null
        endSelectionBlock()
        if (frameId) cancelAnimationFrame(frameId)
        resize.disconnect()
        trigger.kill()
        frame.removeEventListener('pointerdown', onPointerDown)
        frame.removeEventListener('pointermove', onPointerMove)
        frame.removeEventListener('pointerup', onPointerUp)
        frame.removeEventListener('pointercancel', onPointerCancel)
        frame.removeEventListener('lostpointercapture', onLostCapture)
        frame.removeEventListener('click', onClickCapture, true)
        frame.removeEventListener('keydown', onKeyDown)
        frame.classList.remove('is-dragging')
        root.classList.remove('is-enhanced')
        track.style.transform = ''
        if (pill) pill.style.transform = ''
        slides.forEach(({ scene, copy, art }) => {
          scene.style.opacity = ''
          scene.style.transform = ''
          if (copy) copy.style.transform = ''
          if (art) art.style.transform = ''
        })
      }
    }

    const sync = () => {
      teardown?.()
      teardown = query.matches ? enhance() : null
      setEnhanced(Boolean(teardown))
    }
    query.addEventListener('change', sync)
    sync()
    return () => { query.removeEventListener('change', sync); teardown?.() }
  }, [rootRef, count])

  const goTo = useCallback((index) => {
    if (api.current) { api.current.goTo(index); return }
    // Stacked layout (narrow screens / reduced motion): the chapters are ordinary vertical content.
    const next = Math.max(0, Math.min(count - 1, index))
    onActiveRef.current?.(next)
    document.getElementById(`horizontal-scene-${next}`)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'center' })
  }, [count])

  return { enhanced, interacted, goTo }
}
