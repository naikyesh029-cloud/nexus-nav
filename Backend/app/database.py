import sqlite3
import json
import os
from typing import List, Dict, Any

DB_PATH = os.environ.get("NEXUS_NAV_DB", os.path.join(os.path.dirname(os.path.dirname(__file__)), "nexus_nav.db"))


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS locations (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            x REAL NOT NULL,
            y REAL NOT NULL,
            icon TEXT NOT NULL,
            description TEXT NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_node TEXT NOT NULL,
            to_node TEXT NOT NULL,
            weight REAL NOT NULL,
            FOREIGN KEY (from_node) REFERENCES locations (id),
            FOREIGN KEY (to_node) REFERENCES locations (id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS multistage_vertices (
            vertex_id INTEGER PRIMARY KEY,
            stage INTEGER NOT NULL
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS multistage_edges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_vertex INTEGER NOT NULL,
            to_vertex INTEGER NOT NULL,
            cost REAL NOT NULL,
            FOREIGN KEY (from_vertex) REFERENCES multistage_vertices (vertex_id),
            FOREIGN KEY (to_vertex) REFERENCES multistage_vertices (vertex_id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS route_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            target TEXT NOT NULL,
            path TEXT NOT NULL,
            distance REAL NOT NULL,
            seconds INTEGER NOT NULL,
            computed_at INTEGER NOT NULL
        )
    """)

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM locations")
    if cursor.fetchone()[0] == 0:
        seed_campus_graph(conn)

    cursor.execute("SELECT COUNT(*) FROM multistage_vertices")
    if cursor.fetchone()[0] == 0:
        seed_multistage_graph(conn)

    conn.close()

def seed_campus_graph(conn):
    cursor = conn.cursor()
    nodes = [
        ('gate', 'Main Gate', 'MG', 80, 310, 'gate', 'Primary entrance with security check-post. Every visitor starts here.'),
        ('parking', 'Parking', 'PK', 190, 530, 'parking', 'Two-wheeler and four-wheeler parking close to the entrance.'),
        ('admin', 'Administration', 'AD', 250, 120, 'admin', "Principal's office, admissions, accounts and examination cell."),
        ('library', 'Library', 'LB', 410, 320, 'library', 'Central library and digital reading rooms. The busiest junction on campus.'),
        ('academic', 'Academic Block', 'AB', 580, 130, 'academic', 'Lecture halls, tutorial rooms and department offices.'),
        ('canteen', 'Canteen', 'CN', 560, 510, 'canteen', 'Food court and student lounge.'),
        ('auditorium', 'Auditorium', 'AU', 740, 320, 'auditorium', '1,200-seat hall for events, seminars and convocation.'),
        ('hostel', 'Hostel', 'HS', 890, 500, 'hostel', 'Residential blocks for students.'),
        ('sports', 'Sports Complex', 'SP', 900, 140, 'sports', 'Indoor stadium, track and playing fields.')
    ]
    cursor.executemany(
        "INSERT INTO locations (id, name, code, x, y, icon, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
        nodes
    )

    edges = [
        ('gate', 'parking', 120),
        ('gate', 'admin', 180),
        ('gate', 'library', 260),
        ('parking', 'library', 230),
        ('parking', 'canteen', 400),
        ('admin', 'library', 150),
        ('admin', 'academic', 220),
        ('library', 'academic', 190),
        ('library', 'canteen', 210),
        ('library', 'auditorium', 330),
        ('academic', 'auditorium', 240),
        ('academic', 'sports', 340),
        ('canteen', 'auditorium', 250),
        ('canteen', 'hostel', 300),
        ('auditorium', 'hostel', 230),
        ('auditorium', 'sports', 220),
        ('hostel', 'sports', 380)
    ]
    cursor.executemany(
        "INSERT INTO edges (from_node, to_node, weight) VALUES (?, ?, ?)",
        edges
    )
    conn.commit()


def seed_multistage_graph(conn):
    cursor = conn.cursor()
    stages = [
        (1, 1),
        (2, 2), (3, 2), (4, 2), (5, 2),
        (6, 3), (7, 3), (8, 3),
        (9, 4), (10, 4), (11, 4),
        (12, 5)
    ]
    cursor.executemany(
        "INSERT INTO multistage_vertices (vertex_id, stage) VALUES (?, ?)",
        stages
    )

    edges = [
        (1, 2, 9), (1, 3, 7), (1, 4, 3), (1, 5, 2),
        (2, 6, 4), (2, 7, 2), (2, 8, 1),
        (3, 6, 2), (3, 7, 7),
        (4, 8, 11),
        (5, 7, 11), (5, 8, 8),
        (6, 9, 6), (6, 10, 5),
        (7, 9, 4), (7, 10, 3),
        (8, 10, 5), (8, 11, 6),
        (9, 12, 4), (10, 12, 2), (11, 12, 5)
    ]
    cursor.executemany(
        "INSERT INTO multistage_edges (from_vertex, to_vertex, cost) VALUES (?, ?, ?)",
        edges
    )
    conn.commit()


def get_campus_graph_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, name, code, x, y, icon, description FROM locations ORDER BY rowid")
    node_rows = cursor.fetchall()
    nodes = [
        {
            "id": r["id"],
            "name": r["name"],
            "code": r["code"],
            "x": r["x"],
            "y": r["y"],
            "icon": r["icon"],
            "description": r["description"]
        }
        for r in node_rows
    ]

    cursor.execute("SELECT from_node, to_node, weight FROM edges ORDER BY id")
    edge_rows = cursor.fetchall()
    edges = [
        {
            "from": r["from_node"],
            "to": r["to_node"],
            "weight": r["weight"]
        }
        for r in edge_rows
    ]

    conn.close()
    return {"nodes": nodes, "edges": edges}


def get_multistage_graph_from_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT vertex_id, stage FROM multistage_vertices ORDER BY stage, vertex_id")
    v_rows = cursor.fetchall()
    stage_map = {}
    for r in v_rows:
        s = r["stage"]
        if s not in stage_map:
            stage_map[s] = []
        stage_map[s].append(r["vertex_id"])

    sorted_stages = [stage_map[s] for s in sorted(stage_map.keys())]

    cursor.execute("SELECT from_vertex, to_vertex, cost FROM multistage_edges ORDER BY id")
    edge_rows = cursor.fetchall()
    edges = [
        {
            "from": r["from_vertex"],
            "to": r["to_vertex"],
            "cost": r["cost"]
        }
        for r in edge_rows
    ]

    conn.close()
    return {"stages": sorted_stages, "edges": edges}


def save_route_history(source: str, target: str, path: List[str], distance: float, seconds: int, computed_at: int):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO route_history (source, target, path, distance, seconds, computed_at) VALUES (?, ?, ?, ?, ?, ?)",
        (source, target, json.dumps(path), distance, seconds, computed_at)
    )
    conn.commit()
    conn.close()


def get_route_histories(limit: int = 20):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, source, target, path, distance, seconds, computed_at FROM route_history ORDER BY id DESC LIMIT ?",
        (limit,)
    )
    rows = cursor.fetchall()
    conn.close()

    items = []
    for r in rows:
        items.append({
            "id": r["id"],
            "source": r["source"],
            "target": r["target"],
            "path": json.loads(r["path"]),
            "distance": r["distance"],
            "seconds": r["seconds"],
            "computedAt": r["computed_at"]
        })
    return items

