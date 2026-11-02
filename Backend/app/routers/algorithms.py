from fastapi import APIRouter, HTTPException, status
from app.database import get_campus_graph_from_db
from app.models import DijkstraVisualizeRequest, DijkstraRunResponse
from app.algorithms.dijkstra import run_dijkstra

router = APIRouter(prefix="/api/algorithms", tags=["Algorithms"])


@router.post("/dijkstra/visualize", response_model=DijkstraRunResponse)
def visualize_dijkstra(req: DijkstraVisualizeRequest):
    graph = get_campus_graph_from_db()
    node_ids = {n["id"] for n in graph["nodes"]}

    if req.source not in node_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown source location '{req.source}'"
        )

    res = run_dijkstra(graph, req.source)

    return DijkstraRunResponse(
        source=res["source"],
        dist=res["dist"],
        prev=res["prev"],
        steps=res["steps"],
        extractions=res["extractions"],
        relaxations=res["relaxations"],
        updates=res["updates"]
    )
