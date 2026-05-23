'use client'

import {
  type CeilingNode,
  getEffectiveWallSurfaceMaterial,
  type MaterialSchema,
  type MaterialTarget,
  type SlabNode,
  useScene,
  type WallNode,
  type WallSurfaceSide,
} from '@pascal-app/core'
import { Bookmark, Library } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import {
  buildSingleSurfaceMaterialPatch,
  buildWallSurfaceMaterialPatch,
} from '../../../lib/material-paint'
import {
  DEFAULT_SCENE_PALETTE,
  useScenePalette,
  writeScenePalette,
} from '../../../lib/scene-palette'
import { CURATED_PALETTES } from '../../../lib/curated-palettes'
import { cn } from '../../../lib/utils'
import { MaterialPicker } from '../controls/material-picker'
import { PanelSection } from '../controls/panel-section'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import {
  finishFromMaterial,
  FINISH_VALUES,
  type MaterialFinish,
  MaterialFinishToggle,
} from './material-finish-toggle'
import { PaletteStrip } from './palette-strip'
import { SwatchGrid } from './swatch-grid'

type PaintableNode = WallNode | SlabNode | CeilingNode

function buildMaterialFromColor(
  base: MaterialSchema | undefined,
  color: string,
  finish: MaterialFinish,
): MaterialSchema {
  const { roughness, metalness } = FINISH_VALUES[finish]
  return {
    preset: 'custom',
    properties: {
      color,
      roughness,
      metalness,
      opacity: base?.properties?.opacity ?? 1,
      transparent: base?.properties?.transparent ?? false,
      side: base?.properties?.side ?? 'front',
    },
  }
}

interface SurfaceState {
  color: string | undefined
  material: MaterialSchema | undefined
  materialPreset: string | undefined
  finish: MaterialFinish
}

function describeWallSurface(node: WallNode, side: WallSurfaceSide): SurfaceState {
  const surface = getEffectiveWallSurfaceMaterial(node, side)
  return {
    color: surface.material?.properties?.color,
    material: surface.material,
    materialPreset: surface.materialPreset,
    finish: finishFromMaterial(
      surface.material?.properties?.roughness,
      surface.material?.properties?.metalness,
    ),
  }
}

function describeSimpleSurface(node: SlabNode | CeilingNode): SurfaceState {
  return {
    color: node.material?.properties?.color,
    material: node.material,
    materialPreset: node.materialPreset,
    finish: finishFromMaterial(
      node.material?.properties?.roughness,
      node.material?.properties?.metalness,
    ),
  }
}

function pickerNodeType(node: PaintableNode): MaterialTarget {
  if (node.type === 'wall') return 'wall'
  if (node.type === 'slab') return 'slab'
  return 'ceiling'
}

export interface AppearanceSectionProps {
  node: PaintableNode
}

export function AppearanceSection({ node }: AppearanceSectionProps) {
  const updateNode = useScene((s) => s.updateNode)
  const scenePalette = useScenePalette()
  const [wallSide, setWallSide] = useState<WallSurfaceSide>('interior')

  const surface = useMemo<SurfaceState>(() => {
    if (node.type === 'wall') return describeWallSurface(node, wallSide)
    return describeSimpleSurface(node)
  }, [node, wallSide])

  const applyPaint = useCallback(
    (paint: { material?: MaterialSchema; materialPreset?: string }) => {
      if (node.type === 'wall') {
        updateNode(
          node.id,
          buildWallSurfaceMaterialPatch(node, wallSide, paint.material, paint.materialPreset),
        )
      } else {
        updateNode(
          node.id,
          buildSingleSurfaceMaterialPatch<SlabNode | CeilingNode>(
            paint.material,
            paint.materialPreset,
          ),
        )
      }
    },
    [node, updateNode, wallSide],
  )

  const handleColor = useCallback(
    (color: string) => {
      applyPaint({
        material: buildMaterialFromColor(surface.material, color, surface.finish),
        materialPreset: undefined,
      })
    },
    [applyPaint, surface.finish, surface.material],
  )

  const handleFinish = useCallback(
    (finish: MaterialFinish) => {
      const color =
        surface.color ?? scenePalette[0] ?? DEFAULT_SCENE_PALETTE[0]!
      applyPaint({
        material: buildMaterialFromColor(surface.material, color, finish),
        materialPreset: undefined,
      })
    },
    [applyPaint, scenePalette, surface.color, surface.material],
  )

  const handlePickerCustomMaterial = useCallback(
    (material: MaterialSchema) => {
      applyPaint({ material, materialPreset: undefined })
    },
    [applyPaint],
  )

  const handlePickerPreset = useCallback(
    (materialPreset: string) => {
      applyPaint({ material: undefined, materialPreset })
    },
    [applyPaint],
  )

  const handleApplyPaletteToScene = useCallback((colors: string[]) => {
    writeScenePalette(colors.slice(0, 6))
  }, [])

  const usingCatalogPreset = Boolean(surface.materialPreset)
  const selectedSwatch = usingCatalogPreset ? undefined : surface.color

  return (
    <PanelSection title="Appearance">
      {node.type === 'wall' && (
        <WallSideToggle onChange={setWallSide} value={wallSide} />
      )}

      <div className="flex flex-col gap-3">
        <SwatchGrid
          colors={scenePalette}
          label="Scene palette"
          onSelect={handleColor}
          selected={selectedSwatch}
          size="md"
        />

        <div className="flex items-center gap-2">
          <PaletteLibraryButton onApply={handleApplyPaletteToScene} />
          <button
            className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => writeScenePalette(DEFAULT_SCENE_PALETTE)}
            title="Reset scene palette"
            type="button"
          >
            Reset
          </button>
        </div>

        <div className="mt-1">
          <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
            Materials
          </p>
          <MaterialPicker
            nodeType={pickerNodeType(node)}
            onChange={handlePickerCustomMaterial}
            onSelectMaterialPreset={handlePickerPreset}
            selectedMaterialPreset={surface.materialPreset}
            value={surface.material}
          />
        </div>

        <MaterialFinishToggle
          label="Finish"
          onChange={handleFinish}
          value={surface.finish}
        />
        {usingCatalogPreset && (
          <p className="text-[10px] text-muted-foreground">
            Finish applies to a custom color. Picking a finish converts this surface to paint.
          </p>
        )}
      </div>
    </PanelSection>
  )
}

function WallSideToggle({
  value,
  onChange,
}: {
  value: WallSurfaceSide
  onChange: (next: WallSurfaceSide) => void
}) {
  const options: { id: WallSurfaceSide; label: string }[] = [
    { id: 'interior', label: 'Interior' },
    { id: 'exterior', label: 'Exterior' },
  ]
  return (
    <div className="mb-2 inline-flex rounded-md border border-border bg-background/50 p-0.5">
      {options.map((option) => {
        const isActive = option.id === value
        return (
          <button
            aria-pressed={isActive}
            className={cn(
              'rounded px-2.5 py-1 font-medium text-[11px] transition-colors',
              isActive
                ? 'bg-foreground/90 text-background'
                : 'text-muted-foreground hover:text-foreground',
            )}
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

function PaletteLibraryButton({ onApply }: { onApply: (colors: string[]) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          type="button"
        >
          <Library className="h-3 w-3" />
          Palette library
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2" sideOffset={6}>
        <div className="mb-2 flex items-center gap-1.5 px-1">
          <Bookmark className="h-3 w-3 text-muted-foreground" />
          <p className="font-medium text-xs">Curated palettes</p>
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto pr-1">
          {CURATED_PALETTES.map((entry) => (
            <button
              className="flex w-full items-center gap-2 rounded-md p-1.5 text-left transition-colors hover:bg-accent"
              key={entry.id}
              onClick={() => {
                onApply(entry.colors)
                setOpen(false)
              }}
              type="button"
            >
              <PaletteStrip className="w-16" colors={entry.colors} size="sm" />
              <span className="flex-1 min-w-0">
                <span className="block truncate font-medium text-[11px]">{entry.name}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                  {entry.mood}
                </span>
              </span>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
