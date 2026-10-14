import { createRef, useEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { springs } from '../../lib/motion.js'
import { createSpringValue } from '../../lib/spring.js'
import { stepper } from '../../data/landingCopy.js'
import { SectionHeading } from './SectionHeading.jsx'
import { StepperFrame } from './StepperFrame.jsx'
import { useReveal } from './useReveal.js'
import './process.css'

gsap.registerPlugin(ScrollTrigger)

const ENHANCED_QUERY = '(min-width: 901px) and (prefers-reduced-motion: no-preference)'
const clamp01 = (value) => Math.min(1, Math.max(0, value))
const pad = (value) => String(value).padStart(2, '0')

function useEnhanced() {
  const [enhanced, setEnhanced] = useState(() => window.matchMedia(ENHANCED_QUERY).matches)
  useEffect(() => {
    const query = window.matchMedia(ENHANCED_QUERY)
    const update = () => setEnhanced(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return enhanced
}

function Step({ step, index, active, itemRef }) {
  return (
    <li ref={itemRef} className="process-step" aria-current={active ? 'step' : undefined} data-active={active}>
      <span className="process-step__number tnum">{pad(index + 1)}</span>
      <div>
        <h3 className="lp-card-title process-step__title">{step.title}</h3>
        <p className="process-step__text">{step.text}</p>
      </div>
    </li>
  )
}

/**
 * Pinned stage: scroll progress is smoothed by a spring into one value t (0..2). t drives the visual
 * (files -> outline -> chapter), the dimming of the three steps and the timeline fill, so everything is
 * scroll-linked, reversible and interruptible. Narrow / reduced-motion layouts show each stage inline.
 */
function useStepperScrub({ enabled, stageRef, pinRef, frameApi, itemRefs, railRef, count, onActive }) {
  useEffect(() => {
    const stage = stageRef.current
    const pin = pinRef.current
    if (!enabled || !stage || !pin) return undefined
    const onActiveRef = onActive
    let lastActive = -1

    const render = (t) => {
      frameApi.current?.apply(t)
      itemRefs.current.forEach((item, index) => {
        if (!item) return
        const nearness = 1 - Math.min(1, Math.abs(t - index))
        item.style.opacity = (0.78 + 0.22 * clamp01(nearness)).toFixed(3) // dimmed steps stay >= 4.5:1
      })
      if (railRef.current) railRef.current.style.transform = `scaleY(${clamp01(t / (count - 1)).toFixed(4)})`
      const active = Math.round(clamp01(t / (count - 1)) * (count - 1))
      if (active !== lastActive) { lastActive = active; onActiveRef(active) }
    }

    const value = createSpringValue({ value: 0, spring: springs.default, onUpdate: render })
    const navOffset = () => parseFloat(getComputedStyle(pin).top) || 0
    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: () => `top top+=${navOffset()}`,
      end: () => `bottom top+=${navOffset() + pin.offsetHeight}`,
      invalidateOnRefresh: true,
      onUpdate: (self) => value.setTarget(self.progress * (count - 1)),
    })
    value.jump(trigger.progress * (count - 1))
    return () => { trigger.kill(); value.destroy() }
  }, [enabled, stageRef, pinRef, frameApi, itemRefs, railRef, count, onActive])
}

export default function ProcessStory() {
  const rootRef = useRef(null)
  const stageRef = useRef(null)
  const pinRef = useRef(null)
  const railRef = useRef(null)
  const itemRefs = useRef([])
  const frameApi = useRef(null)
  const [active, setActive] = useState(0)
  const enhanced = useEnhanced()
  const steps = stepper.steps
  const staticFrames = useMemo(() => steps.map(() => createRef()), [steps])
  useReveal(rootRef)

  useStepperScrub({ enabled: enhanced, stageRef, pinRef, frameApi, itemRefs, railRef, count: steps.length, onActive: setActive })

  // Reduced motion / narrow: apply each stage's final state once to its own inline frame.
  useEffect(() => {
    if (enhanced) return
    staticFrames.forEach((frame, index) => frame.current?.apply(index))
  }, [enhanced, staticFrames])

  return (
    <section ref={rootRef} className={`lp-section process${enhanced ? ' is-enhanced' : ''}`} aria-labelledby="process-title">
      <div className="lp-container" data-reveal-group>
        <SectionHeading id="process-title" eyebrow={stepper.eyebrow} title={stepper.title} lede={stepper.lede} />
      </div>

      {enhanced ? (
        <div ref={stageRef} className="process__stage" style={{ '--stages': steps.length }}>
          <div ref={pinRef} className="process__pin">
            <div className="lp-container process__grid">
              <div className="process__timeline">
                <span className="process__rail" aria-hidden="true"><i ref={railRef} /></span>
                <ol className="process__steps">
                  {steps.map((step, index) => (
                    <Step key={step.title} step={step} index={index} active={active === index} itemRef={(element) => { itemRefs.current[index] = element }} />
                  ))}
                </ol>
              </div>
              <StepperFrame ref={frameApi} />
            </div>
          </div>
        </div>
      ) : (
        <div className="lp-container process__stacked">
          <ol className="process__steps process__steps--stacked">
            {steps.map((step, index) => (
              <li key={step.title} className="process-step">
                <span className="process-step__number tnum">{pad(index + 1)}</span>
                <div>
                  <h3 className="lp-card-title process-step__title">{step.title}</h3>
                  <p className="process-step__text">{step.text}</p>
                  <StepperFrame ref={staticFrames[index]} staticStage={index} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
