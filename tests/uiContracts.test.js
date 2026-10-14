import test from 'node:test'
import assert from 'node:assert/strict'
import { apiRequest } from '../web/src/api.js'
import { architectureNodes } from '../web/src/data/architecture.js'
import { nodeBox, routedConnections } from '../web/src/lib/architectureGraph.js'

test('non-JSON and HTML API errors never expose the raw body', async () => {
  const original = global.fetch
  try {
    for (const status of [400, 404, 429, 500, 502]) {
      global.fetch = async () => new Response('<!DOCTYPE html><pre>private stack</pre>', { status, headers: { 'Content-Type': 'text/html' } })
      await assert.rejects(apiRequest('/api/wiki'), (error) => error.status === status && !/[<>]|private stack/.test(error.message))
    }
    global.fetch = async () => Response.json({ status: 'failed', error: '<html>private stack</html>' })
    assert.equal((await apiRequest('/api/wiki/jobs/id')).error, 'The service could not complete this job. Try again.')
  } finally { global.fetch = original }
})

test('every system connection avoids node interiors', () => {
  for (const { points } of routedConnections) for (let i = 1; i < points.length; i++) {
    const [a,b] = [points[i-1], points[i]]
    for (const node of architectureNodes) {
      const box = nodeBox(node)
      for (let step = 1; step < 100; step++) {
        const x = a[0] + (b[0]-a[0]) * step/100, y = a[1] + (b[1]-a[1]) * step/100
        assert.ok(!(x > box.x && x < box.x + box.width && y > box.y && y < box.y + box.height), `${node.id} overlaps an edge`)
      }
    }
  }
})
