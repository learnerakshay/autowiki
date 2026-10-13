import { useEffect, useState } from 'react'
import { STREAM_CPS } from './streamTiming.js'

/**
 * Types `text` out when `live && active`, otherwise shows it whole. The unrevealed tail is rendered
 * transparent rather than omitted, so line breaks and height never change while streaming (no layout
 * shift) and assistive tech always reads the complete sample text.
 */
export function StreamText({ as: Tag = 'p', className, text, live, active, delay = 0 }) {
  const [count, setCount] = useState(0)
  const streaming = live && active

  useEffect(() => {
    if (!streaming) return undefined

    let frame = 0
    const timer = setTimeout(() => {
      const start = performance.now()
      const step = (now) => {
        const next = Math.min(text.length, Math.floor(((now - start) / 1000) * STREAM_CPS))
        setCount(next)
        if (next < text.length) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, delay)

    return () => { clearTimeout(timer); cancelAnimationFrame(frame); setCount(0) }
  }, [text, streaming, delay])

  // Not replaying: the whole sample text. Replaying but not started: nothing yet.
  const shown = !live ? text.length : streaming ? count : 0

  return (
    <Tag className={className}>
      <span>{text.slice(0, shown)}</span>
      <span className="stream-rest">{text.slice(shown)}</span>
    </Tag>
  )
}
