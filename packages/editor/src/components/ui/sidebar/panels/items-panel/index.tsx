'use client'

import type { AssetInput } from '@pascal-app/core'
import NextImage from 'next/image'
import { useEffect, useState } from 'react'
import { cn } from '../../../../../lib/utils'
import type { CatalogCategory } from '../../../../../store/use-editor'
import useEditor from '../../../../../store/use-editor'
import { furnishTools } from '../../../action-menu/furnish-tools'
import { CATALOG_ITEMS } from '../../../item-catalog/catalog-items'
import { ItemCatalog } from '../../../item-catalog/item-catalog'

export function ItemsPanel({
  items,
  onSearchChange,
  searchResults,
  leadingTile,
  emptyState,
}: {
  items?: AssetInput[]
  /** Called when the search query changes (community edition uses this for server-side search) */
  onSearchChange?: (query: string) => void
  /** When non-null and search is active, these results bypass local filtering (server search results) */
  searchResults?: AssetInput[] | null
  /**
   * Optional node rendered as the first grid cell, always visible. Used by the
   * community edition to inject a "+ Generate with AI" tile.
   */
  leadingTile?: React.ReactNode
  /**
   * Optional node rendered when the grid has no items to show (empty category
   * or no search results). Replaces the default "No results" message.
   */
  emptyState?: React.ReactNode
}) {
  const mode = useEditor((s) => s.mode)
  const catalogCategory = useEditor((s) => s.catalogCategory)
  const setMode = useEditor((s) => s.setMode)
  const setTool = useEditor((s) => s.setTool)
  const setCatalogCategory = useEditor((s) => s.setCatalogCategory)

  // Library / Community / Mine. Default to Library so first-time users see
  // the curated catalog rather than every uploaded item.
  const [activeSource, setActiveSource] = useState<AssetInput['source'] | null>('library')
  const [search, setSearch] = useState('')
  const isServerSearch = onSearchChange !== undefined
  const isSearchPending = isServerSearch && search.length > 0 && searchResults === null

  // Auto-select the first category when the panel mounts without one
  useEffect(() => {
    if (!(catalogCategory && furnishTools.some((c) => c.catalogCategory === catalogCategory))) {
      setCatalogCategory(furnishTools[0]!.catalogCategory)
    }
  }, [catalogCategory, setCatalogCategory])

  const activeCategory =
    furnishTools.find((c) => c.catalogCategory === catalogCategory) ?? furnishTools[0]!

  function selectCategory(categoryId: CatalogCategory) {
    setCatalogCategory(categoryId)
    setTool('item')
    setSearch('')
    onSearchChange?.('')
    if (mode !== 'build') setMode('build')
  }

  const baseItems = items ?? CATALOG_ITEMS

  // Library/Community/Mine source filter. Items without a `source` (seeded
  // built-ins) are treated as "library". Community also shows my published
  // items; drafts only under Mine.
  const matchesSource = (item: AssetInput) => {
    if (!activeSource) return true
    const itemSource = item.source ?? 'library'
    if (activeSource === 'mine') return itemSource === 'mine'
    if (activeSource === 'library') return itemSource === 'library'
    if (activeSource === 'community') {
      if (itemSource === 'community') return true
      if (itemSource === 'mine') return !item.isDraft
      return false
    }
    return true
  }

  const countFor = (cat: CatalogCategory) =>
    baseItems.filter((i) => i.category === cat && matchesSource(i)).length

  const sourceChips: Array<{ id: AssetInput['source']; label: string }> = [
    { id: 'library', label: 'Library' },
    { id: 'community', label: 'Community' },
    { id: 'mine', label: 'Mine' },
  ]

  return (
    <div className="flex h-full flex-col">
      {/* Categories — big, clear, visual. The primary way to browse. */}
      <div className="grid shrink-0 grid-cols-3 gap-1.5 border-border/70 border-b p-2">
        {furnishTools.map((cat) => {
          const isActive = activeCategory.catalogCategory === cat.catalogCategory
          const count = countFor(cat.catalogCategory)
          return (
            <button
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 transition-colors',
                isActive
                  ? 'bg-brand/15 text-brand ring-1 ring-brand/30'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
              )}
              key={cat.catalogCategory}
              onClick={() => selectCategory(cat.catalogCategory)}
              type="button"
            >
              <NextImage
                alt={cat.label}
                className={cn('size-8 object-contain', !isActive && 'opacity-70 grayscale')}
                height={32}
                src={cat.iconSrc}
                width={32}
              />
              <span className="font-medium text-[11px] leading-none">{cat.label}</span>
              <span className="text-[10px] text-muted-foreground/70 leading-none">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Search + source */}
      <div className="flex shrink-0 items-center gap-1.5 border-border/70 border-b p-2">
        <input
          className="w-1/2 min-w-0 shrink-0 rounded-lg bg-muted px-2.5 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none"
          onChange={(e) => {
            setSearch(e.target.value)
            onSearchChange?.(e.target.value)
          }}
          placeholder={`Search ${activeCategory.label.toLowerCase()}…`}
          type="text"
          value={search}
        />
        <div className="flex w-1/2 min-w-0 shrink-0 rounded-lg bg-muted p-0.5">
          {sourceChips.map((chip) => {
            const isActive = activeSource === chip.id
            return (
              <button
                className={cn(
                  'min-w-0 flex-1 truncate rounded-md px-1 py-1 text-center font-medium text-[10px] transition-colors',
                  isActive
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                key={chip.id}
                onClick={() => setActiveSource(isActive ? null : chip.id)}
                type="button"
              >
                {chip.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Visual item grid — the focus of the panel */}
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isSearchPending ? (
          <div className="flex h-full items-center justify-center">
            <div className="size-5 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-muted-foreground" />
          </div>
        ) : isServerSearch && search && searchResults?.length === 0 ? (
          (emptyState ?? (
            <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
              No results for &ldquo;{search}&rdquo;
            </div>
          ))
        ) : (
          <ItemCatalog
            category={activeCategory.catalogCategory}
            emptyState={emptyState}
            items={activeSource && items ? items.filter(matchesSource) : items}
            key={activeCategory.catalogCategory}
            leadingTile={leadingTile}
            overrideItems={
              isServerSearch && search
                ? activeSource && searchResults
                  ? searchResults.filter(matchesSource)
                  : (searchResults ?? undefined)
                : undefined
            }
            search={isServerSearch ? '' : search}
          />
        )}
      </div>
    </div>
  )
}
