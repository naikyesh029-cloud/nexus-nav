import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CAMPUS_NODES } from '../data/campusGraph'

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */
export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`card ${className}`}>
      {children}
    </section>
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
    <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-700">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
            <Icon size={18} />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="font-semibold text-white">{title}</h3>
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
      <p className="font-mono text-xs uppercase tracking-wider text-slate-400">{eyebrow}</p>
      <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-400 sm:text-base">{description}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost'

const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white',
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
      className={`btn ${VARIANTS[variant]} inline-flex items-center justify-center gap-2 ${className}`}
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
}: {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="stat">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-slate-400">{label}</p>
          <p className="text-2xl font-bold leading-tight text-white">{value}</p>
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
  const tone = accent === 'cyan'
    ? 'border-blue-500/30 bg-blue-500/10 text-blue-200'
    : 'border-violet-500/30 bg-violet-500/10 text-violet-200'
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
    slate: 'badge-blue',
    cyan: 'badge-blue',
    violet: 'badge-violet',
    amber: 'badge-amber',
    green: 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30',
  }[tone]
  return (
    <span className={`badge ${tones}`}>
      {children}
    </span>
  )
}

export function LegendDot({ color, label, ring }: { color: string; label: string; ring?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={ring ? { border: `2px solid ${color}`, background: 'transparent' } : { background: color }}
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
          x1="0" y1="4" x2="20" y2="4"
          stroke={color} strokeWidth="3" strokeLinecap="round"
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
}: {
  label: string
  value: string
  onChange: (id: string) => void
  disabledId?: string
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
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