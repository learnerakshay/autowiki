import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BookOpenText, RefreshCw } from 'lucide-react'
import { postJson } from '../api.js'
import { WikiGenerationProgress } from '../components/WikiGenerationProgress.jsx'
import { Button, EmptyState, Page, Skeleton, SkeletonText, StatusPill, Surface, TextField } from '../components/ui/kit/index.js'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { checkRepoInput } from '../lib/repoInput.js'
import { useJobPoll } from '../useJobPoll.js'
import { WikiReader } from './WikiReader.jsx'
import './wiki-reader.css'

export { WikiReader } from './WikiReader.jsx'

function WikiEntry({ repo, setRepo, generate, submitting, submitError }) {
  const validation = repo.trim() ? checkRepoInput(repo) : null
  return <Page track="content" as="section" className="wiki-state-page" aria-labelledby="wiki-entry-title">
    <Link className="wiki-back-link" to="/workspace"><ArrowLeft size={16} aria-hidden="true" />Back to Workspace</Link>
    <header className="wiki-state-intro"><BookOpenText size={28} aria-hidden="true" /><div><h1 id="wiki-entry-title">Generate a repository wiki</h1><p>Create structured technical chapters and Mermaid diagrams from a public GitHub repository.</p></div></header>
    <Surface variant="raised" className="wiki-entry-form"><form onSubmit={generate} aria-busy={submitting}><TextField id="wiki-repo" label="Repository" value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repository" autoComplete="off" mono validate={(value) => value.trim() ? checkRepoInput(value).message ?? '' : ''} hint="Use owner/repository or a public GitHub URL. Wiki generation is separate from Chat indexing." /><Button type="submit" loading={submitting} disabled={validation?.status !== 'valid'} disabledReason={validation?.status !== 'valid' ? 'Enter a valid repository first' : undefined}>Generate Wiki</Button></form></Surface>
    {submitError ? <EmptyState icon={RefreshCw} title="Wiki generation could not start" description={submitError} /> : null}
  </Page>
}

function WikiPending({ jobId, repo, progress }) {
  return <Page track="content" as="section" className="wiki-state-page" aria-labelledby="wiki-pending-title">
    <Link className="wiki-back-link" to="/workspace"><ArrowLeft size={16} aria-hidden="true" />Back to Workspace</Link>
    <header className="wiki-state-intro"><StatusPill state="pending">generating...</StatusPill><div><h1 id="wiki-pending-title">Generating your technical wiki</h1><p>AutoWiki is analyzing the repository, organizing its architecture, and writing the generated document. The activity below comes from real worker boundaries rather than a simulated percentage.</p></div></header>
    <WikiGenerationProgress progress={progress} repo={repo} />
    <p>When generation finishes, this route becomes the chaptered Wiki reader with its source references and diagrams intact.</p>
    <details className="wiki-job-details"><summary>Job details</summary><code>{jobId}</code></details>
  </Page>
}

function WikiLoading() {
  const [showMark, setShowMark] = useState(false)
  useEffect(() => { const id = setTimeout(() => setShowMark(true), 150); return () => clearTimeout(id) }, [])
  return <Page track="wide" as="section" className="wiki-loading" aria-label="Loading Wiki">
    <div className="wiki-loading__status">{showMark ? <StatusPill state="pending">Loading Wiki</StatusPill> : null}</div>
    <div className="wiki-loading__grid" aria-hidden="true"><div><SkeletonText lines={4} /></div><Surface variant="raised"><Skeleton width="65%" height="2.5rem" /><SkeletonText lines={6} /><Skeleton height="14rem" /></Surface><div><SkeletonText lines={3} /></div></div>
  </Page>
}

function WikiFailure({ title, error, jobId, onRetry }) {
  return <Page track="content" as="section" className="wiki-state-page" aria-labelledby="wiki-failure-title">
    <Link className="wiki-back-link" to="/workspace"><ArrowLeft size={16} aria-hidden="true" />Back to Workspace</Link>
    <h1 id="wiki-failure-title">{title}</h1>
    <div role="alert"><EmptyState icon={RefreshCw} title="AutoWiki could not open this generated document" description={String(error || 'The job is unavailable.')} action={onRetry ? <Button type="button" variant="secondary" onClick={onRetry}>Retry status check</Button> : <Button as={Link} to="/workspace">Back to Workspace</Button>} /></div>
    {jobId ? <details className="wiki-job-details"><summary>Job details</summary><code>{jobId}</code><p>Job records are stored in memory and can disappear when the server restarts.</p></details> : null}
  </Page>
}

export default function Wiki() {
  const [repo, setRepo] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const jobId = searchParams.get('jobId') ?? ''
  const { job, error: pollError, retry: retryPoll } = useJobPoll('wiki', jobId)
  useJobNotifications(job, jobId, { completed: 'Repository wiki is ready', failed: 'Wiki generation failed' })

  async function generate(event) {
    event.preventDefault()
    const parsed = checkRepoInput(repo)
    if (parsed.status !== 'valid') return
    setSubmitError('')
    setSubmitting(true)
    try { const result = await postJson('/api/wiki', { repo: parsed.repo }); setSearchParams({ jobId: result.jobId }) }
    catch (error) { setSubmitError(error.message) }
    finally { setSubmitting(false) }
  }
  if (!jobId) return <WikiEntry repo={repo} setRepo={setRepo} generate={generate} submitting={submitting} submitError={submitError} />
  if (pollError) return <WikiFailure title="Wiki job unavailable" error={pollError} jobId={jobId} onRetry={retryPoll} />
  if (!job) return <WikiLoading />
  if (job.status === 'pending') return <WikiPending jobId={jobId} repo={job.repo || repo} progress={job.progress} />
  if (job.status === 'failed') return <WikiFailure title="Wiki generation failed" error={job.error} jobId={jobId} />
  if (!job.chapters?.length) return <WikiFailure title="No chapters were generated" error="The completed job did not contain readable chapters." jobId={jobId} />
  return <WikiReader key={jobId} job={job} jobId={jobId} />
}
