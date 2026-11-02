import { useId, useMemo } from 'react'
import type { MultistageGraph } from '../types'
import { placeLabels } from '../lib/labels'

const W = 1000
const H = 560
const R = 24

interface Props {
  graph: MultistageGraph
  currentVertex: number | null
  /** null = cost not computed yet */
  costs: Record<number, number | null>
  /** edges being compared in the current step, as "from>to" */
  candidateEdges: Set<string>
  /** edges chosen so far, d(v), as "from>to" */
  decisionEdges: Set<string>
  /** final optimal path edges, as "from>to" */
  pathEdges: Set<string>
  pathVertices: Set<number>
}

type EdgeKind = 'default' | 'decision' | 'candidate' | 'path'

const EDGE: Record<EdgeKind, { stroke: string; width: number; opacity: number; rank: number }> = {
  default: { stroke: '#3b4a7a', width: 2, opacity: 0.8, rank: 0 },
  decision: { stroke: '#60a5fa', width: 3, opacity: 0.9, rank: 1 },
  candidate: { stroke: '#a78bfa', width: 3.5, opacity: 1, rank: 2 },
  path: { stroke: '#22d3ee', width: 5, opacity: 1, rank: 3 },
}

export default function MultistageGraphView({
  graph,
  currentVertex,
  costs,
  candidateEdges,
  decisionEdges,
  pathEdges,
  pathVertices,
}: Props) {
  const uid = useId().replace(/:/g, '')

  const pos = useMemo(() => {
    const m = new Map<number, { x: number; y: number }>()
    const n = graph.stages.length
    graph.stages.forEach((vs, s) => {
      const x = 95 + (s * (W - 190)) / (n - 1)
      const top = 95
      const span = H - top - 70
      vs.forEach((v, j) => {
        m.set(v, { x, y: top + ((j + 0.5) * span) / vs.length })
      })
    })
    return m
  }, [graph])

  const colW = (W - 190) / (graph.stages.length - 1)

  const kindOf = (from: number, to: number): EdgeKind => {
    const k = `${from}>${to}`
    if (pathEdges.has(k)) return 'path'
    if (candidateEdges.has(k)) return 'candidate'
    if (decisionEdges.has(k)) return 'decision'
    return 'default'
  }

  /** shortened segment so arrow heads sit on the node border */
  const segment = (from: number, to: number) => {
    const a = pos.get(from)!
    const b = pos.get(to)!
    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    const ux = dx / len
    const uy = dy / len
    return { x1: a.x + ux * (R + 2), y1: a.y + uy * (R + 2), x2: b.x - ux * (R + 7), y2: b.y - uy * (R + 7) }
  }

  const labelPos = useMemo(
    () =>
      placeLabels(
        graph.edges.map((e) => {
          const a = pos.get(e.from)!
          const b = pos.get(e.to)!
          return { id: `${e.from}>${e.to}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y }
        }),
        { w: 38, h: 22 },
      ),
    [graph, pos],
  )

  const edges = [...graph.edges].sort(
    (p, q) => EDGE[kindOf(p.from, p.to)].rank - EDGE[kindOf(q.from, q.to)].rank,
  )

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full min-w-[640px]" role="img" aria-label="Multistage graph">
        <defs>
          <filter id={`g-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {(Object.keys(EDGE) as EdgeKind[]).map((k) => (
            <marker
              key={k}
              id={`arrow-${k}-${uid}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="11"
              markerHeight="11"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M0,1 L9,5 L0,9 z" fill={EDGE[k].stroke} />
            </marker>
          ))}
        </defs>

        {/* stage columns */}
        {graph.stages.map((_, s) => {
          const x = 95 + s * colW
          return (
            <g key={`stage-${s}`}>
              <rect
                x={x - 62}
                y={14}
                width={124}
                height={H - 28}
                rx={18}
                fill="rgba(255,255,255,0.025)"
                stroke="rgba(255,255,255,0.06)"
              />
              <text
                x={x}
                y={46}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fill="#9fb0e0"
                fontFamily="Space Grotesk, sans-serif"
              >
                Stage {s + 1}
              </text>
              <text x={x} y={65} textAnchor="middle" fontSize={11} fill="#6272a8" fontFamily="Inter, sans-serif">
                {s === 0 ? 'source' : s === graph.stages.length - 1 ? 'sink' : 'intermediate'}
              </text>
            </g>
          )
        })}

        {/* edges */}
        {edges.map((e) => {
          const kind = kindOf(e.from, e.to)
          const st = EDGE[kind]
          const s = segment(e.from, e.to)
          return (
            <g key={`${e.from}>${e.to}`}>
              {kind === 'path' && (
                <line {...s} stroke={st.stroke} strokeWidth={st.width + 9} opacity={0.16} strokeLinecap="round" />
              )}
              <line
                {...s}
                stroke={st.stroke}
                strokeWidth={st.width}
                opacity={st.opacity}
                strokeLinecap="round"
                markerEnd={`url(#arrow-${kind}-${uid})`}
              />
              {kind === 'path' && (
                <line
                  className="flow-dash"
                  {...s}
                  stroke="#ecfeff"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeDasharray="3 13"
                />
              )}
            </g>
          )
        })}

        {/* edge costs */}
        {edges.map((e) => {
          const kind = kindOf(e.from, e.to)
          const p = labelPos[`${e.from}>${e.to}`]
          const text = String(e.cost)
          const w = text.length * 8.5 + 14
          const active = kind !== 'default'
          return (
            <g key={`c-${e.from}>${e.to}`} transform={`translate(${p.x},${p.y})`} pointerEvents="none">
              <rect
                x={-w / 2}
                y={-10}
                width={w}
                height={20}
                rx={10}
                fill="#060b1d"
                stroke={active ? EDGE[kind].stroke : '#2a3866'}
                strokeWidth={1.2}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontFamily="JetBrains Mono, monospace"
                fill={active ? '#fff' : '#9fb0e0'}
              >
                {text}
              </text>
            </g>
          )
        })}

        {/* vertices */}
        {graph.stages.flat().map((v) => {
          const p = pos.get(v)!
          const isCurrent = v === currentVertex
          const onPath = pathVertices.has(v)
          const cost = costs[v]
          const computed = cost !== null && cost !== undefined
          const stroke = isCurrent ? '#fbbf24' : onPath ? '#22d3ee' : computed ? '#60a5fa' : '#5468a8'
          const fill = isCurrent ? '#4a3508' : onPath ? '#0b3b4d' : computed ? '#0f1c4d' : '#0b1330'
          return (
            <g key={v} transform={`translate(${p.x},${p.y})`}>
              {isCurrent && (
                <circle r={R} fill="none" stroke="#fbbf24" strokeWidth={2.5} className="pulse-ring" />
              )}
              <circle
                r={R}
                fill={fill}
                stroke={stroke}
                strokeWidth={isCurrent || onPath ? 3 : 2}
                filter={isCurrent || onPath ? `url(#g-${uid})` : undefined}
              />
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={17}
                fontWeight={700}
                fill="#f1f5ff"
                fontFamily="Space Grotesk, sans-serif"
              >
                {v}
              </text>
              {computed && (
                <g transform={`translate(0,${R + 17})`}>
                  <rect x={-31} y={-10} width={62} height={20} rx={10} fill="#060b1d" stroke={stroke} strokeWidth={1.2} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={11.5}
                    fontFamily="JetBrains Mono, monospace"
                    fill="#dbeafe"
                  >
                    cost={cost}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
