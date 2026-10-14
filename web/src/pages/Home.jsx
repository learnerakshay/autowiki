import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { AlertCircle, ArrowRight, BookOpenText, Check, CheckCircle2, Database, GitBranch, ListTree, MessageSquareText, RefreshCw } from 'lucide-react'
import { postJson } from '../api.js'
import { GithubMark } from '../components/hero/GithubMark.jsx'
import { WikiGenerationProgress } from '../components/WikiGenerationProgress.jsx'
import { Button, Page, PageHeader, StatusPill, Surface, TextField } from '../components/ui/kit/index.js'
import { heroSample } from '../data/heroSample.js'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { toast } from '../components/ui/kit/toastStore.js'
import { checkRepoInput } from '../lib/repoInput.js'
import { useJobPoll } from '../useJobPoll.js'
import './workspace.css'

const workflow = [
  { icon: GitBranch, title: 'Repository' },
  { icon: ListTree, title: 'Wiki outline' },
  { icon: BookOpenText, title: 'Documentation' },
]
const benefits = [
  { icon: CheckCircle2, title: 'Independent jobs', detail: 'Wiki and index work can run at the same time.' },
  { icon: ListTree, title: 'Structured output', detail: 'Chapters organize code into a readable system narrative.' },
  { icon: MessageSquareText, title: 'Grounded answers', detail: 'Indexing prepares repository context for Chat.' },
]

function requestError(error) {
  if (error.status === 429) return 'The service is rate-limited. Try again later.'
  if (error.status === 404) return 'The requested job was not found. Start a new job from this workspace.'
  if (!error.status && /failed to fetch|network/i.test(error.message)) return 'The service could not be reached. Check your connection and try again.'
  return error.message || 'The request could not be completed.'
}
function jobState(id, job, submitting, error) {
  if (submitting) return 'submitting'
  if (error) return 'failed'
  if (!id) return 'idle'
  return job?.status === 'completed' ? 'succeeded' : job?.status === 'failed' ? 'failed' : 'pending'
}
function Pill({ state }) {
  return <StatusPill state={state === 'submitting' ? 'pending' : state}>{state === 'submitting' ? 'Starting' : undefined}</StatusPill>
}

function SamplePanel() {
  return <Surface variant="dark" as="section" className="workspace-preview" aria-labelledby="sample-title" data-job-state="idle">
    <div className="workspace-preview__top"><span>Pre-generated sample</span><code>{heroSample.repo}</code></div>
    <h2 id="sample-title">What arrives on the other side</h2>
    <div className="workspace-preview__window">
      <div className="workspace-preview__window-bar"><span>Generated wiki</span><span>{heroSample.chapters.length} chapters</span></div>
      <h3>{heroSample.repo}</h3>
      <ol className="workspace-preview__chapters">{heroSample.chapters.map((chapter, index) => <li key={chapter.title}><span>{String(index + 1).padStart(2, '0')}</span><strong>{chapter.title}</strong><code>{chapter.filePaths[0]}</code></li>)}</ol>
    </div>
    <ol className="workspace-preview__flow" aria-label="Conceptual repository to Wiki workflow">{workflow.map(({ icon: Icon, title }) => <li key={title}><Icon aria-hidden="true" size={16} /><span>{title}</span></li>)}</ol>
    <p className="workspace-preview__note">Conceptual workflow—not live job progress.</p>
  </Surface>
}

function LivePanel({ state, job, jobId, repo, error, retry, retryPoll, reset, edit }) {
  const chapters = Array.isArray(job?.chapters) ? job.chapters : []
  return <Surface variant="dark" as="section" className="workspace-preview workspace-preview--live" aria-labelledby="live-job-title" data-job-state={state}>
    <div className="workspace-preview__top"><span>{jobId ? 'Live job' : 'Wiki request'}</span><Pill state={state} /></div>
    <h2 id="live-job-title">{state === 'succeeded' ? 'Wiki is ready' : state === 'failed' ? jobId ? 'Wiki generation failed' : 'Wiki generation could not start' : 'Generating your technical wiki'}</h2>
    {repo ? <code className="workspace-preview__repo">{repo}</code> : null}
    {state === 'pending' ? <WikiGenerationProgress progress={job?.progress} repo={repo} compact /> : null}
    {state === 'submitting' ? <p role="status">Starting the job</p> : null}
    {state === 'succeeded' ? <>
      <p>{chapters.length} {chapters.length === 1 ? 'generated chapter' : 'generated chapters'}</p>
      <ol className="workspace-preview__chapters workspace-preview__chapters--result">{chapters.map((chapter, index) => <li key={`${chapter.title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><strong>{chapter.title}</strong></li>)}</ol>
      <div className="workspace-preview__actions"><Button as={Link} to={`/wiki?jobId=${encodeURIComponent(jobId)}`} state={{ justGenerated: true }} iconTrailing={ArrowRight}>Open wiki</Button><Button variant="secondary" onClick={reset}>Generate another</Button></div>
    </> : null}
    {state === 'failed' ? <>
      <p className="workspace-preview__error" role="alert"><AlertCircle aria-hidden="true" size={17} />{error || job?.error || 'The backend could not complete this request.'}</p>
      <p className="workspace-preview__help">Repository fetching reads up to 200 eligible files and skips files larger than 200 KB.</p>
      <div className="workspace-preview__actions"><Button onClick={error && jobId ? retryPoll : retry} iconLeading={RefreshCw}>{error && jobId ? 'Retry status check' : 'Try again'}</Button><Button variant="secondary" onClick={edit}>Edit repository</Button></div>
    </> : null}
    <span className="ui-sr-only" aria-live="polite" aria-atomic="true">{state === 'pending' ? job?.progress?.stage?.replaceAll('_', ' ') || 'Wiki generation pending' : state === 'succeeded' ? 'Wiki generation completed' : state === 'failed' ? 'Wiki generation failed' : ''}</span>
  </Surface>
}

export default function Home() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [repo, setRepo] = useState(() => (searchParams.get('repo') ?? '').trim().slice(0, 140))
  const [fieldError, setFieldError] = useState('')
  const [wikiJobId, setWikiJobId] = useState('')
  const [indexJobId, setIndexJobId] = useState('')
  const [wikiRepo, setWikiRepo] = useState('')
  const [indexRepo, setIndexRepo] = useState('')
  const [submitting, setSubmitting] = useState({ wiki: false, index: false })
  const [submitErrors, setSubmitErrors] = useState({ wiki: '', index: '' })
  const repoRef = useRef(null)
  useEffect(() => {
    if (location.state?.focus === '#repo') requestAnimationFrame(() => repoRef.current?.focus({ preventScroll: true }))
  }, [location.state])
  const wiki = useJobPoll('wiki', wikiJobId)
  const index = useJobPoll('index', indexJobId)
  const validation = checkRepoInput(repo)
  const wikiState = jobState(wikiJobId, wiki.job, submitting.wiki, submitErrors.wiki || wiki.error)
  const indexState = jobState(indexJobId, index.job, submitting.index, submitErrors.index || index.error)
  const busy = submitting.wiki || submitting.index || wikiState === 'pending' || indexState === 'pending'

  useJobNotifications(wiki.job, wikiJobId, { completed: 'Wiki is ready', failed: 'Wiki generation failed' })
  useJobNotifications(index.job, indexJobId, { completed: 'Repository index is ready', failed: 'Repository indexing failed' })

  async function submit(kind, input = repo) {
    const checked = checkRepoInput(input)
    if (checked.status !== 'valid') { setFieldError(checked.message || 'Enter a repository before starting a job.'); repoRef.current?.focus(); return }
    setFieldError('')
    setSubmitting((value) => ({ ...value, [kind]: true }))
    setSubmitErrors((value) => ({ ...value, [kind]: '' }))
    try {
      const result = await postJson(`/api/${kind}`, { repo: checked.repo })
      if (kind === 'wiki') { setWikiRepo(checked.repo); setWikiJobId(result.jobId) }
      else { setIndexRepo(checked.repo); setIndexJobId(result.jobId) }
    } catch (error) {
      const message = requestError(error)
      setSubmitErrors((value) => ({ ...value, [kind]: message }))
      toast.error(kind === 'wiki' ? 'Wiki generation could not start' : 'Repository indexing could not start', { description: message })
    }
    finally { setSubmitting((value) => ({ ...value, [kind]: false })) }
  }

  const indexDisabled = validation.status !== 'valid' || indexState === 'pending' || submitting.index
  const indexReason = validation.status !== 'valid' ? 'Enter a valid repository first' : indexState === 'pending' || submitting.index ? 'Repository indexing is already running' : undefined

  return <Page className="workspace-page">
    <PageHeader eyebrow="Repository workspace · Wiki generation" title="What will we document today?" lede="Turn a public GitHub repository into a structured technical wiki, or index its source for repository-grounded Q&A." />
    <div className="workspace-layout">
      <div className="workspace-layout__commands">
        <Surface variant="raised" as="section" className="workspace-command" aria-labelledby="wiki-workflow-title" data-job-state={wikiState}>
          <div className="workspace-command__heading"><BookOpenText aria-hidden="true" /><h2 id="wiki-workflow-title">Generate a technical wiki</h2></div>
          <form onSubmit={(event) => { event.preventDefault(); void submit('wiki') }}>
            <TextField id="repo" ref={repoRef} label="GitHub repository" hint="Use owner/repository or paste a public GitHub URL. A trailing .git is accepted." value={repo} onChange={(event) => { setRepo(event.target.value); setFieldError('') }} validate={(value) => { const checked = checkRepoInput(value); return checked.status === 'invalid' ? checked.message : '' }} error={fieldError} placeholder="owner/repository" autoComplete="off" readOnly={busy} mono prefix={<span className="workspace-repo-mark" data-valid={validation.status === 'valid'}><GithubMark /><Check /></span>} />
            <div className="workspace-command__action"><Button type="submit" size="lg" iconLeading={BookOpenText} loading={submitting.wiki} disabled={wikiState === 'pending'} disabledReason={wikiState === 'pending' ? 'Wiki generation is already running' : undefined}>Generate Wiki</Button><p>Creates chapters, technical explanations, and architecture diagrams.</p></div>
            <div className="workspace-command__sample"><p><strong>Want to see the finished reader first?</strong> The sample is pre-generated and starts no backend job.</p><Button as={Link} to="/wiki/sample/spoon-knife" variant="secondary" size="sm" iconTrailing={ArrowRight}>Explore a sample Wiki</Button></div>
          </form>
        </Surface>
        <Surface as="section" className="workspace-index" aria-labelledby="index-workflow-title" data-job-state={indexState}>
          <div className="workspace-index__heading"><div><Database aria-hidden="true" /><h2 id="index-workflow-title">Index for grounded Q&amp;A</h2></div><Pill state={indexState} /></div>
          <p>Build a searchable source index for Chat. Indexing is independent from wiki generation and does not create chapters.</p>
          <Button iconLeading={Database} disabled={indexDisabled} disabledReason={indexReason} loading={submitting.index} onClick={() => void submit('index')}>Index Repository</Button>
          {indexReason ? <p className="workspace-index__reason">{indexReason}</p> : null}
          {indexState === 'pending' ? <p role="status">Repository indexing is in progress.</p> : null}
          {indexState === 'failed' ? <><p role="alert" className="workspace-index__error">{submitErrors.index || index.error || index.job?.error}</p><Button variant="secondary" iconLeading={RefreshCw} onClick={index.error && indexJobId ? index.retry : () => void submit('index', indexRepo || repo)}>{index.error && indexJobId ? 'Retry status check' : 'Try again'}</Button></> : null}
          {indexState === 'succeeded' ? <div className="workspace-index__result"><p><strong>{index.job?.fileCount}</strong> source files read · <strong>{index.job?.chunkCount}</strong> searchable chunks</p><p>{index.job?.saved === false ? 'The index was processed but was not saved for repository-grounded Q&A.' : index.job?.truncated ? 'The searchable index was saved, with large source content truncated to service limits.' : 'The searchable index was saved and is ready for repository-grounded Q&A.'}</p>{index.job?.saved !== false ? <Button as={Link} to={`/chat?repo=${encodeURIComponent(indexRepo)}`} variant="secondary" iconTrailing={ArrowRight}>Open Chat</Button> : null}</div> : null}
        </Surface>
      </div>
      <aside className="workspace-layout__side" aria-label="Wiki preview or live job">{wikiState === 'idle' ? <SamplePanel /> : <LivePanel state={wikiState} job={wiki.job} jobId={wikiJobId} repo={wikiRepo || validation.repo || repo} error={submitErrors.wiki || wiki.error} retry={() => void submit('wiki', wikiRepo || repo)} retryPoll={wiki.retry} reset={() => { setWikiJobId(''); setWikiRepo('') }} edit={() => repoRef.current?.focus()} />}</aside>
    </div>
    <section className="workspace-benefits" aria-label="Workspace capabilities">{benefits.map(({ icon: Icon, title, detail }) => <Surface key={title} padding="sm"><Icon aria-hidden="true" size={18} /><p><strong>{title}</strong><span>{detail}</span></p></Surface>)}</section>
  </Page>
}
