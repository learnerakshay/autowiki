// Validation for the landing-page repository field. It mirrors what the workspace backend
// accepts (`owner/repo`, optionally a github.com URL with a trailing .git) but is stricter about
// GitHub's real naming rules so mistakes surface while typing, not after a failed job.
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/
const NAME = /^[A-Za-z0-9._-]{1,100}$/
const HOST = /^(?:https?:\/\/)?(?:www\.)?github\.com(?:\/|$)/i
const URL_PREFIXES = ['https://github.com/', 'http://github.com/', 'https://www.github.com/', 'http://www.github.com/', 'www.github.com/', 'github.com/']

export const REPO_EXAMPLE = 'octocat/Spoon-Knife'

/**
 * @returns {{ status: 'empty' | 'incomplete' | 'invalid' | 'valid', repo?: string, message?: string }}
 * `incomplete` means "might still become valid" (e.g. `octocat` or `octocat/`), so the UI can stay quiet.
 */
export function checkRepoInput(raw) {
  const value = raw.trim()
  if (!value) return { status: 'empty' }

  if (/\s/.test(value)) return { status: 'invalid', message: 'Repository names cannot contain spaces.' }

  // Still typing the host (`github.c`, `https://git`): stay quiet instead of flagging every keystroke.
  const lower = value.toLowerCase()
  if (URL_PREFIXES.some((prefix) => prefix.startsWith(lower))) return { status: 'incomplete' }
  if (!value.includes('/')) {
    return /^[A-Za-z0-9.-]*$/.test(value)
      ? { status: 'incomplete', message: 'Add the repository name after a slash, like octocat/Spoon-Knife.' }
      : { status: 'invalid', message: 'Owners can only use letters, numbers, and hyphens.' }
  }

  let path = value
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value) || /^(?:www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+\//i.test(value)) {
    if (!HOST.test(value)) return { status: 'invalid', message: 'Only public github.com repositories are supported.' }
    path = value.replace(HOST, '')
  }

  const [owner = '', name = '', ...rest] = path.replace(/[?#].*$/, '').split('/')
  const cleanName = name.replace(/\.git$/i, '')

  if (!/^[A-Za-z0-9-]*$/.test(owner)) return { status: 'invalid', message: 'Owners can only use letters, numbers, and hyphens.' }
  if (!name) return { status: 'incomplete', message: 'Add the repository name after the slash.' }
  if (!owner) return { status: 'invalid', message: 'Start with the owner, like octocat/Spoon-Knife.' }
  if (!OWNER.test(owner) || owner.endsWith('-')) return { status: 'invalid', message: 'That owner name is not valid on GitHub.' }
  if (!NAME.test(cleanName) || cleanName === '.' || cleanName === '..') {
    return { status: 'invalid', message: 'Repository names can only use letters, numbers, dots, hyphens, and underscores.' }
  }
  // Extra segments are fine for URLs (/tree/main), but a bare owner/repo/extra is almost certainly a typo.
  if (rest.filter(Boolean).length && path === value) return { status: 'invalid', message: 'Use the owner/repo format, like octocat/Spoon-Knife.' }

  return { status: 'valid', repo: `${owner}/${cleanName}` }
}

export function workspaceHref(repo) {
  return `/workspace?repo=${encodeURIComponent(repo)}`
}
