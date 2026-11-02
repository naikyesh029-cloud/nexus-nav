/**
 * ALGORITHM SERVICE - connects to the NEXUS NAV FastAPI backend.
 *
 * Engine : "fastapi"  -> calls the backend which runs real Dijkstra/Multistage
 *                  algorithms with SQLite storage. Results are genuine, not mocked.
 *
 * Keep the function signatures and return types below, and replace each body
 * with a fetch() call to your server.
 *
 * JSON cannot carry Infinity, so have the backend send `null` for "infinite"
 * distances and map it back to Infinity here before returning.
 * No page or component needs to change.
 */


export const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000'

export const ENGINE = {
  id: 'fastapi',
  label: 'FastAPI + Python + SQLite',
  note: 'Algorithms run on the backend with real priority-queue Dijkstra and backward DP.',
} as const

/** Walking speed used for travel-time estimates (about 5 km/h). */
export const WALKING_SPEED_MPS = 1.4

/** Map backend dist dict (where null=Infinity) to a plain dist record */
export const mapDistFromBackend = (distBackend: Record<string, number | null>): Record<string, number> => {
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(distBackend)) {
    result[k] = v === null || v === undefined ? Infinity : Number(v)
  }
  return result
}

/** Map backend prev dict (where null=unvisited) to a plain prev record */
export const mapPrevFromBackend = (prevBackend: Record<string, string | null>): Record<string, string | null> => {
  const result: Record<string, string | null> = {}
  for (const [k, v] of Object.entries(prevBackend)) {
    result[k] = v === null ? null : v
  }
  return result
}

/** Map backend DijkstraStep to frontend type */
export const mapDijkstraStepFromBackend = (stepBackend: any): any => {
  const visited = stepBackend.visited || []
  const dist = mapDistFromBackend(stepBackend.dist)
  const prev = mapPrevFromBackend(stepBackend.prev)
  return {
    index: stepBackend.index,
    kind: stepBackend.kind,
    current: stepBackend.current ?? null,
    edge: stepBackend.edge
      ? {
          from: stepBackend.edge.from,
          to: stepBackend.edge.to,
          weight: stepBackend.edge.weight,
          improved: stepBackend.edge.improved,
        }
      : null,
    updated: stepBackend.updated ?? null,
    dist,
    prev,
    visited,
    lines: stepBackend.lines ?? [],
    message: stepBackend.message || '',
  }
}

/** Map backend Multistep DPStep to frontend type */
export const mapMultistageStepFromBackend = (s: any): any => ({
  index: s.index,
  kind: s.kind,
  stage: s.stage ?? null,
  vertex: s.vertex ?? null,
  candidates: (s.candidates || []).map((c: any) => ({
    to: c.to,
    edgeCost: c.edgeCost,
    costTo: c.costTo,
    total: c.total,
  })),
  chosen: s.chosen ?? null,
  cost: { ...s.cost },
  next: { ...s.next },
  symbolic: s.symbolic || '',
  numeric: s.numeric || '',
  message: s.message || '',
})

/** Result of a shortest-route calculation, returned by calculateRoute. */
export interface RouteResult {
  source: string
  target: string
  /** Primary route information. */
  primary: {
    /** Node IDs along the route, from source to target. */
    path: string[]
    /** Total distance in metres. */
    distance: number
    /** Estimated time in seconds (distance / walking speed). */
    seconds: number
    /** Individual segments with weights. */
    segments?: { from: string; to: string; weight: number }[]
    /** Cumulative distance from start at each step. */
    cumulativeDistances?: number[]
  }
  /** Alternative route (best route avoiding at least one segment of the primary). */
  alternative?: RouteResult['primary']
  /** Number of Dijkstra extractions performed. */
  extractions: number
  /** Number of edge relaxations performed. */
  relaxations: number
  /** Number of distance updates performed. */
  updates: number
  /** Engine ID string, e.g. "fastapi". */
  engine: string
  /** ISO timestamp when the route was computed. */
  computedAt: number
}

/** Summary of a route, persistently stored in localStorage. */
export interface RouteSummary {
  source: string
  target: string
  path: string[]
  distance: number
  seconds: number
  computedAt: number
}

/** An intermediate option used by the UI for alternative routes. */
export interface RouteOption {
  path: string[]
  distance: number
  seconds: number
}

/** Result of the Dijkstra algorithm run on the backend. */
export interface DijkstraRun {
  source: string
  dist: Record<string, number>
  prev: Record<string, string | null>
  steps: any[]
  extractions: number
  relaxations: number
  updates: number
}

/** Result of the Multistage DP algorithm run on the backend. */
export interface MultistageResult {
  steps: any[]
  cost: Record<number, number>
  next: Record<number, number | null>
  source: number
  sink: number
  path: number[]
  totalCost: number
  optimalPaths: number[][]
  vertexCount: number
  edgeCount: number
  edgesExamined: number
}

/** Fetch the shortest path from source to target via the backend. */
export async function calculateRoute(source: string, target: string): Promise<RouteResult> {
  const resp = await fetch(API_BASE + '/api/routes/shortest-path', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, target }),
  })

  if (!resp.ok) {
    const err = await resp.json()
    throw new Error(err.detail || 'HTTP ' + resp.status)
  }

  const data = await resp.json() as RouteResult
  data.engine = ENGINE.id
  return data
}

/** Fetch the Dijkstra trace from a source vertex. */
export async function getDijkstraTrace(source: string): Promise<DijkstraRun> {
  const resp = await fetch(API_BASE + '/api/algorithms/dijkstra/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  })

  if (!resp.ok) {
    const err = await resp.json()
    throw new Error(err.detail || 'HTTP ' + resp.status)
  }

  const data = await resp.json() as {
    source: string
    dist: Record<string, number | null>
    prev: Record<string, string | null>
    steps: any[]
    extractions: number
    relaxations: number
    updates: number
  }

  // Convert dist/prev from backend format (null=Infinity) to frontend format
  const frontendDist = { ...data.dist, null: Infinity }
  const frontendPrev = { ...data.prev }

  return {
    source: data.source,
    dist: frontendDist,
    prev: frontendPrev,
    steps: data.steps,
    extractions: data.extractions,
    relaxations: data.relaxations,
    updates: data.updates,
  }
}

/** Fetch the multistage DP solution from the backend. */
export async function getMultistageSolution(): Promise<MultistageResult> {
  const resp = await fetch(API_BASE + '/api/multistage/visualize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  })

  if (!resp.ok) {
    const err = await resp.json()
    throw new Error(err.detail || 'HTTP ' + resp.status)
  }

  const data = await resp.json() as MultistageResult & { steps: any[] }

  // Convert DPStep candidates from backend format
  const frontendSteps = data.steps.map((s: any) => ({
    index: s.index,
    kind: s.kind,
    stage: s.stage ?? null,
    vertex: s.vertex ?? null,
    candidates: (s.candidates || []).map((c: any) => ({
      to: c.to,
      edgeCost: c.edgeCost,
      costTo: c.costTo,
      total: c.total,
    })),
    chosen: s.chosen ?? null,
    cost: { ...s.cost },
    next: { ...s.next },
    symbolic: s.symbolic || '',
    numeric: s.numeric || '',
    message: s.message || '',
  }))

  return {
    steps: frontendSteps,
    cost: { ...data.cost },
    next: { ...data.next },
    source: data.source,
    sink: data.sink,
    path: data.path,
    totalCost: data.totalCost,
    optimalPaths: [...(data.optimalPaths || [])],
    vertexCount: data.vertexCount,
    edgeCount: data.edgeCount,
    edgesExamined: data.edgesExamined,
  }
}