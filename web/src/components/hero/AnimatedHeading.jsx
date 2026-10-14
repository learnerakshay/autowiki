// Word-split hero headline (masked line + word spans). Section headings use SectionHeading instead.
export function AnimatedHeading({ as: Heading = 'h2', id, lines, hero = false }) {
  return (
    <Heading
      id={id}
      className={`motion-heading${hero ? ' motion-heading--hero' : ''}`}
      aria-label={lines.join(' ')}
      data-motion-heading={hero ? 'hero' : 'section'}
    >
      {lines.map((line, lineIndex) => (
        <span className="motion-heading__line" aria-hidden="true" key={line}>
          {line.split(' ').map((word, index) => (
            // --w is the word's position in the whole heading; the entrance CSS staggers on it.
            <span className="motion-heading__word" style={{ '--w': lines.slice(0, lineIndex).reduce((total, previous) => total + previous.split(' ').length, 0) + index }} key={`${word}-${index}`}>{word}</span>
          ))}
        </span>
      ))}
    </Heading>
  )
}
