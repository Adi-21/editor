import type { SceneGraph } from '@pascal-app/editor'
import { Palette } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'
import { CreateSceneButton } from '@/components/save-button'
import { SceneCard } from '@/components/scene-card'
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

// The list endpoint returns metadata only; the saved palette lives on the
// site node inside the graph. Fetch graphs in parallel to surface palette
// chips. TODO(phase5): fold palette into listScenes to drop these N reads.
async function fetchPalette(base: string, id: string): Promise<string[]> {
  try {
    const response = await fetch(`${base}/api/scenes/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    })
    if (!response.ok) return extractPaletteFromGraph(null)
    const scene = (await response.json()) as { graph?: SceneGraph }
    return extractPaletteFromGraph(scene.graph)
  } catch {
    return extractPaletteFromGraph(null)
  }
}

export default async function ScenesPage() {
  const base = await resolveBaseUrl()
  const scenes = await fetchScenes(base)
  const palettes = await Promise.all(scenes.map((scene) => fetchPalette(base, scene.id)))

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/"
            >
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Scenes</span>
          </nav>
          <div className="flex items-center gap-2">
            <Link
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
              href="/palettes"
            >
              <Palette className="h-3.5 w-3.5" />
              Palettes
            </Link>
            <CreateSceneButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 font-bold text-3xl">Your scenes</h1>
        <p className="mb-8 text-muted-foreground text-sm">
          {scenes.length === 0
            ? 'No scenes yet. Create one to get started.'
            : `${scenes.length} scene${scenes.length === 1 ? '' : 's'}, each with its palette.`}
        </p>

        {scenes.length === 0 ? (
          <div className="rounded-xl border border-border/60 border-dashed bg-background p-12 text-center">
            <p className="text-muted-foreground text-sm">You haven&apos;t saved any scenes yet.</p>
            <div className="mt-4 flex justify-center gap-2">
              <Link
                className="rounded-md border border-border bg-background px-3 py-2 font-medium text-sm hover:bg-accent/40"
                href="/start"
              >
                Browse templates
              </Link>
              <CreateSceneButton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {scenes.map((scene, i) => (
              <SceneCard
                key={scene.id}
                palette={palettes[i] ?? extractPaletteFromGraph(null)}
                scene={scene}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
