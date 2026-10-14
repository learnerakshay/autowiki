import { useEffect, useLayoutEffect, useState } from 'react'
import { brand } from '../../config/brand.js'
import { installMotionTokens } from '../../lib/motion.js'
// The SVG in design/brand is the one drawing of the mark. Its markup is inlined here: no request, no JS for the static state.
import markSource from '../../../../design/brand/logo-mark.svg?raw'
import './logo.css'

const markInner = markSource.slice(markSource.indexOf('>') + 1, markSource.lastIndexOf('</svg>'))

// brand.colors is the only place the logo's colours live; they reach the SVG as custom properties.
const palette = {
  '--logo-c-tile': brand.colors.tile,
  '--logo-c-glyph': brand.colors.glyph,
  '--logo-c-tile-dark': brand.colors.tileOnDark,
  '--logo-c-glyph-dark': brand.colors.glyphOnDark,
}

// The entrance plays once per page load, however many times the nav remounts during client-side routing.
let entrancePlayed = false

function useEntrance(animated) {
  const [play] = useState(() => animated === 'always' || (Boolean(animated) && !entrancePlayed))
  useEffect(() => { if (play) entrancePlayed = true }, [play])
  return play
}

/**
 * The product mark and its lockups. Every logo on the site renders through this component.
 *
 * variant  mark    the tile alone (decorative next to a wordmark; named when standalone)
 *          lockup  mark + live-text name, side by side
 *          stacked mark above the name
 * tone     auto    light, switching to on-dark inside an ancestor with data-logo-surface="dark"
 *          light   dark tile, mint graph (for pale surfaces)
 *          dark    mint tile, deep-green graph (for dark surfaces)
 *          mono    the silhouette in currentColor, no tile
 * size     width/height of the tile: a number (px) or any CSS length
 * animated draws the graph in once per page load; 'always' replays on every mount (the brand board)
 * loading  calm indeterminate breathing, never a progress value
 */
export function Logo({ variant = 'mark', tone = 'auto', size = '2rem', animated = false, loading = false, decorative = false, label, className = '' }) {
  useLayoutEffect(() => {
    if (!document.documentElement.style.getPropertyValue('--spring')) installMotionTokens()
  }, [])
  const enter = useEntrance(animated)

  const classes = ['logo', `logo--${variant}`, enter && 'logo--enter', loading && 'logo--loading', className].filter(Boolean).join(' ')
  const style = { ...palette, '--logo-size': typeof size === 'number' ? `${size}px` : size }
  const mark = <svg className="logo__svg" viewBox="0 0 32 32" focusable="false" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markInner }} />

  if (variant === 'mark') {
    return decorative
      ? <span className={classes} data-tone={tone} style={style} aria-hidden="true">{mark}</span>
      : <span className={classes} data-tone={tone} style={style} role="img" aria-label={label ?? brand.name}>{mark}</span>
  }

  return (
    <span className={classes} data-tone={tone} style={style}>
      {mark}
      <span className="logo__name">{brand.name}</span>
    </span>
  )
}
