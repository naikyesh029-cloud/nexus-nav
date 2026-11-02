/** Shared domain types. Kept free of any UI imports so a backend can reuse them. */

export type IconKey =
  | 'gate'
  | 'parking'
  | 'admin'
  | 'library'
  | 'academic'
  | 'canteen'
  | 'auditorium'
  | 'hostel'
  | 'sports'

/** A campus location = a vertex of the graph. x/y are map coordinates (drawing only). */
export interface CampusNode {
  id: string
  name: string
  code: string
  x: number
  y: number
  icon: IconKey
  description: string
}

/** An undirected walkway = a weighted edge. Weight is the walking distance in metres. */
export interface CampusEdge {
  from: string
  to: string
  weight: number
}

export interface Graph {
  nodes: CampusNode[]
  edges: CampusEdge[]
}

/** Directed edge of a multistage graph (always goes from stage i to stage i+1). */
export interface MultistageEdge {
  from: number
  to: number
  cost: number
}

/** stages[0] holds the single source, stages[last] the single sink. */
export interface MultistageGraph {
  stages: number[][]
  edges: MultistageEdge[]
}
