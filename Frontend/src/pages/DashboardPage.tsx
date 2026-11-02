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
import { Badge, Button, CardHeader, GlassCard, PathChips, StatTile } from '../components/ui'
import { NODE_ICONS } from '../components/nodeIcons'
import type { PageId } from '../components/Layout'
import { buildAdjacency } from '../algorithms/dijkstra'
import { CAMPUS_EDGES, CAMPUS_GRAPH, CAMPUS_NODES, NODE_BY_ID, nodeName } from '../data/campusGraph'
import { MULTISTAGE_GRAPH } from '../data/multistageGraph'
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
      tone: 'from-cyan-400/25',
    },
    {
      icon: Workflow,
      title: 'Algorithm Visualization',
      text: "Watch Dijkstra's greedy algorithm run step by step.",
      page: 'visualization' as PageId,
      tone: 'from-blue-400/25',
    },
    {
      icon: Layers,
      title: 'Multistage Graph',
      text: 'See dynamic programming solve a 5-stage graph.',
      page: 'multistage' as PageId,
      tone: 'from-violet-400/25',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <GlassCard glow className="relative overflow-hidden p-6 sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl" />
        <div className="relative max-w-3xl">
          <Badge tone="cyan">
            <Sparkles size={12} /> Design & Analysis of Algorithms · Mini Project
          </Badge>
          <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-6xl">
            Welcome to <span className="text-gradient">NEXUS NAV</span>
          </h1>
          <p className="mt-2 font-display text-lg text-slate-300 sm:text-xl">
            Intelligent Campus Navigation System
          </p>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            The campus is modelled as a weighted graph. <b className="text-slate-200">Dijkstra&apos;s greedy
            algorithm</b> finds the shortest walking route between any two locations, and{' '}
            <b className="text-slate-200">dynamic programming</b> solves the shortest path in a multistage graph.
            Every result on screen is computed by the real algorithm.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button icon={NavIcon} onClick={() => onGo('navigation')}>
              Find shortest path
            </Button>
            <Button variant="outline" icon={Workflow} onClick={() => onGo('visualization')}>
              Visualize Dijkstra
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile icon={MapPin} label="Locations" value={CAMPUS_NODES.length} hint="vertices (V)" />
        <StatTile
          icon={GitBranch}
          label="Connections"
          value={CAMPUS_EDGES.length}
          hint="weighted edges (E)"
          accent="blue"
        />
        <StatTile
          icon={Ruler}
          label="Walkway length"
          value={`${totalLength.toLocaleString()} m`}
          hint="sum of all edge weights"
          accent="violet"
        />
        <StatTile
          icon={Cpu}
          label="Algorithms"
          value="2"
          hint="Greedy · Dynamic Programming"
          accent="amber"
        />
      </div>

      {/* Graph + side column */}
      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="lg:col-span-2" delay={0.05}>
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
            className="flex flex-col gap-4 border-t border-white/5 p-5 sm:flex-row sm:items-start"
          >
            <div className="flex items-start gap-3 sm:w-1/2">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30">
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
                    className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 transition hover:border-cyan-300/50"
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
        </GlassCard>

        <div className="min-w-0 space-y-6">
          {/* Recent route */}
          <GlassCard delay={0.1}>
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
          </GlassCard>

          {/* Quick access */}
          <GlassCard delay={0.15}>
            <CardHeader title="Quick access" />
            <div className="space-y-2 p-3">
              {quick.map((q) => (
                <button
                  key={q.page}
                  onClick={() => onGo(q.page)}
                  className={`group flex w-full items-center gap-3 rounded-xl border border-white/5 bg-gradient-to-r ${q.tone} to-transparent p-3 text-left transition hover:border-cyan-300/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60`}
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/30 text-cyan-300">
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
          </GlassCard>
        </div>
      </div>

      {/* Project overview */}
      <GlassCard delay={0.2}>
        <CardHeader
          icon={Sparkles}
          title="Project overview"
          subtitle="Two classic algorithm design techniques on two different graph models"
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-white">Dijkstra&apos;s Algorithm</h4>
              <Badge tone="cyan">Greedy</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Single-source shortest path on the campus graph ({CAMPUS_NODES.length} vertices,{' '}
              {CAMPUS_EDGES.length} edges). Repeatedly picks the unvisited vertex with the smallest tentative
              distance and relaxes its edges.
            </p>
            <p className="mt-3 font-mono text-xs text-cyan-200">
              Time O(V²) with array · O((V+E) log V) with heap &nbsp;|&nbsp; Space O(V)
            </p>
          </div>
          <div className="rounded-xl border border-violet-300/15 bg-violet-400/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="font-display text-lg font-semibold text-white">Multistage Graph</h4>
              <Badge tone="violet">Dynamic Programming</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-400">
              Shortest path in a directed graph split into {MULTISTAGE_GRAPH.stages.length} stages. Costs are
              built backwards from the sink using cost(i) = min {'{'}c(i,j) + cost(j){'}'}.
            </p>
            <p className="mt-3 font-mono text-xs text-violet-200">
              Time O(V+E) &nbsp;|&nbsp; Space O(V)
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  )
}
