import { useId, useMemo, useState } from 'react'
import { CAMPUS_EDGES, CAMPUS_NODES, MAP_HEIGHT, MAP_WIDTH, NODE_BY_ID } from '../data/campusGraph'
import { edgeKey } from '../algorithms/dijkstra'
import { placeLabels } from '../lib/labels'
import { NODE_ICONS } from './nodeIcons'

export type NodeVisual = 'default' | 'visited' | 'frontier' | 'current' | 'path'
export type EdgeVisual = 'default' | 'tree' | 'relax' | 'alt' | 'relaxImproved' | 'path'

const NODE_STYLE: Record<NodeVisual, { fill: string; stroke: string; icon: string; glow: boolean }> = {
  default: { fill: '#0b1330', stroke: '#5468a8', icon: '#aab8e6', glow: false },
  frontier: { fill: '#0f1c4d', stroke: '#60a5fa', icon: '#bfdbfe', glow: false },
  visited: { fill: '#0b3b4d', stroke: '#22d3ee', icon: '#a5f3fc', glow: true },
  path: { fill: '#0b3b4d', stroke: '#22d3ee', icon: '#cffafe', glow: true },
  current: { fill: '#4a3508', stroke: '#fbbf24', icon: '#fde68a', glow: true },
}

const EDGE_STYLE: Record<
  EdgeVisual,
  { stroke: string; width: number; opacity: number; dash?: string; glow?: boolean; flow?: boolean; rank: number }
> = {
  default: { stroke: '#3b4a7a', width: 2, opacity: 0.75, rank: 0 },
  tree: { stroke: '#38bdf8', width: 3, opacity: 0.85, rank: 1 },
  relax: { stroke: '#fbbf24', width: 3.5, opacity: 1, dash: '7 6', rank: 2 },
  alt: { stroke: '#a78bfa', width: 3.5, opacity: 0.95, dash: '10 8', glow: true, rank: 3 },
  relaxImproved: { stroke: '#a78bfa', width: 4.5, opacity: 1, glow: true, rank: 4 },
  path: { stroke: '#22d3ee', width: 5, opacity: 1, glow: true, flow: true, rank: 5 },
}

const R = 27

interface Props {
  nodeStates?: Record<string, NodeVisual>
  /** keyed by edgeKey(a, b) */
  edgeStates?: Record<string, EdgeVisual>
  sourceId?: string
  targetId?: string
  /** small text above a node, e.g. its tentative distance */
  distLabels?: Record<string, string>
  onNodeClick?: (id: string) => void
  showWeights?: boolean
  showTooltip?: boolean
  className?: string
}

export default function CampusGraph({
  nodeStates,
  edgeStates,
  sourceId,
  targetId,
  distLabels,
  onNodeClick,
  showWeights = true,
  showTooltip = true,
  className = '',
}: Props) {
  const uid = useId().replace(/:/g, '')
  const [hovered, setHovered] = useState<string | null>(null)
  const selectable = Boolean(onNodeClick)

  const labelPos = useMemo(
    () =>
      placeLabels(
        CAMPUS_EDGES.map((e) => {
          const a = NODE_BY_ID[e.from]
          const b = NODE_BY_ID[e.to]
          return { id: edgeKey(e.from, e.to), x1: a.x, y1: a.y, x2: b.x, y2: b.y }
        }),
      ),
    [],
  )

  const edges = useMemo(() => {
    const stateOf = (a: string, b: string): EdgeVisual => edgeStates?.[edgeKey(a, b)] ?? 'default'
    return [...CAMPUS_EDGES].sort(
      (p, q) => EDGE_STYLE[stateOf(p.from, p.to)].rank - EDGE_STYLE[stateOf(q.from, q.to)].rank,
    )
  }, [edgeStates])

  const hoveredNode = hovered ? NODE_BY_ID[hovered] : null

  return (
    <div className={`overflow-x-auto ${className}`}>
      <div className="relative min-w-[640px]">
        <svg
          viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
          className="block h-auto w-full"
          role="img"
          aria-label="Interactive campus graph"
        >
          <defs>
            <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <radialGradient id={`bg-${uid}`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor="#101a3d" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#060b1d" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={MAP_WIDTH} height={MAP_HEIGHT} rx="22" fill={`url(#bg-${uid})`} />

          {/* edges */}
          {edges.map((e) => {
            const a = NODE_BY_ID[e.from]
            const b = NODE_BY_ID[e.to]
            const st = EDGE_STYLE[edgeStates?.[edgeKey(e.from, e.to)] ?? 'default']
            return (
              <g key={edgeKey(e.from, e.to)}>
                {st.glow && (
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={st.stroke}
                    strokeWidth={st.width + 9}
                    strokeLinecap="round"
                    opacity={0.16}
                  />
                )}
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={st.stroke}
                  strokeWidth={st.width}
                  strokeLinecap="round"
                  strokeDasharray={st.dash}
                  opacity={st.opacity}
                />
                {st.flow && (
                  <line
                    className="flow-dash"
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#ecfeff"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeDasharray="3 13"
                    opacity={0.95}
                  />
                )}
              </g>
            )
          })}

          {/* weight labels */}
          {showWeights &&
            edges.map((e) => {
              const key = edgeKey(e.from, e.to)
              const p = labelPos[key]
              const st = EDGE_STYLE[edgeStates?.[key] ?? 'default']
              const text = `${e.weight}`
              const w = text.length * 8.5 + 16
              const active = (edgeStates?.[key] ?? 'default') !== 'default'
              return (
                <g key={`l-${key}`} transform={`translate(${p.x},${p.y})`} pointerEvents="none">
                  <rect
                    x={-w / 2}
                    y={-11}
                    width={w}
                    height={22}
                    rx={11}
                    fill="#060b1d"
                    stroke={active ? st.stroke : '#2a3866'}
                    strokeWidth={1.2}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={12.5}
                    fontFamily="JetBrains Mono, monospace"
                    fill={active ? '#ffffff' : '#9fb0e0'}
                  >
                    {text}
                  </text>
                </g>
              )
            })}

          {/* nodes */}
          {CAMPUS_NODES.map((n) => {
            const Icon = NODE_ICONS[n.icon]
            const vis = nodeStates?.[n.id] ?? 'default'
            const st = NODE_STYLE[vis]
            const isSource = n.id === sourceId
            const isTarget = n.id === targetId
            const dist = distLabels?.[n.id]
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                className={selectable ? 'cursor-pointer' : undefined}
                onClick={onNodeClick ? () => onNodeClick(n.id) : undefined}
                onKeyDown={
                  onNodeClick
                    ? (ev) => {
                        if (ev.key === 'Enter' || ev.key === ' ') {
                          ev.preventDefault()
                          onNodeClick(n.id)
                        }
                      }
                    : undefined
                }
                onMouseEnter={() => setHovered(n.id)}
                onMouseLeave={() => setHovered((h) => (h === n.id ? null : h))}
                onFocus={() => setHovered(n.id)}
                onBlur={() => setHovered((h) => (h === n.id ? null : h))}
                tabIndex={selectable ? 0 : undefined}
                role={selectable ? 'button' : undefined}
                aria-label={selectable ? `Select ${n.name}` : n.name}
              >
                {vis === 'current' && (
                  <circle r={R} fill="none" stroke="#fbbf24" strokeWidth={2.5} className="pulse-ring" />
                )}
                {(isSource || isTarget) && (
                  <circle
                    r={R + 8}
                    fill="none"
                    stroke={isSource ? '#22d3ee' : '#a78bfa'}
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    opacity={0.9}
                  />
                )}
                <circle
                  r={R}
                  fill={st.fill}
                  stroke={st.stroke}
                  strokeWidth={vis === 'default' ? 2 : 3}
                  strokeDasharray={vis === 'frontier' ? '4 3' : undefined}
                  filter={st.glow ? `url(#glow-${uid})` : undefined}
                />
                <Icon x={-11} y={-11} size={22} color={st.icon} strokeWidth={2} />

                {(isSource || isTarget) && (
                  <g transform={`translate(${R - 2},${-R + 2})`}>
                    <circle r={10} fill={isSource ? '#22d3ee' : '#a78bfa'} stroke="#060b1d" strokeWidth={2} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={11}
                      fontWeight={700}
                      fill="#04101a"
                    >
                      {isSource ? 'S' : 'D'}
                    </text>
                  </g>
                )}

                <text
                  y={R + 21}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fill="#e6ecff"
                  stroke="#050816"
                  strokeWidth={4.5}
                  paintOrder="stroke"
                  strokeLinejoin="round"
                  fontFamily="Inter, sans-serif"
                >
                  {n.name}
                </text>

                {dist !== undefined && (
                  <g transform={`translate(0,${-R - 17})`}>
                    <rect
                      x={-26}
                      y={-11}
                      width={52}
                      height={22}
                      rx={11}
                      fill="#060b1d"
                      stroke={dist === '∞' ? '#2a3866' : '#60a5fa'}
                      strokeWidth={1.2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize={12.5}
                      fontFamily="JetBrains Mono, monospace"
                      fill={dist === '∞' ? '#7081b8' : '#dbeafe'}
                    >
                      {dist}
                    </text>
                  </g>
                )}
              </g>
            )
          })}
        </svg>

        {showTooltip && hoveredNode && (
          <div
            className="pointer-events-none absolute z-10 w-56 -translate-x-1/2 rounded-xl border border-white/15 bg-[#0a1124]/95 p-3 shadow-xl backdrop-blur"
            style={{
              left: `${(hoveredNode.x / MAP_WIDTH) * 100}%`,
              top: `${(hoveredNode.y / MAP_HEIGHT) * 100}%`,
              transform: 'translate(-50%, calc(-100% - 46px))',
            }}
          >
            <p className="font-display text-sm font-semibold text-white">{hoveredNode.name}</p>
            <p className="mt-1 text-xs leading-snug text-slate-400">{hoveredNode.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
