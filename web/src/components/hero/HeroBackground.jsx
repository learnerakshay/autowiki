// Decorative, layered hero backdrop. Everything here is aria-hidden and pointer-events: none.
// The only moving parts are CSS-keyframed blobs (transform only) and two refs the hero's single
// rAF loop writes `transform` to (parallax backdrop, cursor spotlight).
export function HeroBackground({ backdropRef, spotRef }) {
  return (
    <div className="hero-bg" aria-hidden="true">
      <div className="hero-bg__backdrop" ref={backdropRef}>
        <div className="hero-bg__mesh">
          <span className="hero-bg__blob hero-bg__blob--a" />
          <span className="hero-bg__blob hero-bg__blob--b" />
          <span className="hero-bg__blob hero-bg__blob--c" />
          <span className="hero-bg__blob hero-bg__blob--d" />
        </div>
        <div className="hero-bg__grid" />
      </div>
      <div className="hero-bg__grain" />
      <div className="hero-bg__spot" ref={spotRef} />
    </div>
  )
}
