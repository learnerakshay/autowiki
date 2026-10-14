import { Component, lazy, Suspense } from 'react'
import { BrandLink } from '../brand/BrandLink.jsx'

const ErrorPage = lazy(() => import('../../pages/ErrorPage.jsx'))
const recoveryLoader = <div className="shell-recovery"><BrandLink /><p role="status">Loading recovery page…</p></div>
// Recovery must still work when the recovery chunk itself is unavailable.
class RecoveryBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    const Tag = this.props.root ? 'main' : 'div'
    return <Tag className="shell-recovery"><BrandLink /><h1 tabIndex={-1} ref={(node) => node?.focus({ preventScroll: true })}>AutoWiki could not display this page</h1><p>The recovery screen could not be loaded. Reload to try again.</p><p>Error reference: <code>{this.props.id}</code></p><div><a className="press" href={window.location.href}>Reload to update</a><a className="press" href="/">Go home</a></div></Tag>
  }
}
export class ErrorBoundary extends Component {
  state = { id: '', resetKey: this.props.resetKey }
  static getDerivedStateFromError() { return { id: `AW-${Math.random().toString(36).slice(2, 8)}` } }
  static getDerivedStateFromProps(props, state) {
    return props.resetKey === state.resetKey ? null : { id: '', resetKey: props.resetKey }
  }
  render() {
    if (!this.state.id) return this.props.children
    return <RecoveryBoundary id={this.state.id} root={this.props.root}><Suspense fallback={recoveryLoader}><ErrorPage id={this.state.id} root={this.props.root} /></Suspense></RecoveryBoundary>
  }
}
export function ChunkError() {
  return <RecoveryBoundary id="AW-CHUNK"><Suspense fallback={recoveryLoader}><ErrorPage id="AW-CHUNK" chunk /></Suspense></RecoveryBoundary>
}
