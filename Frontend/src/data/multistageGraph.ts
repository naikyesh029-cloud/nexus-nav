import type { MultistageGraph } from '../types'

/**
 * Classic 5-stage, 12-vertex multistage graph (the standard textbook example).
 * Vertex 1 is the source (stage 1), vertex 12 is the sink (stage 5).
 * Every edge goes from stage i to stage i+1, which is what makes the
 * backward dynamic-programming recurrence valid.
 *
 * Known answer for this graph: minimum cost = 16.
 * Two different paths reach it (1-2-7-10-12 and 1-3-6-10-12).
 */
export const MULTISTAGE_GRAPH: MultistageGraph = {
  stages: [[1], [2, 3, 4, 5], [6, 7, 8], [9, 10, 11], [12]],
  edges: [
    { from: 1, to: 2, cost: 9 },
    { from: 1, to: 3, cost: 7 },
    { from: 1, to: 4, cost: 3 },
    { from: 1, to: 5, cost: 2 },

    { from: 2, to: 6, cost: 4 },
    { from: 2, to: 7, cost: 2 },
    { from: 2, to: 8, cost: 1 },
    { from: 3, to: 6, cost: 2 },
    { from: 3, to: 7, cost: 7 },
    { from: 4, to: 8, cost: 11 },
    { from: 5, to: 7, cost: 11 },
    { from: 5, to: 8, cost: 8 },

    { from: 6, to: 9, cost: 6 },
    { from: 6, to: 10, cost: 5 },
    { from: 7, to: 9, cost: 4 },
    { from: 7, to: 10, cost: 3 },
    { from: 8, to: 10, cost: 5 },
    { from: 8, to: 11, cost: 6 },

    { from: 9, to: 12, cost: 4 },
    { from: 10, to: 12, cost: 2 },
    { from: 11, to: 12, cost: 5 },
  ],
}
