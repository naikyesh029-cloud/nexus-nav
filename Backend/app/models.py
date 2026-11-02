from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class CampusNode(BaseModel):
    id: str
    name: str
    code: str
    x: float
    y: float
    icon: str
    description: str


class CampusEdge(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    weight: float


class GraphData(BaseModel):
    nodes: List[CampusNode]
    edges: List[CampusEdge]


class MultistageEdgeData(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    from_vertex: int = Field(..., alias="from")
    to_vertex: int = Field(..., alias="to")
    cost: float


class MultistageGraphData(BaseModel):
    stages: List[List[int]]
    edges: List[MultistageEdgeData]


class RouteRequest(BaseModel):
    source: str
    target: str


class RouteSegment(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    weight: float


class RouteOption(BaseModel):
    path: List[str]
    distance: float
    seconds: int
    segments: List[RouteSegment]


class RouteResultResponse(BaseModel):
    algorithm: str = "dijkstra"
    source: str
    target: str
    primary: RouteOption
    alternative: Optional[RouteOption] = None
    extractions: int
    relaxations: int
    engine: str = "fastapi-sqlite"
    computedAt: int


class DijkstraVisualizeRequest(BaseModel):
    source: str
    target: Optional[str] = None


class RelaxedEdge(BaseModel):
    model_config = ConfigDict(populate_by_name=True, serialize_by_alias=True)

    from_node: str = Field(..., alias="from")
    to_node: str = Field(..., alias="to")
    weight: float
    improved: bool


class DijkstraStep(BaseModel):
    index: int
    kind: str  # 'init' | 'extract' | 'relax' | 'done'
    current: Optional[str] = None
    edge: Optional[RelaxedEdge] = None
    updated: Optional[str] = None
    dist: Dict[str, Optional[float]]  # None serialized as null representing infinity
    prev: Dict[str, Optional[str]]
    visited: List[str]
    lines: List[int]
    message: str


class DijkstraRunResponse(BaseModel):
    source: str
    dist: Dict[str, Optional[float]]
    prev: Dict[str, Optional[str]]
    steps: List[DijkstraStep]
    extractions: int
    relaxations: int
    updates: int


class DPCandidate(BaseModel):
    to: int
    edgeCost: float
    costTo: float
    total: float


class DPStep(BaseModel):
    index: int
    kind: str  # 'init' | 'compute' | 'done'
    stage: Optional[int] = None
    vertex: Optional[int] = None
    candidates: List[DPCandidate]
    chosen: Optional[int] = None
    cost: Dict[int, Optional[float]]
    next: Dict[int, Optional[int]]
    symbolic: str
    numeric: str
    message: str


class MultistageResultResponse(BaseModel):
    steps: List[DPStep]
    cost: Dict[int, Optional[float]]
    next: Dict[int, Optional[int]]
    source: int
    sink: int
    path: List[int]
    totalCost: float
    optimalPaths: List[List[int]]
    vertexCount: int
    edgeCount: int
    edgesExamined: int


class RouteHistoryItem(BaseModel):
    id: int
    source: str
    target: str
    path: List[str]
    distance: float
    seconds: int
    computedAt: int


class HealthStatus(BaseModel):
    status: str
    engine: str
    database: str
    location_count: int
    edge_count: int
