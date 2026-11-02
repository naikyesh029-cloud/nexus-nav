import type { MultistageGraph } from '../types'

/**
 * Multistage graph shortest path - Dynamic Programming (backward approach).
 *
 *   cost(sink) = 0
 *   cost(i)    = min over edges (i, j) of  { c(i, j) + cost(j) }
 *   d(i)       = the j that achieves the minimum  (next hop on the optimal path)
 *
 * Vertices are processed stage by stage from the last stage back to the first,
 * so every cost(j) is already known when it is needed (optimal substructure).
 * Each vertex and each edge is handled exactly once  ->  O(V + E) time.
 */

export interface DPCandidate {
  to: number
  edgeCost: number
  costTo: number
  total: number
}

export type DPStepKind = 'init' | 'compute' | 'done'

export interface DPStep {
  index: number
  kind: DPStepKind
  /** 1-based stage number of the vertex computed in this step. */
  stage: number | null
  vertex: number | null
  candidates: DPCandidate[]
  /** Next hop chosen for `vertex`. */
  chosen: number | null
  /** null = not computed yet. */
  cost: Record<number, number | null>
  next: Record<number, number | null>
  symbolic: string
  numeric: string
  message: string
}

export interface MultistageResult {
  steps: DPStep[]
  cost: Record<number, number>
  next: Record<number, number | null>
  source: number
  sink: number
  path: number[]
  totalCost: number
  /** Every path whose total equals the optimum (ties). */
  optimalPaths: number[][]
  vertexCount: number
  edgeCount: number
  /** Edge examinations actually performed (equals edgeCount). */
  edgesExamined: number
}

export function solveMultistage(graph: MultistageGraph): MultistageResult {
  const { stages, edges } = graph
  if (stages.length < 2) throw new Error('A multistage graph needs at least two stages')
  if (stages[0].length !== 1 || stages[stages.length - 1].length !== 1) {
    throw new Error('A multistage graph needs exactly one source and one sink')
  }

  const stageOf = new Map<number, number>()
  stages.forEach((vs, s) => vs.forEach((v) => stageOf.set(v, s)))
  for (const e of edges) {
    if (stageOf.get(e.to) !== (stageOf.get(e.from) ?? -10) + 1) {
      throw new Error(`Edge ${e.from}→${e.to} does not go from stage i to stage i+1`)
    }
  }

  const out = new Map<number, { to: number; cost: number }[]>()
  for (const vs of stages) for (const v of vs) out.set(v, [])
  for (const e of edges) out.get(e.from)!.push({ to: e.to, cost: e.cost })
  for (const list of out.values()) list.sort((a, b) => a.to - b.to)

  const source = stages[0][0]
  const sink = stages[stages.length - 1][0]
  const allVertices = stages.flat()

  const cost: Record<number, number | null> = {}
  const next: Record<number, number | null> = {}
  for (const v of allVertices) {
    cost[v] = null
    next[v] = null
  }
  cost[sink] = 0

  const steps: DPStep[] = []
  const snap = (
    kind: DPStepKind,
    stage: number | null,
    vertex: number | null,
    candidates: DPCandidate[],
    chosen: number | null,
    symbolic: string,
    numeric: string,
    message: string,
  ) =>
    steps.push({
      index: steps.length,
      kind,
      stage,
      vertex,
      candidates,
      chosen,
      cost: { ...cost },
      next: { ...next },
      symbolic,
      numeric,
      message,
    })

  snap(
    'init',
    stages.length,
    sink,
    [],
    null,
    `cost(${sink}) = 0`,
    '',
    `Base case: the sink vertex ${sink} costs 0 to reach itself. We now work backwards, stage by stage.`,
  )

  let edgesExamined = 0
  for (let s = stages.length - 2; s >= 0; s--) {
    for (const v of stages[s]) {
      const candidates: DPCandidate[] = []
      for (const { to, cost: c } of out.get(v)!) {
        edgesExamined++
        const costTo = cost[to] as number
        candidates.push({ to, edgeCost: c, costTo, total: c + costTo })
      }
      let best = candidates[0]
      for (const cand of candidates) if (cand.total < best.total) best = cand
      cost[v] = best.total
      next[v] = best.to

      const symbolic = `cost(${v}) = min{ ${candidates
        .map((c) => `c(${v},${c.to}) + cost(${c.to})`)
        .join(', ')} }`
      const numeric = `= min{ ${candidates.map((c) => `${c.edgeCost} + ${c.costTo}`).join(', ')} } = min{ ${candidates
        .map((c) => c.total)
        .join(', ')} } = ${best.total}`

      snap(
        'compute',
        s + 1,
        v,
        candidates,
        best.to,
        symbolic,
        numeric,
        `Stage ${s + 1}, vertex ${v}: cost(${v}) = ${best.total}, reached best through vertex ${best.to}, so d(${v}) = ${best.to}.`,
      )
    }
  }

  const path = [source]
  while (path[path.length - 1] !== sink) path.push(next[path[path.length - 1]] as number)

  // Enumerate all optimal paths (ties) using the finished cost table.
  const optimalPaths: number[][] = []
  const walk = (v: number, acc: number[]) => {
    if (v === sink) {
      optimalPaths.push([...acc])
      return
    }
    for (const { to, cost: c } of out.get(v)!) {
      if (c + (cost[to] as number) === cost[v]) {
        acc.push(to)
        walk(to, acc)
        acc.pop()
      }
    }
  }
  walk(source, [source])

  snap(
    'done',
    null,
    null,
    [],
    null,
    `d(1) → d(d(1)) → ... follows the stored next hops`,
    '',
    `Optimal cost = ${cost[source]}. Path read from the d[] table: ${path.join(' → ')}.`,
  )

  return {
    steps,
    cost: cost as Record<number, number>,
    next,
    source,
    sink,
    path,
    totalCost: cost[source] as number,
    optimalPaths,
    vertexCount: allVertices.length,
    edgeCount: edges.length,
    edgesExamined,
  }
}
