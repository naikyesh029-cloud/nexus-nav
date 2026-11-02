import { motion } from 'framer-motion'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CAMPUS_NODES } from '../data/campusGraph'

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export function GlassCard({
  children,
  className = '',
  glow = false,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  glow?: boolean
  delay?: number
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: 'easeOut' }}
      className={`glass min-w-0 rounded-2xl ${glow ? 'glass-glow' : ''} ${className}`}
    >
      {children}
    </motion.section>
  )
}

export function CardHeader({
  icon: Icon,
  title,
  subtitle,
  right,
}: {
  icon?: LucideIcon
  title: string
  subtitle?: string
  right?: ReactNode
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-violet-500/20 text-cyan-300 ring-1 ring-white/10">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold leading-tight text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}

export function PageTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-6">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-300/80">{eyebrow}</p>
      <h1 className="mt-1 font-display text-3xl font-bold text-white sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">{description}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type Variant = 'primary' | 'ghost' | 'outline' | 'violet'

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-glow hover:brightness-110 disabled:shadow-none',
  violet:
    'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-glow-violet hover:brightness-110 disabled:shadow-none',
  outline: 'border border-white/15 bg-white/5 text-slate-100 hover:border-cyan-300/50 hover:bg-white/10',
  ghost: 'text-slate-300 hover:bg-white/10 hover:text-white',
}

export function Button({
  variant = 'primary',
  icon: Icon,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; icon?: LucideIcon }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70 disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'cyan',
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
  accent?: 'cyan' | 'violet' | 'blue' | 'amber'
}) {
  const colors = {
    cyan: 'text-cyan-300 from-cyan-400/20',
    violet: 'text-violet-300 from-violet-400/20',
    blue: 'text-blue-300 from-blue-400/20',
    amber: 'text-amber-300 from-amber-400/20',
  }[accent]
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${colors} to-transparent ring-1 ring-white/10`}
        >
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
          <p className="font-display text-2xl font-bold leading-tight text-white">{value}</p>
        </div>
      </div>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

/** a → b → c chips. */
export function PathChips({
  items,
  accent = 'cyan',
}: {
  items: string[]
  accent?: 'cyan' | 'violet'
}) {
  const tone =
    accent === 'cyan'
      ? 'border-cyan-300/30 bg-cyan-400/10 text-cyan-100'
      : 'border-violet-300/30 bg-violet-400/10 text-violet-100'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="flex items-center gap-1.5">
          <span className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${tone}`}>{it}</span>
          {i < items.length - 1 && <ArrowRight size={13} className="text-slate-500" />}
        </span>
      ))}
    </div>
  )
}

export function Badge({
  children,
  tone = 'slate',
}: {
  children: ReactNode
  tone?: 'slate' | 'cyan' | 'violet' | 'amber' | 'green'
}) {
  const tones = {
    slate: 'border-white/10 bg-white/5 text-slate-300',
    cyan: 'border-cyan-300/30 bg-cyan-400/10 text-cyan-200',
    violet: 'border-violet-300/30 bg-violet-400/10 text-violet-200',
    amber: 'border-amber-300/30 bg-amber-400/10 text-amber-200',
    green: 'border-emerald-300/30 bg-emerald-400/10 text-emerald-200',
  }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${tones}`}
    >
      {children}
    </span>
  )
}

export function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={ring ? { border: `2px solid ${color}` } : { background: color }}
      />
      {label}
    </span>
  )
}

export function LegendLine({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <svg width="20" height="8" aria-hidden>
        <line
          x1="0"
          y1="4"
          x2="20"
          y2="4"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={dashed ? '5 4' : undefined}
        />
      </svg>
      {label}
    </span>
  )
}

/** Labelled <select> over campus locations. */
export function LocationSelect({
  label,
  value,
  onChange,
  disabledId,
  placeholder = 'Select a location…',
  tone = 'cyan',
}: {
  label: string
  value: string
  onChange: (id: string) => void
  disabledId?: string
  placeholder?: string
  tone?: 'cyan' | 'violet'
}) {
  return (
    <label className="block">
      <span
        className={`mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wider ${
          tone === 'cyan' ? 'text-cyan-300' : 'text-violet-300'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${tone === 'cyan' ? 'bg-cyan-300' : 'bg-violet-400'}`}
        />
        {label}
      </span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {CAMPUS_NODES.map((n) => (
          <option key={n.id} value={n.id} disabled={n.id === disabledId}>
            {n.name}
          </option>
        ))}
      </select>
    </label>
  )
}
