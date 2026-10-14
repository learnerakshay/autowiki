import { Clipboard, FileCode2 } from 'lucide-react'
import { Chip } from '../components/ui/kit/index.js'
import { toast } from '../components/ui/kit/toastStore.js'
export function SourceList({ files, label = 'Implementation evidence' }) {
  async function copy(path) {
    try { await navigator.clipboard.writeText(path); toast.success('Source path copied', { description: path }) }
    catch { toast.error('Copy failed', { description: 'Select the path text and copy it manually.' }) }
  }
  return <div className="arch-files" aria-label={label}>{files.map((path) => <Chip key={path} icon={FileCode2} onClick={() => void copy(path)} aria-label={`Copy source path ${path}`}><code>{path}</code><Clipboard size={14} aria-hidden="true" /></Chip>)}</div>
}
