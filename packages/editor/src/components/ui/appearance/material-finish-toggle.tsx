'use client'

import { cn } from '../../../lib/utils'

export type MaterialFinish = 'matte' | 'satin' | 'gloss'

export const FINISH_VALUES: Record<MaterialFinish, { roughness: number; metalness: number }> = {
  matte: { roughness: 0.9, metalness: 0 },
  satin: { roughness: 0.4, metalness: 0 },
  gloss: { roughness: 0.05, metalness: 0 },
}

export function finishFromMaterial(
  roughness: number | undefined,
  metalness: number | undefined,
): MaterialFinish {
  const r = roughness ?? 0.5
  if (r >= 0.7) return 'matte'
  if (r >= 0.2) return 'satin'
  return 'gloss'
}

const OPTIONS: { id: MaterialFinish; label: string }[] = [
  { id: 'matte', label: 'Matte' },
  { id: 'satin', label: 'Satin' },
  { id: 'gloss', label: 'Gloss' },
]

export interface MaterialFinishToggleProps {
  value: MaterialFinish
  onChange: (next: MaterialFinish) => void
  label?: string
  className?: string
}

export function MaterialFinishToggle({
  value,
  onChange,
  label,
  className,
}: MaterialFinishToggleProps) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-[0.12em]">
          {label}
        </p>
      )}
      <div className="inline-flex rounded-md border border-border bg-background/50 p-0.5">
        {OPTIONS.map((option) => {
          const isActive = option.id === value
          return (
            <button
              aria-pressed={isActive}
              className={cn(
                'rounded px-3 py-1 font-medium text-xs transition-colors',
                isActive
                  ? 'bg-brand text-brand-foreground shadow-sm'
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
    </div>
  )
}
