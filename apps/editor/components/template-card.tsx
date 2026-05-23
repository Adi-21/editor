'use client'

import { PaletteStrip, type TemplateEntry } from '@pascal-app/editor'
import { ArrowRight, Loader2 } from 'lucide-react'
import { useState } from 'react'

export interface TemplateCardProps {
  template: TemplateEntry
  onUse: (template: TemplateEntry) => Promise<void> | void
}

const ROOM_LABELS: Record<string, string> = {
  studio: 'Studio',
  bedroom: 'Bedroom',
  kitchen: 'Kitchen',
  living: 'Living room',
  bath: 'Bathroom',
  office: 'Office',
}

const MOOD_LABELS: Record<string, string> = {
  warm: 'Warm',
  minimal: 'Minimal',
  coastal: 'Coastal',
  japandi: 'Japandi',
  industrial: 'Industrial',
  boho: 'Boho',
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const [isBusy, setIsBusy] = useState(false)

  const handleUse = async () => {
    if (isBusy) return
    setIsBusy(true)
    try {
      await onUse(template)
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background transition-all hover:border-border hover:shadow-elevation-4">
      <div
        aria-hidden
        className="relative flex aspect-[4/3] w-full overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${template.palette.join(', ')})`,
        }}
      >
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="rounded-md bg-black/40 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-md">
            {ROOM_LABELS[template.room] ?? template.room}
          </span>
          <span className="rounded-md bg-black/40 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-md">
            {MOOD_LABELS[template.mood] ?? template.mood}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-semibold text-sm">{template.name}</h3>
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">{template.description}</p>
        </div>

        <PaletteStrip colors={template.palette} size="sm" />

        <button
          aria-busy={isBusy}
          className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 font-medium text-brand-foreground text-xs transition-colors hover:bg-brand-hover disabled:opacity-60"
          disabled={isBusy}
          onClick={handleUse}
          type="button"
        >
          {isBusy ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Creating…</span>
            </>
          ) : (
            <>
              <span>Use template</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </article>
  )
}
