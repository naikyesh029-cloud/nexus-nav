import { useCallback, useEffect, useState } from 'react'

/** Timer-driven step player shared by the Dijkstra and DP visualisations. */
export function usePlayback(total: number, intervalMs: number) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)

  const last = Math.max(total - 1, 0)
  const safeIndex = Math.min(index, last)

  useEffect(() => {
    if (!playing) return
    if (safeIndex >= last) {
      setPlaying(false)
      return
    }
    const t = window.setTimeout(() => setIndex(safeIndex + 1), intervalMs)
    return () => window.clearTimeout(t)
  }, [playing, safeIndex, last, intervalMs])

  const play = useCallback(() => {
    if (total === 0) return
    if (safeIndex >= last) setIndex(0)
    setPlaying(true)
  }, [total, safeIndex, last])

  const pause = useCallback(() => setPlaying(false), [])
  const next = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.min(i + 1, last))
  }, [last])
  const prev = useCallback(() => {
    setPlaying(false)
    setIndex((i) => Math.max(Math.min(i, last) - 1, 0))
  }, [last])
  const reset = useCallback(() => {
    setPlaying(false)
    setIndex(0)
  }, [])
  const goTo = useCallback(
    (i: number) => {
      setPlaying(false)
      setIndex(Math.max(0, Math.min(i, last)))
    },
    [last],
  )
  const jumpToEnd = useCallback(() => {
    setPlaying(false)
    setIndex(last)
  }, [last])

  return { index: safeIndex, playing, total, play, pause, next, prev, reset, goTo, jumpToEnd }
}
