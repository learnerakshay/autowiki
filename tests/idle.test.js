import test from 'node:test'
import assert from 'node:assert/strict'
import { whenIdle, cancelIdle } from '../web/src/lib/idle.js'

test('idle fallback runs and cancels without browser idle APIs', async () => {
  global.window = {}
  try {
    let calls = 0
    cancelIdle(whenIdle(() => calls++, 20, 0))
    await new Promise((resolve) => whenIdle(resolve, 20, 1))
    assert.equal(calls, 0)
    await new Promise((resolve) => whenIdle(() => { calls++; resolve() }, 20, 0))
    assert.equal(calls, 1)
  } finally { delete global.window }
})
test('idle cancellation stays paired with native scheduler', () => {
  let cancelled
  global.window = { requestIdleCallback: () => 7, cancelIdleCallback: (id) => { cancelled = id } }
  try { const handle = whenIdle(() => {}); delete window.cancelIdleCallback; cancelIdle(handle); assert.equal(cancelled, 7) } finally { delete global.window }
})
