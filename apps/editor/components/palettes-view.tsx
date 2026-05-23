'use client'

import { CURATED_PALETTES, PaletteStrip } from '@pascal-app/editor'
import { ArrowRight, Check, Copy, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { createSceneWithPalette } from '@/lib/create-scene-with-palette'

export interface ScenePaletteUsage {
  id: string
  name: string
  palette: string[]
}

interface DistinctUsage {
  signature: string
  palette: string[]
  scenes: { id: string; name: string }[]
}

function PaletteCard({
  title,
  subtitle,
  colors,
  token,
  busy,
  copied,
  onCopy,
  onCreate,
  children,
}: {
  title: string
  subtitle: string
  colors: string[]
  token: string
  busy: string | null
  copied: string | null
  onCopy: (token: string, colors: string[]) => void
  onCreate: (token: string, name: string, colors: string[]) => void
  children?: React.ReactNode
}) {
  return (
    <article className="flex flex-col gap-3 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-border hover:shadow-elevation-4">
      <PaletteStrip className="h-12" colors={colors} rounded size="lg" />
      <div>
        <h3 className="truncate font-semibold text-sm">{title}</h3>
        <p className="mt-0.5 truncate text-muted-foreground text-xs capitalize">{subtitle}</p>
      </div>
      {children}
      <div className="mt-auto flex items-center gap-2">
        <button
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 font-medium text-xs transition-colors hover:bg-accent"
          onClick={() => onCopy(token, colors)}
          type="button"
        >
          {copied === token ? (
            <Check className="h-3.5 w-3.5 text-brand" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied === token ? 'Copied' : 'Copy'}
        </button>
        <button
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 font-medium text-brand-foreground text-xs transition-colors hover:bg-brand-hover disabled:opacity-60"
          disabled={busy === token}
          onClick={() => onCreate(token, title, colors)}
          type="button"
        >
          {busy === token ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Creating…</span>
            </>
          ) : (
            <>
              <span>New scene</span>
              <ArrowRight className="h-3 w-3" />
            </>
          )}
        </button>
      </div>
    </article>
  )
}

export function PalettesView({ usage }: { usage: ScenePaletteUsage[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const distinct = useMemo<DistinctUsage[]>(() => {
    const map = new Map<string, DistinctUsage>()
    for (const u of usage) {
      const signature = u.palette.join(',')
      const existing = map.get(signature)
      if (existing) {
        existing.scenes.push({ id: u.id, name: u.name })
      } else {
        map.set(signature, {
          signature,
          palette: u.palette,
          scenes: [{ id: u.id, name: u.name }],
        })
      }
    }
    return [...map.values()]
  }, [usage])

  const filteredCurated = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return CURATED_PALETTES
    return CURATED_PALETTES.filter(
      (p) => p.name.toLowerCase().includes(q) || p.mood.toLowerCase().includes(q),
    )
  }, [query])

  const copy = (token: string, colors: string[]) => {
    navigator.clipboard
      .writeText(colors.join(', '))
      .then(() => {
        setCopied(token)
        setTimeout(() => setCopied((c) => (c === token ? null : c)), 1600)
      })
      .catch((err) => console.error('[palettes] copy failed', err))
  }

  const create = async (token: string, name: string, colors: string[]) => {
    if (busy) return
    setBusy(token)
    setError(null)
    try {
      const { id } = await createSceneWithPalette(name, colors)
      router.push(`/scene/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene')
      setBusy(null)
    }
  }

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
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/scenes"
            >
              Scenes
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Palettes</span>
          </nav>
          <input
            className="w-56 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none transition-colors focus:border-brand"
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search palettes…"
            type="search"
            value={query}
          />
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        <h1 className="mb-2 font-bold text-3xl">Palettes</h1>
        <p className="mb-8 text-muted-foreground text-sm">
          Reuse a palette across projects — copy it, or spin up a fresh room with it.
        </p>

        {error && (
          <div className="mb-6 max-w-xl rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {distinct.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-1 font-semibold text-lg">In your scenes</h2>
            <p className="mb-5 text-muted-foreground text-xs">
              Palettes already in use across {usage.length} scene
              {usage.length === 1 ? '' : 's'}.
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {distinct.map((d) => (
                <PaletteCard
                  busy={busy}
                  colors={d.palette}
                  copied={copied}
                  key={`scene:${d.signature}`}
                  onCopy={copy}
                  onCreate={create}
                  subtitle={`${d.scenes.length} scene${d.scenes.length === 1 ? '' : 's'}`}
                  title="Scene palette"
                  token={`scene:${d.signature}`}
                >
                  <div className="flex flex-wrap gap-1.5">
                    {d.scenes.slice(0, 4).map((s) => (
                      <Link
                        className="max-w-[10rem] truncate rounded-md bg-accent px-2 py-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
                        href={`/scene/${s.id}`}
                        key={s.id}
                      >
                        {s.name}
                      </Link>
                    ))}
                    {d.scenes.length > 4 && (
                      <span className="px-1 py-0.5 text-[10px] text-muted-foreground">
                        +{d.scenes.length - 4}
                      </span>
                    )}
                  </div>
                </PaletteCard>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="mb-1 font-semibold text-lg">Curated library</h2>
          <p className="mb-5 text-muted-foreground text-xs">
            {filteredCurated.length} of {CURATED_PALETTES.length} reference palettes.
          </p>
          {filteredCurated.length === 0 ? (
            <div className="rounded-xl border border-border/60 border-dashed bg-background p-12 text-center text-muted-foreground text-sm">
              No palettes match “{query}”.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredCurated.map((p) => (
                <PaletteCard
                  busy={busy}
                  colors={p.colors}
                  copied={copied}
                  key={p.id}
                  onCopy={copy}
                  onCreate={create}
                  subtitle={p.mood}
                  title={p.name}
                  token={p.id}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
