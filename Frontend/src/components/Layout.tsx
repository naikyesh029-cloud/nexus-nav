import { motion } from 'framer-motion'
import { Compass, Layers, LayoutDashboard, Navigation as NavIcon, Workflow } from 'lucide-react'
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type PageId = 'dashboard' | 'navigation' | 'visualization' | 'multistage'

const TABS: { id: PageId; label: string; short: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Dashboard', short: 'Home', icon: LayoutDashboard },
  { id: 'navigation', label: 'Navigation', short: 'Navigate', icon: NavIcon },
  { id: 'visualization', label: 'Algorithm Lab', short: 'Dijkstra', icon: Workflow },
  { id: 'multistage', label: 'Multistage DP', short: 'DP', icon: Layers },
]

export default function Layout({
  page,
  onPage,
  children,
}: {
  page: PageId
  onPage: (p: PageId) => void
  children: ReactNode
}) {
  return (
    <div className="relative min-h-screen">
      <div className="app-bg fixed inset-0 -z-20" />
      <div className="app-grid fixed inset-0 -z-10" />

      <header className="sticky top-0 z-30 border-b border-white/5 bg-[#04060f]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            onClick={() => onPage('dashboard')}
            className="flex items-center gap-3 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
            aria-label="NEXUS NAV home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 shadow-glow">
              <Compass size={22} className="text-slate-950" />
            </span>
            <span className="text-left">
              <span className="block font-display text-lg font-bold leading-none tracking-wide text-white">
                NEXUS<span className="text-gradient"> NAV</span>
              </span>
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Intelligent Campus Navigation System
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 rounded-2xl border border-white/10 bg-white/5 p-1 md:flex">
            {TABS.map((t) => {
              const active = page === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => onPage(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60 ${
                    active ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-400/20 to-violet-500/25 ring-1 ring-cyan-300/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <t.icon size={16} className="relative" />
                  <span className="relative">{t.label}</span>
                </button>
              )
            })}
          </nav>

          <span className="hidden rounded-full border border-violet-300/30 bg-violet-400/10 px-3 py-1 font-mono text-[11px] text-violet-200 lg:inline">
            DAA · Greedy + Dynamic Programming
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#050816]/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => {
            const active = page === t.id
            return (
              <button
                key={t.id}
                onClick={() => onPage(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-cyan-300' : 'text-slate-500'
                }`}
              >
                <t.icon size={20} />
                {t.short}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
