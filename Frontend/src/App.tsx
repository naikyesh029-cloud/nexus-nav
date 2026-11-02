import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useState } from 'react'
import Layout, { type PageId } from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import MultistagePage from './pages/MultistagePage'
import NavigationPage from './pages/NavigationPage'
import VisualizationPage from './pages/VisualizationPage'
import type { Preset } from './lib/preset'
import { loadRecent, saveRecent, summarize, type RouteSummary } from './lib/recentRoute'
import type { RouteResult } from './services/algorithmService'

export default function App() {
  const [page, setPage] = useState<PageId>('dashboard')
  const [preset, setPreset] = useState<Preset | null>(null)
  const [recent, setRecent] = useState<RouteSummary | null>(loadRecent)

  const go = useCallback((p: PageId, next?: Preset) => {
    setPreset(next ?? null)
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const handleRoute = useCallback((r: RouteResult) => {
    const s = summarize(r)
    setRecent(s)
    saveRecent(s)
  }, [])

  return (
    <Layout page={page} onPage={(p) => go(p)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {page === 'dashboard' && <DashboardPage recent={recent} onGo={go} />}
          {page === 'navigation' && (
            <NavigationPage preset={preset} onRoute={handleRoute} />
          )}
          {page === 'visualization' && <VisualizationPage preset={preset} />}
          {page === 'multistage' && <MultistagePage />}
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}
