/** Formats a distance value; Infinity is shown as ∞. */
export const fmtDist = (d: number | null | undefined): string =>
  d === null || d === undefined || !Number.isFinite(d) ? '∞' : String(d)

/** 550 -> "9 min 10 s",  45 -> "45 s" */
export function fmtDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds))
  if (s < 60) return `${s} s`
  const m = Math.floor(s / 60)
  const r = s % 60
  return r === 0 ? `${m} min` : `${m} min ${r} s`
}

export const fmtClock = (ts: number): string =>
  new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
