import { AnimatePresence, motion } from 'framer-motion'
import {
  CheckCircle2,
  CircleDot,
  Code2,
  FastForward,
  Gauge,
  ListOrdered,
  Network,
  Table2,
  Target,
  Zap,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import CampusGraph, { type EdgeVisual, type NodeVisual } from '../components/CampusGraph'
import PlaybackControls, { SPEED_MS } from '../components/PlaybackControls'
import {
  Badge,
  Button,
  CardHeader,
  GlassCard,
  LegendDot,
  LegendLine,
  LocationSelect,
  PageTitle,
  PathChips,
} from '../components/ui'
import {
  DIJKSTRA_PSEUDOCODE,
  edgeKey,
  reconstructPath,
  type DijkstraRun,
  type DijkstraStep,
} from '../algorithms/dijkstra'
import { CAMPUS_NODES, nodeName } from '../data/campusGraph'
import { fmtDist } from '../lib/format'
import { usePlayback } from '../hooks/usePlayback'
import type { Preset } from '../lib/preset'
import { getDijkstraTrace } from '../services/algorithmService'

export default function VisualizationPage({ preset }: { preset: Preset | null }) {
  const [source, setSource] = useState(preset?.source || 'gate')
  const [target, setTarget] = useState(preset?.target || 'hostel')
  const [run, setRun] = useState<DijkstraRun | null>(null)
  const [speed, setSpeed] = useState(3)

  const pb = usePlayback(run?.steps.length ?? 0, SPEED_MS[speed - 1])
  const { reset } = pb

  useEffect(() => {
    let cancelled = false
    void getDijkstraTrace(source).then((r) => {
      if (cancelled) return
      setRun(r)
      reset()
    })
    return () => {
      cancelled = true
    }
  }, [source, reset])

  const step: DijkstraStep | undefined = run?.steps[pb.index]
  const isDone = step?.kind === 'done'

  const finalPath = useMemo(
    () => (step && isDone && target ? reconstructPath(step.prev, source, target) : null),
    [step, isDone, source, target],
  )

  const { nodeStates, edgeStates, distLabels } = useMemo(() => {
    const ns: Record<string, NodeVisual> = {}
    const es: Record<string, EdgeVisual> = {}
    const dl: Record<string, string> = {}
    if (step) {
      for (const n of CAMPUS_NODES) {
        dl[n.id] = fmtDist(step.dist[n.id])
        if (step.visited.includes(n.id)) ns[n.id] = 'visited'
        else if (Number.isFinite(step.dist[n.id])) ns[n.id] = 'frontier'
        const p = step.prev[n.id]
        if (p) es[edgeKey(p, n.id)] = 'tree'
      }
      if (step.current && step.kind !== 'done') ns[step.current] = 'current'
      if (step.edge) es[edgeKey(step.edge.from, step.edge.to)] = step.edge.improved ? 'relaxImproved' : 'relax'
      if (finalPath) {
        finalPath.forEach((id) => (ns[id] = 'path'))
        for (let i = 0; i < finalPath.length - 1; i++) es[edgeKey(finalPath[i], finalPath[i + 1])] = 'path'
      }
    }
    return { nodeStates: ns, edgeStates: es, distLabels: dl }
  }, [step, finalPath])

  // live counters up to the current step
  const counts = useMemo(() => {
    let extractions = 0
    let relaxations = 0
    let updates = 0
    if (run) {
      for (const s of run.steps.slice(0, pb.index + 1)) {
        if (s.kind === 'extract') extractions++
        if (s.kind === 'relax') {
          relaxations++
          if (s.edge?.improved) updates++
        }
      }
    }
    return { extractions, relaxations, updates }
  }, [run, pb.index])

  // keep newest log line in view
  const logRef = useRef<HTMLOListElement>(null)
  useEffect(() => {
    const el = logRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [pb.index])

  const onNodeClick = (id: string) => {
    if (id === target) setTarget(source)
    setSource(id)
  }

  const statusOf = (id: string) => {
    if (!step) return 'Unvisited'
    if (step.current === id && step.kind !== 'done') return 'Current'
    if (step.visited.includes(id)) return 'Visited'
    if (Number.isFinite(step.dist[id])) return 'Frontier'
    return 'Unvisited'
  }

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Algorithm Lab · Greedy"
        title="Dijkstra, step by step"
        description="Every step below is recorded from the real algorithm run. Pick a source, press Start, or step through manually to see which vertex is chosen and which edges are relaxed."
      />

      {/* controls */}
      <GlassCard>
        <div className="grid gap-5 p-5 lg:grid-cols-[220px_220px_1fr]">
          <LocationSelect label="Source" value={source} onChange={(id) => setSource(id || 'gate')} />
          <LocationSelect
            label="Destination (for final path)"
            value={target}
            onChange={setTarget}
            tone="violet"
            placeholder="None"
          />
          <PlaybackControls
            playing={pb.playing}
            index={pb.index}
            total={pb.total}
            speed={speed}
            onSpeed={setSpeed}
            onPlay={pb.play}
            onPause={pb.pause}
            onNext={pb.next}
            onPrev={pb.prev}
            onReset={pb.reset}
          />
        </div>
      </GlassCard>

      {/* graph + table */}
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <GlassCard delay={0.05} className="min-w-0">
          <CardHeader
            icon={Network}
            title="Graph state"
            subtitle="Click any location to make it the new source."
            right={
              <div className="hidden gap-2 sm:flex">
                <Badge tone="amber">Relaxations {counts.relaxations}</Badge>
                <Badge tone="cyan">Visited {step?.visited.length ?? 0}/{CAMPUS_NODES.length}</Badge>
              </div>
            }
          />
          <div className="p-3 sm:p-4">
            <CampusGraph
              nodeStates={nodeStates}
              edgeStates={edgeStates}
              distLabels={distLabels}
              sourceId={source}
              targetId={target || undefined}
              onNodeClick={onNodeClick}
              showTooltip={false}
            />
          </div>

          <AnimatePresence mode="wait">
            {step && (
              <motion.div
                key={step.index}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="mx-4 mb-4 flex items-start gap-3 rounded-xl border border-white/10 bg-black/25 p-4"
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                    step.kind === 'relax'
                      ? step.edge?.improved
                        ? 'bg-violet-400/20 text-violet-200'
                        : 'bg-amber-400/15 text-amber-200'
                      : step.kind === 'extract'
                        ? 'bg-amber-400/15 text-amber-200'
                        : step.kind === 'done'
                          ? 'bg-emerald-400/15 text-emerald-200'
                          : 'bg-cyan-400/15 text-cyan-200'
                  }`}
                >
                  {step.kind === 'done' ? <CheckCircle2 size={16} /> : step.kind === 'extract' ? <Target size={16} /> : step.kind === 'relax' ? <Zap size={16} /> : <CircleDot size={16} />}
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {step.kind === 'init' && 'Initialise'}
                    {step.kind === 'extract' && 'Pick the closest unvisited vertex'}
                    {step.kind === 'relax' && 'Relax an edge'}
                    {step.kind === 'done' && 'Finished'}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-200">{step.message}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/5 px-5 py-3">
            <LegendDot color="#5468a8" ring label="Unvisited (∞)" />
            <LegendDot color="#60a5fa" ring label="Frontier (tentative)" />
            <LegendDot color="#fbbf24" label="Current" />
            <LegendDot color="#22d3ee" label="Visited (final)" />
            <LegendLine color="#fbbf24" dashed label="Edge checked, no gain" />
            <LegendLine color="#a78bfa" label="Edge improved" />
            <LegendLine color="#38bdf8" label="Shortest-path tree" />
          </div>
        </GlassCard>

        {/* distance table */}
        <GlassCard delay={0.1} className="min-w-0">
          <CardHeader icon={Table2} title="Distance table" subtitle={`Shortest distance from ${nodeName(source)}`} />
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 font-medium">Vertex</th>
                  <th className="px-3 py-2 text-right font-medium">dist</th>
                  <th className="px-3 py-2 font-medium">prev</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {CAMPUS_NODES.map((n) => {
                  const st = statusOf(n.id)
                  const updated = step?.updated === n.id
                  return (
                    <tr
                      key={`${n.id}-${updated ? step?.index : 'x'}`}
                      className={`border-t border-white/5 ${updated ? 'row-flash' : ''} ${
                        st === 'Current' ? 'bg-amber-400/10' : n.id === target ? 'bg-violet-400/5' : ''
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-slate-100">
                        {n.name}
                        {n.id === source && <span className="ml-1.5 text-[10px] text-cyan-300">(S)</span>}
                        {n.id === target && <span className="ml-1.5 text-[10px] text-violet-300">(D)</span>}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          step && Number.isFinite(step.dist[n.id]) ? 'text-cyan-200' : 'text-slate-500'
                        }`}
                      >
                        {step ? fmtDist(step.dist[n.id]) : '∞'}
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-400">
                        {step?.prev[n.id] ? nodeName(step.prev[n.id]!) : '—'}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            st === 'Current'
                              ? 'bg-amber-400/20 text-amber-200'
                              : st === 'Visited'
                                ? 'bg-cyan-400/15 text-cyan-200'
                                : st === 'Frontier'
                                  ? 'bg-blue-400/15 text-blue-200'
                                  : 'bg-white/5 text-slate-500'
                          }`}
                        >
                          {st}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* pseudocode / log / result */}
      <div className="grid gap-6 xl:grid-cols-3">
        <GlassCard delay={0.1} className="min-w-0">
          <CardHeader icon={Code2} title="Pseudocode" subtitle="Highlighted lines run in the current step" />
          <pre className="overflow-x-auto p-4 font-mono text-[12.5px] leading-6">
            {DIJKSTRA_PSEUDOCODE.map((line, i) => {
              const active = step?.lines.includes(i)
              return (
                <div
                  key={i}
                  className={`flex whitespace-pre rounded-md px-2 transition-colors ${
                    active ? 'bg-cyan-400/15 text-cyan-100' : 'text-slate-500'
                  }`}
                >
                  <span className="mr-3 w-4 select-none text-right text-slate-600">{i + 1}</span>
                  {line}
                </div>
              )
            })}
          </pre>
        </GlassCard>

        <GlassCard delay={0.15} className="min-w-0">
          <CardHeader
            icon={ListOrdered}
            title="Execution steps"
            subtitle="Click a step to jump to it"
            right={<Badge>{pb.index + 1} done</Badge>}
          />
          <ol ref={logRef} className="max-h-[340px] space-y-1 overflow-y-auto p-3">
            {run?.steps.slice(0, pb.index + 1).map((s) => (
              <li key={s.index}>
                <button
                  onClick={() => pb.goTo(s.index)}
                  className={`flex w-full gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    s.index === pb.index
                      ? 'bg-white/10 text-white ring-1 ring-cyan-300/30'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <span className="mt-0.5 font-mono text-slate-600">{String(s.index).padStart(2, '0')}</span>
                  <span
                    className={
                      s.kind === 'extract'
                        ? 'text-amber-200'
                        : s.kind === 'relax' && s.edge?.improved
                          ? 'text-violet-200'
                          : undefined
                    }
                  >
                    {s.message}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </GlassCard>

        <div className="min-w-0 space-y-6">
          <GlassCard delay={0.2} glow={Boolean(finalPath)}>
            <CardHeader icon={CheckCircle2} title="Final shortest path" />
            <div className="p-5">
              {isDone ? (
                !target ? (
                  <p className="text-sm text-slate-400">Choose a destination to see its final path.</p>
                ) : finalPath ? (
                  <div className="space-y-3">
                    <PathChips items={finalPath.map(nodeName)} />
                    <p className="font-display text-3xl font-bold text-white">
                      {step!.dist[target]} <span className="text-lg font-medium text-slate-400">metres</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      Read by following prev[] from {nodeName(target)} back to {nodeName(source)}.
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-200">{nodeName(target)} is unreachable from {nodeName(source)}.</p>
                )
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">
                    The path appears once the algorithm finishes.
                  </p>
                  <Button variant="outline" icon={FastForward} onClick={pb.jumpToEnd} disabled={!run}>
                    Skip to result
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard delay={0.25}>
            <CardHeader icon={Gauge} title="Complexity" subtitle="Dijkstra's algorithm" />
            <div className="space-y-3 p-5 text-sm">
              <div className="rounded-xl bg-cyan-400/5 p-3 ring-1 ring-cyan-300/15">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Time</p>
                <p className="font-mono text-cyan-200">O(V²) — array scan (this implementation)</p>
                <p className="font-mono text-slate-400">O((V + E) log V) — with a binary min-heap</p>
              </div>
              <div className="rounded-xl bg-violet-400/5 p-3 ring-1 ring-violet-300/15">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Space</p>
                <p className="font-mono text-violet-200">O(V) — dist[], prev[], visited</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  ['Extractions', counts.extractions],
                  ['Relaxations', counts.relaxations],
                  ['Updates', counts.updates],
                ].map(([label, v]) => (
                  <div key={label} className="rounded-lg bg-white/5 p-2">
                    <p className="font-display text-xl font-bold text-white">{v}</p>
                    <p className="text-[10px] text-slate-400">{label}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Counted from this run so far. Requires non-negative edge weights.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
