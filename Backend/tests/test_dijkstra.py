import pytest
from app.algorithms.dijkstra import run_dijkstra, reconstruct_path, path_distance, find_alternative_route

SAMPLE_GRAPH = {
    "nodes": [
        {"id": "A", "name": "Node A"},
        {"id": "B", "name": "Node B"},
        {"id": "C", "name": "Node C"},
        {"id": "D", "name": "Node D"},
        {"id": "X", "name": "Isolated X"}
    ],
    "edges": [
        {"from": "A", "to": "B", "weight": 10},
        {"from": "A", "to": "C", "weight": 30},
        {"from": "B", "to": "C", "weight": 10},
        {"from": "C", "to": "D", "weight": 15}
    ]
}


def test_dijkstra_shortest_path():
    res = run_dijkstra(SAMPLE_GRAPH, "A")
    assert res["dist"]["A"] == 0
    assert res["dist"]["B"] == 10
    assert res["dist"]["C"] == 20  # A -> B (10) -> C (10) = 20 < 30
    assert res["dist"]["D"] == 35  # A -> B -> C -> D = 35

    path = reconstruct_path(res["prev"], "A", "D")
    assert path == ["A", "B", "C", "D"]
    assert path_distance(SAMPLE_GRAPH, path) == 35


def test_dijkstra_unreachable():
    res = run_dijkstra(SAMPLE_GRAPH, "A")
    assert res["dist"]["X"] is None
    path = reconstruct_path(res["prev"], "A", "X")
    assert path is None


def test_dijkstra_invalid_source():
    with pytest.raises(ValueError):
        run_dijkstra(SAMPLE_GRAPH, "UNKNOWN")


def test_dijkstra_alternative_route():
    alt = find_alternative_route(SAMPLE_GRAPH, "A", "C", ["A", "B", "C"])
    assert alt is not None
    assert alt["path"] == ["A", "C"]
    assert alt["distance"] == 30
