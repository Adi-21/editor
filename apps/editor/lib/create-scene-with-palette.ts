'use client'

import { buildRoom } from '@pascal-app/editor'

export interface CreateSceneResult {
  id: string
}

/**
 * Reuse a palette across projects: spin up a fresh room seeded with the
 * given palette on the site node (via the Phase 2 `buildRoom` builder).
 *
 * Client-only — it imports the editor barrel (`buildRoom`), so it must
 * never be pulled into a Server Component. Kept out of `lib/palettes.ts`
 * (which the `/scenes` + `/palettes` server pages import) for exactly
 * that reason.
 */
export async function createSceneWithPalette(
  name: string,
  colors: string[],
): Promise<CreateSceneResult> {
  const graph = buildRoom({ width: 4, depth: 3, palette: colors })
  const response = await fetch('/api/scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, graph }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to create scene (${response.status}): ${text}`)
  }
  const meta = (await response.json()) as { id: string }
  return { id: meta.id }
}
