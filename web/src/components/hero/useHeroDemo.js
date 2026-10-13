import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Auto-playing "type a repo, press Generate, watch the wiki appear" loop.
 *
 * It replays the pre-generated sample only; nothing is requested from the backend. The loop is a
 * plain timeout chain so any step can be cancelled instantly: `stop()` (the user took over),
 * `pause()`, losing visibility, or unmounting all clear it and leave the mockup in its finished state.
 *
 * Returned `reveal` describes how much of the mockup is shown, so the preview stays presentational.
 */
const TIMING = {
  startDelay: 1900, // after the entrance finishes, before the first loop
  loopDelay: 1500,
  keyMin: 48,
  keyJitter: 52,
  afterTyping: 420,
  press: 260,
  clear: 320,
  chapterGap: 520,
  chapterStart: 260,
  diagramLag: 450,
  settle: 2600, // stream + diagram time after the last chapter appears
  hold: 7000,
}

const jitter = (index) => TIMING.keyMin + ((index * 37) % 7) * (TIMING.keyJitter / 7)

export function useHeroDemo({ text, chapterCount, enabled, visible }) {
  const [state, setState] = useState({ phase: 'idle', typed: '', chapters: chapterCount, doc: true, diagram: true })
  const [mode, setMode] = useState('running') // running | paused | stopped
  const timers = useRef([])

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const finished = useCallback(() => ({ phase: 'idle', typed: '', chapters: chapterCount, doc: true, diagram: true }), [chapterCount])

  const playing = enabled && visible && mode === 'running'

  useEffect(() => {
    if (!playing) return undefined

    const at = (delay, fn) => { timers.current.push(setTimeout(fn, delay)) }

    const run = () => {
      timers.current = [] // every earlier timer has already fired (this call is one of them)
      let clock = 0
      setState({ ...finished(), phase: 'typing' })
      for (let index = 1; index <= text.length; index += 1) {
        clock += jitter(index)
        const typed = text.slice(0, index)
        at(clock, () => setState((current) => ({ ...current, typed })))
      }

      clock += TIMING.afterTyping
      at(clock, () => setState((current) => ({ ...current, phase: 'pressing' })))

      clock += TIMING.press
      at(clock, () => setState({ phase: 'generating', typed: text, chapters: 0, doc: false, diagram: false }))

      let chapterClock = clock + TIMING.clear + TIMING.chapterStart
      for (let count = 1; count <= chapterCount; count += 1) {
        const visibleChapters = count
        at(chapterClock, () => setState((current) => ({ ...current, chapters: visibleChapters })))
        if (count === 1) at(chapterClock + 120, () => setState((current) => ({ ...current, doc: true })))
        chapterClock += TIMING.chapterGap
      }
      at(chapterClock + TIMING.diagramLag, () => setState((current) => ({ ...current, diagram: true })))

      const doneAt = chapterClock + TIMING.settle
      at(doneAt, () => setState((current) => ({ ...current, phase: 'done' })))
      at(doneAt + TIMING.hold, () => setState((current) => ({ ...current, phase: 'resetting' })))
      at(doneAt + TIMING.hold + 380, () => {
        setState(finished())
        at(TIMING.loopDelay, run)
      })
    }

    at(TIMING.startDelay, run)
    return () => {
      clearTimers()
      setState(finished()) // leaving the loop (stop, pause, hidden, unmount) always lands on the complete sample
    }
  }, [playing, text, chapterCount, clearTimers, finished])

  const stop = useCallback(() => setMode((current) => (current === 'running' ? 'stopped' : current)), [])
  const pause = useCallback(() => setMode('paused'), [])
  const resume = useCallback(() => setMode('running'), [])

  // Whenever the loop isn't playing, what the user sees is the complete, final sample.
  const view = playing ? state : finished()

  return {
    ...view,
    mode,
    running: playing,
    // Pass-through so consumers can show the pause control only when motion is allowed.
    enabled,
    stop,
    pause,
    resume,
  }
}
