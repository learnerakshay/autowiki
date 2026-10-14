import test from 'node:test'
import assert from 'node:assert/strict'
import { fuzzyMatch, paletteCommands } from '../web/src/lib/paletteCommands.js'
import { snapshot, toast } from '../web/src/components/ui/kit/toastStore.js'
test('palette fuzzy matching and repository commands only carry navigation data', () => {
  assert.equal(fuzzyMatch('Go to Workspace', 'wrksp'), true)
  assert.equal(fuzzyMatch('Go to Chat', 'workspace'), false)
  for (const query of ['acme/repo', 'https://github.com/acme/repo.git']) {
    const commands = paletteCommands(query)
    assert.equal(commands[0].to, '/workspace?repo=acme%2Frepo')
    assert.equal(commands[1].to, '/chat?repo=acme%2Frepo')
    assert.ok(commands.every((item) => !item.request && !item.submit))
  }
  assert.equal(paletteCommands('octocat').some((item) => item.id.startsWith('repo-')), false)
})
test('toast defaults, key dedupe, announcement opt-out and maximum three', () => {
  toast.success('First', { key: 'same' }); toast.error('Replacement', { key: 'same', announce: false })
  assert.equal(snapshot().length, 1)
  assert.equal(snapshot()[0].duration, 8000)
  assert.equal(snapshot()[0].announce, false)
  for (let i=0;i<4;i++) toast.success('Message '+i)
  assert.equal(snapshot().length, 3)
  assert.ok(snapshot().every((item) => item.duration === 4000))
})
