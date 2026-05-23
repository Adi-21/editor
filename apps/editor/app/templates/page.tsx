'use client'

import { TEMPLATES, type TemplateEntry, type TemplateMood, type TemplateRoom } from '@pascal-app/editor'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { TemplateCard } from '@/components/template-card'
import { createSceneFromTemplate } from '@/lib/templates'

const ROOM_FILTERS: { id: TemplateRoom | 'all'; label: string }[] = [
  { id: 'all', label: 'All rooms' },
  { id: 'studio', label: 'Studio' },
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'living', label: 'Living' },
  { id: 'bath', label: 'Bath' },
  { id: 'office', label: 'Office' },
]

const MOOD_FILTERS: { id: TemplateMood | 'all'; label: string }[] = [
  { id: 'all', label: 'All moods' },
  { id: 'warm', label: 'Warm' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'coastal', label: 'Coastal' },
  { id: 'japandi', label: 'Japandi' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'boho', label: 'Boho' },
]

export default function TemplatesPage() {
  const router = useRouter()
  const [room, setRoom] = useState<TemplateRoom | 'all'>('all')
  const [mood, setMood] = useState<TemplateMood | 'all'>('all')
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return TEMPLATES.filter((entry) => {
      if (room !== 'all' && entry.room !== room) return false
      if (mood !== 'all' && entry.mood !== mood) return false
      return true
    })
  }, [room, mood])

  const handleUse = async (template: TemplateEntry) => {
    setError(null)
    try {
      const { id } = await createSceneFromTemplate(template)
      router.push(`/scene/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene')
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
            <Link
              className="text-muted-foreground transition-colors hover:text-foreground"
              href="/start"
            >
              Start
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium text-foreground">Templates</span>
          </nav>
          <Link
            className="rounded-md border border-border bg-accent px-3 py-1.5 font-medium text-sm hover:bg-accent/80"
            href="/scenes"
          >
            My scenes
          </Link>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl px-6 py-12">
        <div className="mb-8">
          <h1 className="font-bold text-3xl tracking-tight">Templates</h1>
          <p className="mt-2 text-muted-foreground text-sm">
            Start from a populated room. Edit anything — geometry, colors, finishes — once it's
            yours.
          </p>
        </div>

        <div className="mb-8 space-y-3">
          <FilterRow
            active={room}
            label="Room"
            onChange={(id) => setRoom(id as TemplateRoom | 'all')}
            options={ROOM_FILTERS}
          />
          <FilterRow
            active={mood}
            label="Mood"
            onChange={(id) => setMood(id as TemplateMood | 'all')}
            options={MOOD_FILTERS}
          />
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-destructive text-sm">
            {error}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border/60 border-dashed bg-background p-12 text-center">
            <p className="text-muted-foreground text-sm">
              No templates match this filter yet. Try a different room or mood.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((template) => (
              <li key={template.id}>
                <TemplateCard onUse={handleUse} template={template} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string
  options: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
        {label}
      </span>
      {options.map((option) => {
        const isActive = active === option.id
        return (
          <button
            aria-pressed={isActive}
            className={
              isActive
                ? 'rounded-full bg-brand px-3 py-1 font-medium text-brand-foreground text-xs'
                : 'rounded-full border border-border/60 px-3 py-1 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground'
            }
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
