import { useEffect, useState } from 'react'
import { brand } from '../../config/brand.js'
import { Logo } from '../../components/brand/Logo.jsx'
import markSource from '../../../../design/brand/logo-mark.svg?raw'
import faviconSource from '../../../../design/brand/logo-mark-favicon.svg?raw'
import './brand-board.css'

// Dev-only: App.jsx only imports this module when import.meta.env.DEV, so it is absent from production builds.
const inner = (svg) => svg.slice(svg.indexOf('>') + 1, svg.lastIndexOf('</svg>'))
const fav = (px, tone = 'light') => (
  <svg className="bb-fav" width={px} height={px} viewBox="0 0 32 32" aria-hidden="true" style={{ '--logo-tile': tone === 'light' ? brand.colors.tile : brand.colors.tileOnDark, '--logo-glyph': tone === 'light' ? brand.colors.glyph : brand.colors.glyphOnDark }} dangerouslySetInnerHTML={{ __html: inner(faviconSource) }} />
)

function ConstructionGrid() {
  const lines = []
  for (let i = 0; i <= 32; i += 4) {
    lines.push(<line key={`v${i}`} x1={i} y1="0" x2={i} y2="32" className={i === 16 ? 'bb-grid__mid' : 'bb-grid__line'} />)
    lines.push(<line key={`h${i}`} x1="0" y1={i} x2="32" y2={i} className={i === 16 ? 'bb-grid__mid' : 'bb-grid__line'} />)
  }
  return (
    <svg className="bb-construction" viewBox="-2 -2 36 36" role="img" aria-label="The mark on its 32-unit construction grid">
      <g style={{ '--logo-tile': brand.colors.tile, '--logo-glyph': brand.colors.glyph }} dangerouslySetInnerHTML={{ __html: inner(markSource) }} />
      <g>{lines}</g>
      <rect x="6" y="6" width="20" height="20" className="bb-grid__live" />
      <circle cx="8.5" cy="9" r="2" className="bb-grid__ring" />
      <circle cx="14.5" cy="16" r="2" className="bb-grid__ring" />
      <circle cx="8.5" cy="23" r="2" className="bb-grid__ring" />
    </svg>
  )
}

function Panel({ title, note, children, className = '' }) {
  return (
    <section className={`bb-panel ${className}`}>
      <h2>{title}</h2>
      {note ? <p className="bb-note">{note}</p> : null}
      {children}
    </section>
  )
}

export default function BrandBoard() {
  const [run, setRun] = useState(0)

  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.append(robots)
    const previous = document.title
    document.title = `Brand board · ${brand.name}`
    return () => { robots.remove(); document.title = previous }
  }, [])

  return (
    <main className="bb">
      <header className="bb-head">
        <h1 className="ui-sr-only">Brand board</h1>
        <Logo variant="lockup" size="2.5rem" />
        <p>Brand board. Dev-only: this route does not exist in production builds. “{brand.motto}”</p>
      </header>

      <div className="bb-grid">
        <Panel title="The mark" note="A commit graph (rail, a branch, three nodes) resolving into ordered text lines. The branch row is indented like an outline: repository structure becoming a readable document. 32-unit grid, stroke 2.4, node radius 2, round caps and joins.">
          <ConstructionGrid />
        </Panel>

        <Panel title="Lockups" note="Live text from brand.name. The mark is decorative beside the wordmark.">
          <div className="bb-row">
            <div className="bb-surface bb-surface--mint"><Logo variant="lockup" size="2.5rem" /></div>
            <div className="bb-surface bb-surface--white"><Logo variant="lockup" size="2.5rem" /></div>
            <div className="bb-surface bb-surface--dark" data-logo-surface="dark"><Logo variant="lockup" tone="dark" size="2.5rem" /></div>
          </div>
          <div className="bb-row">
            <div className="bb-surface bb-surface--mint"><Logo variant="stacked" size="4rem" /></div>
            <div className="bb-surface bb-surface--dark"><Logo variant="stacked" tone="dark" size="4rem" /></div>
          </div>
        </Panel>

        <Panel title="Clear space and minimum size" note="Clear space is one quarter of the mark's width on every side (the dashed box). Below 24px the mark switches to the simplified favicon drawing, which has a heavier stroke and larger nodes.">
          <div className="bb-clear">
            <div className="bb-clear__box"><Logo variant="lockup" size="3rem" /></div>
            <ul className="bb-sizes" aria-label="Minimum sizes">
              <li>{fav(16)}<span>16px favicon drawing, minimum</span></li>
              <li><Logo variant="mark" size={24} label="24px mark" /><span>24px full mark, minimum beside a wordmark</span></li>
              <li><Logo variant="mark" size={32} label="32px mark" /><span>32px</span></li>
              <li><Logo variant="lockup" size={24} /><span>Smallest lockup</span></li>
            </ul>
          </div>
        </Panel>

        <Panel title="Colour and mono" note="One drawing; the palette comes from brand.colors. Mono is the silhouette alone in currentColor.">
          <div className="bb-row">
            <div className="bb-surface bb-surface--mint"><Logo variant="mark" size="3.5rem" label="Mark, light tone" /></div>
            <div className="bb-surface bb-surface--dark"><Logo variant="mark" tone="dark" size="3.5rem" label="Mark, dark tone" /></div>
            <div className="bb-surface bb-surface--white" style={{ color: '#111918' }}><Logo variant="mark" tone="mono" size="3.5rem" label="Mark, mono" /></div>
            <div className="bb-surface bb-surface--dark" style={{ color: '#ffffff' }}><Logo variant="mark" tone="mono" size="3.5rem" label="Mark, mono on dark" /></div>
          </div>
          <ul className="bb-swatches">
            {Object.entries(brand.colors).map(([name, value]) => (
              <li key={name}><i style={{ background: value }} /><b>{name}</b><code>{value}</code></li>
            ))}
          </ul>
        </Panel>

        <Panel title="Favicon" note="Real files from /public at 1× and enlarged. The 48px entry in favicon.ico uses the full mark.">
          <div className="bb-row bb-row--fav">
            <figure><img src="/favicon-16.png" width="16" height="16" alt="favicon 16" /><img className="bb-zoom" src="/favicon-16.png" width="128" height="128" alt="favicon 16 enlarged" /><figcaption>16</figcaption></figure>
            <figure><img src="/favicon-32.png" width="32" height="32" alt="favicon 32" /><img className="bb-zoom" src="/favicon-32.png" width="128" height="128" alt="favicon 32 enlarged" /><figcaption>32</figcaption></figure>
            <figure><Logo variant="mark" size={48} label="48px mark" /><Logo variant="mark" size={128} label="48px mark enlarged" /><figcaption>48</figcaption></figure>
            <figure><span className="bb-tab"><img src="/favicon-16.png" width="16" height="16" alt="" /> {brand.name}</span><figcaption>In a tab</figcaption></figure>
          </div>
        </Panel>

        <Panel title="App icon" note="icon-512.png, and the maskable version in a circular crop (glyph inside the 80% safe zone).">
          <div className="bb-row">
            <img className="bb-icon" src="/icon-512.png" width="128" height="128" alt="App icon" />
            <img className="bb-icon bb-icon--circle" src="/icon-512-maskable.png" width="128" height="128" alt="Maskable app icon, circle crop" />
            <img className="bb-icon" src="/apple-touch-icon.png" width="90" height="90" alt="Apple touch icon" />
          </div>
        </Panel>

        <Panel title="Open Graph" note="1200×630, generated from the brand config." className="bb-panel--wide">
          <img className="bb-og" src="/og-image.jpg" width="1200" height="630" alt="Open Graph card" />
        </Panel>

        <Panel title="Motion" note="Every curve and duration is the shared spring (lib/motion.js). Reduced motion shows the static mark." className="bb-panel--wide">
          <div className="bb-row bb-row--motion">
            <figure>
              <div className="bb-surface bb-surface--mint"><Logo key={run} variant="lockup" size="3rem" animated="always" /></div>
              <figcaption>Entrance <button type="button" className="bb-replay" onClick={() => setRun((n) => n + 1)}>Replay</button></figcaption>
            </figure>
            <figure>
              <div className="bb-surface bb-surface--mint"><a href="#hover" className="brand" onClick={(event) => event.preventDefault()}><Logo variant="lockup" size="3rem" /></a></div>
              <figcaption>Hover or focus the logo</figcaption>
            </figure>
            <figure>
              <div className="bb-surface bb-surface--mint"><Logo variant="mark" size="3rem" loading decorative /></div>
              <figcaption>Loading, indeterminate</figcaption>
            </figure>
          </div>
        </Panel>

        <Panel title="Do and don't" className="bb-panel--wide">
          <div className="bb-dd">
            <ul className="bb-do">
              <li>Use the dark tile on pale surfaces and the mint tile on dark ones.</li>
              <li>Keep clear space of a quarter of the mark's width.</li>
              <li>Use the mono silhouette for single-colour print and the pinned tab.</li>
              <li>Render the name as live text from the brand config.</li>
            </ul>
            <ul className="bb-dont">
              <li>Don't use the mark as a generic file or document icon.</li>
              <li>Don't recolour, stretch, rotate, outline or add effects or gradients.</li>
              <li>Don't set it in a coloured tile that isn't one of the two defined.</li>
              <li>Don't imitate or combine it with the GitHub or Git logos.</li>
            </ul>
          </div>
        </Panel>
      </div>
    </main>
  )
}
