import { useEffect, useImperativeHandle, useRef } from 'react'
import { FileCode2 } from 'lucide-react'
import { AutoWikiMark } from '../AutoWikiBrand.jsx'
import { DiagramGraph } from '../hero/DiagramGraph.jsx'
import { stepper } from '../../data/landingCopy.js'
import { landingSample as sample } from '../../data/landingSample.js'

const clamp01 = (value) => Math.min(1, Math.max(0, value))
const lerp = (a, b, t) => a + (b - a) * t
/** Smoothstep of x between a and b. */
const ss = (x, a, b) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const pad = (value) => String(value).padStart(2, '0')

const featuredIndex = sample.chapters.indexOf(sample.featured)

/**
 * The stepper's visual: one set of elements that is a file list at t=0, a chapter outline at t=1 and a
 * generated chapter at t=2, driven by `api.apply(t)` (scroll-scrubbed, reversible). Rows are laid out in
 * their outline positions and FLIP-transformed back to the file-list positions measured at runtime;
 * the featured row's title travels to the chapter heading; the excerpt reveals by character count; the
 * diagram draws when t passes a threshold. Static usage (`staticStage`) applies one stage once. The parent
 * drives it through the `ref` handle: `ref.current.apply(t)`.
 */
export function StepperFrame({ ref, staticStage = null }) {
  const rootRef = useRef(null)
  const handle = useRef(null)
  useImperativeHandle(ref, () => ({ apply: (t) => handle.current?.apply(t) }), [])

  useEffect(() => {
    const root = rootRef.current
    const q = (selector) => root.querySelector(selector)
    const rows = [...root.querySelectorAll('.sv-row')].map((el) => ({ el, bg: el.querySelector('.sv-row__bg'), file: el.querySelector('.sv-row__file'), metas: [...el.querySelectorAll('.sv-row__meta')], title: el.querySelector('.sv-row__title') }))
    const rowsBox = q('.sv__rows')
    const headRepo = q('.sv__head--repo')
    const headOutline = q('.sv__head--outline')
    const chapter = q('.sv__chapter')
    const heading = q('.sv__chapter-title')
    const shown = q('.sv__chapter-text .is-shown')
    const rest = q('.sv__chapter-text .is-rest')
    const graph = q('.sv__chapter .diagram-graph')
    const chip = q('.sv__chapter-top')
    const text = sample.featuredBlurb
    let geo = rows.map(() => ({ dy: 0, sy: 1 }))
    let titleFlip = { dx: 0, dy: 0, scale: 1 }
    let current = staticStage ?? 0
    let lastChars = -1
    let lastDrawn = null

    const measure = () => {
      // Reset, measure the outline (default) layout, then the file-list layout, then the heading target.
      rows.forEach(({ el, bg, title }) => { el.style.transform = ''; bg.style.transform = ''; title.style.transform = '' })
      const outline = rows.map(({ el }) => el.getBoundingClientRect())
      rowsBox.classList.add('is-files')
      const files = rows.map(({ el }) => el.getBoundingClientRect())
      rowsBox.classList.remove('is-files')
      geo = rows.map((_, i) => ({
        dy: files[i].top + files[i].height / 2 - (outline[i].top + outline[i].height / 2),
        sy: files[i].height / outline[i].height,
      }))
      const rowTitle = rows[featuredIndex].title
      const from = rowTitle.getBoundingClientRect()
      const to = heading.getBoundingClientRect()
      const fromSize = parseFloat(getComputedStyle(rowTitle).fontSize)
      const toSize = parseFloat(getComputedStyle(heading).fontSize)
      titleFlip = { dx: to.left - from.left, dy: to.top - from.top, scale: toSize / fromSize }
      apply(current)
    }

    function apply(t) {
      current = t
      const u = clamp01(t)
      const v = clamp01(t - 1)
      const toOutline = ss(u, 0, 1)
      const intoChapter = ss(v, 0.05, 0.7)

      headRepo.style.opacity = (1 - ss(u, 0.1, 0.5)).toFixed(3)
      headRepo.style.transform = `translate3d(0, ${(-10 * ss(u, 0.1, 0.5)).toFixed(2)}px, 0)`
      headOutline.style.opacity = (ss(u, 0.4, 0.8) * (1 - ss(v, 0, 0.35))).toFixed(3)

      rows.forEach((row, i) => {
        const g = geo[i]
        const featured = i === featuredIndex
        const away = ss(v, 0, 0.45)
        row.el.style.transform = `translate3d(0, ${(g.dy * (1 - toOutline) + (featured ? 0 : 14 * away)).toFixed(2)}px, 0)`
        row.el.style.opacity = featured ? '1' : (1 - away).toFixed(3)
        row.bg.style.transform = `scale(${lerp(0.64, 1, toOutline).toFixed(3)}, ${lerp(g.sy, 1, toOutline).toFixed(3)})`
        row.bg.style.opacity = featured ? (1 - ss(v, 0.2, 0.55)).toFixed(3) : '1'
        row.file.style.opacity = (1 - ss(u, 0.25, 0.6)).toFixed(3)
        const metaOpacity = (ss(u, 0.4, 0.8) * (featured ? 1 - ss(v, 0, 0.35) : 1)).toFixed(3)
        row.metas.forEach((meta) => { meta.style.opacity = metaOpacity })
        const titleOpacity = featured ? 1 - ss(v, 0.92, 1) : 1
        row.title.style.opacity = (ss(u, 0.4, 0.8) * titleOpacity).toFixed(3)
        row.title.style.transform = featured
          ? `translate3d(${(titleFlip.dx * intoChapter).toFixed(2)}px, ${(titleFlip.dy * intoChapter).toFixed(2)}px, 0) scale(${lerp(1, titleFlip.scale, intoChapter).toFixed(4)})`
          : ''
      })

      chapter.style.opacity = ss(v, 0.25, 0.6).toFixed(3)
      chip.style.opacity = ss(v, 0.35, 0.6).toFixed(3)
      heading.style.opacity = ss(v, 0.92, 1).toFixed(3)

      const chars = Math.round(text.length * ss(v, 0.45, 0.92))
      if (chars !== lastChars) { lastChars = chars; shown.textContent = text.slice(0, chars); rest.textContent = text.slice(chars) }
      const drawn = v > 0.72
      if (drawn !== lastDrawn && graph) { lastDrawn = drawn; graph.dataset.drawn = String(drawn) }
    }

    handle.current = { apply, measure }
    measure()
    const resize = new ResizeObserver(measure)
    resize.observe(root)
    document.fonts?.ready.then(measure)
    return () => { resize.disconnect(); handle.current = null }
  }, [staticStage])

  return (
    <div ref={rootRef} className="sv" aria-hidden="true" data-stage={staticStage ?? undefined}>
      <div className="sv__bar">
        <span className="sv__brand"><AutoWikiMark /> {stepper.frameLabel}</span>
        <code>{sample.repo}</code>
      </div>
      <div className="sv__canvas">
        <div className="sv__heads">
          <p className="sv__head sv__head--repo"><span>{stepper.labels.repository}</span><strong>{sample.repo}</strong></p>
          <p className="sv__head sv__head--outline"><span>{stepper.labels.outline}</span></p>
        </div>

        <div className="sv__rows">
          {sample.files.map((file, index) => {
            const chapter = sample.chapters[file.chapter]
            return (
              <div className="sv-row" key={file.path}>
                <span className="sv-row__bg" />
                <span className="sv-row__file"><FileCode2 />{file.path}</span>
                <span className="sv-row__meta"><b className="tnum">{pad(index + 1)}</b></span>
                <strong className="sv-row__title">{chapter.title}</strong>
                <code className="sv-row__meta sv-row__path">{file.path}</code>
              </div>
            )
          })}
        </div>

        <div className="sv__chapter">
          <div className="sv__chapter-top"><span>{stepper.labels.chapter}</span><code>{sample.featured.filePaths[0]}</code></div>
          <h3 className="sv__chapter-title">{sample.featured.title}</h3>
          <p className="sv__chapter-text"><span className="is-shown" /><span className="is-rest">{sample.featuredBlurb}</span></p>
          <DiagramGraph diagram={sample.featured.diagram} drawn={false} size="compact" label="" />
        </div>
      </div>
    </div>
  )
}
