/**
 * Self-check: proves the implementations are correct by comparing them with
 * independent reference solutions. Run with:  npm run verify
 *
 *  - Dijkstra       vs  Bellman-Ford, for every source on the campus graph
 *  - Multistage DP  vs  brute-force enumeration of every source→sink path
 */
import { CAMPUS_GRAPH } from '../src/data/campusGraph'
import { MULTISTAGE_GRAPH } from '../src/data/multistageGraph'
import { INF, pathDistance, reconstructPath, runDijkstra } from '../src/algorithms/dijkstra'
import { solveMultistage } from '../src/algorithms/multistage'

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`FAILED: ${msg}`)
}

// ---- Dijkstra vs Bellman-Ford -------------------------------------------
function bellmanFord(source: string): Record<string, number> {
  const d: Record<string, number> = {}
  for (const n of CAMPUS_GRAPH.nodes) d[n.id] = INF
  d[source] = 0
  for (let i = 0; i < CAMPUS_GRAPH.nodes.length - 1; i++) {
    for (const e of CAMPUS_GRAPH.edges) {
      if (d[e.from] + e.weight < d[e.to]) d[e.to] = d[e.from] + e.weight
      if (d[e.to] + e.weight < d[e.from]) d[e.from] = d[e.to] + e.weight
    }
  }
  return d
}

let pairs = 0
for (const s of CAMPUS_GRAPH.nodes) {
  const run = runDijkstra(CAMPUS_GRAPH, s.id)
  const ref = bellmanFord(s.id)
  for (const t of CAMPUS_GRAPH.nodes) {
    assert(run.dist[t.id] === ref[t.id], `dist ${s.id}→${t.id}: ${run.dist[t.id]} vs ${ref[t.id]}`)
    const path = reconstructPath(run.prev, s.id, t.id)
    assert(path !== null, `path ${s.id}→${t.id} missing`)
    assert(pathDistance(CAMPUS_GRAPH, path!) === run.dist[t.id], `path length ${s.id}→${t.id}`)
    pairs++
  }
}
console.log(`✔ Dijkstra matches Bellman-Ford for all ${pairs} source/target pairs`)

// ---- Multistage DP vs brute force ---------------------------------------
const dp = solveMultistage(MULTISTAGE_GRAPH)
const out = new Map<number, { to: number; cost: number }[]>()
for (const e of MULTISTAGE_GRAPH.edges) {
  if (!out.has(e.from)) out.set(e.from, [])
  out.get(e.from)!.push({ to: e.to, cost: e.cost })
}
const all: { path: number[]; cost: number }[] = []
const dfs = (v: number, path: number[], c: number) => {
  if (v === dp.sink) return void all.push({ path: [...path], cost: c })
  for (const e of out.get(v) ?? []) dfs(e.to, [...path, e.to], c + e.cost)
}
dfs(dp.source, [dp.source], 0)
const best = Math.min(...all.map((p) => p.cost))
const bestPaths = all.filter((p) => p.cost === best)
assert(dp.totalCost === best, `DP cost ${dp.totalCost} vs brute force ${best}`)
assert(bestPaths.length === dp.optimalPaths.length, 'number of optimal paths')
assert(
  bestPaths.map((p) => p.path.join('-')).sort().join('|') ===
    dp.optimalPaths.map((p) => p.join('-')).sort().join('|'),
  'set of optimal paths',
)
console.log(
  `✔ Multistage DP cost ${dp.totalCost} matches brute force over ${all.length} paths ` +
    `(${bestPaths.length} optimal: ${bestPaths.map((p) => p.path.join('→')).join('  |  ')})`,
)
console.log('All checks passed.')
