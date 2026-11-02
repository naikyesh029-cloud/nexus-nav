import pytest
from app.algorithms.multistage import solve_multistage

SAMPLE_MULTISTAGE = {
    "stages": [
        [1],
        [2, 3, 4, 5],
        [6, 7, 8],
        [9, 10, 11],
        [12]
    ],
    "edges": [
        {"from": 1, "to": 2, "cost": 9},
        {"from": 1, "to": 3, "cost": 7},
        {"from": 1, "to": 4, "cost": 3},
        {"from": 1, "to": 5, "cost": 2},
        {"from": 2, "to": 6, "cost": 4},
        {"from": 2, "to": 7, "cost": 2},
        {"from": 2, "to": 8, "cost": 1},
        {"from": 3, "to": 6, "cost": 2},
        {"from": 3, "to": 7, "cost": 7},
        {"from": 4, "to": 8, "cost": 11},
        {"from": 5, "to": 7, "cost": 11},
        {"from": 5, "to": 8, "cost": 8},
        {"from": 6, "to": 9, "cost": 6},
        {"from": 6, "to": 10, "cost": 5},
        {"from": 7, "to": 9, "cost": 4},
        {"from": 7, "to": 10, "cost": 3},
        {"from": 8, "to": 10, "cost": 5},
        {"from": 8, "to": 11, "cost": 6},
        {"from": 9, "to": 12, "cost": 4},
        {"from": 10, "to": 12, "cost": 2},
        {"from": 11, "to": 12, "cost": 5}
    ]
}


def test_multistage_solve():
    res = solve_multistage(SAMPLE_MULTISTAGE)
    assert res["totalCost"] == 16
    assert len(res["optimalPaths"]) == 2
    assert [1, 2, 7, 10, 12] in res["optimalPaths"]
    assert [1, 3, 6, 10, 12] in res["optimalPaths"]
    assert res["source"] == 1
    assert res["sink"] == 12


def test_invalid_multistage_graph():
    with pytest.raises(ValueError):
        solve_multistage({"stages": [[1]], "edges": []})
