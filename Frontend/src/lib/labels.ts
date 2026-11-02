export interface LabelAnchor {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * Places an edge-weight label on each edge. Starts at the midpoint and slides
 * the label along its own edge when it would collide with an earlier label.
 */
export function placeLabels(
  anchors: LabelAnchor[],
  box: { w: number; h: number } = { w: 46, h: 22 },
): Record<string, { x: number; y: number }> {
  const offsets = [0.5, 0.4, 0.6, 0.32, 0.68, 0.26, 0.74]
  const placed: { x: number; y: number }[] = []
  const result: Record<string, { x: number; y: number }> = {}
  for (const a of anchors) {
    let chosen: { x: number; y: number } | null = null
    for (const t of offsets) {
      const p = { x: a.x1 + (a.x2 - a.x1) * t, y: a.y1 + (a.y2 - a.y1) * t }
      if (!placed.some((q) => Math.abs(q.x - p.x) < box.w && Math.abs(q.y - p.y) < box.h)) {
        chosen = p
        break
      }
    }
    if (!chosen) chosen = { x: (a.x1 + a.x2) / 2, y: (a.y1 + a.y2) / 2 }
    placed.push(chosen)
    result[a.id] = chosen
  }
  return result
}
