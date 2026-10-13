// Minimal parser for the `graph TD; A[x] --> B[y];` Mermaid subset the generator emits.
// It exists so the hero can draw the real generated graph instead of a hand-copied one.
const EDGE = /^\s*([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\])?\s*-->\s*([A-Za-z0-9_]+)\s*(?:\[([^\]]*)\])?\s*;?\s*$/

const cleanLabel = (label) => label.trim().replace(/^["']|["']$/g, '')

export function parseMermaid(source = '') {
  const labels = new Map()
  const edges = []

  for (const line of source.split('\n')) {
    const match = line.match(EDGE)
    if (!match) continue
    const [, from, fromLabel, to, toLabel] = match
    if (fromLabel) labels.set(from, cleanLabel(fromLabel))
    if (toLabel) labels.set(to, cleanLabel(toLabel))
    edges.push({ from, to })
  }

  return { labels, edges }
}

/**
 * Breadth-first levels (top-down) for the first root in the graph.
 * `maxDepth` and `maxPerLevel` keep very wide graphs legible in a small preview;
 * edges whose endpoints were trimmed are dropped.
 */
export function buildDiagram(source, { maxDepth = 4, maxPerLevel = 5 } = {}) {
  const { labels, edges } = parseMermaid(source)
  if (!edges.length) return { levels: [], edges: [] }

  const children = new Map()
  const hasParent = new Set()
  edges.forEach(({ from, to }) => {
    if (!children.has(from)) children.set(from, [])
    children.get(from).push(to)
    hasParent.add(to)
  })

  const root = edges.find(({ from }) => !hasParent.has(from))?.from ?? edges[0].from
  const depth = new Map([[root, 0]])
  const queue = [root]
  while (queue.length) {
    const id = queue.shift()
    for (const child of children.get(id) ?? []) {
      if (depth.has(child)) continue
      depth.set(child, depth.get(id) + 1)
      queue.push(child)
    }
  }

  const levels = []
  depth.forEach((level, id) => {
    if (level >= maxDepth) return
    levels[level] ??= []
    if (levels[level].length < maxPerLevel) levels[level].push({ id, label: labels.get(id) ?? id })
  })

  const kept = new Set(levels.flat().map((node) => node.id))
  return {
    levels,
    edges: edges.filter(({ from, to }) => kept.has(from) && kept.has(to) && depth.get(to) === depth.get(from) + 1),
  }
}
