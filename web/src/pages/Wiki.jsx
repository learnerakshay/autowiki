import { useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { useSearchParams } from 'react-router-dom'
import { BookOpenText, GitFork, LoaderCircle } from 'lucide-react'
import { postJson } from '../api.js'
import { EmptyState } from '../components/EmptyState.jsx'
import { ErrorNotice } from '../components/ErrorNotice.jsx'
import { JobStatus } from '../components/JobStatus.jsx'
import { PageHeading } from '../components/PageHeading.jsx'
import { WikiSkeleton } from '../components/JobSkeleton.jsx'
import { Button } from '../components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx'
import { useJobNotifications } from '../hooks/useJobNotifications.js'
import { useJobPoll } from '../useJobPoll.js'
import MermaidDiagram from './MermaidDiagram.jsx'

gsap.registerPlugin(useGSAP)

export default function Wiki() {
  const [repo, setRepo] = useState('octocat/Hello-World')
  const [searchParams, setSearchParams] = useSearchParams()
  const [selected, setSelected] = useState(0)
  const [rendered, setRendered] = useState(0)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const contentRef = useRef(null)
  const transitionRef = useRef(null)
  const jobId = searchParams.get('jobId') ?? ''
  const { job, error: pollError } = useJobPoll('wiki', jobId)

  useJobNotifications(job, jobId, { completed: 'Repository wiki is ready', failed: 'Wiki generation failed' })

  useEffect(() => {
    transitionRef.current?.kill()
    setSelected(0)
    setRendered(0)
  }, [jobId])
  useEffect(() => {
    if (job?.status === 'completed' && job.repo) setRepo(job.repo)
  }, [job?.repo, job?.status])

  useEffect(() => () => transitionRef.current?.kill(), [])

  useGSAP(() => {
    if (!contentRef.current || job?.status !== 'completed') return undefined
    transitionRef.current?.kill()
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    transitionRef.current = gsap.timeline().fromTo(
      contentRef.current,
      { autoAlpha: 0.35, x: reduced ? 0 : 10 },
      { autoAlpha: 1, x: 0, duration: reduced ? 0.12 : 0.18, ease: reduced ? 'none' : 'power4.out' },
    )
    return () => transitionRef.current?.kill()
  }, { scope: contentRef, dependencies: [rendered, job?.status] })

  async function generate(event) {
    event.preventDefault()
    setSubmitError('')
    setSubmitting(true)
    try {
      const result = await postJson('/api/wiki', { repo })
      setSearchParams({ jobId: result.jobId })
    } catch (error) {
      setSubmitError(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  function switchChapter(value) {
    const next = Number(value)
    transitionRef.current?.kill()
    setSelected(next)

    if (!contentRef.current || next === rendered) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      transitionRef.current = gsap.to(contentRef.current, { autoAlpha: 1, x: 0, duration: reduced ? 0.1 : 0.14, ease: 'power3.out' })
      return
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    transitionRef.current = gsap.timeline({ onComplete: () => setRendered(next) }).to(contentRef.current, {
      autoAlpha: 0,
      x: reduced ? 0 : -8,
      duration: reduced ? 0.1 : 0.12,
      ease: reduced ? 'none' : 'power2.in',
    })
  }

  const chapter = job?.chapters?.[rendered]
  const pending = job?.status === 'pending'

  return (
    <section className="page-stack">
      <PageHeading title="Repository wiki" description="Generate a structured guide, then move between chapters without losing the context of the repository." />
      <Card className="max-w-3xl">
        <form onSubmit={generate} aria-busy={submitting || pending}>
          <CardContent className="grid gap-4 pt-5 sm:grid-cols-[1fr_auto] sm:items-end sm:pt-6">
            <div className="space-y-2">
              <Label htmlFor="wiki-repo">Repository</Label>
              <Input id="wiki-repo" value={repo} onChange={(event) => setRepo(event.target.value)} autoComplete="off" />
            </div>
            <Button disabled={submitting || pending || !repo.trim()}>
              {submitting || pending ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <BookOpenText aria-hidden="true" />}
              {submitting ? 'Starting…' : pending ? 'Generating…' : 'Generate wiki'}
            </Button>
          </CardContent>
        </form>
      </Card>
      {jobId && <p className="job-reference">Wiki job <code>{jobId}</code></p>}
      {pending && <div className="space-y-3"><JobStatus status="pending"><span>generating...</span></JobStatus><WikiSkeleton /></div>}
      {(submitError || pollError) && <ErrorNotice title="Wiki could not be loaded" error={submitError || pollError} recovery="Check the connection and repository name, then generate the wiki again." />}
      {job?.status === 'failed' && <ErrorNotice title="Wiki generation failed" error={job.error} recovery="Confirm the repository can be read, then generate the wiki again." />}
      {job?.status === 'completed' && job.chapters?.length > 0 && (
        <Tabs value={String(selected)} onValueChange={switchChapter} className="wiki-grid">
          <aside className="chapter-panel">
            <div className="flex items-center justify-between gap-3 px-2 pb-2 pt-1">
              <h2 className="text-sm font-semibold">Chapters</h2>
              <span className="text-xs tabular-nums text-muted-foreground">{selected + 1} / {job.chapters.length}</span>
            </div>
            <TabsList aria-label="Wiki chapters" className="chapter-list">
              {job.chapters.map((item, index) => (
                <TabsTrigger id={`chapter-${index}`} value={String(index)} key={`${item.title}-${index}`} className="chapter-trigger" data-number={String(index + 1).padStart(2, '0')}>
                  <span>{item.title}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </aside>
          {chapter && (
            <article ref={contentRef} key={`${rendered}-${chapter.title}`} role="tabpanel" aria-labelledby={`chapter-${rendered}`} className="min-w-0">
              <Card className="overflow-hidden">
                <CardHeader className="border-b border-border bg-surface-subtle">
                  <CardTitle>{chapter.title}</CardTitle>
                  <p className="max-w-[70ch] text-sm leading-6 text-muted-foreground">{chapter.description}</p>
                </CardHeader>
                <CardContent className="space-y-8 pt-6 sm:pt-7">
                  <section aria-labelledby="chapter-notes-title">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h3 id="chapter-notes-title" className="text-sm font-semibold">Chapter notes</h3>
                      <span className="text-xs font-medium text-muted-foreground">Markdown</span>
                    </div>
                    <pre className="chapter">{chapter.markdown}</pre>
                  </section>
                  <section aria-labelledby="diagram-title">
                    <MermaidDiagram titleId="diagram-title" source={chapter.mermaid} valid={chapter.diagramValid} />
                  </section>
                </CardContent>
              </Card>
            </article>
          )}
        </Tabs>
      )}
      {job?.status === 'completed' && !job.chapters?.length && (
        <EmptyState icon={BookOpenText} title="No chapters were generated" description="Try generating the wiki again. If the repository is empty, choose one with source files and documentation." />
      )}
      {!jobId && !submitError && (
        <EmptyState icon={GitFork} title="No wiki loaded yet" description="Enter a public GitHub repository to generate its chapter list, technical notes, and diagrams." />
      )}
    </section>
  )
}
