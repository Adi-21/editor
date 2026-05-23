'use client'

import { TEMPLATES } from '@pascal-app/editor'
import { ArrowRight, Layers, PlusSquare } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function StartPage() {
  const router = useRouter()
  const [isCreatingBlank, setIsCreatingBlank] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleBlank = async () => {
    setIsCreatingBlank(true)
    setError(null)
    try {
      const response = await fetch('/api/scenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Untitled scene',
          graph: { nodes: {}, rootNodeIds: [] },
        }),
      })
      if (!response.ok) {
        setError(`Failed to create scene (${response.status})`)
        setIsCreatingBlank(false)
        return
      }
      const meta = (await response.json()) as { id: string }
      router.push(`/scene/${meta.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene')
      setIsCreatingBlank(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-border border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <nav className="flex items-center gap-4 text-sm">
            <Link className="text-muted-foreground transition-colors hover:text-foreground" href="/">
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Start</span>
          </nav>
          <Link
            className="rounded-md border border-border bg-accent px-3 py-1.5 font-medium text-sm hover:bg-accent/80"
            href="/scenes"
          >
            My scenes
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="font-bold text-4xl tracking-tight">Start a new scene</h1>
          <p className="mt-3 text-muted-foreground text-sm">
            Pick a starting point — a template you can remix, or an empty canvas.
          </p>
        </div>

        {error && (
          <div className="mx-auto mb-6 max-w-xl rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <Link
            className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-8 transition-all hover:border-border hover:shadow-elevation-4"
            href="/templates"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/15 text-brand">
              <Layers className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">Start from a template</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Studio-grade rooms, presets and palettes. Pick one and customize anything.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium text-brand text-xs">
              Browse {TEMPLATES.length} templates
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <button
            className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-8 text-left transition-all hover:border-border hover:shadow-elevation-4 disabled:opacity-60"
            disabled={isCreatingBlank}
            onClick={handleBlank}
            type="button"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-foreground">
              <PlusSquare className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-lg">Blank canvas</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Build from scratch with full creative control over geometry, materials, and layout.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80 text-xs">
              {isCreatingBlank ? 'Creating…' : 'New scene'}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        </div>
      </main>
    </div>
  )
}
