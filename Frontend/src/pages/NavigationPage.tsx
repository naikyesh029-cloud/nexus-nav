import { AnimatePresence, motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowLeftRight,
  Clock,
  Footprints,
  Info,
  Loader2,
  MousePointerClick,
  Navigation as NavIcon,
  Route,
  Ruler,
  RotateCcw,
  Split,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import CampusGraph, { type EdgeVisual, type NodeVisual } from '../components/CampusGraph'
import { NODE_ICONS } from '../components/nodeIcons'
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
  StatTile,
} from '../components/ui'
import { edgeKey } from '../algorithms/dijkstra'
import { NODE_BY_ID, nodeName } from '../data/campusGraph'
import { fmtDuration } from '../lib/format'
import type { Preset } from '../lib/preset'
import {
  calculateRoute,
  ENGINE,
  WALKING_SPEED_MPS,
  type RouteOption,
  type RouteResult,
} from '../services/algorithmService'

interface Props {
  preset: Preset | null
  onRoute: (r: RouteResult) => void
}

export default function NavigationPage({ preset, onRoute }: Props) {
  const [source, setSource] = useState(preset?.source ?? '')
  const [target, setTarget] = useState(preset?.target ?? '')
  const [result, setResult] = useState<RouteResult | null>(null)
  const [showAlt, setShowAlt] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculate = useCallback(
    async (s: string, t: string) => {
      if (!s || !t) {
        setError('Please choose both a starting point and a destination.')
        return
      }
      if (s === t) {
        setError('Starting point and destination must be different.')
        return
      }
      setError(null)
      setLoading(true)
      try {
        const r = await calculateRoute(s, t)
        setResult(r)
        onRoute(r)
      } catch (err) {
        setResult(null)
        setError(err instanceof Error ? err.message : 'Could not calculate the route.')
      } finally {
        setLoading(false)
      }
    },
    [onRoute],
  )

  // Coming from the Dashboard with both ends chosen -> calculate straight away.
  useEffect(() => {
    if (preset?.auto && preset.source && preset.target) void calculate(preset.source, preset.target)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearResult = () => {
    setResult(null)
    setError(null)
  }

  const changeSource = (id: string) => {
    setSource(id)
    clearResult()
  }
  const changeTarget = (id: string) => {
    setTarget(id)
    clearResult()
  }
  const swap = () => {
    setSource(target)
    setTarget(source)
    clearResult()
  }
  const reset = () => {
    setSource('')
    setTarget('')
    clearResult()
  }

  /** Click on the map: 1st click = start, 2nd = destination, 3rd starts over. */
  const onNodeClick = (id: string) => {
    clearResult()
    if (!source || (source && target)) {
      setSource(id)
      setTarget('')
    } else if (id !== source) {
      setTarget(id)
    }
  }

  const { nodeStates, edgeStates } = useMemo(() => {
    const ns: Record<string, NodeVisual> = {}
    const es: Record<string, EdgeVisual> = {}
    if (result) {
      if (showAlt && result.alternative) {
        const alt = result.alternative.path
        alt.forEach((id) => (ns[id] = 'frontier'))
        for (let i = 0; i < alt.length - 1; i++) es[edgeKey(alt[i], alt[i + 1])] = 'alt'
      }
      const p = result.primary.path
      p.forEach((id) => (ns[id] = 'path'))
      for (let i = 0; i < p.length - 1; i++) es[edgeKey(p[i], p[i + 1])] = 'path'
    }
    return { nodeStates: ns, edgeStates: es }
  }, [result, showAlt])

  const hint = !source
    ? 'Click a location on the map (or use the menu) to set your starting point.'
    : !target
      ? 'Now choose a destination.'
      : result
        ? 'Route found. Click any location to start a new route.'
        : 'Ready - press Calculate shortest path.'

  return (
    <div>
      <PageTitle
        eyebrow="Dijkstra · Greedy"
        title="Campus Navigation"
        description="Choose where you are and where you want to go. The shortest walking route is computed with Dijkstra's algorithm and highlighted on the campus graph."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Controls */}
        <div className="min-w-0 space-y-6">
          <GlassCard>
            <CardHeader icon={NavIcon} title="Plan a route" />
            <div className="space-y-4 p-5">
              <LocationSelect
                label="Start"
                value={source}
                onChange={changeSource}
                disabledId={target}
              />
              <div className="flex justify-center">
                <button
                  onClick={swap}
                  disabled={!source && !target}
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:rotate-180 hover:border-cyan-300/50 hover:text-cyan-300 disabled:opacity-30 disabled:hover:rotate-0"
                  aria-label="Swap start and destination"
                  title="Swap"
                >
                  <ArrowLeftRight size={16} className="rotate-90" />
                </button>
              </div>
              <LocationSelect
                label="Destination"
                value={target}
                onChange={changeTarget}
                disabledId={source}
                tone="violet"
              />

              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-400">
                  Algorithm
                </p>
                <button
                  type="button"
                  aria-pressed="true"
                  className="flex w-full items-center gap-3 rounded-xl border border-cyan-300/50 bg-cyan-400/10 p-3 text-left ring-1 ring-cyan-300/20"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-cyan-400/20 text-cyan-300">
                    <Route size={17} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-white">Dijkstra&apos;s Algorithm</span>
                    <span className="block text-xs text-slate-400">Greedy · single-source shortest path</span>
                  </span>
                  <Badge tone="cyan">Selected</Badge>
                </button>
              </div>

              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  icon={loading ? Loader2 : Footprints}
                  disabled={loading || !source || !target}
                  onClick={() => void calculate(source, target)}
                >
                  {loading ? 'Calculating…' : 'Calculate shortest path'}
                </Button>
                <Button
                  variant="outline"
                  icon={RotateCcw}
                  onClick={reset}
                  disabled={!source && !target && !result}
                  aria-label="Reset"
                  title="Reset"
                  className="!px-3"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 rounded-lg border border-amber-300/30 bg-amber-400/10 p-3 text-xs text-amber-200"
                    role="alert"
                  >
                    <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <p className="flex items-start gap-2 text-xs text-slate-500">
                <Info size={14} className="mt-0.5 shrink-0" />
                {ENGINE.note}
              </p>
            </div>
          </GlassCard>
        </div>

        {/* Map + results */}
        <div className="min-w-0 space-y-6">
          <GlassCard delay={0.05}>
            <CardHeader
              icon={MousePointerClick}
              title="Campus map"
              subtitle={hint}
              right={
                result?.alternative && (
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={showAlt}
                      onChange={(e) => setShowAlt(e.target.checked)}
                      className="h-4 w-4 accent-violet-400"
                    />
                    Show alternative
                  </label>
                )
              }
            />
            <div className="p-3 sm:p-4">
              <CampusGraph
                nodeStates={nodeStates}
                edgeStates={edgeStates}
                sourceId={source || undefined}
                targetId={target || undefined}
                onNodeClick={onNodeClick}
              />
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-white/5 px-5 py-3">
              <LegendLine color="#22d3ee" label="Shortest route" />
              <LegendLine color="#a78bfa" label="Alternative route" dashed />
              <LegendDot color="#22d3ee" ring label="Start (S)" />
              <LegendDot color="#a78bfa" ring label="Destination (D)" />
            </div>
          </GlassCard>

          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                key={`${result.source}-${result.target}-${result.computedAt}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatTile
                    icon={Ruler}
                    label="Total distance"
                    value={`${result.primary.distance} m`}
                    hint={(result.primary.segments?.length ?? 0) > 0 ? `${result.primary.segments?.length} segment(s)` : ''}
                  />
                  <StatTile
                    icon={Clock}
                    label="Estimated time"
                    value={fmtDuration(result.primary.seconds)}
                    hint={`walking at ${WALKING_SPEED_MPS} m/s`}
                    accent="violet"
                  />
                  <StatTile
                    icon={Route}
                    label="Locations on route"
                    value={result.primary.path.length}
                    hint={`${result.extractions} extractions · ${result.relaxations} relaxations`}
                    accent="blue"
                  />
                </div>

                <div className="grid gap-6 xl:grid-cols-2">
                  <GlassCard>
                    <CardHeader icon={Footprints} title="Route, step by step" />
                    <ol className="p-5">
                      {result.primary.path.map((id, i, arr) => {
                        const Icon = NODE_ICONS[NODE_BY_ID[id].icon]
                        const seg = result.primary.segments?.[i]
                        const cumulative = result.primary.segments
                      ?.slice(0, i)
                      .reduce((s, x) => s + x.weight, 0)
                        return (
                          <li key={id} className="relative flex gap-4 pb-1">
                            <div className="flex flex-col items-center">
                              <span
                                className={`grid h-9 w-9 place-items-center rounded-full ring-1 ${
                                  i === 0
                                    ? 'bg-cyan-400/20 text-cyan-200 ring-cyan-300/50'
                                    : i === arr.length - 1
                                      ? 'bg-violet-400/20 text-violet-200 ring-violet-300/50'
                                      : 'bg-white/5 text-slate-300 ring-white/15'
                                }`}
                              >
                                <Icon size={16} />
                              </span>
                              {seg && <span className="my-1 w-px flex-1 bg-gradient-to-b from-cyan-300/50 to-violet-300/30" />}
                            </div>
                            <div className="min-w-0 flex-1 pb-4">
                              <p className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
                                <span>
                                  <span className="mr-2 font-mono text-xs text-slate-500">{i + 1}.</span>
                                  {NODE_BY_ID[id].name}
                                </span>
                                <span className="font-mono text-xs text-slate-400">{cumulative ?? 0} m</span>
                              </p>
                              {seg && (
                                <p className="mt-1 text-xs text-cyan-300">
                                  ↓ walk {seg.weight} m to {nodeName(seg.to)}
                                </p>
                              )}
                              {i === 0 && <p className="text-xs text-slate-500">Start</p>}
                              {i === arr.length - 1 && <p className="text-xs text-slate-500">Destination</p>}
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </GlassCard>

                  <AlternativeCard
                    primary={result.primary as RouteOption}
                    alt={result.alternative ?? null}
                    show={showAlt}
                    onToggle={setShowAlt}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function AlternativeCard({
  primary,
  alt,
  show,
  onToggle,
}: {
  primary: RouteOption
  alt: RouteOption | null
  show: boolean
  onToggle: (v: boolean) => void
}) {
  return (
    <GlassCard>
      <CardHeader
        icon={Split}
        title="Alternative route"
        subtitle="Best route that avoids at least one segment of the shortest route"
      />
      <div className="space-y-4 p-5">
        {alt ? (
          <>
            <PathChips items={alt.path.map(nodeName)} accent="violet" />
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-white/5 p-3">
                <p className="font-display text-lg font-bold text-white">{alt.distance} m</p>
                <p className="text-[11px] text-slate-400">distance</p>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <p className="font-display text-lg font-bold text-white">{fmtDuration(alt.seconds)}</p>
                <p className="text-[11px] text-slate-400">time</p>
              </div>
              <div className="rounded-xl bg-violet-400/10 p-3">
                <p className="font-display text-lg font-bold text-violet-200">
                  +{alt.distance - primary.distance} m
                </p>
                <p className="text-[11px] text-slate-400">vs shortest</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => onToggle(!show)} className="w-full">
              {show ? 'Hide alternative on map' : 'Show alternative on map'}
            </Button>
          </>
        ) : (
          <p className="text-sm text-slate-400">
            No other route exists that avoids every segment of the shortest path - it is the only way to
            get there.
          </p>
        )}
      </div>
    </GlassCard>
  )
}
