# NEXUS NAV — Intelligent Campus Navigation System

A dual-algorithm campus navigation system implementing **Dijkstra's algorithm** (greedy, single-source shortest path) and **Multistage Graph Dynamic Programming** (backward DP, O(V+E)).

## Architecture

```
nexus nav/
├── Frontend/          # React + TypeScript + Vite + Tailwind
│   ├── src/
│   │   ├── algorithms/    # Dijkstra & Multistage implementations
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Dashboard, Navigation, Algorithm Lab, Multistage DP
│   │   ├── services/      # API client (algorithmService.ts)
│   │   └── data/          # Campus graph & multistage graph definitions
│   └── ...
└── Backend/           # FastAPI + Python + SQLite
    ├── app/
    │   ├── algorithms/    # Dijkstra & Multistage Python implementations
    │   ├── routers/       # REST API endpoints
    │   └── database.py    # SQLite initialization & seeding
    └── tests/             # pytest suite (14 tests)
```

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- uv or pip

### Frontend
```bash
cd Frontend
cp .env.example .env.local   # configure VITE_API_BASE if needed
npm install
npm run dev                  # http://localhost:5173
```

### Backend
```bash
cd Backend
cp .env.example .env         # configure DB, CORS, etc.
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python seed.py               # initialize SQLite database
uvicorn app.main:app --reload --port 8000
```

### Run Both (Development)
```bash
# Terminal 1
cd Backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2
cd Frontend && npm run dev
```

Open http://localhost:5173 — the frontend proxies API calls to http://localhost:8000.

## Features

| Page | Algorithm | Description |
|------|-----------|-------------|
| **Navigation** | Dijkstra | Campus routing: pick start/destination, get shortest walking path |
| **Algorithm Lab** | Dijkstra | Step-by-step visualization of priority queue, relaxations, extractions |
| **Multistage DP** | Backward DP | Directed acyclic graph with stages; costs computed backward from sink |

## Environment Variables

### Frontend (`.env.local`)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE` | `http://localhost:8000` | Backend API base URL |

### Backend (`.env`)
| Variable | Default | Description |
|----------|---------|-------------|
| `NEXUS_NAV_DB` | `./nexus_nav.db` | SQLite path (or Postgres URL) |
| `HOST` | `0.0.0.0` | Server bind address |
| `PORT` | `8000` | Server port |
| `RELOAD` | `true` | Auto-reload on code changes |
| `CORS_ORIGINS` | `*` | Allowed CORS origins |

## Testing

```bash
# Frontend type-check
cd Frontend && npx tsc --noEmit

# Backend tests
cd Backend && source venv/bin/activate && pytest -v
```

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, Lucide React
- **Backend**: FastAPI, Uvicorn, SQLite (stdlib), Pydantic
- **Algorithms**: Custom implementations (no external graph libraries)

## License

MIT