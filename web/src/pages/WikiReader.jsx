import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpenText, Check, ChevronLeft, ChevronRight, Clipboard, Clock3, ExternalLink, FileCode2, GitFork, MessageSquareText } from 'lucide-react'
import { Badge, Button, Chip, Disclosure, Kbd, Page, Sheet, StatusPill } from '../components/ui/kit/index.js'
import { prefersReducedMotion, springCss, springDuration } from '../lib/motion.js'
import { MarkdownDocument } from './MarkdownDocument.jsx'
import MermaidDiagram from './MermaidDiagram.jsx'
import { prefetchDiagramSource } from './mermaidRuntime.js'
import './wiki-reader.css'

function generatedAt(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return 'Generation time unavailable'
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function sourceUrl(repo, path) {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repo) || !path || path.includes('..')) return ''
  return `https://github.com/${repo.split('/').map(encodeURIComponent).join('/')}/blob/HEAD/${path.split('/').map(encodeURIComponent).join('/')}`
}

function readVisited(repo) {
  try { const value = JSON.parse(sessionStorage.getItem(`wiki-visited:${repo}`) || '[]'); return Array.isArray(value) ? value : [] } catch { return [] }
}

function initialChapter(total) {
  const match = location.hash.match(/^#chapter-(\d+)$/)
  return match ? Math.max(0, Math.min(total - 1, Number(match[1]) - 1)) : 0
}

function SourceFile({ repo, path }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const href = sourceUrl(repo, path)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path)
      setCopied(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setCopied(false), 2000)
    } catch { setCopied(false) }
  }
  return <li><Chip icon={FileCode2}>{path}</Chip>{href ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${path} on GitHub`}><ExternalLink size={16} aria-hidden="true" /></a> : null}<button type="button" aria-label={copied ? `Copied ${path}` : `Copy ${path}`} onClick={copy}>{copied ? <Check size={16} aria-hidden="true" /> : <Clipboard size={16} aria-hidden="true" />}</button></li>
}

export function WikiReader({ job, jobId, sample = false, provenance }) {
  const { state } = useLocation()
  const chapters = job.chapters
  const [selected, setSelected] = useState(() => initialChapter(chapters.length))
  const [visited, setVisited] = useState(() => [...new Set([...readVisited(job.repo), initialChapter(chapters.length)])])
  const [headings, setHeadings] = useState([])
  const [activeHeading, setActiveHeading] = useState('')
  const [progress, setProgress] = useState(0)
  const [chaptersOpen, setChaptersOpen] = useState(false)
  const [copyStatus, setCopyStatus] = useState('idle')
  const articleRef = useRef(null)
  const readerRef = useRef(null)
  const chapterButtons = useRef([])
  const copyTimer = useRef(0)
  const transition = useRef(null)
  const lastIndex = useRef(selected)
  const [justGenerated] = useState(() => {
    if (sample || !state?.justGenerated) return false
    try { return sessionStorage.getItem(`wiki-arrived:${jobId}`) !== 'true' } catch { return true }
  })
  const chapter = chapters[selected]

  useEffect(() => {
    window.history.replaceState(window.history.state, '', `#chapter-${selected + 1}`)
    const article = articleRef.current
    if (!article) return
    transition.current?.cancel()
    const direction = Math.sign(selected - lastIndex.current)
    lastIndex.current = selected
    if (direction) {
      window.scrollTo({ top: article.getBoundingClientRect().top + window.scrollY - 105, behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
      transition.current = article.animate(
        [{ opacity: 0.65, transform: `translateY(${direction * 16}px)` }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: prefersReducedMotion() ? 180 : springDuration.default * 1000, easing: prefersReducedMotion() ? 'ease-out' : springCss.default },
      )
    }
    return () => transition.current?.cancel()
  }, [selected, job.repo])

  useEffect(() => { try { sessionStorage.setItem(`wiki-visited:${job.repo}`, JSON.stringify(visited)) } catch { /* session storage can be unavailable */ } }, [visited, job.repo])

  useEffect(() => {
    const next = chapters[selected + 1]?.mermaid
    if (!next) return undefined
    const run = () => prefetchDiagramSource(next)
    if (window.requestIdleCallback) {
      const id = window.requestIdleCallback(run, { timeout: 3000 })
      return () => window.cancelIdleCallback(id)
    }
    const id = window.setTimeout(run, 500)
    return () => window.clearTimeout(id)
  }, [chapters, selected])

  useEffect(() => {
    if (!justGenerated) return undefined
    try { sessionStorage.setItem(`wiki-arrived:${jobId}`, 'true') } catch { /* session storage can be unavailable */ }
    const elements = [...(readerRef.current?.querySelectorAll('.wiki-reader-grid > .wiki-chapter-nav .wiki-chapter-button, .wiki-article__header') ?? [])]
    const animations = elements.map((element, index) => element.animate(
      [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: prefersReducedMotion() ? 180 : springDuration.default * 1000, delay: prefersReducedMotion() ? 0 : index * 55, easing: prefersReducedMotion() ? 'ease-out' : springCss.default },
    ))
    return () => animations.forEach((animation) => animation.cancel())
  }, [justGenerated, jobId])

  useLayoutEffect(() => {
    const items = [...(articleRef.current?.querySelectorAll('.wiki-markdown [data-toc]') ?? [])].map((element) => ({ id: element.id, title: element.textContent, level: element.tagName === 'H3' ? 2 : 3 }))
    setHeadings(items)
    setActiveHeading(items[0]?.id ?? '')
  }, [selected, chapter.markdown])

  useEffect(() => {
    const article = articleRef.current
    if (!article) return undefined
    let frame = 0
    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const top = article.getBoundingClientRect().top + window.scrollY
        const length = Math.max(1, article.offsetHeight - window.innerHeight + 110)
        setProgress(Math.max(0, Math.min(1, (window.scrollY - top + 110) / length)))
        const found = [...article.querySelectorAll('.wiki-markdown [data-toc]')].filter((item) => item.getBoundingClientRect().top < 180).at(-1)
        if (found) setActiveHeading(found.id)
      })
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    const observer = new ResizeObserver(update)
    observer.observe(article)
    return () => { window.removeEventListener('scroll', update); observer.disconnect(); cancelAnimationFrame(frame) }
  }, [selected])

  useEffect(() => () => { clearTimeout(copyTimer.current); transition.current?.cancel() }, [])

  function selectChapter(index) {
    if (index < 0 || index >= chapters.length || index === selected) return
    setCopyStatus('idle')
    setSelected(index)
    setVisited((old) => [...new Set([...old, index])])
    setChaptersOpen(false)
  }
  function chapterKey(event, index) {
    const next = { ArrowDown: (index + 1) % chapters.length, ArrowRight: (index + 1) % chapters.length, ArrowUp: (index - 1 + chapters.length) % chapters.length, ArrowLeft: (index - 1 + chapters.length) % chapters.length, Home: 0, End: chapters.length - 1 }[event.key]
    if (next === undefined) return
    event.preventDefault()
    selectChapter(next)
    chapterButtons.current[next]?.focus()
  }
  async function copyMarkdown() {
    clearTimeout(copyTimer.current)
    try { await navigator.clipboard.writeText(chapter.markdown); setCopyStatus('copied') }
    catch { setCopyStatus('failed') }
    copyTimer.current = setTimeout(() => setCopyStatus('idle'), 2400)
  }
  const toc = headings.length ? <nav aria-label="In this chapter"><ol>{headings.map((item) => <li key={item.id} data-level={item.level}><button type="button" aria-current={activeHeading === item.id ? 'location' : undefined} onClick={() => document.getElementById(item.id)?.scrollIntoView({ behavior: prefersReducedMotion() ? 'instant' : 'smooth', block: 'start' })}>{item.title}</button></li>)}</ol></nav> : <p>No section headings in this chapter.</p>
  const files = chapter.filePaths?.length ? <ul className="wiki-context-files">{chapter.filePaths.map((path) => <SourceFile key={path} repo={job.repo} path={path} />)}</ul> : null
  const context = <>
    <section className="wiki-context-section"><span className="wiki-kicker">Reading now</span><strong>{chapter.title}</strong>{chapter.description ? <p>{chapter.description}</p> : null}</section>
    {files ? <section className="wiki-context-section"><h2>Source context</h2>{files}</section> : null}
    <section className="wiki-context-section"><h2>On this page</h2>{toc}</section>
    {chapter.mermaid ? <button type="button" className="wiki-context-diagram" onClick={() => document.querySelector('.diagram-header button')?.click()}><GitFork size={17} aria-hidden="true" /><span><strong>Generated diagram</strong><small>Expand this chapter’s diagram</small></span><ArrowRight size={16} aria-hidden="true" /></button> : null}
  </>
  const chapterList = <><div className="wiki-chapter-nav__header"><h2>Chapters</h2><span>{selected + 1} / {chapters.length}</span></div><nav aria-label="Wiki chapters"><ol>{chapters.map((item, index) => <li key={index}><button ref={(node) => { chapterButtons.current[index] = node }} type="button" className="wiki-chapter-button" aria-current={index === selected ? 'page' : undefined} tabIndex={index === selected ? 0 : -1} onClick={() => selectChapter(index)} onKeyDown={(event) => chapterKey(event, index)}><span className="wiki-chapter-number">{String(index + 1).padStart(2, '0')}</span><span>{item.title}</span>{visited.includes(index) && index !== selected ? <Check size={14} aria-label="Visited" /> : null}</button></li>)}</ol></nav><p>Use <Kbd>↑</Kbd> <Kbd>↓</Kbd> to move between chapters.</p></>

  return (
    <Page ref={readerRef} track="wide" as="section" className="wiki-reader" aria-label={`Generated wiki for ${job.repo}`}>
      <div className="wiki-reading-progress" aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></div>
      <header className="wiki-document-header">
        <div className="wiki-document-header__topline"><Link className="wiki-back-link" to="/workspace"><ArrowLeft size={16} aria-hidden="true" />Workspace</Link><StatusPill state="succeeded">{sample ? 'Pre-generated sample' : 'Generated'}</StatusPill></div>
        <div className="wiki-document-header__body"><div><span className="wiki-kicker">Technical wiki</span><h1>{job.repo}</h1><p>{sample ? 'A previously generated Wiki from a public repository. Opening it does not start a new AI generation job.' : 'Structured repository documentation generated from source context.'}</p></div><div className="wiki-document-actions">{!sample ? <Button as={Link} to={`/chat?repo=${encodeURIComponent(job.repo)}`} variant="secondary" iconLeading={MessageSquareText}>Open Chat</Button> : null}<Button as={Link} to="/workspace" iconTrailing={ArrowRight}>{sample ? 'Generate your own' : 'Generate another'}</Button></div></div>
        {sample ? <div className="wiki-sample-provenance"><Badge tone="accent">Demo-safe</Badge><p>{provenance}</p></div> : null}
        <div className="wiki-document-meta"><span><Clock3 size={15} aria-hidden="true" />{generatedAt(job.generatedAt)}</span><span><BookOpenText size={15} aria-hidden="true" />{chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'}</span><span><GitFork size={15} aria-hidden="true" />Repository-generated</span>{justGenerated ? <Badge tone="accent">Generated just now</Badge> : null}{!sample && jobId ? <details className="wiki-job-details"><summary>Job details</summary><code>{jobId}</code></details> : null}</div>
      </header>
      <div className="wiki-reader-grid">
        <aside className="wiki-chapter-nav">{chapterList}</aside>
        <article ref={articleRef} className="wiki-article" aria-labelledby="wiki-chapter-title">
          <header className="wiki-article__header"><span className="wiki-kicker">Chapter {String(selected + 1).padStart(2, '0')} · {chapters.length}</span><h2 id="wiki-chapter-title">{chapter.title}</h2>{chapter.description ? <p>{chapter.description}</p> : null}</header>
          <div className="wiki-article__toolbar"><span>Explanations and diagrams are generated from repository context and may contain errors.</span><Button type="button" variant="ghost" size="sm" iconLeading={copyStatus === 'copied' ? Check : Clipboard} onClick={copyMarkdown}>{copyStatus === 'copied' ? 'Copied' : 'Copy Markdown'}</Button><span className="ui-sr-only" role="status" aria-live="polite">{copyStatus === 'failed' ? 'Copy failed. Select the chapter text and copy it manually.' : ''}</span></div>
          <MarkdownDocument markdown={chapter.markdown} title={chapter.title} />
          {chapter.mermaid ? <section id="wiki-diagram" className="wiki-diagram-section" aria-label="Chapter diagram"><MermaidDiagram key={chapter.mermaid} titleId="diagram-title" source={chapter.mermaid} valid={chapter.diagramValid} label={`${chapter.title} architecture diagram`} /></section> : null}
          <nav className="wiki-chapter-pagination" aria-label="Adjacent chapters"><Button type="button" variant="secondary" disabled={selected === 0} iconLeading={ChevronLeft} onClick={() => selectChapter(selected - 1)}>{selected ? `Previous: ${chapters[selected - 1].title}` : 'Previous'}</Button><span>Chapter {selected + 1} of {chapters.length}</span><Button type="button" variant="secondary" disabled={selected === chapters.length - 1} iconTrailing={ChevronRight} onClick={() => selectChapter(selected + 1)}>{selected < chapters.length - 1 ? `Next: ${chapters[selected + 1].title}` : 'Next'}</Button></nav>
        </article>
        <aside className="wiki-context-rail" aria-label="Chapter context">{context}</aside>
      </div>
      <div className="wiki-mobile-bar"><Button type="button" variant="secondary" onClick={() => setChaptersOpen(true)}>{chapter.title} · {selected + 1}/{chapters.length}</Button><Button type="button" variant="ghost" disabled={selected === 0} aria-label="Previous chapter" iconLeading={ChevronLeft} onClick={() => selectChapter(selected - 1)} /><Button type="button" variant="ghost" disabled={selected === chapters.length - 1} aria-label="Next chapter" iconLeading={ChevronRight} onClick={() => selectChapter(selected + 1)} /></div>
      <Sheet open={chaptersOpen} onOpenChange={setChaptersOpen} title="Chapters" side="bottom" className="wiki-chapter-sheet"><div className="wiki-chapter-nav">{chapterList}</div></Sheet>
      <div className="wiki-mobile-details"><Disclosure title="Details">{context}</Disclosure></div>
    </Page>
  )
}
