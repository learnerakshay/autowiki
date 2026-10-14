import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { reducedMotionQuery, springs } from '../../lib/motion.js'
import { createSpringValue } from '../../lib/spring.js'

gsap.registerPlugin(ScrollTrigger)

const clamp01 = (value) => Math.min(1, Math.max(0, value))
// Below this width the strip becomes a vertical timeline (see pipeline.css); the fill then runs top to bottom.
const VERTICAL_QUERY = '(max-width: 720px)'

/**
 * Scroll-linked fill for the generation pipeline strip.
 *
 * Scroll progress (a ScrollTrigger over the strip) is smoothed by a critically damped spring and drives
 * both the connector's scaleX and the sequential activation of each node: a node turns on as the fill
 * front reaches it and turns off again when scrolling back up. When the fill completes, one highlight
 * travels the line - once per entry into view, never a loop. Under reduced motion the strip is simply
 * shown in its final, filled state.
 *
 * Node thresholds come from measured geometry while the connector is visible, and fall back to even
 * index spacing when the strip wraps or stacks (where the line is hidden), so activation works in any
 * orientation.
 */
export function usePipelineScroll({ wrapRef, count }) {
  useEffect(() => {
    const wrap = wrapRef.current
    if (!wrap) return undefined
    const path = wrap.querySelector('.pipeline__path')
    const glint = wrap.querySelector('.pipeline__glint')
    const nodes = [...wrap.querySelectorAll('.pipeline li')]
    const reduced = window.matchMedia(reducedMotionQuery)
    let teardown = null

    const showFinal = () => {
      if (path) path.style.transform = 'scale(1)'
      nodes.forEach((node) => node.classList.add('is-active'))
      return () => {
        if (path) path.style.transform = ''
        nodes.forEach((node) => node.classList.remove('is-active'))
      }
    }

    const run = () => {
      // Even spacing, slightly inset so the first node isn't lit at zero progress.
      const evenThresholds = () => nodes.map((_, index) => (index === count - 1 ? 0.995 : 0.03 + 0.965 * (index / (count - 1))))
      let thresholds = evenThresholds()
      let inView = false
      let played = false

      let vertical = false

      const measure = () => {
        vertical = window.matchMedia(VERTICAL_QUERY).matches
        const single = nodes.every((node) => node.offsetTop === nodes[0].offsetTop)
        if (vertical && path && path.offsetHeight) {
          // Vertical timeline: a node lights when the fill front reaches the centre of its circle.
          thresholds = nodes.map((node) => {
            const circle = node.firstElementChild
            const center = node.offsetTop + circle.offsetTop + circle.offsetHeight / 2
            return clamp01((center - path.offsetTop) / path.offsetHeight)
          })
          thresholds[thresholds.length - 1] = Math.min(thresholds[thresholds.length - 1], 0.995)
          for (let i = 1; i < thresholds.length; i += 1) thresholds[i] = Math.max(thresholds[i], thresholds[i - 1])
        } else if (single && path && getComputedStyle(path).display !== 'none' && path.offsetWidth) {
          // One row with a visible connector: a node lights when the fill front reaches its centre.
          thresholds = nodes.map((node) => {
            const circle = node.firstElementChild
            const center = node.offsetLeft + circle.offsetLeft + circle.offsetWidth / 2
            return clamp01((center - path.offsetLeft) / path.offsetWidth)
          })
          thresholds[thresholds.length - 1] = Math.min(thresholds[thresholds.length - 1], 0.995)
          // Always in reading order, whatever the geometry says.
          for (let i = 1; i < thresholds.length; i += 1) thresholds[i] = Math.max(thresholds[i], thresholds[i - 1])
        } else {
          // Wrapped (tablet) layout: no meaningful geometry, so activate in order by progress through the strip.
          thresholds = evenThresholds()
        }
      }

      const travel = () => {
        if (!glint || played || !inView) return
        played = true
        glint.classList.remove('is-travelling')
        void glint.offsetWidth
        glint.classList.add('is-travelling')
        glint.addEventListener('animationend', () => glint.classList.remove('is-travelling'), { once: true })
      }

      const apply = (value) => {
        const fill = clamp01(value)
        if (path) path.style.transform = vertical ? `scaleY(${fill.toFixed(4)})` : `scaleX(${fill.toFixed(4)})`
        nodes.forEach((node, index) => {
          const on = fill >= thresholds[index] - 0.0005
          if (on === node.classList.contains('is-active')) return
          node.classList.toggle('is-active', on)
          if (on) {
            node.classList.remove('is-pulsing')
            void node.offsetWidth
            node.classList.add('is-pulsing')
            node.addEventListener('animationend', () => node.classList.remove('is-pulsing'), { once: true })
          }
        })
        if (fill >= 0.995) travel()
      }

      const fill = createSpringValue({ value: 0, spring: springs.default, onUpdate: apply })

      measure()
      const trigger = ScrollTrigger.create({
        trigger: wrap,
        start: 'top 82%',
        end: 'bottom 55%',
        onRefresh: (self) => { measure(); fill.jump(self.progress) },
        onUpdate: (self) => fill.setTarget(self.progress),
      })
      fill.jump(trigger.progress)

      // "Entry into view" for the once-per-entry highlight; leaving the viewport re-arms it.
      const observer = new IntersectionObserver(([entry]) => {
        // Enter at 35% visible; only re-arm once fully out of view, so jitter near the edge can't replay it.
        if (entry.intersectionRatio === 0) { inView = false; played = false; return }
        inView = entry.intersectionRatio >= 0.35
        if (inView && fill.value >= 0.995) travel()
      }, { threshold: [0, 0.35] })
      observer.observe(wrap)

      const resize = new ResizeObserver(() => { measure(); apply(fill.value) })
      resize.observe(wrap)

      return () => {
        observer.disconnect()
        resize.disconnect()
        trigger.kill()
        fill.destroy()
        glint?.classList.remove('is-travelling')
        if (path) path.style.transform = ''
        nodes.forEach((node) => node.classList.remove('is-active', 'is-pulsing'))
      }
    }

    const sync = () => {
      teardown?.()
      teardown = reduced.matches ? showFinal() : run()
    }
    reduced.addEventListener('change', sync)
    sync()
    return () => { reduced.removeEventListener('change', sync); teardown?.() }
  }, [wrapRef, count])
}
