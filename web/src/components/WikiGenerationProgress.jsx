import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  BookOpenText,
  Clock3,
  GitBranch,
  ListTree,
  Save,
} from 'lucide-react'

const stages = [
  {
    id: 'queued',
    label: 'Preparing the generation job',
    shortLabel: 'Queued',
    icon: Clock3,
  },
  {
    id: 'fetching_repository',
    label: 'Reading repository files',
    shortLabel: 'Repository',
    icon: GitBranch,
  },
  {
    id: 'planning_outline',
    label: 'Planning the wiki structure',
    shortLabel: 'Outline',
    icon: ListTree,
  },
  {
    id: 'generating_chapter',
    label: 'Generating chapters and diagrams',
    shortLabel: 'Chapters',
    icon: BookOpenText,
  },
  {
    id: 'saving_wiki',
    label: 'Saving the generated wiki',
    shortLabel: 'Save',
    icon: Save,
  },
]

function describeProgress(progress) {
  const stage = stages.find((item) => item.id === progress?.stage)
  if (!stage) return null

  if (
    stage.id === 'generating_chapter' &&
    Number.isInteger(progress.chapter) &&
    Number.isInteger(progress.totalChapters) &&
    progress.chapter > 0 &&
    progress.totalChapters >= progress.chapter
  ) {
    return {
      ...stage,
      label: `Generating chapter ${progress.chapter} of ${progress.totalChapters}`,
    }
  }

  return stage
}

export function WikiGenerationProgress({ progress, repo, compact = false }) {
  const surfaceRef = useRef(null)
  const activeStage = describeProgress(progress)
  const stageKey = activeStage
    ? `${activeStage.id}-${progress?.chapter ?? ''}-${progress?.totalChapters ?? ''}`
    : 'unavailable'

  useGSAP(() => {
    const active = surfaceRef.current?.querySelector('.wiki-generation-progress__current')
    if (!active) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(active, { clearProps: 'all' })
      return
    }

    gsap.fromTo(
      active,
      { autoAlpha: 0.76, filter: 'blur(2px)' },
      {
        autoAlpha: 1,
        filter: 'blur(0px)',
        duration: 0.24,
        ease: 'power3.out',
        clearProps: 'filter',
      },
    )
  }, { scope: surfaceRef, dependencies: [stageKey] })

  const ActiveIcon = activeStage?.icon || Clock3

  return (
    <section
      ref={surfaceRef}
      className={`wiki-generation-progress${compact ? ' wiki-generation-progress--compact' : ''}`}
      aria-busy="true"
      aria-label="Wiki generation activity"
    >
      <div className="wiki-generation-progress__heading">
        <div>
          <h2>Generation activity</h2>
          <p>Latest operation reported by the generation worker.</p>
        </div>
        {repo ? <code>{repo}</code> : null}
      </div>

      <div className="wiki-generation-progress__current">
        <span aria-hidden="true"><ActiveIcon size={20} /></span>
        <div>
          <p aria-live="polite" aria-atomic="true">
            {activeStage?.label || 'Generation is still running'}
          </p>
          <small>
            {activeStage
              ? 'Live worker activity. No percentage or completion estimate is available.'
              : 'Detailed worker activity is unavailable. This is not live stage progress.'}
          </small>
        </div>
      </div>

      <ol className="wiki-generation-progress__stages" aria-label="Generation stages">
        {stages.map(({ id, shortLabel, icon: StageIcon }) => (
          <li key={id} className={activeStage?.id === id ? 'is-active' : ''} aria-current={activeStage?.id === id ? 'step' : undefined}>
            <span aria-hidden="true"><StageIcon size={15} /></span>
            <span>{shortLabel}</span>
          </li>
        ))}
      </ol>

      <div className="wiki-generation-progress__activity" aria-hidden="true"><span /></div>
    </section>
  )
}
