/** Values handed from one page to another (e.g. Dashboard -> Navigation). */
export interface Preset {
  source?: string
  target?: string
  /** If true and both ends are set, the destination page calculates immediately. */
  auto?: boolean
}
