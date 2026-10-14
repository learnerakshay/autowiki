import { prefersReducedMotion } from './motion.js'
// Spring math shared by every interactive motion on the landing page.
//
// A spring is described the way fluid-interface systems describe it: a damping ratio and a
// "response" (the period of the undamped oscillation, in seconds). Steps use the closed-form
// solution, so they are exact for any frame time and carry velocity between retargets.

const omegaOf = (response) => (2 * Math.PI) / response

/**
 * Advance a spring that is displaced by `d` from its target and moving at `v`.
 * Returns the new [displacement, velocity] after `dt` seconds.
 */
export function stepSpring(d, v, dt, { response, damping }) {
  const w = omegaOf(response)
  if (damping >= 1) {
    // Critically damped (no overshoot).
    const c2 = v + w * d
    const e = Math.exp(-w * dt)
    return [(d + c2 * dt) * e, (c2 - w * (d + c2 * dt)) * e]
  }
  const wd = w * Math.sqrt(1 - damping * damping)
  const zw = damping * w
  const c2 = (v + zw * d) / wd
  const e = Math.exp(-zw * dt)
  const cos = Math.cos(wd * dt)
  const sin = Math.sin(wd * dt)
  return [e * (d * cos + c2 * sin), e * ((-zw * d + wd * c2) * cos + (-zw * c2 - wd * d) * sin)]
}

/** Seconds until a unit step settles to within `tolerance` (and is effectively at rest). */
export function settleTime(spring, tolerance = 0.01) {
  let d = 1
  let v = 0
  const dt = 1 / 240
  for (let t = dt; t < 4; t += dt) {
    ;[d, v] = stepSpring(d, v, dt, spring)
    if (Math.abs(d) < tolerance && Math.abs(v) < 0.1) return t
  }
  return 4
}

/** Step response 0 -> 1 as an easing function over progress 0..1 (usable as a GSAP ease). */
export function springEase(spring, duration = settleTime(spring)) {
  return (progress) => (progress >= 1 ? 1 : 1 - stepSpring(1, 0, progress * duration, spring)[0])
}

/** The same step response as a CSS `linear()` easing; pair it with `settleTime(spring)` as the duration. */
export function springToLinear(spring, points = 28) {
  const duration = settleTime(spring)
  const stops = []
  for (let i = 0; i <= points; i += 1) {
    stops.push((1 - stepSpring(1, 0, (i / points) * duration, spring)[0]).toFixed(4))
  }
  return `linear(${stops.join(', ')}, 1)`
}

/**
 * A scalar that chases a target with a spring, retargetable at any time with velocity carried over.
 * It runs a requestAnimationFrame loop only while it is moving.
 */
export function createSpringValue({ value = 0, spring, onUpdate }) {
  const state = { value, target: value, velocity: 0 }
  let frame = 0
  let last = 0

  const frameStep = (now) => {
    if (prefersReducedMotion()) { state.value = state.target; state.velocity = 0; onUpdate(state.value); frame = 0; return }
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    const [d, v] = stepSpring(state.value - state.target, state.velocity, dt, spring)
    state.value = state.target + d
    state.velocity = v
    const resting = Math.abs(d) < 0.0005 && Math.abs(v) < 0.005
    if (resting) { state.value = state.target; state.velocity = 0 }
    onUpdate(state.value)
    frame = resting ? 0 : requestAnimationFrame(frameStep)
  }

  const wake = () => {
    if (frame) return
    last = performance.now()
    frame = requestAnimationFrame(frameStep)
  }

  return {
    get value() { return state.value },
    setTarget(target) { state.target = target; wake() },
    reveal() { state.value = Math.min(state.value, 0.65); state.target = 1; onUpdate(state.value); wake() },
    jump(next) { if (frame) cancelAnimationFrame(frame); frame = 0; state.value = next; state.target = next; state.velocity = 0; onUpdate(next) },
    destroy() { if (frame) cancelAnimationFrame(frame); frame = 0 },
  }
}
