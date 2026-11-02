import { Pause, Play, RotateCcw, SkipBack, SkipForward } from 'lucide-react'

/** Step interval in ms for speed levels 1..5. */
export const SPEED_MS = [1800, 1300, 900, 550, 300]
export const SPEED_LABEL = ['0.5×', '0.75×', '1×', '1.5×', '2×']

interface Props {
  playing: boolean
  index: number
  total: number
  speed: number
  onSpeed: (level: number) => void
  onPlay: () => void
  onPause: () => void
  onNext: () => void
  onPrev: () => void
  onReset: () => void
}

const btn =
  'grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-300/50 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-35'

export default function PlaybackControls({
  playing,
  index,
  total,
  speed,
  onSpeed,
  onPlay,
  onPause,
  onNext,
  onPrev,
  onReset,
}: Props) {
  const last = Math.max(total - 1, 0)
  const pct = last === 0 ? 0 : (index / last) * 100
  const finished = total > 0 && index >= last

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={playing ? onPause : onPlay}
          disabled={total === 0}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 text-sm font-semibold text-slate-950 shadow-glow transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-40"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
          {playing ? 'Pause' : finished ? 'Replay' : index > 0 ? 'Resume' : 'Start'}
        </button>
        <button onClick={onPrev} disabled={index === 0} className={btn} aria-label="Previous step" title="Previous step">
          <SkipBack size={16} />
        </button>
        <button onClick={onNext} disabled={index >= last} className={btn} aria-label="Next step" title="Next step">
          <SkipForward size={16} />
        </button>
        <button onClick={onReset} disabled={index === 0 && !playing} className={btn} aria-label="Reset" title="Reset">
          <RotateCcw size={16} />
        </button>

        <label className="ml-auto flex items-center gap-2 text-xs text-slate-400">
          Speed
          <input
            type="range"
            min={1}
            max={5}
            value={speed}
            onChange={(e) => onSpeed(Number(e.target.value))}
            className="h-1.5 w-24 cursor-pointer accent-cyan-400"
            aria-label="Playback speed"
          />
          <span className="w-9 font-mono text-slate-300">{SPEED_LABEL[speed - 1]}</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="font-mono text-xs text-slate-400">
          Step {total === 0 ? 0 : index + 1} / {total}
        </span>
      </div>
    </div>
  )
}
