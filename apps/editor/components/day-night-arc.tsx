'use client'

import { useViewer } from '@pascal-app/viewer'
import { Moon, Sun } from 'lucide-react'
import { useCallback, useRef } from 'react'

/**
 * Half-circle slider — left = bright day, right = night. Dragging the
 * knob along the arc updates `useViewer.timeOfDay` (0..1), which the
 * Lights component reads to dim + tint the scene every frame.
 *
 * The arc lives inside an SVG with viewBox proportional to the visible
 * geometry; the pointer-to-time math runs in those same coordinates so
 * pointer events Just Work at any CSS scale.
 */
const VB_WIDTH = 100
const VB_HEIGHT = 56
const CX = VB_WIDTH / 2 // 50
const CY = VB_HEIGHT - 4 // 52, so the arc sits with a small bottom inset
const R = 44

export function DayNightArc() {
  const timeOfDay = useViewer((s) => s.timeOfDay)
  const setTimeOfDay = useViewer((s) => s.setTimeOfDay)
  const svgRef = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)

  // Pointer is in client coords; project into viewBox coords by sampling
  // the SVG's own CTM. Then convert (x,y) relative to arc centre into an
  // angle in [-π/2, π/2] mapped to time in [0,1] (left=0, right=1).
  const computeTime = useCallback((ev: PointerEvent | React.PointerEvent): number => {
    const svg = svgRef.current
    if (!svg) return 0
    const rect = svg.getBoundingClientRect()
    const vx = ((ev.clientX - rect.left) / rect.width) * VB_WIDTH
    const vy = ((ev.clientY - rect.top) / rect.height) * VB_HEIGHT
    const dx = vx - CX
    const dy = CY - vy // invert: upwards is positive
    const angle = Math.atan2(dx, dy) // -π..π, 0 = straight up
    const clamped = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle))
    return (clamped + Math.PI / 2) / Math.PI // -π/2 → 0, +π/2 → 1
  }, [])

  const handlePointerDown = useCallback(
    (ev: React.PointerEvent) => {
      ev.currentTarget.setPointerCapture(ev.pointerId)
      dragging.current = true
      setTimeOfDay(computeTime(ev))
    },
    [computeTime, setTimeOfDay],
  )

  const handlePointerMove = useCallback(
    (ev: React.PointerEvent) => {
      if (!dragging.current) return
      setTimeOfDay(computeTime(ev))
    },
    [computeTime, setTimeOfDay],
  )

  const handlePointerUp = useCallback((ev: React.PointerEvent) => {
    dragging.current = false
    if (ev.currentTarget.hasPointerCapture(ev.pointerId)) {
      ev.currentTarget.releasePointerCapture(ev.pointerId)
    }
  }, [])

  // Knob position: time → angle → (x, y) on the arc.
  const angle = (timeOfDay - 0.5) * Math.PI // -π/2..+π/2
  const knobX = CX + R * Math.sin(angle)
  const knobY = CY - R * Math.cos(angle)

  // Visual "fill" gradient stops shift with time so the arc visually
  // tracks day → night without needing a separate progress arc.
  const sunActive = timeOfDay < 0.3
  const moonActive = timeOfDay > 0.7

  return (
    <div
      aria-label={`Time of day: ${Math.round(timeOfDay * 100)}%`}
      className="flex h-9 w-[120px] items-center justify-center rounded-xl border border-border bg-background/60 px-1.5"
      title={`Time of day · ${Math.round(timeOfDay * 100)}% (drag to change lighting)`}
    >
      <Sun
        className={`h-3.5 w-3.5 transition-colors ${
          sunActive ? 'text-amber-400' : 'text-muted-foreground/60'
        }`}
      />
      <svg
        className="mx-1 h-7 flex-1 touch-none select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={svgRef}
        style={{ cursor: 'pointer' }}
        viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      >
        <defs>
          <linearGradient id="day-night-arc-gradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#94a3b8" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#475569" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        {/* Arc track */}
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="url(#day-night-arc-gradient)"
          strokeLinecap="round"
          strokeWidth="3.5"
        />
        {/* Knob */}
        <circle
          cx={knobX}
          cy={knobY}
          fill="var(--color-brand, #14b8a6)"
          r="5"
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      <Moon
        className={`h-3.5 w-3.5 transition-colors ${
          moonActive ? 'text-indigo-300' : 'text-muted-foreground/60'
        }`}
      />
    </div>
  )
}
