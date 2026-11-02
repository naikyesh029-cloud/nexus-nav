import type { CampusEdge, CampusNode, Graph } from '../types'

/**
 * Fictional campus graph. Pure data: no React, no algorithm code.
 * Vertices  = campus locations
 * Edges     = undirected walkways, weight = walking distance in metres
 * x / y     = coordinates on the 1000 x 620 map (used only for drawing)
 */

export const MAP_WIDTH = 1000
export const MAP_HEIGHT = 620

export const CAMPUS_NODES: CampusNode[] = [
  {
    id: 'gate',
    name: 'Main Gate',
    code: 'MG',
    x: 80,
    y: 310,
    icon: 'gate',
    description: 'Primary entrance with security check-post. Every visitor starts here.',
  },
  {
    id: 'parking',
    name: 'Parking',
    code: 'PK',
    x: 190,
    y: 530,
    icon: 'parking',
    description: 'Two-wheeler and four-wheeler parking close to the entrance.',
  },
  {
    id: 'admin',
    name: 'Administration',
    code: 'AD',
    x: 250,
    y: 120,
    icon: 'admin',
    description: "Principal's office, admissions, accounts and examination cell.",
  },
  {
    id: 'library',
    name: 'Library',
    code: 'LB',
    x: 410,
    y: 320,
    icon: 'library',
    description: 'Central library and digital reading rooms. The busiest junction on campus.',
  },
  {
    id: 'academic',
    name: 'Academic Block',
    code: 'AB',
    x: 580,
    y: 130,
    icon: 'academic',
    description: 'Lecture halls, tutorial rooms and department offices.',
  },
  {
    id: 'canteen',
    name: 'Canteen',
    code: 'CN',
    x: 560,
    y: 510,
    icon: 'canteen',
    description: 'Food court and student lounge.',
  },
  {
    id: 'auditorium',
    name: 'Auditorium',
    code: 'AU',
    x: 740,
    y: 320,
    icon: 'auditorium',
    description: '1,200-seat hall for events, seminars and convocation.',
  },
  {
    id: 'hostel',
    name: 'Hostel',
    code: 'HS',
    x: 890,
    y: 500,
    icon: 'hostel',
    description: 'Residential blocks for students.',
  },
  {
    id: 'sports',
    name: 'Sports Complex',
    code: 'SP',
    x: 900,
    y: 140,
    icon: 'sports',
    description: 'Indoor stadium, track and playing fields.',
  },
]

export const CAMPUS_EDGES: CampusEdge[] = [
  { from: 'gate', to: 'parking', weight: 120 },
  { from: 'gate', to: 'admin', weight: 180 },
  { from: 'gate', to: 'library', weight: 260 },
  { from: 'parking', to: 'library', weight: 230 },
  { from: 'parking', to: 'canteen', weight: 400 },
  { from: 'admin', to: 'library', weight: 150 },
  { from: 'admin', to: 'academic', weight: 220 },
  { from: 'library', to: 'academic', weight: 190 },
  { from: 'library', to: 'canteen', weight: 210 },
  { from: 'library', to: 'auditorium', weight: 330 },
  { from: 'academic', to: 'auditorium', weight: 240 },
  { from: 'academic', to: 'sports', weight: 340 },
  { from: 'canteen', to: 'auditorium', weight: 250 },
  { from: 'canteen', to: 'hostel', weight: 300 },
  { from: 'auditorium', to: 'hostel', weight: 230 },
  { from: 'auditorium', to: 'sports', weight: 220 },
  { from: 'hostel', to: 'sports', weight: 380 },
]

export const CAMPUS_GRAPH: Graph = { nodes: CAMPUS_NODES, edges: CAMPUS_EDGES }

export const NODE_BY_ID: Record<string, CampusNode> = Object.fromEntries(
  CAMPUS_NODES.map((n) => [n.id, n]),
)

export const nodeName = (id: string): string => NODE_BY_ID[id]?.name ?? id
