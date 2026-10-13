import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Clipboard,
  Clock3,
  FileCode2,
  GitFork,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react'
import { postJson } from '../api.js'
import { ErrorNotice } from '../components/ErrorNotice.jsx'
import { JobStatus } from '../components/JobStatus.jsx'
import { WikiGenerationProgress } from '../components/WikiGenerationProgress.jsx'
import { Badge } from '../components/ui/badge.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { motion, prefersReducedMotion } from '../lib/motion.js'
import { useJobPoll } from '../useJobPoll.js'
import { MarkdownDocument } from './MarkdownDocument.jsx'
import MermaidDiagram from './MermaidDiagram.jsx'

function formatGeneratedAt(value) {
  if (!value) return 'Generation time unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Generation time unavailable'

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

function WikiEntry({ repo, setRepo, generate, submitting, submitError }) {
  return (
    <section className="wiki-state-page" aria-labelledby="wiki-entry-title">
      <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Back to Workspace</Link>
      <div className="wiki-state-intro">
        <span className="wiki-state-icon" aria-hidden="true"><BookOpenText size={24} /></span>
        <div>
          <h1 id="wiki-entry-title">Generate a repository wiki</h1>
          <p>Create structured technical chapters and Mermaid diagrams from a public GitHub repository.</p>
        </div>
      </div>
      <form className="wiki-entry-form" onSubmit={generate} aria-busy={submitting}>
        <Label htmlFor="wiki-repo">Repository</Label>
        <div className="wiki-entry-form__controls">
          <Input
            id="wiki-repo"
            value={repo}
            onChange={(event) => setRepo(event.target.value)}
            placeholder="owner/repository"
            autoComplete="off"
          />
          <Button disabled={submitting || !repo.trim()}>
            {submitting ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BookOpenText aria-hidden="true" />}
            {submitting ? 'Starting…' : 'Generate Wiki'}
          </Button>
        </div>
        <p>Use owner/repository or a public GitHub URL. Wiki generation is separate from Chat indexing.</p>
      </form>
      {submitError ? (
        <ErrorNotice title="Wiki generation could not start" error={submitError} recovery="Check the repository name and connection, then try again." />
      ) : null}
    </section>
  )
}

function WikiPending({ jobId, repo, progress }) {
  return (
    <section className="wiki-state-page" aria-labelledby="wiki-pending-title">
      <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Back to Workspace</Link>
      <div className="wiki-pending-header">
        <JobStatus status="pending"><span>generating...</span></JobStatus>
        <h1 id="wiki-pending-title">Generating your technical wiki</h1>
        <p>
          AutoWiki is analyzing the repository, organizing its architecture, and writing the generated document.
          The activity below comes from real worker boundaries rather than a simulated percentage.
        </p>
      </div>
      <WikiGenerationProgress progress={progress} repo={repo} />
      <p className="wiki-pending-outcome">
        When generation finishes, this route becomes the chaptered Wiki reader with its source references and diagrams intact.
      </p>
      <details className="wiki-job-details">
        <summary>Job details</summary>
        <code>{jobId}</code>
      </details>
    </section>
  )
}

function WikiFailure({ title, error, jobId, onRetry }) {
  return (
    <section className="wiki-state-page" aria-labelledby="wiki-failure-title">
      <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Back to Workspace</Link>
      <div className="wiki-state-intro wiki-state-intro--error">
        <span className="wiki-state-icon" aria-hidden="true"><RefreshCw size={23} /></span>
        <div>
          <h1 id="wiki-failure-title">{title}</h1>
          <p>AutoWiki could not open this generated document.</p>
        </div>
      </div>
      <ErrorNotice
        title={title}
        error={error}
        recovery={onRetry ? 'The generation job may still be running. Retry this status check without starting a duplicate job.' : 'Return to Workspace, confirm the repository is available, and start a new Wiki job. Retrying may still depend on external services.'}
      />
      {onRetry ? <Button type="button" variant="secondary" onClick={onRetry}><RefreshCw aria-hidden="true" size={17} />Retry status check</Button> : null}
      {jobId ? (
        <details className="wiki-job-details">
          <summary>Job details</summary>
          <code>{jobId}</code>
          <p>Job records are stored in memory and can disappear when the server restarts.</p>
        </details>
      ) : null}
    </section>
  )
}

export function WikiReader({ job, jobId, sample = false, provenance }) {
  const readerRef = useRef(null)
  const articleRef = useRef(null)
  const chapterButtons = useRef([])
  const copyTimerRef = useRef()
  const [selected, setSelected] = useState(0)
  const [copyStatus, setCopyStatus] = useState('idle')
  const chapters = job.chapters
  const chapter = chapters[selected]

  useGSAP(() => {
    if (prefersReducedMotion()) return
    gsap.from('.wiki-document-header, .wiki-chapter-nav, .wiki-article, .wiki-context-rail', {
      autoAlpha: 0.72,
      y: 8,
      duration: motion.selection,
      stagger: 0.045,
      ease: motion.ease,
      clearProps: 'opacity,visibility,transform',
    })
  }, { scope: readerRef })

  useGSAP(() => {
    if (!articleRef.current) return
    const reduced = prefersReducedMotion()
    gsap.fromTo(
      articleRef.current,
      { autoAlpha: reduced ? 1 : 0.62, y: reduced ? 0 : 6 },
      { autoAlpha: 1, y: 0, duration: reduced ? 0.1 : motion.selection, ease: reduced ? 'none' : motion.ease, clearProps: 'opacity,visibility,transform' },
    )
  }, { scope: articleRef, dependencies: [selected] })

  useEffect(() => () => window.clearTimeout(copyTimerRef.current), [])

  function selectChapter(index) {
    if (index < 0 || index >= chapters.length) return
    setCopyStatus('idle')
    setSelected(index)
  }

  function handleChapterKey(event, index) {
    const lastIndex = chapters.length - 1
    let nextIndex

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = index === lastIndex ? 0 : index + 1
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = index === 0 ? lastIndex : index - 1
    if (event.key === 'Home') nextIndex = 0
    if (event.key === 'End') nextIndex = lastIndex
    if (nextIndex === undefined) return

    event.preventDefault()
    selectChapter(nextIndex)
    chapterButtons.current[nextIndex]?.focus()
  }

  async function copyMarkdown() {
    window.clearTimeout(copyTimerRef.current)
    try {
      await navigator.clipboard.writeText(chapter.markdown)
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    copyTimerRef.current = window.setTimeout(() => setCopyStatus('idle'), 2400)
  }

  const generatedAt = formatGeneratedAt(job.generatedAt)
  const chatHref = `/chat?repo=${encodeURIComponent(job.repo)}`

  return (
    <section ref={readerRef} className="wiki-reader" aria-label={`Generated wiki for ${job.repo}`}>
      <header className={`wiki-document-header${sample ? ' wiki-document-header--sample' : ''}`}>
        <div className="wiki-document-header__topline">
          <Link className="wiki-back-link" to="/workspace"><ArrowLeft aria-hidden="true" size={16} />Workspace</Link>
          <JobStatus status="completed">{sample ? 'Pre-generated sample' : 'Generated'}</JobStatus>
        </div>
        <div className="wiki-document-header__body">
          <div className="wiki-document-identity">
            <span className="wiki-document-kicker">Technical wiki</span>
            <h1>{job.repo}</h1>
            <p>{sample
              ? 'A previously generated Wiki from a public repository. Opening it does not start a new AI generation job.'
              : 'Structured repository documentation generated from source context.'}</p>
          </div>
          <div className="wiki-document-actions">
            {!sample ? (
              <Button asChild variant="secondary" size="sm">
                <Link to={chatHref}><MessageSquareText aria-hidden="true" size={16} />Open Chat</Link>
              </Button>
            ) : null}
            <Button asChild size="sm">
              <Link to="/workspace">{sample ? 'Generate your own' : 'Generate another'}<ArrowRight aria-hidden="true" size={16} /></Link>
            </Button>
          </div>
        </div>
        {sample ? (
          <div className="wiki-sample-provenance" aria-label="Sample provenance">
            <span>Demo-safe</span>
            <p>{provenance}</p>
          </div>
        ) : null}
        <div className="wiki-document-meta">
          <span><Clock3 aria-hidden="true" size={15} />{generatedAt}</span>
          <span><BookOpenText aria-hidden="true" size={15} />{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</span>
          <span><GitFork aria-hidden="true" size={15} />Repository-generated</span>
          {!sample && jobId ? (
            <details className="wiki-job-details wiki-job-details--inline">
              <summary>Job details</summary>
              <code>{jobId}</code>
            </details>
          ) : null}
        </div>
      </header>

      <div className="wiki-mobile-chapters">
        <Label htmlFor="mobile-chapter">Chapter</Label>
        <select id="mobile-chapter" value={selected} onChange={(event) => selectChapter(Number(event.target.value))}>
          {chapters.map((item, index) => <option key={`${item.title}-${index}`} value={index}>{index + 1}. {item.title}</option>)}
        </select>
      </div>

      <div className="wiki-reader-grid">
        <aside className="wiki-chapter-nav">
          <div className="wiki-chapter-nav__header">
            <h2>Chapters</h2>
            <span>{selected + 1} / {chapters.length}</span>
          </div>
          <nav aria-label="Wiki chapters">
            <ol>
              {chapters.map((item, index) => (
                <li key={`${item.title}-${index}`}>
                  <button
                    ref={(node) => { chapterButtons.current[index] = node }}
                    type="button"
                    className="wiki-chapter-button"
                    data-chapter-number={String(index + 1).padStart(2, '0')}
                    aria-current={index === selected ? 'page' : undefined}
                    tabIndex={index === selected ? 0 : -1}
                    onClick={() => selectChapter(index)}
                    onKeyDown={(event) => handleChapterKey(event, index)}
                  >
                    <span>{item.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </nav>
          <p>Use arrow keys to move between chapters.</p>
        </aside>

        <article ref={articleRef} className="wiki-article" aria-labelledby="wiki-chapter-title">
          <header className="wiki-article__header">
            <span className="wiki-article__eyebrow">Chapter {String(selected + 1).padStart(2, '0')} · {chapters.length}</span>
            <h2 id="wiki-chapter-title">{chapter.title}</h2>
            {chapter.description ? <p>{chapter.description}</p> : null}
            {chapter.filePaths?.length ? (
              <div className="wiki-source-files" aria-label="Referenced repository files">
                {chapter.filePaths.map((path) => (
                  <Badge key={path} variant="neutral"><FileCode2 aria-hidden="true" size={14} />{path}</Badge>
                ))}
              </div>
            ) : null}
          </header>

          <div className="wiki-article__toolbar" aria-label="Chapter actions">
            <Button type="button" variant="ghost" size="sm" onClick={copyMarkdown}>
              {copyStatus === 'copied' ? <Check aria-hidden="true" size={16} /> : <Clipboard aria-hidden="true" size={16} />}
              {copyStatus === 'copied' ? 'Copied' : 'Copy Markdown'}
            </Button>
            <span role="status" aria-live="polite">
              {copyStatus === 'failed' ? 'Copy failed. Select the chapter text and copy it manually.' : ''}
            </span>
          </div>

          <MarkdownDocument markdown={chapter.markdown} title={chapter.title} />

          <section id="wiki-diagram" className="wiki-diagram-section" aria-labelledby="diagram-title">
            <MermaidDiagram
              key={chapter.mermaid}
              titleId="diagram-title"
              source={chapter.mermaid}
              valid={chapter.diagramValid}
              label={`${chapter.title} architecture diagram`}
            />
          </section>

          <nav className="wiki-chapter-pagination" aria-label="Adjacent chapters">
            <Button type="button" variant="secondary" disabled={selected === 0} onClick={() => selectChapter(selected - 1)}>
              <ChevronLeft aria-hidden="true" size={17} />Previous
            </Button>
            <span>Chapter {selected + 1} of {chapters.length}</span>
            <Button type="button" variant="secondary" disabled={selected === chapters.length - 1} onClick={() => selectChapter(selected + 1)}>
              Next<ChevronRight aria-hidden="true" size={17} />
            </Button>
          </nav>
        </article>

        <aside className="wiki-context-rail" aria-label="Chapter context">
          <div className="wiki-context-rail__section">
            <span className="wiki-context-rail__eyebrow">Reading now</span>
            <strong>{chapter.title}</strong>
            {chapter.description ? <p>{chapter.description}</p> : null}
          </div>
          {chapter.filePaths?.length ? (
            <div className="wiki-context-rail__section">
              <h2>Source context</h2>
              <ul>{chapter.filePaths.map((path) => <li key={path}><FileCode2 aria-hidden="true" size={14} /><code>{path}</code></li>)}</ul>
            </div>
          ) : null}
          <div className="wiki-context-rail__section wiki-context-rail__diagram">
            <NetworkMark />
            <div><strong>Generated diagram</strong><p>Rendered from this chapter’s Mermaid definition.</p></div>
          </div>
        </aside>
      </div>
    </section>
  )
}

function NetworkMark() {
  return <span className="wiki-context-rail__mark" aria-hidden="true"><GitFork size={16} /></span>
}

export default function Wiki() {
  const [repo, setRepo] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const jobId = searchParams.get('jobId') ?? ''
  const { job, error: pollError, retry: retryPoll } = useJobPoll('wiki', jobId)

  useJobNotifications(job, jobId, {
    completed: 'Repository wiki is ready',
    failed: 'Wiki generation failed',
  })

  async function generate(event) {
    event.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await postJson('/api/wiki', { repo: repo.trim() })
      setSearchParams({ jobId: result.jobId })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!jobId) {
    return <WikiEntry repo={repo} setRepo={setRepo} generate={generate} submitting={submitting} submitError={submitError} />
  }

  if (pollError) {
    return <WikiFailure title="Wiki job unavailable" error={pollError} jobId={jobId} onRetry={retryPoll} />
  }

  if (!job || job.status === 'pending') {
    return <WikiPending jobId={jobId} repo={job?.repo || repo} progress={job?.progress} />
  }

  if (job.status === 'failed') {
    return <WikiFailure title="Wiki generation failed" error={job.error} jobId={jobId} />
  }

  if (!job.chapters?.length) {
    return <WikiFailure title="No chapters were generated" error="The completed job did not contain readable chapters." jobId={jobId} />
  }

  return <WikiReader key={jobId} job={job} jobId={jobId} />
}
