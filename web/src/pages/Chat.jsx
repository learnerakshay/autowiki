import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clipboard, Database, FileCode2, RefreshCw, Search, MessageSquareText, Send } from 'lucide-react'
import { postJson } from '../api.js'
import { Button, Chip, Kbd, Page, PageHeader, SkeletonText, StatusPill, Surface, TextareaField, TextField } from '../components/ui/kit/index.js'
import { useSpringReveal } from '../components/ui/kit/hooks.js'
import { toast } from '../components/ui/kit/toastStore.js'
import { checkRepoInput } from '../lib/repoInput.js'
import { useJobPoll } from '../useJobPoll.js'
import { MarkdownDocument } from './MarkdownDocument.jsx'
import './wiki-reader.css'
import './chat.css'

const suggestions = [
  'What is the main purpose of this repository?',
  'How is the application structured?',
  'Where is the primary application logic implemented?',
  'How are errors handled in the codebase?',
]
// This is the explicit no-vectors response from service/rag.js, not an inference from empty sources.
const noIndexAnswer = 'No indexed content was found for this repo. Index it first, then try again.'
const caveat = 'Answers use retrieved indexed files. Review the returned paths before relying on implementation details.'

function IndexGuard({ repo }) {
  return <div className="qa-index"><div><Database aria-hidden="true" /><div><h2>Index before asking</h2><p>Repository indexing powers this Q&amp;A workflow. Wiki generation is a separate flow and remains available without creating a Chat request.</p></div></div><Button as={Link} variant="secondary" to={`/workspace?repo=${encodeURIComponent(repo || '')}`} iconTrailing={ArrowRight}>Open Workspace</Button></div>
}

export default function Chat() {
  const [params] = useSearchParams()
  const [repo, setRepo] = useState(() => params.get('repo')?.trim() || '')
  const prefill = params.get('repo')
  const [seenPrefill, setSeenPrefill] = useState(prefill)
  if (prefill !== seenPrefill) { setSeenPrefill(prefill); if (prefill !== null) setRepo(prefill.trim()) }
  const [question, setQuestion] = useState('')
  const [jobId, setJobId] = useState('')
  const [submission, setSubmission] = useState(null)
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [copied, setCopied] = useState(false)
  const questionRef = useRef(null)
  const askRef = useRef(null)
  const resultRef = useRef(null)
  const suggestionRef = useRef(null)
  const requestRef = useRef(0)
  const focusTransfer = useRef(false)
  const { job, error: pollError, errorStatus, retry: retryPoll } = useJobPoll('chat', jobId)
  const checked = checkRepoInput(repo)
  const currentError = submitError || pollError || (job?.status === 'failed' ? job.error : '')
  const pending = submitting || Boolean(jobId && job?.status === 'pending' && !pollError)
  const notIndexed = job?.status === 'completed' && job.answer === noIndexAnswer && !job.sources?.length
  const state = pending ? 'pending' : currentError ? 'error' : notIndexed ? 'not-indexed' : job?.status === 'completed' ? 'completed' : 'idle'
  const sources = [...new Set((Array.isArray(job?.sources) ? job.sources : []).filter((path) => typeof path === 'string' && path.trim()))]
  const matchesDraft = submission?.repo === checked.repo && submission?.question === question.trim()
  const reason = (submitting || pending && matchesDraft) ? 'Your question is being answered' : checked.status !== 'valid' && !question.trim() ? 'Enter a repository and a question' : checked.status !== 'valid' ? 'Enter a valid repository' : !question.trim() ? 'Enter a question' : ''
  const workspaceRepo = submission?.repo || checked.repo || repo
  useSpringReveal(resultRef, state + jobId)
  useSpringReveal(suggestionRef, 'suggestions', { stagger: true })
  useEffect(() => () => { requestRef.current += 1 }, [])
  useLayoutEffect(() => {
    if (focusTransfer.current) {
      const heading = resultRef.current?.querySelector('h2')
      if (heading) { heading.focus({ preventScroll: true }); focusTransfer.current = false }
    }
  }, [state])

  async function ask(inputs) {
    if (submitting) return
    const next = inputs || { repo: checked.repo, question: question.trim() }
    if (!next.repo || !next.question) return
    focusTransfer.current = resultRef.current?.contains(document.activeElement) || false
    if (!focusTransfer.current) askRef.current?.focus({ preventScroll: true })
    const number = ++requestRef.current
    setSubmission(next); setJobId(''); setSubmitError(''); setCopied(false); setSubmitting(true)
    try {
      const result = await postJson('/api/chat', next)
      if (requestRef.current === number) setJobId(result.jobId)
    } catch (error) { if (requestRef.current === number) setSubmitError(error.message) }
    finally { if (requestRef.current === number) setSubmitting(false) }
  }
  function askAnother() {
    requestRef.current += 1
    focusTransfer.current = false
    setQuestion(''); setJobId(''); setSubmission(null); setSubmitError(''); setCopied(false)
    requestAnimationFrame(() => questionRef.current?.focus())
  }
  async function copy(text, answer = false) {
    try { await navigator.clipboard.writeText(text); if (answer) setCopied(true); else toast.success('Source path copied', { description: text }) }
    catch { toast.error('Copy failed', { description: 'Clipboard access was unavailable. Select the text to copy it manually.' }) }
  }
  const announcement = state === 'pending' ? 'Working on your question' : state === 'completed' ? 'Answer is ready' : state === 'not-indexed' ? 'No indexed content was found. Index before asking.' : ''

  return <Page className="qa-page">
    <PageHeader title="Ask better questions about your code." lede="Explore an indexed GitHub repository with AI-generated answers grounded in retrieved source context." />
    <ol className="qa-flow" aria-label="Grounded answer workflow">
      <li><Database aria-hidden="true" size={18} /><strong>Index</strong><span>Store source chunks</span></li>
      <li><Search aria-hidden="true" size={18} /><strong>Retrieve</strong><span>Find relevant files</span></li>
      <li><MessageSquareText aria-hidden="true" size={18} /><strong>Answer</strong><span>Return source paths</span>{pending ? <StatusPill state="pending">Indeterminate request</StatusPill> : state === 'completed' ? <StatusPill state="succeeded">Answer settled</StatusPill> : null}</li>
    </ol>
    <Surface variant="raised" as="form" className="qa-composer" onSubmit={(event) => { event.preventDefault(); if (!reason) void ask() }}>
      <TextField id="chat-repo" label="Repository" mono value={repo} onChange={(event) => setRepo(event.target.value)} validate={(value) => checkRepoInput(value).status === 'invalid' ? checkRepoInput(value).message : checkRepoInput(value).status === 'incomplete' && !value.includes('/') ? 'Use owner/repository' : ''} placeholder="owner/repository or GitHub URL" autoComplete="off" hint="Entering a repository does not index it." />
      <TextareaField ref={questionRef} id="chat-question" label="Question" value={question} maxRows={8} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about architecture, control flow, implementation details, or error handling…" hint="Each submission is an independent request." onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); if (!reason) void ask() } }} />
      <div ref={suggestionRef} className="qa-suggestions" aria-label="Example prompts">{suggestions.map((item) => <Chip data-step key={item} onClick={() => { setQuestion(item); questionRef.current?.focus() }}>{item}</Chip>)}</div>
      <div className="qa-actions"><div><p id="ask-reason">{reason || 'Ready to ask about this repository'}</p><span><Kbd>⌘</Kbd> / <Kbd>Ctrl</Kbd> + <Kbd>Enter</Kbd> to ask</span></div><Button ref={askRef} type="submit" iconLeading={Send} disabled={Boolean(reason)} disabledReason={reason} aria-describedby="ask-reason" loading={submitting || pending && matchesDraft}>{submitting ? 'Sending…' : pending && matchesDraft ? 'Answering…' : 'Ask'}</Button></div>
    </Surface>
    {submission && (checked.repo !== submission.repo || question.trim() !== submission.question) && state !== 'idle' ? <p className="qa-draft">Composer edits do not alter the active request. Select Ask to replace it.</p> : null}
    <span className="ui-sr-only" role="status" aria-live="polite" aria-atomic="true">{announcement}</span>
    <div ref={resultRef} className="qa-result" data-state={state}>
      {state === 'idle' ? <IndexGuard repo={workspaceRepo} /> : <Surface variant="raised" as="article" className="qa-answer" aria-busy={pending} aria-labelledby="chat-answer-heading">
        <header className="qa-answer-header"><div><code>{submission?.repo}</code><h2 id="chat-answer-heading" tabIndex={-1}>{state === 'pending' ? 'Working on your question' : state === 'error' ? pollError ? errorStatus === 404 ? 'Job not found' : 'Status check failed' : job?.status === 'failed' ? 'Question failed' : 'Question could not be completed' : state === 'not-indexed' ? 'Repository is not indexed' : 'Answer'}</h2><p>{submission?.question}</p></div>{state === 'completed' ? <Button variant="secondary" iconLeading={Clipboard} onClick={() => void copy(job.answer, true)}>{copied ? 'Copied' : 'Copy Answer'}</Button> : null}</header>
        {state === 'pending' ? <><StatusPill state="pending">pending...</StatusPill><SkeletonText lines={5} /><p>This is an indeterminate background job. No retrieval stage is inferred before the backend reports a result.</p></> : null}
        {state === 'error' ? <div className="qa-error" role="alert"><p>{currentError}</p>{errorStatus === 404 ? <Button as={Link} to={`/workspace?repo=${encodeURIComponent(workspaceRepo)}`}>Start over</Button> : <Button variant="secondary" iconLeading={RefreshCw} onClick={pollError ? retryPoll : () => void ask(submission)}>{pollError ? 'Retry status check' : 'Retry'}</Button>}</div> : null}
        {state === 'not-indexed' ? <><p>{job.answer}</p><IndexGuard repo={workspaceRepo} /></> : null}
        {state === 'completed' ? <><div className="qa-caveat qa-caveat--heading"><p>{caveat}</p><p>Model-generated answers may contain errors.</p></div><MarkdownDocument markdown={job.answer} title="Answer" className="qa-markdown chat-answer-markdown" /><section className="qa-sources" aria-labelledby="chat-sources-heading"><h2 id="chat-sources-heading">Sources</h2><p>File paths returned by the retrieval service.</p>{sources.length ? <ul>{sources.map((path) => <li key={path}><Chip icon={FileCode2}>{path}</Chip><Button size="icon" variant="ghost" aria-label={`Copy ${path}`} iconLeading={Clipboard} onClick={() => void copy(path)} /></li>)}</ul> : <p>No source paths were returned for this answer. No citations have been inferred.</p>}</section><footer className="qa-answer-actions"><Button variant="secondary" onClick={askAnother}>Ask another question</Button><Button as={Link} variant="ghost" to={`/workspace?repo=${encodeURIComponent(workspaceRepo)}`} iconTrailing={ArrowRight}>Generate Wiki</Button><Button as={Link} variant="ghost" to={`/workspace?repo=${encodeURIComponent(workspaceRepo)}`}>Repository Workspace</Button></footer></> : null}
        {jobId ? <details><summary>Job reference</summary><code>{jobId}</code></details> : null}
      </Surface>}
    </div>
  </Page>
}
