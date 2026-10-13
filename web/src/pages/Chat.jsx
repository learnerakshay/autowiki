import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenText,
  Check,
  Clipboard,
  FileCode2,
  GitFork,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
  Send,
} from 'lucide-react'
import { postJson } from '../api.js'
import { ErrorNotice } from '../components/ErrorNotice.jsx'
import { JobStatus } from '../components/JobStatus.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { motion, motionQuery, reducedMotionQuery } from '../lib/motion.js'
import { useJobPoll } from '../useJobPoll.js'
import { MarkdownDocument } from './MarkdownDocument.jsx'

const suggestions = [
  'What is the main purpose of this repository?',
  'How is the application structured?',
  'Where is the primary application logic implemented?',
  'How are errors handled in the codebase?',
]

export default function Chat() {
  const [searchParams] = useSearchParams()
  const [repo, setRepo] = useState(() => searchParams.get('repo')?.trim() || '')
  const [question, setQuestion] = useState('')
  const [jobId, setJobId] = useState('')
  const [submission, setSubmission] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copyStatus, setCopyStatus] = useState('idle')
  const pageRef = useRef(null)
  const resultRef = useRef(null)
  const questionRef = useRef(null)
  const requestRef = useRef(0)
  const copyTimerRef = useRef()
  const { job, error: pollError, retry: retryPoll } = useJobPoll('chat', jobId)

  useJobNotifications(job, jobId, { completed: 'Answer is ready', failed: 'Repository question failed' })

  const pending = Boolean(jobId) && job?.status === 'pending'
  const sources = Array.isArray(job?.sources)
    ? [...new Set(job.sources.filter((source) => typeof source === 'string' && source.trim()).map((source) => source.trim()))]
    : []
  const normalizedRepo = repo.trim()
  const normalizedQuestion = question.trim()
  const activeMatchesDraft = submission?.repo === normalizedRepo && submission?.question === normalizedQuestion
  const draftDiffers = Boolean(submission) && !activeMatchesDraft
  const currentError = submitError || pollError
  const stateKey = submitting ? 'submitting' : currentError ? 'error' : job?.status || 'empty'

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add(motionQuery, () => {
      const timeline = gsap.timeline()
      timeline.fromTo(
        ['.chat-intro', '.chat-composer', '.chat-index-note'],
        { autoAlpha: 0.8, y: 6 },
        { autoAlpha: 1, y: 0, duration: motion.selection, stagger: 0.025, ease: motion.ease, clearProps: 'opacity,visibility,transform' },
      )
      timeline.fromTo(
        '.chat-intro__flow li',
        { autoAlpha: 0.7, x: -5 },
        { autoAlpha: 1, x: 0, duration: motion.feedback, stagger: 0.035, ease: motion.ease, clearProps: 'opacity,visibility,transform' },
        0.04,
      )
    })
    media.add(reducedMotionQuery, () => {
      gsap.set(['.chat-intro', '.chat-composer', '.chat-index-note', '.chat-intro__flow li'], { clearProps: 'all' })
    })
    return () => media.revert()
  }, { scope: pageRef })

  useGSAP(() => {
    if (!resultRef.current) return undefined
    const media = gsap.matchMedia()
    media.add(motionQuery, () => {
      gsap.fromTo(
        resultRef.current,
        { autoAlpha: 0.76, y: 8, clipPath: 'inset(0 0 10px 0 round 12px)' },
        { autoAlpha: 1, y: 0, clipPath: 'inset(0 0 0 0 round 12px)', duration: motion.selection, ease: motion.ease, clearProps: 'opacity,visibility,transform,clipPath' },
      )
      if (job?.status === 'completed') {
        const sourceItems = gsap.utils.toArray('.chat-source-item', pageRef.current)
        if (sourceItems.length) {
          gsap.fromTo(
            sourceItems,
            { autoAlpha: 0.65, x: 5 },
            { autoAlpha: 1, x: 0, duration: motion.feedback, stagger: 0.025, delay: 0.04, ease: motion.ease, clearProps: 'opacity,visibility,transform' },
          )
        }
      }
    })
    media.add(reducedMotionQuery, () => {
      gsap.set(resultRef.current, { clearProps: 'all' })
      const sourceItems = gsap.utils.toArray('.chat-source-item', pageRef.current)
      if (sourceItems.length) gsap.set(sourceItems, { clearProps: 'all' })
    })
    return () => media.revert()
  }, { scope: pageRef, dependencies: [stateKey, jobId] })

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), [])

  async function submit(event) {
    event.preventDefault()
    if (!normalizedRepo || !normalizedQuestion || submitting) return

    const requestNumber = requestRef.current + 1
    requestRef.current = requestNumber
    const nextSubmission = { repo: normalizedRepo, question: normalizedQuestion }

    setSubmission(nextSubmission)
    setJobId('')
    setSubmitError('')
    setCopyStatus('idle')
    setSubmitting(true)

    try {
      const result = await postJson('/api/chat', nextSubmission)
      if (requestRef.current === requestNumber) setJobId(result.jobId)
    } catch (error) {
      if (requestRef.current === requestNumber) setSubmitError(error.message)
    } finally {
      if (requestRef.current === requestNumber) setSubmitting(false)
    }
  }

  function selectSuggestion(nextQuestion) {
    setQuestion(nextQuestion)
    requestAnimationFrame(() => questionRef.current?.focus())
  }

  async function copyAnswer() {
    window.clearTimeout(copyTimerRef.current)
    try {
      await navigator.clipboard.writeText(String(job?.answer || ''))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    copyTimerRef.current = window.setTimeout(() => setCopyStatus('idle'), 2400)
  }

  function askAnother() {
    requestRef.current += 1
    setQuestion('')
    setJobId('')
    setSubmission(null)
    setSubmitError('')
    setCopyStatus('idle')
    requestAnimationFrame(() => questionRef.current?.focus())
  }

  return (
    <section ref={pageRef} className="chat-page">
      <header className="chat-intro">
        <div className="chat-intro__icon" aria-hidden="true"><MessageSquareText /></div>
        <div className="chat-intro__copy">
          <h1>Ask better questions about your code.</h1>
          <p>Explore an indexed GitHub repository with AI-generated answers grounded in retrieved source context.</p>
        </div>
        <ol className="chat-intro__flow" aria-label="Grounded answer workflow">
          <li><span>01</span><div><strong>Index</strong><small>Store source chunks</small></div></li>
          <li><span>02</span><div><strong>Retrieve</strong><small>Find relevant files</small></div></li>
          <li><span>03</span><div><strong>Answer</strong><small>Return source paths</small></div></li>
        </ol>
      </header>

      <form className="chat-composer" onSubmit={submit} aria-busy={submitting || pending}>
        <div className="chat-repository-field">
          <div className="chat-field-heading">
            <GitFork aria-hidden="true" />
            <div>
              <Label htmlFor="chat-repo">Repository</Label>
              <p>Ask questions about an indexed repository.</p>
            </div>
          </div>
          <Input
            id="chat-repo"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="owner/repository or GitHub URL"
            autoComplete="off"
            required
          />
          <p className="chat-field-help">Use <code>owner/repository</code> or a public GitHub repository URL. Entering a repository does not index it.</p>
        </div>

        <div className="chat-question-field">
          <div className="chat-question-label">
            <Label htmlFor="chat-question">Question</Label>
            <span>Each submission is an independent request</span>
          </div>
          <textarea
            ref={questionRef}
            id="chat-question"
            className="textarea chat-textarea"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask about architecture, control flow, implementation details, or error handling…"
            required
          />

          <div className="chat-suggestions" aria-label="Example prompts">
            {suggestions.map((suggestion) => (
              <button key={suggestion} type="button" onClick={() => selectSuggestion(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>

          <div className="chat-composer-footer">
            <p>Answers use retrieved indexed files. Review the returned paths before relying on implementation details.</p>
            <Button
              type="submit"
              className="chat-ask-button"
              disabled={submitting || !normalizedRepo || !normalizedQuestion || (pending && activeMatchesDraft)}
            >
              {submitting || (pending && activeMatchesDraft) ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {submitting ? 'Sending…' : pending && activeMatchesDraft ? 'Answering…' : 'Ask'}
            </Button>
          </div>
        </div>
      </form>

      {draftDiffers && (pending || job?.status === 'completed') && (
        <p className="chat-draft-notice" role="status">Composer edits do not alter the active request. Select Ask to replace it.</p>
      )}

      {!submission && !currentError && (
        <section className="chat-index-note">
          <div>
            <BookOpenText aria-hidden="true" />
            <div>
              <h2>Index before asking</h2>
              <p>Repository indexing powers this Q&amp;A workflow. Wiki generation is a separate flow and remains available without creating a Chat request.</p>
            </div>
          </div>
          <Button asChild variant="secondary"><Link to="/workspace">Open Workspace <ArrowRight aria-hidden="true" /></Link></Button>
        </section>
      )}

      {(submitting || pending) && submission && (
        <section ref={resultRef} className="chat-request-state chat-request-state--pending" aria-labelledby="chat-pending-title">
          <div className="chat-request-state__topline">
            <JobStatus status="pending"><span>pending...</span></JobStatus>
            <code>{submission.repo}</code>
          </div>
          <h2 id="chat-pending-title">Working on your question</h2>
          <p className="chat-submitted-question">{submission.question}</p>
          <div className="chat-pending-track" aria-hidden="true"><span /></div>
          <p className="chat-state-help">This is an indeterminate background job. No retrieval stage is inferred before the backend reports a result.</p>
          {jobId && <details className="chat-job-details"><summary>Job reference</summary><code>{jobId}</code></details>}
        </section>
      )}

      {currentError && submission && (
        <section ref={resultRef} className="chat-request-state" aria-labelledby="chat-error-context">
          <div className="chat-request-state__topline"><span>Request context</span><code>{submission.repo}</code></div>
          <h2 id="chat-error-context">{submission.question}</h2>
          <ErrorNotice title="Question could not be completed" error={currentError} recovery={pollError ? 'The job may still be running. Retry the status check without submitting a duplicate question.' : 'Confirm the repository has been indexed, then submit the question again.'} />
          {pollError ? <Button type="button" variant="secondary" onClick={retryPoll}><RefreshCw aria-hidden="true" />Retry status check</Button> : null}
        </section>
      )}

      {job?.status === 'failed' && submission && (
        <section ref={resultRef} className="chat-request-state" aria-labelledby="chat-failed-context">
          <div className="chat-request-state__topline"><JobStatus status="failed">failed</JobStatus><code>{submission.repo}</code></div>
          <h2 id="chat-failed-context">{submission.question}</h2>
          <ErrorNotice title="Question failed" error={job.error || 'The background job did not return an answer.'} recovery="Review the repository name and confirm it has been indexed, then submit the question again." />
        </section>
      )}

      {job?.status === 'completed' && submission && (
        <article ref={resultRef} className="chat-result">
          <section className="chat-answer" aria-labelledby="chat-answer-heading">
            <header className="chat-answer__header">
              <div>
                <div className="chat-answer__identity">
                  <JobStatus status="completed">completed</JobStatus>
                  <code>{submission.repo}</code>
                </div>
                <h2 id="chat-answer-heading">Answer</h2>
                <p className="chat-submitted-question">{submission.question}</p>
              </div>
              <Button type="button" variant="secondary" onClick={copyAnswer}>
                {copyStatus === 'copied' ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}
                {copyStatus === 'copied' ? 'Copied' : 'Copy Answer'}
              </Button>
            </header>
            {copyStatus === 'failed' && <p className="chat-copy-error" role="alert">Clipboard access was unavailable. Select the answer text to copy it manually.</p>}
            <MarkdownDocument markdown={job.answer} title="Answer" className="chat-answer-markdown" />
            <footer className="chat-answer__actions">
              <Button type="button" variant="secondary" onClick={askAnother}>Ask another question</Button>
              <Button asChild variant="ghost"><Link to={`/wiki?repo=${encodeURIComponent(submission.repo)}`}>Generate Wiki <ArrowRight aria-hidden="true" /></Link></Button>
            </footer>
          </section>

          <aside className="chat-sources" aria-labelledby="chat-sources-heading">
            <div className="chat-sources__heading">
              <FileCode2 aria-hidden="true" />
              <div>
                <h2 id="chat-sources-heading">Sources</h2>
                <p>File paths returned by the retrieval service.</p>
              </div>
            </div>
            {sources.length ? (
              <ul>{sources.map((path) => <li className="chat-source-item" key={path}><FileCode2 aria-hidden="true" /><code>{path}</code></li>)}</ul>
            ) : (
              <p className="chat-sources__empty">No source paths were returned for this answer. No citations have been inferred.</p>
            )}
            {jobId && <details className="chat-job-details"><summary>Job reference</summary><code>{jobId}</code></details>}
            <Button asChild variant="secondary" className="chat-sources__workspace"><Link to="/workspace">Repository Workspace</Link></Button>
          </aside>
        </article>
      )}
    </section>
  )
}
