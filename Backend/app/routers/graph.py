from typing import List
from fastapi import APIRouter
from app.database import get_campus_graph_from_db
from app.models import GraphData, CampusNode

router = APIRouter(prefix="/api", tags=["Graph"])


@router.get("/graph", response_model=GraphData)
def get_graph():
    return get_campus_graph_from_db()


@router.get("/locations", response_model=List[CampusNode])
def get_locations():
    graph = get_campus_graph_from_db()
    return graph["nodes"]
