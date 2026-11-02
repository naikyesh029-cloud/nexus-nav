import heapq
from typing import Dict, List, Optional, Set, Tuple, Any

INF = float('inf')


def edge_key(a: str, b: str) -> str:
    return f"{a}|{b}" if a < b else f"{b}|{a}"


def build_adjacency(graph: Dict[str, Any], excluded: Optional[Set[str]] = None) -> Tuple[Dict[str, List[Dict[str, Any]]], Dict[str, int]]:
    nodes = graph["nodes"]
    edges = graph["edges"]
    
    order = {node["id"]: i for i, node in enumerate(nodes)}
    adj: Dict[str, List[Dict[str, Any]]] = {node["id"]: [] for node in nodes}
    
    for e in edges:
        u, v, w = e["from"], e["to"], float(e["weight"])
        if excluded and edge_key(u, v) in excluded:
            continue
        adj[u].append({"to": v, "weight": w})
        adj[v].append({"to": u, "weight": w})
        
    for u in adj:
        adj[u].sort(key=lambda item: order.get(item["to"], 0))
        
    return adj, order


def run_dijkstra(graph: Dict[str, Any], source: str, excluded_edges: Optional[Set[str]] = None) -> Dict[str, Any]:
    nodes = graph["nodes"]
    names = {n["id"]: n["name"] for n in nodes}
    
    if source not in names:
        raise ValueError(f"Unknown source vertex '{source}'")
        
    def label(nid: str) -> str:
        return names.get(nid, nid)

    adj, _ = build_adjacency(graph, excluded_edges)
    ids = [n["id"] for n in nodes]

    dist: Dict[str, float] = {nid: INF for nid in ids}
    prev: Dict[str, Optional[str]] = {nid: None for nid in ids}
    visited_set: Set[str] = set()
    visited_list: List[str] = []

    dist[source] = 0.0

    steps: List[Dict[str, Any]] = []

    def fmt_dist(d: float) -> str:
        return "∞" if d == INF else str(int(d) if d.is_integer() else d)
    def dist_dict_for_export() -> Dict[str, Optional[float]]:
        return {k: (None if v == INF else v) for k, v in dist.items()}

    def snap(kind: str, current: Optional[str], edge: Optional[Dict[str, Any]], updated: Optional[str], lines: List[int], message: str):
        steps.append({
            "index": len(steps),
            "kind": kind,
            "current": current,
            "edge": edge,
            "updated": updated,
            "dist": dist_dict_for_export(),
            "prev": dict(prev),
            "visited": list(visited_list),
            "lines": lines,
            "message": message
        })

    snap(
        "init",
        None,
        None,
        None,
        [0, 1],
        f"Initialise: dist[{label(source)}] = 0, all other distances = ∞. Priority queue Q contains all vertices."
    )

    extractions = 0
    relaxations = 0
    updates = 0

    heap: List[Tuple[float, str]] = []
    heapq.heappush(heap, (0.0, source))

    while heap:
        d, u = heapq.heappop(heap)

        if u in visited_set:
            continue

        visited_set.add(u)
        visited_list.append(u)
        extractions += 1

        snap(
            "extract",
            u,
            None,
            None,
            [2, 3, 4],
            f"Extract {label(u)} - smallest tentative distance among unvisited vertices ({fmt_dist(dist[u])}). Greedy choice: its distance is now final."
        )

        for neighbor in adj.get(u, []):
            v = neighbor["to"]
            weight = neighbor["weight"]

            if v in visited_set:
                continue

            relaxations += 1
            before = dist[v]
            alt = dist[u] + weight
            improved = alt < before

            if improved:
                dist[v] = alt
                prev[v] = u
                updates += 1
                heapq.heappush(heap, (alt, v))

            edge_info = {
                "from": u,
                "to": v,
                "weight": weight,
                "improved": improved
            }

            snap(
                "relax",
                u,
                edge_info,
                v if improved else None,
                [5, 6, 7] if improved else [5, 6],
                f"Relax {label(u)} → {label(v)}: {fmt_dist(dist[u])} + {weight} = {fmt_dist(alt)} < {fmt_dist(before)}, so dist[{label(v)}] = {fmt_dist(alt)} and prev = {label(u)}."
                if improved
                else f"Relax {label(u)} → {label(v)}: {fmt_dist(dist[u])} + {weight} = {fmt_dist(alt)} ≥ {fmt_dist(before)}, no improvement."
            )

    unreachable = len(ids) - len(visited_list)
    snap(
        "done",
        None,
        None,
        None,
        [8],
        f"All vertices are visited. dist[] now holds the shortest distance from the source to every vertex. {unreachable} vertex(es) are unreachable from the source."
    )

    return {
        "source": source,
        "dist": dist_dict_for_export(),
        "prev": prev,
        "steps": steps,
        "extractions": extractions,
        "relaxations": relaxations,
        "updates": updates,
        "_raw_dist": dist
    }


def reconstruct_path(prev: Dict[str, Optional[str]], source: str, target: str) -> Optional[List[str]]:
    if target not in prev:
        return None
    path = [target]
    cur = target
    visited = set()
    while cur != source:
        if cur in visited:
            return None
        visited.add(cur)
        p = prev.get(cur)
        if p is None:
            return None
        path.append(p)
        cur = p
    path.reverse()
    return path


def path_segments(graph: Dict[str, Any], path: List[str]) -> List[Dict[str, Any]]:
    edges_map = {}
    for e in graph["edges"]:
        edges_map[edge_key(e["from"], e["to"])] = float(e["weight"])
        
    segments = []
    for i in range(len(path) - 1):
        u, v = path[i], path[i + 1]
        k = edge_key(u, v)
        if k not in edges_map:
            raise ValueError(f"No edge between {u} and {v}")
        segments.append({"from": u, "to": v, "weight": edges_map[k]})
    return segments


def path_distance(graph: Dict[str, Any], path: List[str]) -> float:
    return sum(s["weight"] for s in path_segments(graph, path))


def find_alternative_route(graph: Dict[str, Any], source: str, target: str, primary: List[str]) -> Optional[Dict[str, Any]]:
    primary_id = ">".join(primary)
    best: Optional[Dict[str, Any]] = None
    
    for seg in path_segments(graph, primary):
        ex = {edge_key(seg["from"], seg["to"])}
        run = run_dijkstra(graph, source, excluded_edges=ex)
        path = reconstruct_path(run["prev"], source, target)
        if not path or ">".join(path) == primary_id:
            continue
        dist_val = run["_raw_dist"][target]
        if dist_val != INF:
            if best is None or dist_val < best["distance"]:
                best = {"path": path, "distance": dist_val}
                
    return best