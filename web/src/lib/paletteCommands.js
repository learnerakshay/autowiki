import { checkRepoInput } from './repoInput.js'

const pages = [['landing', 'Go to Landing', '/'], ['workspace', 'Go to Workspace', '/workspace'], ['chat', 'Go to Chat', '/chat'], ['sample', 'Go to sample Wiki', '/wiki/sample/spoon-knife'], ['architecture', 'Go to Architecture', '/architecture'], ['generate', 'Generate a Wiki', '/workspace']]
export function fuzzyMatch(label, query) {
  let index = 0
  const text = label.toLowerCase().replace(/[^a-z0-9]/g, '')
  for (const letter of query.toLowerCase().replace(/[^a-z0-9]/g, '')) {
    index = text.indexOf(letter, index)
    if (index < 0) return false
    index++
  }
  return true
}
export function paletteCommands(query) {
  const commands = [...pages.map(([id,label,to]) => ({ id,label,to })), { id: 'copy', label: 'Copy page link', copy: true }].filter((item) => fuzzyMatch(item.label, query))
  const checked = checkRepoInput(query)
  if (checked.status === 'valid') {
    const repo = checked.repo, encoded = encodeURIComponent(repo)
    commands.unshift({ id: 'repo-workspace', label: `Open Workspace for ${repo}`, to: `/workspace?repo=${encoded}` }, { id: 'repo-chat', label: `Ask about ${repo} in Chat`, to: `/chat?repo=${encoded}` })
  }
  return commands
}
