import { useEffect, useState } from 'react'
import { reducedMotionQuery } from '../../lib/motion.js'

const finePointerQuery = '(hover: hover) and (pointer: fine)'
const MAX_TILT = 5 // degrees
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

/** True while the element is on screen and the tab is visible. Drives every loop in the hero. */
export function useHeroActive(ref) {
  const [active, setActive] = useState(true)

  useEffect(() => {
    const element = ref.current
    if (!element) return undefined
    let intersecting = true
    const sync = () => setActive(intersecting && !document.hidden)
    const observer = new IntersectionObserver(([entry]) => { intersecting = entry.isIntersecting; sync() }, { threshold: 0 })
    observer.observe(element)
    document.addEventListener('visibilitychange', sync)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync) }
  }, [ref])

  return active
}

/**
 * One requestAnimationFrame loop for all pointer/scroll-driven hero effects:
 * cursor spotlight, window tilt, top-edge sheen and scroll parallax. Values are lerped with a
 * frame-rate independent ease, only `transform` is written, and the loop sleeps as soon as every
 * value has settled (or the hero leaves the screen), so an idle hero costs nothing.
 */
export function useHeroMotion({ heroRef, stageRef, planeRef, spotRef, sheenRef, backdropRef }, active) {
  useEffect(() => {
    const hero = heroRef.current
    const plane = planeRef.current
    if (!hero || !plane || !active) return undefined

    const reduced = window.matchMedia(reducedMotionQuery).matches
    if (reduced) return undefined

    const fine = window.matchMedia(finePointerQuery).matches
    const spot = spotRef.current
    const sheen = sheenRef.current
    const backdrop = backdropRef.current
    const stage = stageRef.current

    // current / target pairs
    const s = { rx: 0, ry: 0, tx: 0, ty: 0, sx: 0, sy: 0, tsx: 0, tsy: 0, py: 0, tpy: 0, bg: 0, tbg: 0, sh: 0.5, tsh: 0.5 }
    let spotSeeded = false
    let frame = 0
    let last = 0
    let stageTop = 0
    let stageLeft = 0
    let stageWidth = 1
    let stageHeight = 1

    const measure = () => {
      const rect = stage.getBoundingClientRect()
      stageTop = rect.top + window.scrollY
      stageLeft = rect.left
      stageWidth = rect.width || 1
      stageHeight = rect.height || 1
    }

    const setWillChange = (value) => {
      plane.style.willChange = value
      if (spot) spot.style.willChange = value
      if (backdrop) backdrop.style.willChange = value
    }

    const settled = () => (
      Math.abs(s.rx - s.tx) < 0.005 && Math.abs(s.ry - s.ty) < 0.005
      && Math.abs(s.sx - s.tsx) < 0.3 && Math.abs(s.sy - s.tsy) < 0.3
      && Math.abs(s.py - s.tpy) < 0.05 && Math.abs(s.bg - s.tbg) < 0.05
      && Math.abs(s.sh - s.tsh) < 0.002
    )

    const write = () => {
      const flat = Math.abs(s.rx) < 0.01 && Math.abs(s.ry) < 0.01 && Math.abs(s.py) < 0.05
      // `none` when at rest keeps text on the pixel grid instead of a blurry composited layer.
      plane.style.transform = flat ? '' : `translate3d(0, ${s.py.toFixed(2)}px, 0) rotateX(${s.rx.toFixed(3)}deg) rotateY(${s.ry.toFixed(3)}deg)`
      if (spot) spot.style.transform = `translate3d(${s.sx.toFixed(1)}px, ${s.sy.toFixed(1)}px, 0)`
      if (backdrop) backdrop.style.transform = `translate3d(0, ${s.bg.toFixed(2)}px, 0)`
      if (sheen) sheen.style.transform = `translate3d(${(s.sh * 177).toFixed(1)}%, 0, 0)`
    }

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const ease = (rate) => 1 - Math.exp(-rate * dt)
      const tilt = ease(6)
      const follow = ease(9)
      const scroll = ease(11)

      s.rx += (s.tx - s.rx) * tilt
      s.ry += (s.ty - s.ry) * tilt
      s.sh += (s.tsh - s.sh) * tilt
      s.sx += (s.tsx - s.sx) * follow
      s.sy += (s.tsy - s.sy) * follow
      s.py += (s.tpy - s.py) * scroll
      s.bg += (s.tbg - s.bg) * scroll
      write()

      if (settled()) {
        frame = 0
        setWillChange('')
        return
      }
      frame = requestAnimationFrame(tick)
    }

    const wake = () => {
      if (frame || document.hidden) return
      setWillChange('transform')
      last = performance.now()
      frame = requestAnimationFrame(tick)
    }

    const sleep = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      setWillChange('')
    }

    const onScroll = () => {
      const y = clamp(window.scrollY, 0, 900)
      s.tbg = y * 0.16
      s.tpy = fine ? -y * 0.035 : 0
      wake()
    }

    let measuredAt = 0
    const onMove = (event) => {
      if (!fine || event.pointerType === 'touch') return
      // The entrance animation moves the stage, so re-measure occasionally rather than trusting the mount-time rect.
      if (event.timeStamp - measuredAt > 400) { measure(); measuredAt = event.timeStamp }
      const heroRect = hero.getBoundingClientRect()
      const px = event.clientX - heroRect.left
      const py = event.clientY - heroRect.top
      if (spot) {
        // Seed the glow under the pointer on first entry so it eases in place instead of flying in from the corner.
        s.tsx = px - 320
        s.tsy = py - 320
        if (!spotSeeded) { s.sx = s.tsx; s.sy = s.tsy; spotSeeded = true }
        hero.classList.add('is-pointer-inside')
      }
      const centerX = stageLeft + stageWidth / 2
      const centerY = stageTop - window.scrollY + stageHeight / 2
      const dx = clamp((event.clientX - centerX) / (stageWidth * 0.6), -1, 1)
      const dy = clamp((event.clientY - centerY) / (stageHeight * 0.75), -1, 1)
      s.ty = dx * MAX_TILT
      s.tx = -dy * MAX_TILT * 0.8
      s.tsh = clamp((event.clientX - stageLeft) / stageWidth, 0, 1)
      wake()
    }

    const onLeave = () => {
      s.tx = 0
      s.ty = 0
      hero.classList.remove('is-pointer-inside')
      wake()
    }

    measure()
    onScroll()

    const resize = new ResizeObserver(() => { measure(); onScroll() })
    resize.observe(stage)
    window.addEventListener('scroll', onScroll, { passive: true })
    hero.addEventListener('pointermove', onMove, { passive: true })
    hero.addEventListener('pointerleave', onLeave)

    return () => {
      sleep()
      resize.disconnect()
      window.removeEventListener('scroll', onScroll)
      hero.removeEventListener('pointermove', onMove)
      hero.removeEventListener('pointerleave', onLeave)
      hero.classList.remove('is-pointer-inside')
      plane.style.transform = ''
      if (spot) spot.style.transform = ''
      if (backdrop) backdrop.style.transform = ''
      if (sheen) sheen.style.transform = ''
    }
  }, [heroRef, stageRef, planeRef, spotRef, sheenRef, backdropRef, active])
}
