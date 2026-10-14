/**
 * Section header: eyebrow, h2 and lede on the shared type scale. The headline is split into
 * word-masks (so it can rise line by line under useReveal) but stays ordinary inline text that
 * wraps naturally with `text-wrap: balance`, so no word is left alone on the last line.
 */
export function SectionHeading({ id, eyebrow, title, lede, compact = false, className = '' }) {
  const words = title.split(' ')
  return (
    <header className={`lp-head${compact ? ' lp-head--compact' : ''} ${className}`.trim()}>
      {eyebrow ? <p className="lp-eyebrow" data-reveal="item">{eyebrow}</p> : null}
      <h2 id={id} className="lp-h2" data-reveal="heading">
        {words.map((word, index) => (
          <span key={`${word}-${index}`}>
            <span className="mw"><span className="mw__in" style={{ '--i': index }}>{word}</span></span>
            {index < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </h2>
      {lede ? <p className="lp-lede" data-reveal="item">{lede}</p> : null}
    </header>
  )
}
