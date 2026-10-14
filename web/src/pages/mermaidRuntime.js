let mermaidPromise
let renderQueue = Promise.resolve()
const prepared = new Map()
let prefetchId = 0

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then(({ default: mermaid }) => {
      mermaid.initialize({
        startOnLoad: false, securityLevel: 'strict', theme: 'base',
        themeVariables: {
          primaryColor: '#e8fbf2', primaryTextColor: '#0b1211', primaryBorderColor: '#0f8d70',
          lineColor: '#4a5c57', secondaryColor: '#f4fbf8', tertiaryColor: '#ffffff',
          fontFamily: 'Manrope AutoWiki, Manrope, ui-sans-serif, system-ui, sans-serif', fontSize: '13px',
          nodeBorder: '#0f8d70', clusterBkg: '#f4fbf8', clusterBorder: '#4a5c57',
        },
        flowchart: { curve: 'basis', nodeSpacing: 28, rankSpacing: 42, padding: 10, useMaxWidth: true },
      })
      return mermaid
    })
  }
  return mermaidPromise
}

export function renderSource(source, id) {
  if (prepared.has(source)) return prepared.get(source)
  const result = renderQueue.then(async () => {
    const mermaid = await loadMermaid()
    return (await mermaid.render(id, source)).svg
  })
  renderQueue = result.catch(() => {})
  prepared.set(source, result)
  result.catch(() => prepared.delete(source))
  if (prepared.size > 3) prepared.delete(prepared.keys().next().value)
  return result
}

export function prefetchDiagramSource(source) {
  if (source) void renderSource(source, `mermaid-prefetch-${++prefetchId}`)
}
