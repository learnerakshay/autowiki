import { useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { Dialog, TextField } from '../ui/kit/index.js'
import { toast } from '../ui/kit/toastStore.js'
import { paletteCommands } from '../../lib/paletteCommands.js'
import './command-palette.css'

export default function CommandPalette({ open, onOpenChange, triggerRef }) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const id = useId()
  const list = useRef(null)
  const commands = paletteCommands(query)
  async function run(command) {
    if (!command) return
    onOpenChange(false)
    if (command.copy) {
      try { await navigator.clipboard.writeText(location.href); toast.success('Page link copied', { key: 'page-link' }) }
      catch { toast.error('Copy failed', { key: 'page-link', description: 'Copy the address from your browser.' }) }
    }
    if (command.to) navigate(command.to)
  }
  function keydown(event) {
    const count = commands.length
    let next
    if (event.key === 'ArrowDown') next = count ? (active + 1) % count : 0
    else if (event.key === 'ArrowUp') next = count ? (active - 1 + count) % count : 0
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = Math.max(0, count - 1)
    else if (event.key === 'Enter') { event.preventDefault(); void run(commands[active]); return }
    else return
    event.preventDefault(); setActive(next); list.current?.children[next]?.scrollIntoView({ block: 'nearest' })
  }
  return <Dialog open={open} onOpenChange={onOpenChange} title="Go anywhere in AutoWiki" description="Choose a page or prefill a repository. Prefilling starts no job." triggerRef={triggerRef} className="command-palette"><TextField label="Search pages and actions" id={`${id}-input`} prefix={<Search aria-hidden="true" />} data-autofocus role="combobox" aria-autocomplete="list" aria-expanded={open} aria-controls={`${id}-list`} aria-activedescendant={commands[active] ? `${id}-${commands[active].id}` : undefined} value={query} onChange={(event) => { setQuery(event.target.value); setActive(0) }} onKeyDown={keydown} autoComplete="off" /><p className="ui-sr-only" role="status" aria-live="polite">{commands.length} {commands.length === 1 ? 'command' : 'commands'} available</p><ul ref={list} id={`${id}-list`} role="listbox" aria-label="Commands">{commands.map((command,index) => <li tabIndex={-1} className="press" role="option" id={`${id}-${command.id}`} key={command.id} aria-selected={index === active} onPointerMove={() => setActive(index)} onPointerDown={(event) => event.preventDefault()} onClick={() => void run(command)}>{command.label}<ArrowRight aria-hidden="true" size={16} /></li>)}</ul>{!commands.length ? <p>No matching commands.</p> : null}</Dialog>
}
