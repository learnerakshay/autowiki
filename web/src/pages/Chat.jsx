import { useState } from 'react'
import { FileCode2, LoaderCircle, MessageSquareText, Send } from 'lucide-react'
import { postJson } from '../api.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorNotice } from '../components/ErrorNotice.jsx'
import { ChatSkeleton } from '../components/JobSkeleton.jsx'
import { JobStatus } from '../components/JobStatus.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { Badge } from '../components/ui/badge.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { useJobPoll } from '../useJobPoll.js'

export default function Chat() {
  const [repo, setRepo] = useState('octocat/Hello-World')
  const [question, setQuestion] = useState('What does this repo do?')
  const [jobId, setJobId] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { job, error: pollError } = useJobPoll('chat', jobId)

  useJobNotifications(job, jobId, { completed: 'Answer is ready', failed: 'Repository question failed' })

  async function submit(event) {
    event.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await postJson('/api/chat', { repo, question })
      setJobId(result.jobId)
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const pending = job?.status === 'pending'

  return (
    <section className="page-stack">
      <PageHeading title="Ask the repository" description="Send a focused question and get an answer grounded in the indexed source files." />
      <Card className="max-w-3xl">
        <form onSubmit={submit} aria-busy={submitting || pending}>
          <CardHeader>
            <CardTitle>New question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-repo">Repository</Label>
              <Input id="chat-repo" value={repo} onChange={(event) => setRepo(event.target.value)} autoComplete="off" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chat-question">Question</Label>
              <textarea id="chat-question" className="textarea" value={question} onChange={(event) => setQuestion(event.target.value)} />
            </div>
            <Button disabled={submitting || pending || !repo.trim() || !question.trim()}>
              {submitting || pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {submitting ? 'Sending…' : pending ? 'Answering…' : 'Ask'}
            </Button>
          </CardContent>
        </form>
      </Card>
      {jobId && <p className="job-reference">Chat job <code>{jobId}</code></p>}
      {pending && <div className="space-y-3"><JobStatus status="pending"><span>pending...</span></JobStatus><ChatSkeleton /></div>}
      {(submitError || pollError) && <ErrorNotice title="Question could not be completed" error={submitError || pollError} recovery="Confirm the repository has been indexed, then try the question again." />}
      {job?.status === 'failed' && <ErrorNotice title="Question failed" error={job.error} recovery="Review the repository name and question, then submit it again." />}
      {job?.status === 'completed' && (
        <Card className="max-w-5xl">
          <article>
            <CardHeader className="flex-row items-center justify-between gap-4 border-b border-border">
              <CardTitle>Answer</CardTitle>
              <JobStatus status="completed">completed</JobStatus>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="preserve max-w-[72ch] text-[0.9375rem] leading-7 text-foreground">{job.answer}</p>
              <div className="mt-8 border-t border-border pt-6">
                <h2 className="text-lg font-semibold tracking-[-0.02em]">Sources</h2>
                {job.sources.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">{job.sources.map((path) => <li key={path}><Badge variant="neutral" className="font-mono font-medium"><FileCode2 aria-hidden="true" className="size-3.5" />{path}</Badge></li>)}</ul>
                ) : <p className="mt-2 text-sm text-muted-foreground">No sources returned.</p>}
              </div>
            </CardContent>
          </article>
        </Card>
      )}
      {!jobId && !submitError && (
        <EmptyState icon={MessageSquareText} title="Ask from the code, not from memory" description="Choose an indexed repository and ask about its purpose, structure, or implementation. Source paths appear with every completed answer." />
      )}
    </section>
  )
}
