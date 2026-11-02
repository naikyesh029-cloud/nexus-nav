import type { Graph } from '../types'

/**
 * Dijkstra's algorithm (Greedy technique) - Single Source Shortest Path.
 *
 * Greedy choice: always finalise the unvisited vertex with the smallest
 * tentative distance; its distance can never improve afterwards
 * (valid because all edge weights are non-negative).
 *
 * This implementation records a snapshot after every meaningful action so the
 * Algorithm Lab page can replay the run step by step. The trace is produced by
 * the same code that computes the answer - nothing is simulated.
 */

export const INF = Number.POSITIVE_INFINITY

/** Canonical key for an undirected edge. */
export const edgeKey = (a: string, b: string): string => (a < b ? `${a}|${b}` : `${b}|${a}`)

export interface Neighbor {
  to: string
  weight: number
}

export function buildAdjacency(
  graph: Graph,
  excluded?: ReadonlySet<string>,
): Map<string, Neighbor[]> {
  const order = new Map(graph.nodes.map((n, i) => [n.id, i]))
  const adj = new Map<string, Neighbor[]>(graph.nodes.map((n) => [n.id, []]))
  for (const e of graph.edges) {
    if (excluded?.has(edgeKey(e.from, e.to))) continue
    adj.get(e.from)!.push({ to: e.to, weight: e.weight })
    adj.get(e.to)!.push({ to: e.from, weight: e.weight })
  }
  // Deterministic neighbour order (graph node order) so replays are repeatable.
  for (const list of adj.values()) list.sort((a, b) => order.get(a.to)! - order.get(b.to)!)
  return adj
}

export interface RelaxedEdge {
  from: string
  to: string
  weight: number
  improved: boolean
}

export type DijkstraStepKind = 'init' | 'extract' | 'relax' | 'done'

export interface DijkstraStep {
  index: number
  kind: DijkstraStepKind
  /** Vertex u that was just extracted (and is being processed). */
  current: string | null
  /** Edge (u, v) examined in this step, if any. */
  edge: RelaxedEdge | null
  /** Vertex whose tentative distance changed in this step. */
  updated: string | null
  dist: Record<string, number>
  prev: Record<string, string | null>
  visited: string[]
  /** Indices into DIJKSTRA_PSEUDOCODE that are active in this step. */
  lines: number[]
  message: string
}

export const DIJKSTRA_PSEUDOCODE: string[] = [
  'for each vertex v:  dist[v] ← ∞,  prev[v] ← NIL',
  'dist[source] ← 0;   Q ← all vertices',
  'while Q is not empty:',
  '    u ← vertex in Q with minimum dist[u]      // greedy choice',
  '    remove u from Q                           // dist[u] is now final',
  '    for each neighbour v of u that is still in Q:',
  '        if dist[u] + w(u,v) < dist[v]:',
  '            dist[v] ← dist[u] + w(u,v);  prev[v] ← u',
  'return dist, prev',
]

export interface DijkstraRun {
  source: string
  dist: Record<string, number>
  prev: Record<string, string | null>
  steps: DijkstraStep[]
  extractions: number
  relaxations: number
  updates: number
}

const fmt = (d: number) => (Number.isFinite(d) ? String(d) : '∞')

export function runDijkstra(
  graph: Graph,
  source: string,
  options: { excludedEdges?: ReadonlySet<string> } = {},
): DijkstraRun {
  const names = new Map(graph.nodes.map((n) => [n.id, n.name]))
  const label = (id: string) => names.get(id) ?? id
  const ids = graph.nodes.map((n) => n.id)
  if (!names.has(source)) throw new Error(`Unknown source vertex "${source}"`)

  const adj = buildAdjacency(graph, options.excludedEdges)
  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  for (const id of ids) {
    dist[id] = INF
    prev[id] = null
  }
  dist[source] = 0

  const visited: string[] = []
  const visitedSet = new Set<string>()
  const steps: DijkstraStep[] = []
  let extractions = 0
  let relaxations = 0
  let updates = 0

  const snap = (
    kind: DijkstraStepKind,
    current: string | null,
    edge: RelaxedEdge | null,
    updated: string | null,
    lines: number[],
    message: string,
  ) => {
    steps.push({
      index: steps.length,
      kind,
      current,
      edge,
      updated,
      dist: { ...dist },
      prev: { ...prev },
      visited: [...visited],
      lines,
      message,
    })
  }

  snap(
    'init',
    null,
    null,
    null,
    [0, 1],
    `Initialise: dist[${label(source)}] = 0 and every other vertex = ∞. No vertex is visited yet.`,
  )

  while (visited.length < ids.length) {
    // Greedy choice: unvisited vertex with the smallest finite tentative distance.
    let u: string | null = null
    for (const id of ids) {
      if (visitedSet.has(id) || !Number.isFinite(dist[id])) continue
      if (u === null || dist[id] < dist[u]) u = id
    }
    if (u === null) break // remaining vertices are unreachable

    visitedSet.add(u)
    visited.push(u)
    extractions++
    snap(
      'extract',
      u,
      null,
      null,
      [2, 3, 4],
      `Extract ${label(u)} - smallest tentative distance among unvisited vertices (${fmt(dist[u])}). Greedy choice: its distance is now final.`,
    )

    for (const { to, weight } of adj.get(u)!) {
      if (visitedSet.has(to)) continue
      relaxations++
      const before = dist[to]
      const alt = dist[u] + weight
      const improved = alt < before
      if (improved) {
        dist[to] = alt
        prev[to] = u
        updates++
      }
      snap(
        'relax',
        u,
        { from: u, to, weight, improved },
        improved ? to : null,
        improved ? [5, 6, 7] : [5, 6],
        improved
          ? `Relax ${label(u)} → ${label(to)}: ${fmt(dist[u])} + ${weight} = ${alt} < ${fmt(before)}, so dist[${label(to)}] = ${alt} and prev = ${label(u)}.`
          : `Relax ${label(u)} → ${label(to)}: ${fmt(dist[u])} + ${weight} = ${alt} ≥ ${fmt(before)}, no improvement.`,
      )
    }
  }

  const unreachable = ids.length - visited.length
  snap(
    'done',
    null,
    null,
    null,
    [8],
    unreachable === 0
      ? 'All vertices are visited. dist[] now holds the shortest distance from the source to every vertex.'
      : `Finished. ${unreachable} vertex(es) are unreachable from the source.`,
  )

  return { source, dist, prev, steps, extractions, relaxations, updates }
}

/** Walks the prev[] pointers back from target to source. Returns null if unreachable. */
export function reconstructPath(
  prev: Record<string, string | null>,
  source: string,
  target: string,
): string[] | null {
  const path = [target]
  let cur = target
  while (cur !== source) {
    const p = prev[cur]
    if (p === null || p === undefined) return null
    path.push(p)
    cur = p
  }
  return path.reverse()
}

export function pathSegments(graph: Graph, path: string[]) {
  const weights = new Map(graph.edges.map((e) => [edgeKey(e.from, e.to), e.weight]))
  const segments: { from: string; to: string; weight: number }[] = []
  for (let i = 0; i < path.length - 1; i++) {
    const w = weights.get(edgeKey(path[i], path[i + 1]))
    if (w === undefined) throw new Error(`No edge between ${path[i]} and ${path[i + 1]}`)
    segments.push({ from: path[i], to: path[i + 1], weight: w })
  }
  return segments
}

export function pathDistance(graph: Graph, path: string[]): number {
  return pathSegments(graph, path).reduce((sum, s) => sum + s.weight, 0)
}

/**
 * Best alternative route: for every segment of the primary route, remove it,
 * run Dijkstra again, and keep the cheapest route that differs from the primary.
 * (This is "shortest route that avoids at least one segment of the best route".)
 */
export function findAlternativeRoute(
  graph: Graph,
  source: string,
  target: string,
  primary: string[],
): { path: string[]; distance: number } | null {
  const primaryId = primary.join('>')
  let best: { path: string[]; distance: number } | null = null
  for (const seg of pathSegments(graph, primary)) {
    const run = runDijkstra(graph, source, { excludedEdges: new Set([edgeKey(seg.from, seg.to)]) })
    const path = reconstructPath(run.prev, source, target)
    if (!path || path.join('>') === primaryId) continue
    const distance = run.dist[target]
    if (best === null || distance < best.distance) best = { path, distance }
  }
  return best
}
