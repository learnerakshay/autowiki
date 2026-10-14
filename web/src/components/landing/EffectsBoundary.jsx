import { Component } from 'react'

/**
 * Keeps a failure in a decorative or effects layer (backgrounds, spotlights, miniatures, entire
 * below-the-fold sections) from blanking the page. A broken subtree renders `fallback` (nothing by
 * default) and the rest of the landing page keeps working.
 */
export class EffectsBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error) {
    console.warn('[landing] an effects layer failed and was disabled:', error?.message ?? error)
  }

  render() {
    return this.state.failed ? (this.props.fallback ?? null) : this.props.children
  }
}
