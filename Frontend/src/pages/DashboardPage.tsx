import {
  ArrowRight,
  Clock,
  Cpu,
  GitBranch,
  Layers,
  MapPin,
  Navigation as NavIcon,
  Network,
  Route,
  Ruler,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import CampusGraph, { type NodeVisual } from '../components/CampusGraph'
import { Badge, Button, Card, CardHeader, PathChips, StatTile } from '../components/ui'
import { NODE_ICONS } from '../components/nodeIcons'
import type { PageId } from '../components/Layout'
import { buildAdjacency } from '../algorithms/dijkstra'
import { CAMPUS_EDGES, CAMPUS_GRAPH, CAMPUS_NODES, NODE_BY_ID, nodeName } from '../data/campusGraph'
import { fmtClock, fmtDuration } from '../lib/format'
import type { Preset } from '../lib/preset'
import type { RouteSummary } from '../lib/recentRoute'

interface Props {
  recent: RouteSummary | null
  onGo: (page: PageId, preset?: Preset) => void
}

export default function DashboardPage({ recent, onGo }: Props) {
  const [selected, setSelected] = useState<string>('library')
  const adjacency = useMemo(() => buildAdjacency(CAMPUS_GRAPH), [])
  const totalLength = CAMPUS_EDGES.reduce((s, e) => s + e.weight, 0)
  const sel = NODE_BY_ID[selected]
  const SelIcon = NODE_ICONS[sel.icon]
  const neighbours = adjacency.get(selected) ?? []

  const nodeStates: Record<string, NodeVisual> = { [selected]: 'path' }

  const quick = [
    {
      icon: NavIcon,
      title: 'Shortest Path Navigation',
      text: 'Pick two locations and get the optimal walking route.',
      page: 'navigation' as PageId,
    },
    {
      icon: Workflow,
      title: 'Algorithm Visualization',
      text: "Watch Dijkstra's greedy algorithm run step by step.",
      page: 'visualization' as PageId,
    },
    {
      icon: Layers,
      title: 'Multistage Graph',
      text: 'See dynamic programming solve a 5-stage graph.',
      page: 'multistage' as PageId,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <Card className="relative overflow-hidden p-6 sm:p-9">
        <div className="relative max-w-3xl">
         
          
          
          
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon={NavIcon} onClick={() => onGo('navigation')}>
              Find shortest path
            </Button>
            <Button variant="outline" icon={Workflow} onClick={() => onGo('visualization')}>
              Visualize Dijkstra
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={MapPin} label="Locations" value={CAMPUS_NODES.length} hint="vertices (V)" />
        <StatTile
          icon={GitBranch}
          label="Connections"
          value={CAMPUS_EDGES.length}
          hint="weighted edges (E)"
        />
        <StatTile
          icon={Ruler}
          label="Walkway length"
          value={`${totalLength.toLocaleString()} m`}
          hint="sum of all edge weights"
        />
        <StatTile
          icon={Cpu}
          label="Algorithms"
          value="2"
          hint="Greedy · Dynamic Programming"
        />
      </div>

      {/* Graph + side column */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            icon={Network}
            title="Campus graph"
            subtitle="Hover or click a location to inspect it. Numbers on edges are distances in metres."
            right={<Badge tone="violet">Interactive</Badge>}
          />
          <div className="p-3 sm:p-4">
            <CampusGraph
              nodeStates={nodeStates}
              sourceId={undefined}
              onNodeClick={setSelected}
              showTooltip={false}
            />
          </div>
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 border-t border-slate-700 p-5 sm:flex-row sm:items-start"
          >
            <div className="flex items-start gap-3 sm:w-1/2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-slate-800 text-cyan-300 border border-slate-700">
                <SelIcon size={20} />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-white">{sel.name}</p>
                <p className="mt-0.5 text-sm text-slate-400">{sel.description}</p>
              </div>
            </div>
            <div className="flex-1">
              <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
                Connected to ({neighbours.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {neighbours.map((n) => (
                  <button
                    key={n.to}
                    onClick={() => setSelected(n.to)}
                    className="rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-200 transition hover:border-blue-500/50"
                  >
                    {nodeName(n.to)} <span className="font-mono text-cyan-300">{n.weight} m</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => onGo('navigation', { source: selected })}
                className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-300 hover:text-cyan-200"
              >
                Navigate from here <ArrowRight size={14} />
              </button>
            </div>
          </motion.div>
        </Card>

        <div className="min-w-0 space-y-6">
          {/* Recent route */}
          <Card>
            <CardHeader icon={Route} title="Recently calculated route" />
            <div className="p-5">
              {recent ? (
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-lg font-semibold text-white">
                      {nodeName(recent.source)} → {nodeName(recent.target)}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Ruler size={14} className="text-cyan-300" /> {recent.distance} m
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock size={14} className="text-violet-300" /> {fmtDuration(recent.seconds)}
                      </span>
                      <span className="text-xs text-slate-500">at {fmtClock(recent.computedAt)}</span>
                    </p>
                  </div>
                  <PathChips items={recent.path.map(nodeName)} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className="!px-3 !py-2"
                      onClick={() =>
                        onGo('navigation', { source: recent.source, target: recent.target, auto: true })
                      }
                    >
                      Open on map
                    </Button>
                    <Button
                      variant="ghost"
                      className="!px-3 !py-2"
                      onClick={() =>
                        onGo('visualization', { source: recent.source, target: recent.target })
                      }
                    >
                      Trace in Algorithm Lab
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-sm text-slate-400">
                    No route calculated yet. Run one and it will appear here.
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={() => onGo('navigation', { source: 'gate', target: 'hostel', auto: true })}
                  >
                    Try Main Gate → Hostel
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Quick access */}
          <Card>
            <CardHeader title="Quick access" />
            <div className="space-y-2 p-3">
              {quick.map((q) => (
                <button
                  key={q.page}
                  onClick={() => onGo(q.page)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 p-3 text-left transition hover:border-blue-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-900/50 text-cyan-300 border border-slate-700">
                    <q.icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white">{q.title}</span>
                    <span className="block text-xs text-slate-400">{q.text}</span>
                  </span>
                  <ArrowRight
                    size={16}
                    className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-cyan-300"
                  />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Project overview */}
      <Card>
        <CardHeader
          icon={Sparkles}
          title="Project overview"
          subtitle="Two classic algorithm design techniques on two different graph models"
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="rounded-lg border border-blue-500/15 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-white">Dijkstra's Algorithm</h4>
              <Badge tone="cyan">Greedy</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Single-source shortest path on the campus graph ({CAMPUS_NODES.length} vertices,{' '}
              {CAMPUS_EDGES.length} edges). Repeatedly picks the unvisited vertex with the smallest tentative
              distance and relaxes its edges.
            </p>
            <p className="mt-3 font-mono text-xs text-blue-200">
              Time O(V²) with array · O((V+E) log V) with heap &nbsp;|&nbsp; Space O(V)
            </p>
          </div>
          <div className="rounded-lg border border-violet-500/15 bg-violet-500/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-white">Multistage Graph</h4>
              <Badge tone="violet">Dynamic Programming</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Shortest path in a directed graph split into stages. Costs are built backwards from the sink using the recurrence cost(i) = min over edges.
            </p>
            <p className="mt-3 font-mono text-xs text-violet-200">
              Time O(V+E) &nbsp;|&nbsp; Space O(V)
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}