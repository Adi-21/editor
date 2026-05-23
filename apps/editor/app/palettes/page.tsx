import type { SceneGraph } from '@pascal-app/editor'
import { headers } from 'next/headers'
import { PalettesView, type ScenePaletteUsage } from '@/components/palettes-view'
import type { SceneMeta } from '@/components/scene-loader'
import { extractPaletteFromGraph } from '@/lib/palettes'

export const dynamic = 'force-dynamic'

async function resolveBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'http'
  if (!host) {
    return 'http://localhost:3000'
  }
  return `${proto}://${host}`
}

async function fetchScenes(base: string): Promise<SceneMeta[]> {
  const response = await fetch(`${base}/api/scenes?limit=50`, { cache: 'no-store' })
  if (!response.ok) return []
  const payload = (await response.json()) as { scenes?: SceneMeta[] } | SceneMeta[]
  if (Array.isArray(payload)) return payload
  return payload.scenes ?? []
}

async function fetchUsage(base: string, scene: SceneMeta): Promise<ScenePaletteUsage> {
  try {
    const response = await fetch(`${base}/api/scenes/${encodeURIComponent(scene.id)}`, {
      cache: 'no-store',
    })
    const json = response.ok ? ((await response.json()) as { graph?: SceneGraph }) : null
    return { id: scene.id, name: scene.name, palette: extractPaletteFromGraph(json?.graph) }
  } catch {
    return { id: scene.id, name: scene.name, palette: extractPaletteFromGraph(null) }
  }
}

export default async function PalettesPage() {
  const base = await resolveBaseUrl()
  const scenes = await fetchScenes(base)
  const usage = await Promise.all(scenes.map((scene) => fetchUsage(base, scene)))

  return <PalettesView usage={usage} />
}
