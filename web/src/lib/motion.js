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

/** Pixels of release velocity (px/s) above which a drag counts as a flick and may bounce. */
export const FLICK_VELOCITY = 600

/**
 * Publishes the presets as CSS custom properties so stylesheets use the exact same springs:
 * `--spring` / `--spring-duration` and `--spring-momentum` / `--spring-momentum-duration`.
 */
export function installMotionTokens(root = document.documentElement) {
  root.style.setProperty('--spring', springToLinear(springs.default))
  root.style.setProperty('--spring-duration', `${Math.round(springDuration.default * 1000)}ms`)
  root.style.setProperty('--spring-momentum', springToLinear(springs.momentum))
  root.style.setProperty('--spring-momentum-duration', `${Math.round(springDuration.momentum * 1000)}ms`)
}

export function prefersReducedMotion() {
  return window.matchMedia(reducedMotionQuery).matches
}
