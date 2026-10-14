import { settleTime, springEase, springToLinear } from './spring.js'

export const motionQuery = '(prefers-reduced-motion: no-preference)'
export const reducedMotionQuery = '(prefers-reduced-motion: reduce)'

export const motion = Object.freeze({
  feedback: 0.16,
  selection: 0.24,
  content: 0.36,
  entrance: 0.52,
  ease: 'power3.out',
})

/**
 * The page's motion vocabulary. Every interactive spring (hero tab indicator and content swap,
 * carousel settle, pagination pill, pipeline fill) is one of these, so the page moves as one system.
 *   default  - damping 1.0, response 0.35s: no overshoot. Used for everything that isn't a throw.
 *   momentum - damping 0.8, response 0.35s: a small bounce, only after a flick that carried velocity.
 */
export const springs = Object.freeze({
  default: Object.freeze({ damping: 1, response: 0.35 }),
  momentum: Object.freeze({ damping: 0.8, response: 0.35 }),
})

/** Reduced motion replaces every spring with a plain short opacity cross-fade / ease. */
export const reduced = Object.freeze({ fade: 0.18, ease: 'power1.out' })

export const springDuration = Object.freeze({
  default: settleTime(springs.default),
  momentum: settleTime(springs.momentum),
})

/** GSAP-compatible easing functions generated from the presets above. */
export const springEases = Object.freeze({
  default: springEase(springs.default),
  momentum: springEase(springs.momentum),
})

/**
 * The presets as CSS `linear()` easing strings for the Web Animations API (the same curves as --spring /
 * --spring-momentum), with a close ease-out where `linear()` is unsupported.
 */
const hasLinearEasing = typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)')
export const springCss = Object.freeze({
  default: hasLinearEasing ? springToLinear(springs.default) : 'cubic-bezier(0.16, 1, 0.3, 1)',
  momentum: hasLinearEasing ? springToLinear(springs.momentum) : 'cubic-bezier(0.16, 1, 0.3, 1)',
})

/** Pixels of release velocity (px/s) above which a drag counts as a flick and may bounce. */
export const FLICK_VELOCITY = 600

/**
 * Publishes the presets as CSS custom properties so stylesheets use the exact same springs:
 * `--spring` / `--spring-duration` and `--spring-momentum` / `--spring-momentum-duration`.
 */
export function installMotionTokens(root = document.documentElement) {
  // CSS linear() easing needs Chrome 113 / Safari 17.2 / Firefox 112; elsewhere fall back to a close ease-out curve.
  const linearEasing = typeof CSS !== 'undefined' && CSS.supports('transition-timing-function', 'linear(0, 1)')
  const fallback = 'cubic-bezier(0.16, 1, 0.3, 1)'
  root.style.setProperty('--spring', linearEasing ? springToLinear(springs.default) : fallback)
  root.style.setProperty('--spring-duration', `${Math.round(springDuration.default * 1000)}ms`)
  root.style.setProperty('--spring-momentum', linearEasing ? springToLinear(springs.momentum) : fallback)
  root.style.setProperty('--spring-momentum-duration', `${Math.round(springDuration.momentum * 1000)}ms`)
}

export function prefersReducedMotion() {
  return typeof document !== 'undefined' && (document.documentElement.dataset.reducedMotion === 'true' || window.matchMedia(reducedMotionQuery).matches)
}

// The dev override and the OS preference share the same subscription, including enhanced-layout gates.
export function motionPreference(query = reducedMotionQuery) {
  const media = window.matchMedia(query)
  const listeners = new Map()
  return {
    get matches() {
      if (document.documentElement.dataset.reducedMotion !== 'true') return media.matches
      return query.includes('no-preference') ? false : query.includes('prefers-reduced-motion: reduce') ? true : media.matches
    },
    addEventListener(type, callback) {
      const observer = new MutationObserver(callback)
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] })
      media.addEventListener(type, callback)
      listeners.set(callback, observer)
    },
    removeEventListener(type, callback) { media.removeEventListener(type, callback); listeners.get(callback)?.disconnect(); listeners.delete(callback) },
  }
}
export function subscribeMotion(callback) {
  const query = motionPreference()
  query.addEventListener('change', callback)
  return () => query.removeEventListener('change', callback)
}
