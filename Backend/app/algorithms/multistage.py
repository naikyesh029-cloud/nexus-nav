from typing import Dict, List, Optional, Any


def solve_multistage(graph: Dict[str, Any]) -> Dict[str, Any]:
    stages: List[List[int]] = graph["stages"]
    edges: List[Dict[str, Any]] = graph["edges"]

    if len(stages) < 2:
        raise ValueError("A multistage graph needs at least two stages")

    if len(stages[0]) != 1 or len(stages[-1]) != 1:
        raise ValueError("A multistage graph needs exactly one source and one sink")

    stage_of: Dict[int, int] = {}
    for s_idx, vs in enumerate(stages):
        for v in vs:
            stage_of[v] = s_idx

    for e in edges:
        from_v, to_v = int(e["from"]), int(e["to"])
        if stage_of.get(to_v, -100) != stage_of.get(from_v, -100) + 1:
            raise ValueError(f"Edge {from_v}→{to_v} does not go from stage i to stage i+1")

    out_edges: Dict[int, List[Dict[str, Any]]] = {}
    all_vertices = [v for stage in stages for v in stage]
    for v in all_vertices:
        out_edges[v] = []

    for e in edges:
        from_v, to_v, cost = int(e["from"]), int(e["to"]), float(e["cost"])
        out_edges[from_v].append({"to": to_v, "cost": cost})

    for v in out_edges:
        out_edges[v].sort(key=lambda item: item["to"])

    source = stages[0][0]
    sink = stages[-1][0]

    cost: Dict[int, Optional[float]] = {v: None for v in all_vertices}
    next_hop: Dict[int, Optional[int]] = {v: None for v in all_vertices}
    cost[sink] = 0.0

    steps: List[Dict[str, Any]] = []

    def snap(
        kind: str,
        stage: Optional[int],
        vertex: Optional[int],
        candidates: List[Dict[str, Any]],
        chosen: Optional[int],
        symbolic: str,
        numeric: str,
        message: str
    ):
        steps.append({
            "index": len(steps),
            "kind": kind,
            "stage": stage,
            "vertex": vertex,
            "candidates": candidates,
            "chosen": chosen,
            "cost": dict(cost),
            "next": dict(next_hop),
            "symbolic": symbolic,
            "numeric": numeric,
            "message": message
        })

    snap(
        "init",
        len(stages),
        sink,
        [],
        None,
        f"cost({sink}) = 0",
        "",
        f"Base case: the sink vertex {sink} costs 0 to reach itself. We now work backwards, stage by stage."
    )

    edges_examined = 0

    for s in range(len(stages) - 2, -1, -1):
        for v in stages[s]:
            candidates = []
            for neighbor in out_edges[v]:
                edges_examined += 1
                to_v = neighbor["to"]
                c_edge = neighbor["cost"]
                cost_to = cost[to_v]
                assert cost_to is not None
                candidates.append({
                    "to": to_v,
                    "edgeCost": c_edge,
                    "costTo": cost_to,
                    "total": c_edge + cost_to
                })

            best = candidates[0]
            for cand in candidates:
                if cand["total"] < best["total"]:
                    best = cand

            cost[v] = best["total"]
            next_hop[v] = best["to"]

            sym_terms = [f"c({v},{c['to']}) + cost({c['to']})" for c in candidates]
            symbolic = f"cost({v}) = min{{ {', '.join(sym_terms)} }}"

            num_terms_1 = [f"{int(c['edgeCost']) if c['edgeCost'].is_integer() else c['edgeCost']} + {int(c['costTo']) if c['costTo'].is_integer() else c['costTo']}" for c in candidates]
            num_terms_2 = [f"{int(c['total']) if c['total'].is_integer() else c['total']}" for c in candidates]
            best_val_str = f"{int(best['total']) if best['total'].is_integer() else best['total']}"
            numeric = f"= min{{ {', '.join(num_terms_1)} }} = min{{ {', '.join(num_terms_2)} }} = {best_val_str}"

            snap(
                "compute",
                s + 1,  # 1-based stage
                v,
                candidates,
                best["to"],
                symbolic,
                numeric,
                f"Stage {s + 1}, vertex {v}: cost({v}) = {best_val_str}, reached best through vertex {best['to']}, so d({v}) = {best['to']}."
            )

    # Reconstruct optimal path
    path = [source]
    while path[-1] != sink:
        curr = path[-1]
        nxt = next_hop[curr]
        if nxt is None:
            break
        path.append(nxt)

    # Enumerate all optimal paths (ties)
    optimal_paths: List[List[int]] = []

    def walk(v: int, acc: List[int]):
        if v == sink:
            optimal_paths.append(list(acc))
            return
        for neighbor in out_edges[v]:
            to_v = neighbor["to"]
            c_edge = neighbor["cost"]
            if cost[to_v] is not None and c_edge + cost[to_v] == cost[v]:
                acc.append(to_v)
                walk(to_v, acc)
                acc.pop()

    walk(source, [source])

    snap(
        "done",
        None,
        None,
        [],
        None,
        "d(1) → d(d(1)) → ... follows the stored next hops",
        "",
        f"Optimal cost = {int(cost[source]) if cost[source].is_integer() else cost[source]}. Path read from the d[] table: {' → '.join(map(str, path))}."
    )

    return {
        "steps": steps,
        "cost": cost,
        "next": next_hop,
        "source": source,
        "sink": sink,
        "path": path,
        "totalCost": cost[source],
        "optimalPaths": optimal_paths,
        "vertexCount": len(all_vertices),
        "edgeCount": len(edges),
        "edgesExamined": edges_examined
    }
