'use client'

import { useEffect, useState } from 'react'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './primitives/popover'

export type StudioTheme = 'studio-warm' | 'studio-dusk' | 'studio-ocean'

const STORAGE_KEY = 'beeaver.theme'
const DEFAULT_THEME: StudioTheme = 'studio-warm'

const THEMES: {
  id: StudioTheme
  label: string
  caption: string
  swatches: [string, string, string, string]
}[] = [
  {
    id: 'studio-warm',
    label: 'Warm',
    caption: 'Mediterranean sun — jade & sand',
    swatches: ['#FFEED0', '#F4C180', '#00A79D', '#007064'],
  },
  {
    id: 'studio-dusk',
    label: 'Dusk',
    caption: 'Terracotta & fog — presentation mode',
    swatches: ['#D9D9D7', '#3E4A62', '#C24D2C', '#1A273A'],
  },
  {
    id: 'studio-ocean',
    label: 'Ocean',
    caption: 'Deep ocean — cool minimalist',
    swatches: ['#D6E8EE', '#97CADB', '#018ABE', '#02457A'],
  },
]

function readTheme(): StudioTheme {
  if (typeof window === 'undefined') return DEFAULT_THEME
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'studio-warm' || stored === 'studio-dusk' || stored === 'studio-ocean') {
    return stored
  }
  return DEFAULT_THEME
}

function applyTheme(theme: StudioTheme) {
  document.documentElement.setAttribute('data-theme', theme)
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore — Safari private mode, etc.
  }
}

export function useStudioTheme(): [StudioTheme, (next: StudioTheme) => void] {
  const [theme, setTheme] = useState<StudioTheme>(DEFAULT_THEME)

  useEffect(() => {
    setTheme(readTheme())
  }, [])

  const update = (next: StudioTheme) => {
    setTheme(next)
    applyTheme(next)
  }

  return [theme, update]
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = useStudioTheme()
  const active = (THEMES.find((t) => t.id === theme) ?? THEMES[0]) as (typeof THEMES)[number]

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`Studio theme: ${active.label}`}
          className={cn(
            'flex w-8 items-center justify-center text-muted-foreground/80 transition-colors hover:bg-white/8 hover:text-foreground/90',
            className,
          )}
          type="button"
        >
          <span className="flex h-3.5 w-3.5 overflow-hidden rounded-full ring-1 ring-border/60">
            {active.swatches.map((hex) => (
              <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
            ))}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" sideOffset={8}>
        <div className="px-2 pt-1 pb-2">
          <p className="font-medium text-xs">Studio theme</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Affects accent colors across the editor.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          {THEMES.map((t) => {
            const isActive = t.id === theme
            return (
              <button
                aria-pressed={isActive}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors',
                  isActive ? 'bg-brand/15 text-brand' : 'hover:bg-accent',
                )}
                key={t.id}
                onClick={() => setTheme(t.id)}
                type="button"
              >
                <span className="flex h-5 w-10 overflow-hidden rounded-md ring-1 ring-border/60">
                  {t.swatches.map((hex) => (
                    <span key={hex} className="flex-1" style={{ backgroundColor: hex }} />
                  ))}
                </span>
                <span className="flex-1">
                  <span className="block font-medium text-xs">{t.label}</span>
                  <span className="block text-[10px] text-muted-foreground">{t.caption}</span>
                </span>
                {isActive && (
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
