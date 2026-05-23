'use client'

import { useScene } from '@pascal-app/core'
import { useMemo } from 'react'

export const DEFAULT_SCENE_PALETTE: string[] = [
  '#FFEED0',
  '#F4C180',
  '#00A79D',
  '#007064',
  '#FFFFFF',
]

const PALETTE_KEY = 'palette'

function isHexArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(entry))
  )
}

function findSiteNodeId(nodes: Record<string, { type: string; id: string }>): string | null {
  for (const id in nodes) {
    if (nodes[id]?.type === 'site') return id
  }
  return null
}

export function readScenePalette(): string[] {
  const { nodes } = useScene.getState()
  const siteId = findSiteNodeId(nodes as Record<string, { type: string; id: string }>)
  if (!siteId) return DEFAULT_SCENE_PALETTE
  const meta = (nodes as Record<string, { metadata?: Record<string, unknown> }>)[siteId]?.metadata
  const palette = meta?.[PALETTE_KEY]
  return isHexArray(palette) ? palette : DEFAULT_SCENE_PALETTE
}

export function writeScenePalette(colors: string[]) {
  const { nodes, updateNode } = useScene.getState()
  const siteId = findSiteNodeId(nodes as Record<string, { type: string; id: string }>)
  if (!siteId) return
  const current = (nodes as Record<string, { metadata?: Record<string, unknown> }>)[siteId]
    ?.metadata as Record<string, unknown> | undefined
  updateNode(siteId as never, {
    metadata: { ...(current ?? {}), [PALETTE_KEY]: colors },
  } as never)
}

export function useScenePalette(): string[] {
  const siteEntry = useScene((s) => {
    const nodes = s.nodes as Record<string, { type: string; metadata?: Record<string, unknown> }>
    for (const id in nodes) {
      if (nodes[id]?.type === 'site') return nodes[id]
    }
    return undefined
  })
  return useMemo(() => {
    const palette = siteEntry?.metadata?.[PALETTE_KEY]
    return isHexArray(palette) ? palette : DEFAULT_SCENE_PALETTE
  }, [siteEntry])
}
