// The override switches the authored media rules, including normal-motion-only rules and keyframes.
export function installReducedCss() {
  const queries = new Map()
  function visit(rules) {
    for (const rule of rules) {
      if (rule instanceof CSSMediaRule) {
        const query = queries.get(rule) || rule.conditionText
        if (query.includes('prefers-reduced-motion')) {
          queries.set(rule, query)
          const override = query.replace(/\(prefers-reduced-motion:\s*reduce\)/gi, '(min-width: 0px)').replace(/\(prefers-reduced-motion:\s*no-preference\)/gi, '(max-width: 0px)')
          if (rule.conditionText !== override) rule.media.mediaText = override
        }
      }
      if (rule.cssRules) visit(rule.cssRules)
    }
  }
  const sync = () => {
    if (document.documentElement.dataset.reducedMotion !== 'true') {
      for (const [rule, query] of queries) rule.media.mediaText = query
      queries.clear()
      return
    }
    for (const sheet of document.styleSheets) {
      try { visit(sheet.cssRules) } catch { /* External stylesheets cannot be inspected. */ }
    }
  }
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-reduced-motion'] })
  new MutationObserver(sync).observe(document.head, { childList: true, subtree: true, characterData: true })
  document.addEventListener('load', (event) => { if (event.target instanceof HTMLLinkElement) sync() }, true)
  sync()
}
