from fastapi import APIRouter
from app.database import get_multistage_graph_from_db
from app.models import MultistageGraphData, MultistageResultResponse
from app.algorithms.multistage import solve_multistage

router = APIRouter(prefix="/api/multistage", tags=["Multistage DP"])


@router.get("/graph", response_model=MultistageGraphData)
def get_multistage_graph():
    return get_multistage_graph_from_db()


@router.post("/solve", response_model=MultistageResultResponse)
def solve_multistage_api():
    graph = get_multistage_graph_from_db()
    res = solve_multistage(graph)
    return res


@router.post("/visualize", response_model=MultistageResultResponse)
def visualize_multistage_api():
    graph = get_multistage_graph_from_db()
    res = solve_multistage(graph)
    return res
