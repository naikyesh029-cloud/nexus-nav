import { AnimatePresence, motion } from 'framer-motion'
import {
  Calculator,
  CheckCircle2,
  FastForward,
  Gauge,
  Layers,
  Lightbulb,
  Network,
  Table2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useEffect } from 'react'
import MultistageGraphView from '../components/MultistageGraphView'
import PlaybackControls, { SPEED_MS } from '../components/PlaybackControls'
import {
  Badge,
  Button,
  CardHeader,
  GlassCard,
  LegendDot,
  LegendLine,
  PageTitle,
  PathChips,
} from '../components/ui'
import { MULTISTAGE_GRAPH } from '../data/multistageGraph'
import { usePlayback } from '../hooks/usePlayback'
import type { DPStep, MultistageResult } from '../algorithms/multistage'
import { getMultistageSolution } from '../services/algorithmService'

const ROWS = MULTISTAGE_GRAPH.stages.flatMap((vs, s) => vs.map((v) => ({ v, stage: s + 1 })))

export default function MultistagePage() {
  const [solution, setSolution] = useState<MultistageResult | null>(null)
  const [speed, setSpeed] = useState(3)
  const [pathChoice, setPathChoice] = useState(0)

  useEffect(() => {
    let cancelled = false
    void getMultistageSolution().then((r) => {
      if (!cancelled) setSolution(r)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const pb = usePlayback(solution?.steps.length ?? 0, SPEED_MS[speed - 1])
  const step: DPStep | undefined = solution?.steps[pb.index]
  const isDone = step?.kind === 'done'

  const activePath = solution ? (solution.optimalPaths[pathChoice] ?? solution.path) : []

  const view = useMemo(() => {
    const candidateEdges = new Set<string>()
    const decisionEdges = new Set<string>()
    const pathEdges = new Set<string>()
    const pathVertices = new Set<number>()
    if (step) {
      if (step.kind === 'compute' && step.vertex !== null) {
        step.candidates.forEach((c) => candidateEdges.add(`${step.vertex}>${c.to}`))
      }
      for (const [v, nx] of Object.entries(step.next)) {
        if (nx !== null) decisionEdges.add(`${v}>${nx}`)
      }
      if (isDone) {
        activePath.forEach((v, i) => {
          pathVertices.add(v)
          if (i < activePath.length - 1) pathEdges.add(`${v}>${activePath[i + 1]}`)
        })
      }
    }
    return { candidateEdges, decisionEdges, pathEdges, pathVertices }
  }, [step, isDone, activePath])

  // stage-wise calculations done so far, newest stage first
  const grouped = useMemo(() => {
    if (!solution) return []
    const done = solution.steps.slice(0, pb.index + 1).filter((s) => s.kind === 'compute')
    const map = new Map<number, DPStep[]>()
    for (const s of done) {
      const list = map.get(s.stage!) ?? []
      list.push(s)
      map.set(s.stage!, list)
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0])
  }, [solution, pb.index])

  const sinkStage = MULTISTAGE_GRAPH.stages.length

  return (
    <div className="space-y-6">
      <PageTitle
        eyebrow="Algorithm Lab · Dynamic Programming"
        title="Multistage Graph"
        description="A directed graph divided into stages where every edge goes from one stage to the next. Costs are computed backwards from the sink, and each result is stored so it is never recomputed."
      />

      {/* recurrence + controls */}
      <GlassCard>
        <div className="grid gap-5 p-5 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-violet-300/20 bg-violet-400/5 p-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-violet-300">
              <Lightbulb size={14} /> Backward DP recurrence
            </p>
            <p className="mt-2 font-mono text-sm leading-7 text-slate-100">
              cost(sink) = 0<br />
              cost(i) = min <span className="text-slate-500">{'{'}</span> c(i,j) + cost(j) <span className="text-slate-500">{'}'}</span>
              <br />
              d(i) = the j that gives the minimum
            </p>
            <p className="mt-2 text-xs text-slate-500">
              j ranges over the vertices in the next stage that i has an edge to.
            </p>
          </div>
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

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* graph */}
        <GlassCard delay={0.05} className="min-w-0">
          <CardHeader
            icon={Network}
            title="Directed multistage graph"
            subtitle={`${MULTISTAGE_GRAPH.stages.length} stages · ${solution?.vertexCount ?? 12} vertices · ${solution?.edgeCount ?? 21} edges`}
            right={
              step?.kind === 'compute' && (
                <Badge tone="amber">
                  Stage {step.stage} · vertex {step.vertex}
                </Badge>
              )
            }
          />
          <div className="p-3 sm:p-4">
            <MultistageGraphView
              graph={MULTISTAGE_GRAPH}
              currentVertex={step?.kind === 'compute' || step?.kind === 'init' ? step.vertex : null}
              costs={step?.cost ?? {}}
              candidateEdges={view.candidateEdges}
              decisionEdges={view.decisionEdges}
              pathEdges={view.pathEdges}
              pathVertices={view.pathVertices}
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
                className="mx-4 mb-4 rounded-xl border border-white/10 bg-black/25 p-4"
              >
                <p className="text-sm text-slate-200">{step.message}</p>
                {step.kind === 'compute' && (
                  <div className="mt-3 space-y-1 font-mono text-[13px] leading-6">
                    <p className="text-slate-400">{step.symbolic}</p>
                    <p className="text-cyan-200">{step.numeric}</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 border-t border-white/5 px-5 py-3">
            <LegendDot color="#5468a8" ring label="Not computed" />
            <LegendDot color="#60a5fa" ring label="cost known" />
            <LegendDot color="#fbbf24" label="Being computed" />
            <LegendLine color="#a78bfa" label="Candidates compared" />
            <LegendLine color="#60a5fa" label="Chosen next hop d(v)" />
            <LegendLine color="#22d3ee" label="Optimal path" />
          </div>
        </GlassCard>

        {/* DP table */}
        <GlassCard delay={0.1} className="min-w-0">
          <CardHeader icon={Table2} title="DP cost table" subtitle="Filled from stage 5 back to stage 1" />
          <div className="overflow-x-auto p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2 font-medium">Stage</th>
                  <th className="px-3 py-2 font-medium">Vertex</th>
                  <th className="px-3 py-2 text-right font-medium">cost(v)</th>
                  <th className="px-3 py-2 text-right font-medium">d(v)</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ v, stage }) => {
                  const c = step?.cost[v]
                  const known = c !== null && c !== undefined
                  const isCur = step?.vertex === v && step.kind !== 'done'
                  const onPath = isDone && view.pathVertices.has(v)
                  return (
                    <tr
                      key={`${v}-${isCur ? step?.index : 'x'}`}
                      className={`border-t border-white/5 ${isCur ? 'row-flash bg-amber-400/10' : onPath ? 'bg-cyan-400/10' : ''}`}
                    >
                      <td className="px-3 py-1.5 text-xs text-slate-500">
                        {stage}
                        {stage === 1 && ' (src)'}
                        {stage === sinkStage && ' (sink)'}
                      </td>
                      <td className="px-3 py-1.5 font-display font-semibold text-white">{v}</td>
                      <td className={`px-3 py-1.5 text-right font-mono ${known ? 'text-cyan-200' : 'text-slate-600'}`}>
                        {known ? c : '—'}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-slate-300">
                        {step?.next[v] ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* stage-wise calculations */}
        <GlassCard delay={0.1} className="min-w-0 xl:col-span-2">
          <CardHeader
            icon={Calculator}
            title="Stage-wise calculations"
            subtitle="Every vertex of a stage uses only costs from the stage after it"
          />
          <div className="max-h-[420px] space-y-5 overflow-y-auto p-5">
            {grouped.length === 0 && (
              <p className="text-sm text-slate-400">
                Press <b className="text-slate-200">Start</b> or <b className="text-slate-200">Next</b> to begin. The
                first computed stage is stage {sinkStage - 1}, because stage {sinkStage} is the sink with cost 0.
              </p>
            )}
            {grouped.map(([stage, list]) => (
              <div key={stage}>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-300">
                  <Layers size={13} /> Stage {stage}
                  <span className="font-normal normal-case tracking-normal text-slate-500">
                    — uses costs from stage {stage + 1}
                  </span>
                </p>
                <div className="space-y-2">
                  {list.map((s) => (
                    <div
                      key={s.index}
                      className={`rounded-xl border p-3 font-mono text-[12.5px] leading-6 ${
                        s.index === pb.index
                          ? 'border-amber-300/40 bg-amber-400/10'
                          : 'border-white/10 bg-white/[0.03]'
                      }`}
                    >
                      <p className="text-slate-400">{s.symbolic}</p>
                      <p className="text-cyan-200">{s.numeric}</p>
                      <p className="text-violet-200">→ d({s.vertex}) = {s.chosen}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="min-w-0 space-y-6">
          <GlassCard delay={0.15} glow={isDone}>
            <CardHeader icon={CheckCircle2} title="Optimal path & cost" />
            <div className="p-5">
              {isDone && solution ? (
                <div className="space-y-3">
                  <p className="font-display text-4xl font-bold text-white">
                    {solution.totalCost}{' '}
                    <span className="text-lg font-medium text-slate-400">minimum cost</span>
                  </p>
                  <PathChips items={activePath.map(String)} />
                  {solution.optimalPaths.length > 1 && (
                    <div className="space-y-2 rounded-xl bg-violet-400/10 p-3 ring-1 ring-violet-300/20">
                      <p className="text-xs text-violet-100">
                        Tie: {solution.optimalPaths.length} different paths all cost {solution.totalCost}. Show:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {solution.optimalPaths.map((p, i) => (
                          <button
                            key={p.join('-')}
                            onClick={() => setPathChoice(i)}
                            className={`rounded-lg border px-2.5 py-1 font-mono text-xs transition ${
                              i === pathChoice
                                ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100'
                                : 'border-white/10 text-slate-300 hover:border-white/30'
                            }`}
                          >
                            {p.join('→')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">
                    Read from the table: start at vertex {solution.source} and keep following d(v) until the sink.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate-400">
                    The optimal path is revealed once every stage has been computed.
                  </p>
                  <Button variant="outline" icon={FastForward} onClick={pb.jumpToEnd} disabled={!solution}>
                    Show optimal path
                  </Button>
                </div>
              )}
            </div>
          </GlassCard>

          <GlassCard delay={0.2}>
            <CardHeader icon={Gauge} title="Complexity" subtitle="Multistage graph DP" />
            <div className="space-y-3 p-5 text-sm">
              <div className="rounded-xl bg-cyan-400/5 p-3 ring-1 ring-cyan-300/15">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Time</p>
                <p className="font-mono text-lg text-cyan-200">O(V + E)</p>
                <p className="mt-1 text-xs text-slate-400">
                  Each vertex is computed once and each edge examined once:{' '}
                  {solution
                    ? `${solution.vertexCount} vertices + ${solution.edgesExamined} edges = ${solution.vertexCount + solution.edgesExamined} operations here.`
                    : '…'}
                </p>
              </div>
              <div className="rounded-xl bg-violet-400/5 p-3 ring-1 ring-violet-300/15">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">Space</p>
                <p className="font-mono text-lg text-violet-200">O(V)</p>
                <p className="mt-1 text-xs text-slate-400">cost[] and d[] arrays, one entry per vertex.</p>
              </div>
              <p className="flex items-start gap-2 text-xs text-slate-500">
                <Lightbulb size={14} className="mt-0.5 shrink-0 text-amber-300" />
                Why DP? Optimal substructure (the best path from i uses a best path from j) and overlapping
                subproblems (e.g. cost(10) is reused by vertices 6, 7 and 8).
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
