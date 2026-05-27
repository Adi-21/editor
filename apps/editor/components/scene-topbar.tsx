'use client'

import { ShareMenu, ThemeSwitcher } from '@pascal-app/editor'
import Link from 'next/link'
import { DayNightArc } from './day-night-arc'
import {
  PresentButton,
  PreviewButton,
  ViewModeControl,
  WalkthroughButton,
} from './viewer-toolbar'

interface SceneTopBarProps {
  /** Omitted on the local `/` editor (unsaved). */
  sceneId?: string
  sceneName?: string
}

/**
 * Canva/Framer-style top bar — the single coherent home for identity, the
 * 2D/3D toggle (primary, centre), and view/present/share actions. Used by
 * both `/scene/[id]` (saved) and `/` (local, unsaved). Composed entirely
 * from existing controls — no new behaviour.
 */
export function SceneTopBar({ sceneId, sceneName }: SceneTopBarProps) {
  const isLocal = !sceneId

  return (
    <header className="flex h-12 w-full flex-shrink-0 items-center justify-between gap-3 border-border/60 border-b bg-sidebar px-3 text-sidebar-foreground">
      {/* Left — identity */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Link
          className="flex items-center gap-2 rounded-md px-1.5 py-1 transition-colors hover:bg-white/8"
          href="/scenes"
          title="All scenes"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand font-bold text-[11px] text-brand-foreground">
            P
          </span>
          <span className="hidden font-medium text-muted-foreground text-xs sm:inline">
            All scenes
          </span>
        </Link>
        <span aria-hidden className="h-4 w-px bg-border/60" />
        <h1 className="min-w-0 truncate font-semibold text-sm" title={sceneName ?? 'Untitled'}>
          {sceneName ?? 'Untitled'}
        </h1>
        {isLocal && (
          <span className="hidden items-center gap-1.5 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground md:inline-flex">
            Local · not saved
            <Link className="font-medium text-foreground hover:underline" href="/scenes">
              Save / open
            </Link>
          </span>
        )}
      </div>

      {/* Centre — the primary 2D / 3D / Split control */}
      <div className="flex flex-shrink-0 items-center">
        <ViewModeControl />
      </div>

      {/* Right — view + present + share */}
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1">
        <DayNightArc />
        <div className="flex items-center rounded-xl border border-border bg-background/60 px-1">
          <PreviewButton />
          <WalkthroughButton />
          <ThemeSwitcher />
        </div>
        <div className="flex items-center rounded-xl border border-border bg-background/60 px-1">
          <PresentButton />
          <ShareMenu />
        </div>
      </div>
    </header>
  )
}
