from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import health, graph, routes, algorithms, multistage


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB and seed initial data on startup
    init_db()
    yield


app = FastAPI(
    title="NEXUS NAV API",
    description="Backend for NEXUS NAV: Intelligent Campus Navigation System",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for React frontend (development and production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(graph.router)
app.include_router(routes.router)
app.include_router(algorithms.router)
app.include_router(multistage.router)


@app.get("/")
def root():
    return {
        "project": "NEXUS NAV",
        "description": "Intelligent Campus Navigation System API",
        "docs": "/docs",
        "health": "/api/health"
    }
