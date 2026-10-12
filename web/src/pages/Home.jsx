import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpenText, Database, GitFork, LoaderCircle } from 'lucide-react'
import { postJson } from '../api.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorNotice } from '../components/ErrorNotice.jsx'
import { HomeSkeleton } from '../components/JobSkeleton.jsx'
import { JobStatus } from '../components/JobStatus.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { useJobPoll } from '../useJobPoll.js'

export default function Home() {
  const [repo, setRepo] = useState('octocat/Hello-World')
  const [message, setMessage] = useState('')
  const [indexJobId, setIndexJobId] = useState('')
  const [wikiJobId, setWikiJobId] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const { job: indexJob, error: indexPollError } = useJobPoll('index', indexJobId)
  const { job: wikiJob, error: wikiPollError } = useJobPoll('wiki', wikiJobId)

  useJobNotifications(indexJob, indexJobId, { completed: 'Repository index is ready', failed: 'Repository indexing failed' })
  useJobNotifications(wikiJob, wikiJobId, { completed: 'Repository wiki is ready', failed: 'Wiki generation failed' })

  async function submit(action) {
    setBusyAction(action)
    setMessage('')
    setIndexJobId('')
    setWikiJobId('')
    try {
      const result = await postJson(`/api/${action}`, { repo })
      if (action === 'wiki') {
        setWikiJobId(result.jobId)
      } else {
        setIndexJobId(result.jobId)
      }
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusyAction('')
    }
  }

  const indexing = indexJob?.status === 'pending'
  const generating = wikiJob?.status === 'pending'

  return (
    <section className="page-stack">
      <PageHeading title="Turn a repository into a technical wiki" description="Generate a structured, browsable guide from a GitHub repository. Indexing remains available separately to support repository-grounded Q&A." />

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Repository source</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">Enter a public repository in GitHub owner/repository format.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="home-repo">GitHub repository</Label>
            <Input id="home-repo" value={repo} onChange={(event) => setRepo(event.target.value)} placeholder="owner/repo" autoComplete="off" />
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button disabled={Boolean(busyAction) || generating || !repo.trim()} onClick={() => submit('wiki')}>
              {busyAction === 'wiki' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BookOpenText aria-hidden="true" />}
              {busyAction === 'wiki' ? 'Starting wiki…' : 'Generate Wiki'}
            </Button>
            <Button variant="secondary" disabled={Boolean(busyAction) || indexing || !repo.trim()} onClick={() => submit('index')}>
              {busyAction === 'index' ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Database aria-hidden="true" />}
              {busyAction === 'index' ? 'Starting index…' : 'Index Repository'}
            </Button>
          </div>
          <p className="max-w-[68ch] border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
            Generate Wiki creates chapters, explanations, and technical diagrams. Index Repository prepares source context for grounded questions in Chat.
          </p>
        </CardContent>
      </Card>

      {message && <JobStatus status="neutral">{message}</JobStatus>}
      {indexJobId && <p className="job-reference">Index job <code>{indexJobId}</code></p>}
      {indexing && <div className="space-y-3"><JobStatus status="pending"><span>indexing...</span></JobStatus><HomeSkeleton /></div>}
      {indexPollError && <ErrorNotice title="Index status unavailable" error={indexPollError} recovery="Check the connection, then try indexing the repository again." />}
      {indexJob?.status === 'failed' && <ErrorNotice title="Indexing failed" error={indexJob.error} recovery="Confirm the repository is public and correctly named, then try indexing it again." />}
      {indexJob?.status === 'completed' && (
        <Card className="max-w-3xl">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <CardTitle>Repository indexed</CardTitle>
            <JobStatus status="completed">completed</JobStatus>
          </CardHeader>
          <CardContent>
            <dl className="result-grid">
              <div><dt>Files</dt><dd>{indexJob.fileCount}</dd></div>
              <div><dt>Chunks</dt><dd>{indexJob.chunkCount}</dd></div>
              <div><dt>Saved</dt><dd>{String(indexJob.saved)}</dd></div>
              <div><dt>Truncated</dt><dd>{String(indexJob.truncated)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      )}
      {wikiJobId && (
        <Card className="max-w-3xl bg-surface-subtle p-4 shadow-none">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <JobStatus status={wikiJob?.status ?? 'pending'}>{wikiJob?.status === 'completed' ? 'completed' : wikiJob?.status === 'failed' ? 'failed' : 'generating...'}</JobStatus>
                <span className="job-reference">Wiki job <code>{wikiJobId}</code></span>
              </div>
            </div>
            <Button asChild variant="secondary" className="shrink-0">
              <Link to={`/wiki?jobId=${encodeURIComponent(wikiJobId)}`}>View wiki <ArrowRight aria-hidden="true" /></Link>
            </Button>
          </div>
        </Card>
      )}
      {wikiPollError && <ErrorNotice title="Wiki status unavailable" error={wikiPollError} recovery="Open the wiki job to retry checking its status." />}
      {wikiJob?.status === 'failed' && <ErrorNotice title="Wiki generation failed" error={wikiJob.error} recovery="Confirm the repository can be read, then generate the wiki again." />}
      {!indexJobId && !wikiJobId && !message && (
        <EmptyState icon={GitFork} title="Start with one repository" description="Generate its chaptered technical wiki, or index it when you want to ask source-grounded questions in Chat." />
      )}
    </section>
  )
}
