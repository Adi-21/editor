'use client'

import { type AnyNodeId, ItemNode, type SlabNode, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { Loader2, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../../../lib/utils'
import { CATALOG_ITEMS } from '../item-catalog/catalog-items'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'

const MAX_ITEMS_PER_PROMPT = 4
const SPREAD_RADIUS_M = 0.9 // base spread between auto-placed items

type CatalogItem = (typeof CATALOG_ITEMS)[number]

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
}

function scoreItem(item: CatalogItem, tokens: string[]): number {
  if (tokens.length === 0) return 0
  let score = 0
  const name = (item.name ?? '').toLowerCase()
  const category = (item.category ?? '').toLowerCase()
  const tags = (item.tags ?? []).map((t) => t.toLowerCase())
  for (const tok of tokens) {
    if (category && tok === category) score += 3
    else if (category && category.includes(tok)) score += 2
    if (tags.some((t) => t === tok)) score += 2
    else if (tags.some((t) => t.includes(tok) || tok.includes(t))) score += 1
    if (name === tok) score += 3
    else if (name.includes(tok)) score += 1
  }
  return score
}

function pickMatches(prompt: string): CatalogItem[] {
  const tokens = tokenize(prompt)
  if (tokens.length === 0) return []
  const scored = CATALOG_ITEMS.map((item) => ({ item, score: scoreItem(item, tokens) })).filter(
    (e) => e.score > 0,
  )
  scored.sort((a, b) => b.score - a.score)
  // De-dup by category so we don't drop four identical sofas
  const seen = new Set<string>()
  const picks: CatalogItem[] = []
  for (const { item } of scored) {
    const key = `${item.category}:${item.name}`
    if (seen.has(key)) continue
    seen.add(key)
    picks.push(item)
    if (picks.length >= MAX_ITEMS_PER_PROMPT) break
  }
  return picks
}

function polygonCentroid(polygon: [number, number][]): [number, number] {
  if (polygon.length === 0) return [0, 0]
  let sx = 0
  let sy = 0
  for (const [x, y] of polygon) {
    sx += x
    sy += y
  }
  return [sx / polygon.length, sy / polygon.length]
}

// Spread N items on a small grid around the centroid so they don't stack on
// top of each other. Crude but visible; the user can drag-refine.
function spreadOffsets(count: number): [number, number][] {
  if (count <= 1) return [[0, 0]]
  const r = SPREAD_RADIUS_M
  if (count === 2) return [[-r, 0], [r, 0]]
  if (count === 3) return [[-r, -r * 0.6], [r, -r * 0.6], [0, r * 0.8]]
  return [[-r, -r], [r, -r], [-r, r], [r, r]]
}

function useSelectedSlab(): SlabNode | null {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  const slab = useScene((s) => {
    if (selectedIds.length !== 1) return null
    const id = selectedIds[0]
    const node = id ? s.nodes[id as AnyNodeId] : null
    return node && node.type === 'slab' ? (node as SlabNode) : null
  })
  return slab
}

/**
 * Keyword-driven item placement (B-feature, owner-directed). Select a room
 * (slab), open this popover, type something like "kitchen appliances" — the
 * top 4 catalog matches (scored on category/tags/name) get placed inside
 * the room polygon. Deliberately not LLM-backed; pure keyword scoring.
 */
export function SuggestItemsPopover({ className }: { className?: string }) {
  const slab = useSelectedSlab()
  const createNode = useScene((s) => s.createNode)
  const [prompt, setPrompt] = useState('')
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  const preview = useMemo(() => pickMatches(prompt), [prompt])

  if (!slab) return null

  const handleSubmit = () => {
    if (busy) return
    const matches = pickMatches(prompt)
    if (matches.length === 0) {
      setFeedback("No catalog items matched. Try 'kitchen', 'sofa', 'bed'…")
      return
    }
    setBusy(true)
    try {
      const [cx, cy] = polygonCentroid(slab.polygon as [number, number][])
      const offsets = spreadOffsets(matches.length)
      const parentId = slab.parentId as AnyNodeId | null
      matches.forEach((item, i) => {
        const [dx, dy] = offsets[i] ?? [0, 0]
        const node = ItemNode.parse({
          position: [cx + dx, 0, cy + dy] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          name: item.name,
          asset: item,
          parentId: parentId ?? undefined,
          metadata: { isNew: true },
        })
        createNode(node, parentId ?? undefined)
      })
      setFeedback(`Placed ${matches.length} item${matches.length === 1 ? '' : 's'}`)
      setPrompt('')
      setTimeout(() => {
        setOpen(false)
        setFeedback(null)
      }, 900)
    } catch (error) {
      console.error('[suggest-items] placement failed', error)
      setFeedback('Could not place items — see console.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label="Suggest items"
          className={cn(
            'tooltip-trigger rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-brand/15 hover:text-brand',
            className,
          )}
          title="Suggest & place items by keyword"
          type="button"
        >
          <Sparkles className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 p-3" side="top" sideOffset={8}>
        <div className="mb-2">
          <p className="font-medium text-xs">Add items to this room</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Type what you want — e.g. <em>kitchen appliances</em>, <em>sofa and coffee table</em>,
            <em> bedroom</em>. Matching catalog items are placed in the room.
          </p>
        </div>
        <textarea
          autoFocus
          className="w-full resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              handleSubmit()
            }
          }}
          placeholder="Add a kitchen, bedroom items, a sofa…"
          rows={2}
          value={prompt}
        />
        {preview.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {preview.map((item) => (
              <span
                className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground"
                key={item.id}
              >
                {item.name}
              </span>
            ))}
          </div>
        )}
        {feedback && (
          <p className="mt-2 text-[10px] text-brand">{feedback}</p>
        )}
        <div className="mt-2.5 flex items-center justify-end gap-2">
          <button
            className="rounded-md px-2.5 py-1.5 font-medium text-muted-foreground text-xs transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setOpen(false)}
            type="button"
          >
            Cancel
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-2.5 py-1.5 font-semibold text-brand-foreground text-xs transition-opacity hover:opacity-90 disabled:opacity-50"
            disabled={busy || prompt.trim().length === 0}
            onClick={handleSubmit}
            type="button"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
            Place
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
