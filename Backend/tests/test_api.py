import os
import pytest
from fastapi.testclient import TestClient

os.environ["NEXUS_NAV_DB"] = "/tmp/test_nexus_nav.db"

from app.main import app
from app.database import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["location_count"] == 9
    assert data["edge_count"] == 17


def test_graph_and_locations_endpoints():
    res1 = client.get("/api/graph")
    assert res1.status_code == 200
    assert len(res1.json()["nodes"]) == 9

    res2 = client.get("/api/locations")
    assert res2.status_code == 200
    assert len(res2.json()) == 9


def test_shortest_path_success():
    res = client.post("/api/routes/shortest-path", json={"source": "gate", "target": "hostel"})
    assert res.status_code == 200
    data = res.json()
    assert data["algorithm"] == "dijkstra"
    assert data["source"] == "gate"
    assert data["target"] == "hostel"
    assert data["primary"]["path"][0] == "gate"
    assert data["primary"]["path"][-1] == "hostel"
    assert data["primary"]["distance"] > 0


def test_shortest_path_same_source_target():
    res = client.post("/api/routes/shortest-path", json={"source": "gate", "target": "gate"})
    assert res.status_code == 400
    assert "different" in res.json()["detail"].lower()


def test_shortest_path_invalid_location():
    res = client.post("/api/routes/shortest-path", json={"source": "nonexistent", "target": "hostel"})
    assert res.status_code == 400
    assert "unknown" in res.json()["detail"].lower()


def test_dijkstra_visualize():
    res = client.post("/api/algorithms/dijkstra/visualize", json={"source": "gate"})
    assert res.status_code == 200
    data = res.json()
    assert data["source"] == "gate"
    assert len(data["steps"]) > 0


def test_multistage_graph_and_solve():
    res_g = client.get("/api/multistage/graph")
    assert res_g.status_code == 200
    assert len(res_g.json()["stages"]) == 5

    res_s = client.post("/api/multistage/solve")
    assert res_s.status_code == 200
    data = res_s.json()
    assert data["totalCost"] == 16
    assert data["source"] == 1
    assert data["sink"] == 12


def test_route_history():
    client.post("/api/routes/shortest-path", json={"source": "gate", "target": "hostel"})
    res = client.get("/api/routes/history")
    assert res.status_code == 200
    history = res.json()
    assert len(history) >= 1
    assert history[0]["source"] == "gate"
    assert history[0]["target"] == "hostel"
