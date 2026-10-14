import { motionPreference } from '../../lib/motion.js'
import { useEffect, useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { reduced, prefersReducedMotion, subscribeMotion, reducedMotionQuery, springDuration, springEases } from '../../lib/motion.js'

const SHIFT = 20 // px the outgoing/incoming content travels
const OUT = 0.14 // outgoing fade: fast enough that old and new text never overlap readably
const IN_DELAY = 0.09
const STAGGER = 0.045

const PANEL = '[data-swap-panel]'

/** Restart the stroke-draw + node pop on a diagram (CSS transitions keyed off data-drawn). */
function redraw(graph) {
  if (graph.dataset.drawn !== 'true') return
  graph.dataset.drawn = 'false'
  void graph.offsetWidth // one reflow so the "hidden" state is committed before drawing starts
  graph.dataset.drawn = 'true'
}

/** A brief highlight sweep (transform-only pseudo-element, see hero.css) across source paths and code. */
function sweep(elements) {
  elements.forEach((element, index) => {
    element.classList.remove('pw-sweep')
    void element.offsetWidth
    element.style.setProperty('--sweep-delay', `${0.12 + index * 0.07}s`)
    element.classList.add('pw-sweep')
    element.addEventListener('animationend', () => element.classList.remove('pw-sweep'), { once: true })
  })
}

/**
 * Directional, interruptible content swap for tab panels.
 *
 * All panels stay mounted (Radix `forceMount`); the outgoing panel is taken out of flow and slides/fades
 * away while the incoming children spring in with a stagger. Every tween starts from the live on-screen
 * value (GSAP reads the current transform/opacity), so a new swap retargets mid-flight: nothing snaps,
 * nothing queues and input is never locked.
 *
 * @param containerRef  element that directly contains the `[data-swap-panel]` panels
 * @param mode          the active panel value
 * @param order         panel values in tab order, used to derive the direction
 */
export function useTabSwap({ containerRef, mode, order }) {
  const previous = useRef(null)
  const delayed = useRef(null)
  const context = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    context.current = gsap.context(() => {}, container)
    const unsubscribe = subscribeMotion(() => {
      if (!prefersReducedMotion()) return
      delayed.current?.kill()
      gsap.killTweensOf([container, ...container.querySelectorAll('*')])
      container.querySelectorAll(PANEL).forEach((panel) => { delete panel.dataset.swap; gsap.set([panel, ...panel.children], { clearProps: 'all' }) })
      container.style.height = ''
      const active = container.querySelector('[data-state="active"]')
      if (active) gsap.fromTo(active, { opacity: 0 }, { opacity: 1, duration: reduced.fade, ease: reduced.ease, clearProps: 'opacity' })
    })
    return () => { unsubscribe(); delayed.current?.kill(); context.current.revert() }
  }, [containerRef])

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    if (previous.current === null) { previous.current = mode; return }
    const from = previous.current
    previous.current = mode
    if (from === mode) return

    const direction = Math.sign(order.indexOf(mode) - order.indexOf(from)) || 1
    const calm = !motionPreference(reducedMotionQuery).matches

    context.current.add(() => {
      const panels = [...container.querySelectorAll(PANEL)]
      const incoming = panels.find((panel) => panel.dataset.swapPanel === mode)
      const windowEl = container.closest('.product-window')
      delayed.current?.kill()

      // READ: height before any mutation.
      const heightBefore = container.getBoundingClientRect().height

      // WRITE: classify panels. A panel is "visible" if it was the active one or is mid-transition.
      const wasLeaving = incoming.dataset.swap === 'out'
      const wasVisible = (panel) => panel.dataset.swapPanel === from || panel.dataset.swap
      const outgoing = panels.filter((panel) => panel !== incoming && wasVisible(panel))

      outgoing.forEach((panel) => {
        gsap.killTweensOf(panel.children) // an interrupted entrance must not keep animating inside a leaving panel
        panel.dataset.swap = 'out'
        panel.setAttribute('aria-hidden', 'true')
        panel.setAttribute('inert', '')
      })
      incoming.dataset.swap = 'in'
      incoming.removeAttribute('aria-hidden')
      incoming.removeAttribute('inert')

      const finishOut = (panel) => () => {
        if (panel.dataset.swap !== 'out') return
        delete panel.dataset.swap
        gsap.set(panel, { clearProps: 'all' })
        gsap.set(panel.children, { clearProps: 'all' })
      }
      const finishIn = () => {
        if (incoming.dataset.swap !== 'in') return
        delete incoming.dataset.swap
        gsap.set(incoming, { clearProps: 'all' })
        gsap.set(incoming.children, { clearProps: 'all' })
      }

      if (!calm) {
        container.querySelectorAll('.diagram-graph').forEach((graph) => { graph.dataset.drawn = 'true' })
        // Reduced motion: quick opacity-only hand-off, no travel, stagger, redraw or height tween.
        outgoing.forEach((panel) => gsap.to(panel, { autoAlpha: 0, duration: reduced.fade / 2, ease: reduced.ease, overwrite: true, onComplete: finishOut(panel) }))
        gsap.fromTo(incoming, { autoAlpha: wasLeaving ? gsap.getProperty(incoming, 'opacity') : 0 }, { autoAlpha: 1, duration: reduced.fade, delay: reduced.fade / 2, ease: reduced.ease, overwrite: true, onComplete: finishIn })
        return
      }

      // Outgoing: slide opposite to the direction of travel and fade fast, from wherever they are now.
      outgoing.forEach((panel) => {
        gsap.to(panel, { x: -direction * SHIFT, autoAlpha: 0, duration: OUT, ease: 'power2.out', overwrite: true, onComplete: finishOut(panel) })
      })

      // Incoming: children spring in from the direction of travel, staggered.
      const children = [...incoming.children]
      if (!wasLeaving) {
        gsap.set(incoming, { x: 0, autoAlpha: 1 })
        gsap.set(children, { x: direction * SHIFT, autoAlpha: 0 })
      } else {
        gsap.to(incoming, { x: 0, autoAlpha: 1, duration: springDuration.default, ease: springEases.default, overwrite: true })
      }
      gsap.to(children, {
        x: 0,
        autoAlpha: 1,
        duration: springDuration.default,
        ease: springEases.default,
        delay: IN_DELAY,
        stagger: STAGGER,
        overwrite: true,
        onComplete: finishIn,
      })

      // Height: one forced layout to read the new natural height, then spring there from the current one.
      gsap.killTweensOf(container)
      container.style.height = ''
      const heightAfter = container.getBoundingClientRect().height
      if (Math.abs(heightAfter - heightBefore) > 1) {
        gsap.fromTo(container, { height: heightBefore }, { height: heightAfter, duration: springDuration.default, ease: springEases.default, overwrite: true, onComplete: () => { container.style.height = '' } })
      }

      // Per-tab entrance effects, timed to land with the incoming content. One timeline so a retarget kills them all.
      const timeline = gsap.timeline()
      delayed.current = timeline
      if (mode === 'architecture') {
        const asideGraphs = [...(windowEl?.querySelectorAll('.product-window__context .diagram-graph') ?? [])]
        incoming.querySelectorAll('.diagram-graph').forEach((graph) => {
          graph.dataset.drawn = 'false'
          const at = IN_DELAY + STAGGER * Math.max(0, children.indexOf(graph)) + 0.1
          timeline.call(() => { graph.dataset.drawn = 'true' }, null, at)
        })
        timeline.call(() => asideGraphs.forEach(redraw), null, IN_DELAY + 0.1)
      } else if (mode === 'sources') {
        const targets = [
          ...incoming.querySelectorAll('.source-ledger strong'),
          ...(windowEl?.querySelectorAll('.product-window__context-source code, .product-window__context-code') ?? []),
        ]
        timeline.call(() => sweep(targets), null, IN_DELAY + STAGGER * 2)
      }
    })
  }, [containerRef, mode, order])
}
