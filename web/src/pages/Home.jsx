import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { Link, useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BookOpenText,
  CheckCircle2,
  Database,
  FileText,
  Files,
  GitBranch,
  GitFork,
  ListTree,
  LoaderCircle,
  MessageSquareText,
  RefreshCw,
} from 'lucide-react'

import { postJson } from '../api.js'
import { JobStatus } from '../components/JobStatus.jsx'
import { WikiGenerationProgress } from '../components/WikiGenerationProgress.jsx'
import { Button } from '../components/ui/button.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import sampleWiki from '../data/samples/spoon-knife.json'
import { motion, motionQuery, prefersReducedMotion } from '../lib/motion.js'
import { useJobPoll } from '../useJobPoll.js'

const workflowSteps = [
  {
    icon: GitBranch,
    title: 'Repository',
    description: 'AutoWiki reads the public source tree and its relationships.',
  },
  {
    icon: ListTree,
    title: 'Wiki outline',
    description: 'The generator organizes the system into coherent chapters.',
  },
  {
    icon: BookOpenText,
    title: 'Documentation',
    description: 'Explanations and diagrams become a navigable technical wiki.',
  },
]

const jobCopy = {
  idle: {
    title: 'Ready when you are',
    description: 'Submit a repository to begin this workflow.',
  },
  submitting: {
    title: 'Starting the job',
    description: 'AutoWiki is handing the repository to the generation service.',
  },
  pending: {
    title: 'Work is in progress',
    description: 'This status comes directly from the backend. You can start the other workflow independently.',
  },
  completed: {
    title: 'Job complete',
    description: 'The repository has finished processing.',
  },
  failed: {
    title: 'Job failed',
    description: 'The backend could not complete this request.',
  },
  unavailable: {
    title: 'Status unavailable',
    description: 'AutoWiki could not retrieve this job. In-memory jobs can be lost when the server restarts.',
  },
}

function InlineError({ children }) {
  return (
    <p className="workspace-inline-error" role="alert">
      <AlertCircle aria-hidden="true" size={16} />
      <span>{children}</span>
    </p>
  )
}

function WorkspaceJobCard({ kind, jobId, repo, job, error, submitting, onRetry }) {
  const panelRef = useRef(null)
  const isWiki = kind === 'wiki'
  const state = submitting
    ? 'submitting'
    : error
      ? 'unavailable'
      : jobId
        ? job?.status || 'pending'
        : 'idle'
  const copy = jobCopy[state] || jobCopy.pending
  const status = state === 'idle'
    ? 'neutral'
    : state === 'completed'
      ? 'completed'
      : state === 'failed'
        ? 'failed'
        : state === 'unavailable'
          ? 'failed'
          : 'pending'
  const statusLabel = state === 'idle' ? 'Ready' : state === 'unavailable' ? 'Unavailable' : undefined
  const Icon = state === 'completed'
    ? CheckCircle2
    : state === 'failed' || state === 'unavailable'
      ? AlertCircle
      : state === 'idle'
        ? isWiki ? FileText : Database
        : LoaderCircle

  useGSAP(() => {
    if (!panelRef.current) return

    if (prefersReducedMotion()) {
      gsap.set(panelRef.current, { clearProps: 'all' })
      return
    }

    gsap.fromTo(
      panelRef.current,
      { opacity: 0.64, y: 4 },
      { opacity: 1, y: 0, duration: motion.selection, ease: 'power2.out', clearProps: 'transform' },
    )
  }, { scope: panelRef, dependencies: [jobId, state] })

  const chapterCount = Array.isArray(job?.chapters) ? job.chapters.length : 0

  return (
    <section
      ref={panelRef}
      className={`workspace-job workspace-job--${state}`}
      aria-label={`${isWiki ? 'Wiki generation' : 'Repository indexing'} status`}
    >
      <div className="workspace-job__topline">
        <JobStatus status={status}>
          {statusLabel || `${state.charAt(0).toUpperCase()}${state.slice(1)}`}
        </JobStatus>
        {jobId ? <code title={jobId}>{jobId}</code> : null}
      </div>

      {isWiki && state === 'pending' ? (
        <WikiGenerationProgress progress={job?.progress} repo={repo} compact />
      ) : (
        <>
          <div className="workspace-job__body">
            <span className="workspace-job__icon" aria-hidden="true">
              <Icon size={19} />
            </span>
            <div>
              <h3>{copy.title}</h3>
              <p>{error || job?.error || copy.description}</p>
              {repo && jobId ? <p className="workspace-job__repo">{repo}</p> : null}
            </div>
          </div>

          {(state === 'submitting' || state === 'pending') && (
            <div className="workspace-activity" aria-hidden="true">
              <span />
            </div>
          )}
        </>
      )}

      {state === 'completed' && isWiki ? (
        <div className="workspace-result-grid workspace-result-grid--single">
          <div>
            <strong>{chapterCount}</strong>
            <span>{chapterCount === 1 ? 'generated chapter' : 'generated chapters'}</span>
          </div>
        </div>
      ) : null}

      {state === 'completed' && !isWiki ? (
        <>
          <div className="workspace-result-grid">
            <div>
              <strong>{job?.fileCount ?? 0}</strong>
              <span>source files read</span>
            </div>
            <div>
              <strong>{job?.chunkCount ?? 0}</strong>
              <span>searchable chunks</span>
            </div>
          </div>
          <p className={`workspace-result-note ${job?.saved === false ? 'workspace-result-note--warning' : ''}`}>
            {job?.saved === false
              ? 'The index was processed but was not saved for repository-grounded Q&A.'
              : job?.truncated
                ? 'The searchable index was saved, with large source content truncated to service limits.'
                : 'The searchable index was saved and is ready for repository-grounded Q&A.'}
          </p>
        </>
      ) : null}

      {(jobId || (state === 'completed' && !isWiki)) && (
        <div className="workspace-job__footer">
          {state === 'unavailable' ? (
            <Button type="button" size="sm" variant="secondary" onClick={onRetry}>
              <RefreshCw aria-hidden="true" size={15} />
              Retry status check
            </Button>
          ) : null}
          {isWiki && jobId && state !== 'unavailable' ? (
            <Button asChild size="sm">
              <Link to={`/wiki?jobId=${encodeURIComponent(jobId)}`}>
                View wiki
                <ArrowRight aria-hidden="true" size={15} />
              </Link>
            </Button>
          ) : null}
          {!isWiki && state === 'completed' && job?.saved !== false ? (
            <Button asChild size="sm" variant="secondary">
              <Link to={`/chat?repo=${encodeURIComponent(repo)}`}>
                Open Chat
                <MessageSquareText aria-hidden="true" size={15} />
              </Link>
            </Button>
          ) : null}
        </div>
      )}
    </section>
  )
}

export default function Home() {
  const pageRef = useRef(null)
  const [searchParams] = useSearchParams()
  // The landing-page hero hands off a validated owner/repo as ?repo=. It only prefills the field;
  // starting a job still takes an explicit click on Generate Wiki.
  const [repo, setRepo] = useState(() => (searchParams.get('repo') ?? '').trim().slice(0, 140))
  const [touched, setTouched] = useState(false)
  const [indexJobId, setIndexJobId] = useState('')
  const [wikiJobId, setWikiJobId] = useState('')
  const [indexRepo, setIndexRepo] = useState('')
  const [wikiRepo, setWikiRepo] = useState('')
  const [submitting, setSubmitting] = useState({ index: false, wiki: false })
  const [submitErrors, setSubmitErrors] = useState({ index: '', wiki: '' })

  const indexState = useJobPoll('index', indexJobId)
  const wikiState = useJobPoll('wiki', wikiJobId)

  useJobNotifications(indexState.job, indexJobId, {
    completed: 'Repository index is ready',
    failed: 'Repository indexing failed',
  })
  useJobNotifications(wikiState.job, wikiJobId, {
    completed: 'Wiki is ready',
    failed: 'Wiki generation failed',
  })

  useGSAP(() => {
    const media = gsap.matchMedia()

    media.add(motionQuery, () => {
      const timeline = gsap.timeline({ defaults: { ease: 'power2.out' } })
      timeline
        .from('.workspace-heading-word', { opacity: 0, yPercent: 95, duration: 0.58, stagger: 0.04, ease: 'power3.out' })
        .from('.workspace-intro > :not(h1)', { opacity: 0, y: 12, duration: motion.content, stagger: 0.045 }, '-=0.34')
        .from('.workspace-command-grid > *', { opacity: 0, y: 12, duration: motion.content, stagger: 0.06 }, '-=0.16')
        .from('.workspace-assurance > *', { opacity: 0, y: 6, duration: 0.24, stagger: 0.04 }, '-=0.14')
        .to('.workspace-proof__flow', { '--workflow-progress': '100%', duration: 0.58, ease: 'power1.inOut' }, '-=0.2')
    })

    return () => media.revert()
  }, { scope: pageRef })

  const repoMissing = touched && !repo.trim()
  const anySubmitting = submitting.index || submitting.wiki

  async function submit(action) {
    const normalizedRepo = repo.trim()
    setTouched(true)

    if (!normalizedRepo) return

    setSubmitting((current) => ({ ...current, [action]: true }))
    setSubmitErrors((current) => ({ ...current, [action]: '' }))

    try {
      const result = await postJson(`/api/${action}`, { repo: normalizedRepo })

      if (action === 'index') {
        setIndexRepo(normalizedRepo)
        setIndexJobId(result.jobId)
      } else {
        setWikiRepo(normalizedRepo)
        setWikiJobId(result.jobId)
      }
    } catch (requestError) {
      setSubmitErrors((current) => ({
        ...current,
        [action]: requestError.message || `Unable to start ${action}.`,
      }))
    } finally {
      setSubmitting((current) => ({ ...current, [action]: false }))
    }
  }

  return (
    <div ref={pageRef} className="workspace-page">
      <header className="workspace-intro">
        <span className="workspace-eyebrow">Repository workspace · Wiki generation</span>
        <h1 aria-label="What will we document today?">
          {['What', 'will', 'we', 'document', 'today?'].map((word) => <span className="workspace-heading-word" aria-hidden="true" key={word}>{word}</span>)}
        </h1>
        <p>
          Turn a public GitHub repository into a structured technical wiki, or index its source for repository-grounded Q&amp;A.
        </p>
      </header>

      <div className="workspace-command-grid">
        <section className="workspace-primary" aria-labelledby="wiki-workflow-title">
          <div className="workspace-section-heading">
            <span className="workspace-section-icon" aria-hidden="true">
              <BookOpenText size={22} />
            </span>
            <div>
              <h2 id="wiki-workflow-title">Generate a technical wiki</h2>
            </div>
          </div>

          <form
            className="workspace-form"
            onSubmit={(event) => {
              event.preventDefault()
              submit('wiki')
            }}
          >
            <Label htmlFor="repo">GitHub repository</Label>
            <div className={`workspace-input ${repoMissing ? 'workspace-input--invalid' : ''}`}>
              <GitFork aria-hidden="true" size={18} />
              <Input
                id="repo"
                name="repo"
                value={repo}
                onBlur={() => setTouched(true)}
                onChange={(event) => setRepo(event.target.value)}
                placeholder="owner/repository"
                aria-describedby="repo-help repo-error"
                aria-invalid={repoMissing}
                autoComplete="off"
                disabled={anySubmitting}
              />
            </div>
            <div className="workspace-field-message">
              {repoMissing ? (
                <InlineError>Enter a repository before starting a job.</InlineError>
              ) : (
                <p id="repo-help">Use owner/repository or paste a public GitHub URL. A trailing .git is accepted.</p>
              )}
              <span id="repo-error" className="sr-only">
                {repoMissing ? 'A GitHub repository is required.' : ''}
              </span>
            </div>

            {submitErrors.wiki ? <InlineError>{submitErrors.wiki}</InlineError> : null}

            <div className="workspace-primary-action">
              <Button
                type="submit"
                size="lg"
                disabled={submitting.wiki || wikiState.job?.status === 'pending'}
              >
                {submitting.wiki ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <BookOpenText aria-hidden="true" size={18} />}
                Generate Wiki
              </Button>
              <p>Creates chapters, technical explanations, and architecture diagrams.</p>
            </div>
            <div className="workspace-sample-link">
              <span><strong>Want to see the finished reader first?</strong> The sample is pre-generated and starts no backend job.</span>
              <Button asChild variant="secondary" size="sm"><Link to="/wiki/sample/spoon-knife" aria-label="Open the pre-generated Spoon-Knife Wiki">Explore a sample Wiki <ArrowRight aria-hidden="true" size={15} /></Link></Button>
            </div>
          </form>

          <WorkspaceJobCard
            kind="wiki"
            jobId={wikiJobId}
            repo={wikiRepo}
            job={wikiState.job}
            error={wikiState.error}
            submitting={submitting.wiki}
            onRetry={wikiState.retry}
          />
        </section>

        <aside className="workspace-side" aria-label="Generated Wiki preview">
          <section className="workspace-proof" aria-labelledby="workspace-proof-title">
            <div className="workspace-proof__topline"><span>Pre-generated sample</span><code>octocat/Spoon-Knife</code></div>
            <div className="workspace-section-heading workspace-section-heading--compact">
              <span className="workspace-section-icon" aria-hidden="true"><Files size={20} /></span>
              <div><h2 id="workspace-proof-title">What arrives on the other side</h2></div>
            </div>
            <div className="workspace-proof__document">
              <span>Generated wiki</span>
              <h3>{sampleWiki.repo}</h3>
              <ol>{sampleWiki.chapters.map((chapter, index) => <li key={chapter.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{chapter.title}</strong><code>{chapter.filePaths[0]}</code></li>)}</ol>
            </div>
            <ol className="workspace-proof__flow" aria-label="Conceptual repository to Wiki workflow">
              {workflowSteps.map(({ icon: StepIcon, title }, index) => <li key={title}><span aria-hidden="true"><StepIcon size={15} /></span><small>0{index + 1}</small><strong>{title}</strong></li>)}
            </ol>
            <p className="workspace-workflow__note">Conceptual workflow—not live job progress.</p>
          </section>
        </aside>

        <section className="workspace-index" aria-labelledby="index-workflow-title">
            <div className="workspace-section-heading workspace-section-heading--compact">
              <span className="workspace-section-icon workspace-section-icon--neutral" aria-hidden="true">
                <Database size={20} />
              </span>
              <div>
                <h2 id="index-workflow-title">Index for grounded Q&amp;A</h2>
              </div>
            </div>
            <p className="workspace-index__copy">
              Build a searchable source index for Chat. Indexing is independent from wiki generation and does not create chapters.
            </p>
            {submitErrors.index ? <InlineError>{submitErrors.index}</InlineError> : null}
            <Button
              type="button"
              variant="secondary"
              className="workspace-index__button"
              disabled={!repo.trim() || submitting.index || indexState.job?.status === 'pending'}
              onClick={() => submit('index')}
            >
              {submitting.index ? <LoaderCircle className="animate-spin" aria-hidden="true" size={18} /> : <Database aria-hidden="true" size={18} />}
              Index Repository
            </Button>
            <WorkspaceJobCard
              kind="index"
              jobId={indexJobId}
              repo={indexRepo}
              job={indexState.job}
              error={indexState.error}
              submitting={submitting.index}
              onRetry={indexState.retry}
            />
        </section>
      </div>

      <section className="workspace-assurance" aria-label="Workspace capabilities">
        <p><CheckCircle2 aria-hidden="true" size={17} /><span><strong>Independent jobs</strong>Wiki and index work can run at the same time.</span></p>
        <p><ListTree aria-hidden="true" size={17} /><span><strong>Structured output</strong>Chapters organize code into a readable system narrative.</span></p>
        <p><MessageSquareText aria-hidden="true" size={17} /><span><strong>Grounded answers</strong>Indexing prepares repository context for Chat.</span></p>
      </section>
    </div>
  )
}
