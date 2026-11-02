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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button
            onClick={() => onPage('dashboard')}
            className="flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50"
            aria-label="NEXUS NAV home"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600">
              <Compass size={22} className="text-white" />
            </span>
            <span className="text-left">
              <span className="block font-bold text-lg leading-none tracking-wide text-white">
                NEXUS <span className="text-blue-400">NAV</span>
              </span>
              <span className="hidden text-[11px] text-slate-400 sm:block">
                Intelligent Campus Navigation System
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            {TABS.map((t) => {
              const active = page === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => onPage(t.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
                    active
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <t.icon size={16} />
                  <span>{t.label}</span>
                </button>
              )
            })}
          </nav>

          <span className="hidden rounded-full border border-slate-700 bg-slate-800 px-3 py-1 font-mono text-[11px] text-slate-400 lg:inline">
            DAA · Greedy + Dynamic Programming
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 md:pb-12 md:pt-8">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4">
          {TABS.map((t) => {
            const active = page === t.id
            return (
              <button
                key={t.id}
                onClick={() => onPage(t.id)}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
                  active ? 'text-blue-400' : 'text-slate-500'
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