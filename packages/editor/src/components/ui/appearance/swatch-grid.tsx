'use client'

import { cn } from '../../../lib/utils'

export interface SwatchGridProps {
  colors: string[]
  selected?: string
  onSelect: (color: string) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZE_CLASSES = {
  sm: 'h-5 w-5',
  md: 'h-7 w-7',
  lg: 'h-9 w-9',
} as const

function normalizeHex(value: string | undefined) {
  if (!value) return undefined
  return value.trim().toLowerCase()
}

export function SwatchGrid({
  colors,
  selected,
  onSelect,
  size = 'md',
  className,
  label,
}: SwatchGridProps) {
  const normalizedSelected = normalizeHex(selected)
  return (
    <div className={className}>
      {label && (
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => {
          const normalized = normalizeHex(color)
          const isActive = normalized === normalizedSelected
          return (
            <button
              aria-label={color}
              aria-pressed={isActive}
              className={cn(
                'shrink-0 rounded-md border border-border/40 transition-all',
                'hover:scale-110 hover:border-foreground/40',
                isActive && 'scale-110 border-foreground/80 ring-2 ring-brand/60 ring-offset-1 ring-offset-background',
                SIZE_CLASSES[size],
              )}
              key={color}
              onClick={() => onSelect(color)}
              style={{ backgroundColor: color }}
              title={color.toUpperCase()}
              type="button"
            />
          )
        })}
      </div>
    </div>
  )
}
