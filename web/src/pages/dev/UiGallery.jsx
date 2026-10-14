import { useEffect, useRef, useState } from 'react'
import { ArrowRight, BookOpenText, Copy, GitFork, Network, Search, Settings } from 'lucide-react'
import { AppBackground } from '../../components/shell/AppBackground.jsx'
import { AppFooter } from '../../components/shell/AppFooter.jsx'
import { AppNav } from '../../components/shell/AppNav.jsx'
import {
  Accordion, Badge, Button, Chip, CodeBlock, Dialog, Disclosure, Divider, EmptyState, EmptyStateSkeleton, IconButton, Input, Kbd, OverlayActions,
  PageHeader, SegmentedControl, Sheet, Skeleton, SkeletonText, StatusPill, Surface, Tab, TabList, TabPanel, Tabs, TextField, TextareaField, Toaster, Tooltip, toast,
} from '../../components/ui/kit/index.js'
import { checkRepoInput } from '../../lib/repoInput.js'
import './ui-gallery.css'

// Dev-only: App.jsx only imports this module when import.meta.env.DEV, so it is absent from production builds.
// It doubles as the visual-regression surface: every primitive appears in a matrix of states. Hover / focus / pressed
// are forced with data-force so they can be captured without a pointer.

const SWATCHES = [
  ['paper', '--paper'], ['mint-50', '--mint-50'], ['mint-100', '--mint-100'], ['mint-200', '--mint-200'], ['ink', '--ink'], ['ink-2', '--ink-2'], ['ink-3', '--ink-3'],
  ['accent', '--accent'], ['accent-ink', '--accent-ink'], ['accent-soft', '--accent-soft'], ['dark', '--dark'], ['dark-2', '--dark-2'], ['dark-accent', '--dark-accent'],
  ['pending', '--status-pending'], ['success', '--status-success'], ['danger', '--status-danger'], ['info', '--status-info'],
]
const FORCED = [undefined, 'hover', 'focus', 'pressed']
const repoError = (value) => { const result = checkRepoInput(value); return result.status === 'invalid' ? result.message : '' }

function Section({ id, title, note, children }) {
  return (
    <section className="gl-section" id={id} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`}>{title}</h2>
      {note ? <p className="gl-note">{note}</p> : null}
      {children}
    </section>
  )
}

function Row({ label, dark = false, children }) {
  return (
    <div className="gl-row">
      <span className="gl-row__label">{label}</span>
      <div className={`gl-row__cells${dark ? ' gl-dark' : ''}`} data-surface={dark ? 'dark' : undefined}>{children}</div>
    </div>
  )
}

function ButtonMatrix({ dark }) {
  return (
    <>
      {['primary', 'secondary', 'ghost'].map((variant) => (
        <Row key={variant} label={variant} dark={dark}>
          {FORCED.map((force) => <Button key={force ?? 'default'} variant={variant} data-force={force}>{force ?? 'Default'}</Button>)}
          <Button variant={variant} disabled>Disabled</Button>
          <Button variant={variant} disabled disabledReason="Enter a repository first">Disabled, explained</Button>
          <Button variant={variant} loading>Generating</Button>
          <Button variant={variant} iconLeading={GitFork}>Leading</Button>
          <Button variant={variant} iconTrailing={ArrowRight}>Trailing</Button>
        </Row>
      ))}
      <Row label="sizes" dark={dark}>
        <Button size="sm">Small</Button><Button size="md">Medium</Button><Button size="lg">Large</Button>
        <IconButton label="Settings" icon={Settings} variant="secondary" /><IconButton label="Search" icon={Search} />
      </Row>
    </>
  )
}

function FieldMatrix() {
  const [bio, setBio] = useState('')
  return (
    <div className="gl-grid">
      <TextField label="Repository" hint="Use owner/repository or paste a public GitHub URL." mono prefix={<GitFork aria-hidden="true" />} placeholder="octocat/Spoon-Knife" validate={repoError} />
      <TextField label="Focus-visible (forced)" placeholder="Focused" shellClassName="force-focus" />
      <TextField label="Filled" defaultValue="octocat/Spoon-Knife" mono />
      <TextField label="Error" defaultValue="not a repo!" error="Repository names cannot contain spaces." />
      <TextField label="Success" defaultValue="octocat/Spoon-Knife" success="Repository found." mono />
      <TextField label="Disabled" defaultValue="Unavailable" disabled />
      <TextField label="Suffix" placeholder="Search" suffix={<Kbd>/</Kbd>} prefix={<Search aria-hidden="true" />} />
      <TextareaField label="Autosizing textarea" hint="Grows with the content, up to eight lines." value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Ask a question about this repository" />
      <div className="ui-field"><span className="ui-field__label">Bare input (no label)</span><Input aria-label="Bare input" placeholder="Input" /></div>
    </div>
  )
}

function Overlays() {
  const [dialog, setDialog] = useState(false)
  const [sheet, setSheet] = useState(false)
  const [bottom, setBottom] = useState(false)
  const dialogTrigger = useRef(null)
  return (
    <div className="gl-cells">
      <Button ref={dialogTrigger} variant="secondary" onClick={() => setDialog(true)}>Open dialog</Button>
      <Button variant="secondary" onClick={() => setSheet(true)}>Open sheet</Button>
      <Button variant="secondary" onClick={() => setBottom(true)}>Open bottom sheet</Button>
      <Dialog open={dialog} onOpenChange={setDialog} title="Discard this draft?" description="The question you typed has not been sent." triggerRef={dialogTrigger}>
        <TextField label="Why are you discarding it?" data-autofocus placeholder="Optional" />
        <OverlayActions>
          <Button variant="ghost" onClick={() => setDialog(false)}>Keep editing</Button>
          <Button onClick={() => { setDialog(false); toast.success('Draft discarded') }}>Discard</Button>
        </OverlayActions>
      </Dialog>
      <Sheet open={sheet} onOpenChange={setSheet} title="Filters" description="On phones this is a bottom sheet you can drag down to dismiss.">
        <SegmentedControl label="Scope" value="all" onChange={() => {}} options={[{ value: 'all', label: 'All' }, { value: 'wikis', label: 'Wikis' }, { value: 'chats', label: 'Chats' }]} />
        <OverlayActions><Button onClick={() => setSheet(false)}>Done</Button></OverlayActions>
      </Sheet>
      <Sheet open={bottom} onOpenChange={setBottom} side="bottom" title="Bottom sheet" description="Drag the grip or the header down, or flick it.">
        <p>Release past the halfway point, or with enough velocity, and it dismisses; otherwise it springs back.</p>
        <OverlayActions><Button onClick={() => setBottom(false)}>Close</Button></OverlayActions>
      </Sheet>
    </div>
  )
}

export default function UiGallery() {
  const [reducedMotion, setReducedMotion] = useState(false)
  const [seg, setSeg] = useState('week')
  const [tab, setTab] = useState('overview')
  const [chip, setChip] = useState(true)

  useEffect(() => {
    const robots = document.createElement('meta')
    robots.name = 'robots'
    robots.content = 'noindex'
    document.head.append(robots)
    const previous = document.title
    document.title = 'UI gallery · dev'
    return () => { robots.remove(); document.title = previous }
  }, [])

  return (
    <div className="gl" data-reduced={reducedMotion || undefined}>
      <header className="gl-head">
        <h1>UI gallery</h1>
        <p>Dev-only. Every primitive in a matrix of states, on light and dark surfaces. Hover, focus and pressed are forced so they can be captured.</p>
        <label className="gl-toggle"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /> Simulate reduced motion (CSS only; use the OS setting or DevTools emulation for the full effect)</label>
        <nav className="gl-index" aria-label="Sections">
          {['tokens', 'buttons', 'fields', 'surfaces', 'status', 'tabs', 'overlays', 'feedback', 'content', 'shell'].map((id) => <a key={id} href={`#${id}`}>{id}</a>)}
        </nav>
      </header>

      <main className="gl-main">
        <Section id="tokens" title="Tokens" note="Defined once in styles/tokens.css. Landing and app both read them.">
          <div className="gl-swatches">{SWATCHES.map(([name, token]) => <figure key={name}><i style={{ background: `var(${token})` }} /><figcaption>{name}</figcaption></figure>)}</div>
          <div className="gl-shadows">{['--shadow-1', '--shadow-2', '--shadow-3'].map((token) => <span key={token} style={{ boxShadow: `var(${token})` }}>{token}</span>)}</div>
          <div className="gl-type">
            <p style={{ fontSize: 'var(--fs-h3)', fontWeight: 'var(--fw-display)', letterSpacing: 'var(--track-display)' }}>Type: display recipe</p>
            <p style={{ fontSize: 'var(--fs-body)' }}>Body 17px, the landing's reading size.</p>
            <p style={{ fontSize: 'var(--fs-small)', color: 'var(--ink-3)' }}>Small, secondary copy.</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-mono)' }}>mono tokens: web/src/styles/tokens.css</p>
          </div>
        </Section>

        <Section id="buttons" title="Button and IconButton" note="Primary, secondary, ghost. Loading is an indeterminate breathing dot, never a percentage. Disabled stays legible and can explain itself.">
          <h3>On light</h3><ButtonMatrix />
          <h3>On dark</h3><ButtonMatrix dark />
        </Section>

        <Section id="fields" title="Field, Input, Textarea" note="Validation runs while typing and on blur, never only on submit. The message line is always reserved, so nothing shifts."><FieldMatrix /></Section>

        <Section id="surfaces" title="Surface" note="Flat, raised, dark, and the cursor-following spotlight border (pointer-fine only).">
          <div className="gl-grid">
            <Surface variant="flat"><h3>Flat</h3><p>Hairline border, no shadow.</p></Surface>
            <Surface variant="raised"><h3>Raised</h3><p>The landing's card: gradient and layered shadow.</p></Surface>
            <Surface variant="dark"><h3>Dark</h3><p>Dark-section scale. <Button size="sm" variant="secondary">Nested button</Button></p></Surface>
            <Surface variant="raised" spotlight interactive><h3>Spotlight</h3><p>Move the cursor across the border. Lifts on hover, presses on pointer-down.</p></Surface>
          </div>
        </Section>

        <Section id="status" title="Chip, Badge, StatusPill" note="Each status has an icon and text. Pending is indeterminate: no percentage, queue depth or ETA.">
          <Row label="status">
            {['idle', 'pending', 'succeeded', 'failed', 'info'].map((state) => <StatusPill key={state} state={state} />)}
          </Row>
          <Row label="badge"><Badge>Neutral</Badge><Badge tone="accent">Accent</Badge><Badge tone="info" icon={Network}>With icon</Badge></Row>
          <Row label="chip">
            <Chip>Static</Chip><Chip onClick={() => setChip(!chip)} selected={chip} icon={BookOpenText}>Toggle me</Chip><Chip onClick={() => {}} data-force="hover">Hover</Chip>
          </Row>
        </Section>

        <Section id="tabs" title="Tabs and SegmentedControl" note="Arrow keys, Home and End move and select. The indicator slides on the shared spring.">
          <Tabs value={tab} onValueChange={setTab}>
            <TabList label="Demo tabs">
              <Tab value="overview" icon={BookOpenText}>Overview</Tab><Tab value="sources" icon={GitFork}>Sources</Tab><Tab value="diagram" icon={Network}>Diagram</Tab><Tab value="more" disabled>Disabled</Tab>
            </TabList>
            <TabPanel value="overview">Overview panel</TabPanel><TabPanel value="sources">Sources panel</TabPanel><TabPanel value="diagram">Diagram panel</TabPanel>
          </Tabs>
          <div className="gl-cells">
            <SegmentedControl label="Range" value={seg} onChange={setSeg} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
            <SegmentedControl label="Range, small" size="sm" value={seg} onChange={setSeg} options={[{ value: 'day', label: 'Day' }, { value: 'week', label: 'Week' }, { value: 'month', label: 'Month' }]} />
          </div>
        </Section>

        <Section id="overlays" title="Dialog and Sheet" note="Focus trap, Esc, scrim, inert background, scroll lock, focus returns to the trigger. The dialog scales out from its trigger; on phones the sheet is a bottom sheet you can drag to dismiss.">
          <Overlays />
        </Section>

        <Section id="feedback" title="Tooltip, Toast, Skeleton" note="Toasts stack, pause on hover or focus, and swipe away with velocity.">
          <div className="gl-cells">
            <Tooltip content="Copies the repository URL"><IconButton label="Copy" icon={Copy} tooltip={false} variant="secondary" /></Tooltip>
            <Tooltip content="Hover or focus me"><Button variant="secondary">Tooltip</Button></Tooltip>
            <Button onClick={() => toast.info('Heads up', { description: 'Information toasts last five seconds.' })}>Info toast</Button>
            <Button onClick={() => toast.success('Wiki generated', { description: 'octocat/Spoon-Knife is ready to read.' })}>Success toast</Button>
            <Button variant="secondary" onClick={() => toast.error('Generation failed', { description: 'GitHub returned a rate-limit response.', action: { label: 'Try again' } })}>Error toast</Button>
            <Button variant="ghost" onClick={() => toast.dismiss()}>Dismiss all</Button>
          </div>
          <div className="gl-grid">
            <Surface><SkeletonText lines={3} /></Surface>
            <Surface><div className="gl-skeleton-row"><Skeleton width="3rem" height="3rem" radius="var(--r-m)" /><SkeletonText lines={2} /></div></Surface>
          </div>
        </Section>

        <Section id="content" title="CodeBlock, Disclosure, Divider, PageHeader, EmptyState">
          <CodeBlock path="web/src/lib/motion.js" code={"export const springs = Object.freeze({\n  default: Object.freeze({ damping: 1, response: 0.35 }),\n  momentum: Object.freeze({ damping: 0.8, response: 0.35 }),\n})\n// A deliberately long line to show the edge fade and the keyboard-focusable scroll area: " + 'abcdefghij '.repeat(14)} />
          <CodeBlock tone="dark" language="bash" code="npm run build && npm run preview" />
          <Divider label="Disclosure" />
          <Accordion single items={[{ id: 'a', title: 'What does pending mean?', content: 'The job was accepted and is waiting or running. The application does not know how long it will take, so it does not guess.' }, { id: 'b', title: 'Can I read the sample wiki meanwhile?', content: 'Yes. It is a pre-generated example that does not depend on the job.' }]} />
          <Disclosure title="A standalone disclosure" defaultOpen>The height animates on the shared spring and can be interrupted mid-flight.</Disclosure>
          <Divider label="PageHeader" />
          <PageHeader eyebrow="Workspace" title="Turn a repository into documentation." lede="Eyebrow, headline and subcopy in the landing's recipe, revealed with the shared hook." actions={<Button>Primary action</Button>} />
          <div className="gl-grid">
            <Surface variant="flat"><EmptyState icon={BookOpenText} title="No wikis yet" description="Generate one from the Workspace and it will appear here." action={<Button variant="secondary">Open Workspace</Button>} /></Surface>
            <Surface variant="flat"><EmptyStateSkeleton /></Surface>
          </div>
        </Section>

        <Section id="shell" title="Shell: nav, footer, background" note="The pill nav and background are fixed layers, shown here inside frames. Click through the nav: the active pill slides on the shared spring.">
          <div className="gl-frame gl-frame--nav"><AppNav /></div>
          <div className="gl-frame gl-frame--bg"><AppBackground /><p>Background layer</p></div>
          <div className="gl-frame gl-frame--footer"><AppFooter /></div>
        </Section>
      </main>
      <Toaster />
    </div>
  )
}
