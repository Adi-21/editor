'use client'

import { useScene } from '@pascal-app/core'
import {
  ExportManager,
  PaletteStrip,
  type SceneGraph,
  useScenePalette,
} from '@pascal-app/editor'
import { useViewer, Viewer } from '@pascal-app/viewer'
import { OrbitControls } from '@react-three/drei'
import { Box, Check, Link2, Loader2, Pencil, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { SceneMeta } from '@/components/scene-loader'

interface PresentViewProps {
  graph: SceneGraph
  meta: SceneMeta
}

function PaletteOverlay() {
  const palette = useScenePalette()
  if (palette.length === 0) return null
  return <PaletteStrip className="w-40" colors={palette} size="md" />
}

export function PresentView({ graph, meta }: PresentViewProps) {
  const exportScene = useViewer((state) => state.exportScene)
  const [busy, setBusy] = useState<'glb' | 'usdz' | 'ar' | null>(null)
  const [copied, setCopied] = useState(false)
  const arUrlRef = useRef<string | null>(null)

  useEffect(() => {
    // Drive the standalone viewer directly off the core scene store — no editor
    // selection/tool state on a read-only present surface.
    useScene
      .getState()
      .setScene(graph.nodes as never, graph.rootNodeIds as never)
    return () => {
      useScene.getState().clearScene()
      if (arUrlRef.current) {
        URL.revokeObjectURL(arUrlRef.current)
        arUrlRef.current = null
      }
    }
  }, [graph])

  const exportReady = Boolean(exportScene)

  const download = useCallback(
    async (format: 'glb' | 'usdz') => {
      if (!exportScene || busy) return
      setBusy(format)
      try {
        await exportScene(format)
      } catch (error) {
        console.error(`[present] ${format} export failed`, error)
      } finally {
        setBusy(null)
      }
    },
    [exportScene, busy],
  )

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch (error) {
      console.error('[present] copy link failed', error)
    }
  }, [])

  // Quick Look (iOS Safari) triggers on a click of an <a rel="ar"> that wraps a
  // single <img>. We generate the USDZ on demand and hand Quick Look a blob URL.
  const viewInAr = useCallback(async () => {
    if (!exportScene || busy) return
    setBusy('ar')
    try {
      const blob = await exportScene('usdz', { download: false })
      if (!(blob instanceof Blob)) return
      if (arUrlRef.current) URL.revokeObjectURL(arUrlRef.current)
      const url = URL.createObjectURL(blob)
      arUrlRef.current = url

      const anchor = document.createElement('a')
      anchor.setAttribute('rel', 'ar')
      anchor.href = url
      const img = document.createElement('img')
      anchor.appendChild(img)
      anchor.style.display = 'none'
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
    } catch (error) {
      console.error('[present] AR Quick Look failed', error)
    } finally {
      setBusy(null)
    }
  }, [exportScene, busy])

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-background">
      <Viewer selectionManager="custom" useBvh>
        <ExportManager />
        <OrbitControls
          autoRotate
          autoRotateSpeed={0.6}
          enableDamping
          enablePan={false}
          makeDefault
          maxDistance={80}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={3}
          target={[0, 1.2, 0]}
        />
      </Viewer>

      {/* Top-left: identity + back to editor */}
      <div className="pointer-events-none absolute top-5 left-5 z-10 flex items-center gap-3">
        <div className="pointer-events-auto rounded-xl border border-border/60 bg-background/80 px-3.5 py-2 shadow-lg backdrop-blur-md">
          <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-wide">
            Beeaver · Presenting
          </p>
          <h1 className="mt-0.5 font-semibold text-sm">{meta.name}</h1>
        </div>
        <Link
          className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-border/60 bg-background/80 px-3 py-2 font-medium text-muted-foreground text-xs shadow-lg backdrop-blur-md transition-colors hover:text-foreground"
          href={`/scene/${meta.id}`}
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Link>
      </div>

      {/* Bottom: palette + export actions */}
      <div className="-translate-x-1/2 pointer-events-none absolute bottom-6 left-1/2 z-10 w-full max-w-xl px-4">
        <div className="pointer-events-auto flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-2xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1.5">
            <p className="font-medium text-[10px] text-muted-foreground uppercase tracking-wide">
              Scene palette
            </p>
            <PaletteOverlay />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-medium text-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!exportReady || busy === 'glb'}
              onClick={() => download('glb')}
              type="button"
            >
              {busy === 'glb' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Box className="h-3.5 w-3.5" />
              )}
              GLB
            </button>
            <button
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-medium text-xs transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!exportReady || busy === 'usdz'}
              onClick={() => download('usdz')}
              type="button"
            >
              {busy === 'usdz' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              USDZ
            </button>
            <button
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 font-semibold text-brand-foreground text-xs shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!exportReady || busy === 'ar'}
              onClick={viewInAr}
              type="button"
            >
              {busy === 'ar' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Smartphone className="h-3.5 w-3.5" />
              )}
              View in AR
            </button>
            <button
              className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 font-medium text-xs transition-colors hover:bg-accent"
              onClick={copyLink}
              type="button"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-brand" />
              ) : (
                <Link2 className="h-3.5 w-3.5" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
