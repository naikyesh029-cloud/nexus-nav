import type { RouteResult } from '../services/algorithmService'

/** Small summary of the last calculated route, persisted in localStorage. */
export interface RouteSummary {
  source: string
  target: string
  path: string[]
  distance: number
  seconds: number
  computedAt: number
}

const KEY = 'nexusnav:recent-route'

export const summarize = (r: RouteResult): RouteSummary => ({
  source: r.source,
  target: r.target,
  path: r.primary.path,
  distance: r.primary.distance,
  seconds: r.primary.seconds,
  computedAt: r.computedAt,
})

export function loadRecent(): RouteSummary | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as RouteSummary
    return Array.isArray(v.path) && typeof v.distance === 'number' ? v : null
  } catch {
    return null
  }
}

export function saveRecent(summary: RouteSummary): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(summary))
  } catch {
    /* storage unavailable - ignore */
  }
}
