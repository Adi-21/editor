'use client'

import { useViewer } from '@pascal-app/viewer'
import { Box, Check, Link2, Share2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from './primitives/popover'

type Busy = 'glb' | 'usdz' | null

export function ShareMenu({ className }: { className?: string }) {
  const exportScene = useViewer((state) => state.exportScene)
  const [busy, setBusy] = useState<Busy>(null)
  const [copied, setCopied] = useState(false)

  const runExport = async (format: 'glb' | 'usdz') => {
    if (!exportScene || busy) return
    setBusy(format)
    try {
      await exportScene(format)
    } catch (error) {
      console.error(`[share] ${format} export failed`, error)
    } finally {
      setBusy(null)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error('[share] copy link failed', error)
    }
  }

  const exportReady = Boolean(exportScene)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label="Share"
          className={cn(
            'flex items-center gap-1.5 px-2.5 font-medium text-muted-foreground/80 text-xs transition-colors hover:bg-white/8 hover:text-foreground/90',
            className,
          )}
          type="button"
        >
          <Share2 className="h-3.5 w-3.5 shrink-0" />
          <span>Share</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-2" sideOffset={8}>
        <div className="px-2 pt-1 pb-2">
          <p className="font-medium text-xs">Share scene</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Send a link or a model your client can open.
          </p>
        </div>
        <div className="flex flex-col gap-1">
          <button
            className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent"
            onClick={copyLink}
            type="button"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-foreground/80">
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="flex-1">
              <span className="block font-medium text-xs">
                {copied ? 'Link copied' : 'Copy link'}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                Share this editor URL
              </span>
            </span>
          </button>

          <button
            className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!exportReady || busy === 'glb'}
            onClick={() => runExport('glb')}
            type="button"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-foreground/80">
              <Box className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">
              <span className="block font-medium text-xs">
                {busy === 'glb' ? 'Exporting…' : 'Download GLB'}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                3D model — Android, web viewers
              </span>
            </span>
          </button>

          <button
            className="flex items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!exportReady || busy === 'usdz'}
            onClick={() => runExport('usdz')}
            type="button"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand/15 text-brand">
              <Smartphone className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1">
              <span className="block font-medium text-xs">
                {busy === 'usdz' ? 'Exporting…' : 'Download USDZ'}
              </span>
              <span className="block text-[10px] text-muted-foreground">
                AR Quick Look — iPhone, iPad, Vision Pro
              </span>
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
