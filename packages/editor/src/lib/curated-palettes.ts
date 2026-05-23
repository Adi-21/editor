import paletteLibrary from '../components/ui/panels/presets/palettes.json'

export interface CuratedPalette {
  id: string
  name: string
  mood: string
  colors: string[]
}

/**
 * The curated palette library (doc §13.2) — verbatim from `palettes.json`.
 * Single source of truth shared by the Appearance panel and `/palettes`.
 */
export const CURATED_PALETTES = paletteLibrary as CuratedPalette[]
