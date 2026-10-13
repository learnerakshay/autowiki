// Word-split heading used by the hero and every landing section. Moved out of Landing.jsx unchanged.
export function AnimatedHeading({ as: Heading = 'h2', id, lines, hero = false }) {
  return (
    <Heading
      id={id}
      className={`motion-heading${hero ? ' motion-heading--hero' : ''}`}
      aria-label={lines.join(' ')}
      data-motion-heading={hero ? 'hero' : 'section'}
    >
      {lines.map((line) => (
        <span className="motion-heading__line" aria-hidden="true" key={line}>
          {line.split(' ').map((word, index) => (
            <span className="motion-heading__word" key={`${word}-${index}`}>{word}</span>
          ))}
        </span>
      ))}
    </Heading>
  )
}
