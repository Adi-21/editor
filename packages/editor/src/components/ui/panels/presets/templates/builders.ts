import {
  BuildingNode,
  CeilingNode,
  LevelNode,
  SiteNode,
  SlabNode,
  WallNode,
} from '@pascal-app/core'

import type { SceneGraph } from '../../../../../lib/scene'

export interface RoomSpec {
  width: number
  depth: number
  height?: number
  palette?: string[]
}

function rectanglePolygon(halfW: number, halfD: number): [number, number][] {
  return [
    [-halfW, -halfD],
    [halfW, -halfD],
    [halfW, halfD],
    [-halfW, halfD],
  ]
}

export function buildRoom({ width, depth, height = 2.7, palette }: RoomSpec): SceneGraph {
  const halfW = width / 2
  const halfD = depth / 2

  const level0 = LevelNode.parse({ level: 0, children: [] })

  const walls = [
    WallNode.parse({ start: [-halfW, halfD], end: [halfW, halfD], height }),
    WallNode.parse({ start: [halfW, halfD], end: [halfW, -halfD], height }),
    WallNode.parse({ start: [halfW, -halfD], end: [-halfW, -halfD], height }),
    WallNode.parse({ start: [-halfW, -halfD], end: [-halfW, halfD], height }),
  ]

  const polygon = rectanglePolygon(halfW, halfD)

  const slab = SlabNode.parse({ polygon })
  const ceiling = CeilingNode.parse({ polygon, height })

  level0.children = [...walls.map((w) => w.id), slab.id, ceiling.id]

  const building = BuildingNode.parse({ children: [level0.id] })

  const site = SiteNode.parse({
    children: [building],
    metadata: palette ? { palette } : {},
  })

  const nodes: Record<string, unknown> = {
    [site.id]: site,
    [building.id]: building,
    [level0.id]: level0,
    [slab.id]: slab,
    [ceiling.id]: ceiling,
  }
  for (const wall of walls) nodes[wall.id] = wall

  return {
    nodes,
    rootNodeIds: [site.id],
  }
}
