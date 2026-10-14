import { useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, ArrowRight, Check } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { actions } from '../../data/landingCopy.js'
import { checkRepoInput, REPO_EXAMPLE, workspaceHref } from '../../lib/repoInput.js'
import { reducedMotionQuery } from '../../lib/motion.js'
import { GithubMark } from './GithubMark.jsx'

const EMPTY_MESSAGE = `Enter a public GitHub repository, like ${REPO_EXAMPLE}.`

// For uses without an autoplay demo (the final CTA): the field behaves normally, nothing types into it.
const IDLE_DEMO = { running: false, phase: 'idle', typed: '', stop() {} }

/**
 * Real repository field + the demo caret. The demo types into a decorative overlay, never into the
 * input itself, so the user's own text can't be clobbered and focusing the field simply hides the overlay.
 */
export function RepoDemoInput({ demo = IDLE_DEMO, exploreHref, id = 'hero-repo', compact = false, showSecondary = true }) {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const messageId = useId()
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const [visited, setVisited] = useState(false) // left the field once
  const [attempted, setAttempted] = useState(false) // pressed Generate
  const result = checkRepoInput(value)

  const ghostVisible = demo.running && !focused && !value && demo.typed.length > 0
  const typing = demo.phase === 'typing'

  // Invalid input is flagged immediately; "not finished yet" waits until the user leaves the field; empty waits for a submit.
  const showError = result.status === 'invalid'
    || (result.status === 'incomplete' && (visited || attempted))
    || (result.status === 'empty' && attempted)
  const message = result.status === 'empty' ? EMPTY_MESSAGE : (result.message ?? `Use the owner/repo format, like ${REPO_EXAMPLE}.`)

  function handleSubmit(event) {
    event.preventDefault()
    demo.stop()
    if (result.status !== 'valid') {
      setAttempted(true)
      inputRef.current?.focus()
      return
    }
    // Hand off with a View Transition where the browser has them (a root cross-fade; the workspace page is
    // untouched). Everywhere else this is an ordinary navigation.
    const transition = 'startViewTransition' in document && !window.matchMedia(reducedMotionQuery).matches
    navigate(workspaceHref(result.repo), transition ? { viewTransition: true } : undefined)
  }

  return (
    <div className={`hero-actions${compact ? ' hero-actions--compact' : ''}`}>
      <form className="repo-form" onSubmit={handleSubmit} noValidate>
        <label className="sr-only" htmlFor={id}>GitHub repository</label>
        <div
          className="repo-pill"
          data-status={showError ? 'invalid' : result.status}
          data-ghost={ghostVisible}
          onPointerDown={demo.stop}
        >
          <GithubMark className="repo-pill__icon" />
          <div className="repo-pill__field">
            <input
              ref={inputRef}
              id={id}
              name="repo"
              type="text"
              inputMode="url"
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              maxLength={260}
              placeholder="github.com/owner/repo"
              aria-label="GitHub repository, as owner/repo or a github.com URL"
              aria-invalid={showError}
              aria-describedby={messageId}
              value={value}
              onFocus={() => { setFocused(true); demo.stop() }}
              onBlur={() => { setFocused(false); setVisited(true) }}
              onChange={(event) => { demo.stop(); setValue(event.target.value) }}
            />
            <span className="repo-pill__ghost" aria-hidden="true">
              {ghostVisible ? demo.typed : ''}
              {ghostVisible && typing ? <i className="repo-pill__caret" /> : null}
            </span>
          </div>
          {result.status === 'valid' ? <Check className="repo-pill__ok" aria-hidden="true" /> : null}
          <button type="submit" className="repo-pill__submit" data-pressed={demo.phase === 'pressing'}>
            {actions.primary} <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <p id={messageId} className="repo-form__message" data-tone={showError ? 'error' : 'quiet'} aria-live="polite">
          {showError ? <><AlertCircle aria-hidden="true" />{message}</> : null}
        </p>
      </form>
      {showSecondary ? (
        <Button asChild variant="secondary" className="hero-actions__secondary">
          <Link to={exploreHref}>{actions.secondary}</Link>
        </Button>
      ) : null}
    </div>
  )
}
