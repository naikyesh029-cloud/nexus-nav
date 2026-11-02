from fastapi import APIRouter
from app.database import get_campus_graph_from_db
from app.models import HealthStatus

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthStatus)
def health_check():
    graph = get_campus_graph_from_db()
    return HealthStatus(
        status="ok",
        engine="FastAPI + Python + SQLite",
        database="SQLite",
        location_count=len(graph["nodes"]),
        edge_count=len(graph["edges"])
    )
