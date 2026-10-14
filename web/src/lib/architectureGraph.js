import { architectureNodes, architectureConnections } from '../data/architecture.js'
export const nodeBox = (node) => ({ x: node.position.x * 10, y: node.position.y * 5, width: 220, height: 80 })
export function routeConnection(connection) {
  const from = nodeBox(architectureNodes.find((node) => node.id === connection.from))
  const to = nodeBox(architectureNodes.find((node) => node.id === connection.to))
  const fx = from.x + from.width / 2, fy = from.y + from.height / 2
  const tx = to.x + to.width / 2, ty = to.y + to.height / 2
  let points
  if (connection.curved) points = [[fx, from.y], [fx, 20], [tx, 20], [tx, to.y]]
  else if (connection.from === 'inngest' && connection.to === 'jobs') points = [[from.x + from.width, fy], [640, fy], [640, to.y + to.height + 25], [tx, to.y + to.height + 25], [tx, to.y + to.height]]
  else if (from.y === to.y) points = [[from.x + from.width, fy], [to.x, ty]]
  else points = [[fx, from.y + from.height], [fx, (from.y + from.height + to.y) / 2], [tx, (from.y + from.height + to.y) / 2], [tx, to.y]]
  const middle = points.length === 2 ? [(points[0][0] + points[1][0]) / 2, points[0][1] - 12] : [points[1][0], points[1][1] - 12]
  return { points, path: points.map(([x,y], index) => `${index ? 'L' : 'M'} ${x} ${y}`).join(' '), label: middle }
}
export const routedConnections = architectureConnections.map(routeConnection)
