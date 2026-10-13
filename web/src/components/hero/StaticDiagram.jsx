// Level-by-level diagram used by the sections below the hero. Moved out of Landing.jsx unchanged
// so the hero and the page can share it without a circular import.
export function Diagram({ chapter, compact = false }) {
  return (
    <div className={`product-diagram${compact ? ' product-diagram--compact' : ''}`} role="img" aria-label={`Generated Mermaid structure for ${chapter.title}`}>
      {chapter.diagramLevels.map((level, levelIndex) => (
        <div className="product-diagram__level" key={level.join('-')}>
          <div>{level.map((node) => <span key={node}>{node}</span>)}</div>
          {levelIndex < chapter.diagramLevels.length - 1 && <i aria-hidden="true" />}
        </div>
      ))}
    </div>
  )
}
