'use client'

import { cn } from '../../../lib/utils'

export interface PaletteStripProps {
  colors: string[]
  onClick?: (color: string, index: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
  rounded?: boolean
}

const HEIGHT = {
  sm: 'h-3',
  md: 'h-5',
  lg: 'h-7',
} as const

export function PaletteStrip({
  colors,
  onClick,
  size = 'md',
  className,
  rounded = true,
}: PaletteStripProps) {
  if (colors.length === 0) return null
  const interactive = Boolean(onClick)
  return (
    <div
      className={cn(
        'flex w-full overflow-hidden ring-1 ring-border/60',
        rounded && 'rounded-md',
        HEIGHT[size],
        className,
      )}
    >
      {colors.map((color, index) => {
        const baseClasses = 'block flex-1 transition-transform'
        if (!interactive) {
          return (
            <span
              aria-hidden
              className={baseClasses}
              key={`${color}-${index}`}
              style={{ backgroundColor: color }}
            />
          )
        }
        return (
          <button
            aria-label={color}
            className={cn(baseClasses, 'cursor-pointer hover:flex-[1.4]')}
            key={`${color}-${index}`}
            onClick={() => onClick?.(color, index)}
            style={{ backgroundColor: color }}
            title={color.toUpperCase()}
            type="button"
          />
        )
      })}
    </div>
  )
}
