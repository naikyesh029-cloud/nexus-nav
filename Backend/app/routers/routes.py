import time
import math
from typing import List
from fastapi import APIRouter, HTTPException, status
from app.database import get_campus_graph_from_db, save_route_history, get_route_histories
from app.models import RouteRequest, RouteResultResponse, RouteOption, RouteSegment, RouteHistoryItem
from app.algorithms.dijkstra import run_dijkstra, reconstruct_path, path_distance, path_segments, find_alternative_route

router = APIRouter(prefix="/api", tags=["Routes"])

WALKING_SPEED_MPS = 1.4


def make_route_option(graph, path: List[str]) -> RouteOption:
    dist = path_distance(graph, path)
    seconds = int(round(dist / WALKING_SPEED_MPS))
    segs = [
        RouteSegment(from_node=s["from"], to_node=s["to"], weight=s["weight"])
        for s in path_segments(graph, path)
    ]
    return RouteOption(
        path=path,
        distance=dist,
        seconds=seconds,
        segments=segs
    )


@router.post("/routes/shortest-path", response_model=RouteResultResponse)
def compute_shortest_path(req: RouteRequest):
    graph = get_campus_graph_from_db()
    node_ids = {n["id"] for n in graph["nodes"]}

    if req.source not in node_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown source location '{req.source}'")

    if req.target not in node_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unknown target location '{req.target}'")

    if req.source == req.target:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source and destination must be different locations.")

    run_res = run_dijkstra(graph, req.source)
    path = reconstruct_path(run_res["prev"], req.source, req.target)

    if not path:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No route exists between the selected locations.")

    primary_opt = make_route_option(graph, path)

    alt_res = find_alternative_route(graph, req.source, req.target, path)
    alt_opt = make_route_option(graph, alt_res["path"]) if alt_res else None

    computed_at = int(time.time() * 1000)

    # Save to route history in SQLite database
    save_route_history(
        source=req.source,
        target=req.target,
        path=path,
        distance=primary_opt.distance,
        seconds=primary_opt.seconds,
        computed_at=computed_at
    )

    return RouteResultResponse(
        algorithm="dijkstra",
        source=req.source,
        target=req.target,
        primary=primary_opt,
        alternative=alt_opt,
        extractions=run_res["extractions"],
        relaxations=run_res["relaxations"],
        engine="fastapi-sqlite",
        computedAt=computed_at
    )


@router.get("/routes/history", response_model=List[RouteHistoryItem])
def get_history(limit: int = 20):
    return get_route_histories(limit=limit)
