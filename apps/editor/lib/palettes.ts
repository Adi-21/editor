import type { SceneGraph } from '@pascal-app/editor'

// Mirrors `@pascal-app/editor`'s DEFAULT_SCENE_PALETTE. Inlined (not imported)
// so this server-imported module never pulls the editor barrel — importing
// the barrel from a Server Component drags in client-only ('use client')
// UI and breaks the RSC build (/scenes, /palettes). `SceneGraph` is a
// type-only import and is erased at build time, so it is RSC-safe.
export const DEFAULT_SCENE_PALETTE: readonly string[] = [
  '#FFEED0',
  '#F4C180',
  '#00A79D',
  '#007064',
  '#FFFFFF',
]

const HEX = /^#[0-9a-fA-F]{3,8}$/

function isHexArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((entry) => typeof entry === 'string' && HEX.test(entry))
  )
}

/**
 * Server-safe read of a scene's saved palette. Mirrors `readScenePalette`
 * (which reads the live store) but operates on a fetched graph object so it
 * can run in the `/scenes` and `/palettes` server components.
 */
export function extractPaletteFromGraph(graph: SceneGraph | null | undefined): string[] {
  const nodes = (graph?.nodes ?? {}) as Record<
    string,
    { type?: string; metadata?: Record<string, unknown> }
  >
  for (const id in nodes) {
    const node = nodes[id]
    if (node?.type !== 'site') continue
    const palette = node.metadata?.palette
    return isHexArray(palette) ? palette : [...DEFAULT_SCENE_PALETTE]
  }
  return [...DEFAULT_SCENE_PALETTE]
}
