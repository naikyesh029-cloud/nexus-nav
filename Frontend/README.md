# NEXUS NAV — Intelligent Campus Navigation System

DAA college project frontend: **Dijkstra's algorithm (Greedy)** + **Multistage graph (Dynamic Programming)**.
React + TypeScript + Vite, Tailwind CSS, Lucide icons, Framer Motion, SVG graphs.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
npm run verify     # proves the algorithms against Bellman-Ford and brute force
```

## Pages

| Page | What it does |
|---|---|
| Dashboard | Campus graph preview (click a node), stats, recent route, quick links, overview |
| Navigation | Pick start/destination (menus or map clicks), Dijkstra route, distance, time, ordered path, alternative route |
| Algorithm Lab | Dijkstra step by step: visited/frontier/current, relaxed edges, distance table, pseudocode, step log, complexity |
| Multistage DP | 5-stage directed graph, DP cost table, stage-wise calculations, optimal path(s), O(V+E) |

## Structure

```
src/data/          graph data only (campusGraph.ts, multistageGraph.ts)
src/algorithms/    pure implementations (dijkstra.ts, multistage.ts) - no React
src/services/      algorithmService.ts  <- the ONLY file the UI calls for computation
src/components/    CampusGraph, MultistageGraphView, PlaybackControls, ui, Layout
src/pages/         the 4 pages
```

## Connecting a backend later

Edit only `src/services/algorithmService.ts`: keep the three function signatures
(`calculateRoute`, `getDijkstraTrace`, `getMultistageSolution`) and replace their bodies with `fetch` calls.
The header comment in that file describes the expected endpoints.

## Honest notes (useful in the viva)

- All results come from the real algorithm; the "engine" label says it runs locally in the browser.
- Dijkstra here uses an array scan: **O(V²)**; with a binary heap it is **O((V+E) log V)**. Both are shown.
- Alternative route = shortest route that avoids at least one segment of the best route (re-runs Dijkstra with each segment removed).
- The multistage example has a tie: cost 16 via `1-2-7-10-12` and `1-3-6-10-12`; the page lets you switch between them.
- Travel time assumes walking at 1.4 m/s.
