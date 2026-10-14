import { stepSpring } from './spring.js'
import { FLICK_VELOCITY, springs } from './motion.js'

// Pure carousel physics. Position is measured in slides (0 = first, count-1 = last) so nothing here
// knows a pixel size: callers pass the measured `step` (px per slide) and `dimension` (viewport width).
// Three modes share one position and one velocity, so drag, scroll, buttons and keys can never disagree:
//   scroll - position chases a target supplied by the pinned scroll progress
//   drag   - position is held by the pointer
//   settle - a spring carries position (and the release velocity) to a snapped slide

const DECAY = 0.998 // UIScrollView-style deceleration rate used to project where a flick would land
const RUBBER = 0.55
const DIRECTION_THRESHOLD = 250 // px/s above which velocity decides direction, not just distance

/** Progressive resistance past an edge: overshoot (px) -> displayed offset (px). */
export function rubberBand(overshoot, dimension, coefficient = RUBBER) {
  const magnitude = Math.abs(overshoot)
  return (Math.sign(overshoot) * (magnitude * dimension * coefficient)) / (dimension + coefficient * magnitude)
}

/** Distance (px) a release at `velocity` (px/s) would coast under exponential decay. */
export const projectDistance = (velocity) => ((velocity / 1000) * DECAY) / (1 - DECAY)

/**
 * Which slide a release lands on. `position` is in slides, `velocity` is the pointer's px/s
 * (positive = moving right, i.e. towards the previous slide).
 */
export function resolveRelease({ position, velocity, step, count }) {
  const projected = position - projectDistance(velocity) / step
  let target = Math.round(projected)
  // Direction follows the throw, not only the distance travelled.
  if (velocity < -DIRECTION_THRESHOLD) target = Math.max(target, Math.ceil(position - 1e-6))
  else if (velocity > DIRECTION_THRESHOLD) target = Math.min(target, Math.floor(position + 1e-6))
  target = Math.max(0, Math.min(count - 1, target))
  return { target, projected, bounce: Math.abs(velocity) > FLICK_VELOCITY }
}

export function createCarouselEngine({ count }) {
  const max = count - 1
  const engine = {
    position: 0,
    velocity: 0, // slides per second
    target: 0,
    mode: 'scroll',
    spring: springs.default,
    step: 1,
    dimension: 1,
    dragOrigin: 0,

    configure({ step, dimension }) {
      engine.step = step || 1
      engine.dimension = dimension || 1
    },

    get active() { return Math.max(0, Math.min(max, Math.round(engine.position))) },

    /** Scroll-driven target. Ignored while the pointer or a settle owns the position. */
    setScrollTarget(position) {
      if (engine.mode !== 'scroll') return false
      engine.target = position
      engine.spring = springs.default
      return true
    },

    /** The user scrolled during a settle: hand control back to scroll, keeping current velocity. */
    takeOverScroll(position) {
      engine.mode = 'scroll'
      engine.target = position
      engine.spring = springs.default
    },

    jump(position) {
      engine.position = position
      engine.target = position
      engine.velocity = 0
    },

    /** Grab: stop whatever is moving and hold the current position. */
    beginDrag() {
      engine.mode = 'drag'
      engine.velocity = 0
      engine.dragOrigin = engine.position
    },

    /** 1:1 tracking from the grab point, with rubber-banding past either end. */
    dragBy(deltaPx) {
      const raw = engine.dragOrigin - deltaPx / engine.step
      const clamped = Math.max(0, Math.min(max, raw))
      const overshootPx = (raw - clamped) * engine.step
      engine.position = clamped + (overshootPx ? rubberBand(overshootPx, engine.dimension) / engine.step : 0)
      return engine.position
    },

    /** Release at `velocity` (px/s): project, pick a slide, and spring there carrying the velocity. */
    endDrag(velocity) {
      const release = resolveRelease({ position: engine.position, velocity, step: engine.step, count })
      engine.mode = 'settle'
      engine.target = release.target
      engine.velocity = -velocity / engine.step
      // Bounce only when the throw carried momentum; slow drags settle critically damped.
      engine.spring = release.bounce ? springs.momentum : springs.default
      return release
    },

    /** Pagination / keyboard: retarget from wherever we are, keeping any velocity. */
    snapTo(index) {
      engine.mode = 'settle'
      engine.target = Math.max(0, Math.min(max, index))
      engine.spring = springs.default
    },

    /** Advance the spring. Returns true while there is still motion to render. */
    tick(dt) {
      if (engine.mode === 'drag') return false
      const [d, v] = stepSpring(engine.position - engine.target, engine.velocity, dt, engine.spring)
      engine.position = engine.target + d
      engine.velocity = v
      if (Math.abs(d) < 0.0005 && Math.abs(v) < 0.005) {
        engine.position = engine.target
        engine.velocity = 0
        if (engine.mode === 'settle') engine.mode = 'scroll'
        return false
      }
      return true
    },
  }
  return engine
}
