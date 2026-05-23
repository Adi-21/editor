import { PaletteStrip } from '@pascal-app/editor'
import { ArrowRight, Presentation } from 'lucide-react'
import Link from 'next/link'
import type { SceneMeta } from '@/components/scene-loader'

export interface SceneCardProps {
  scene: SceneMeta
  palette: string[]
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return iso
  const diff = Date.now() - then
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

export function SceneCard({ scene, palette }: SceneCardProps) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border/60 bg-background transition-all hover:border-border hover:shadow-elevation-4">
      <Link
        className="relative flex aspect-[4/3] w-full overflow-hidden"
        href={`/scene/${scene.id}`}
        style={
          scene.thumbnailUrl
            ? undefined
            : { background: `linear-gradient(135deg, ${palette.join(', ')})` }
        }
      >
        {scene.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={scene.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={scene.thumbnailUrl}
          />
        ) : null}
        <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <span className="rounded-md bg-black/40 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-md">
            {scene.nodeCount} node{scene.nodeCount === 1 ? '' : 's'}
          </span>
          <span className="rounded-md bg-black/40 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-md">
            v{scene.version}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="truncate font-semibold text-sm">{scene.name}</h3>
          <p className="mt-1 text-muted-foreground text-xs">
            Edited {relativeTime(scene.updatedAt)}
          </p>
        </div>

        <PaletteStrip colors={palette} size="sm" />

        <div className="mt-auto flex items-center gap-2">
          <Link
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-brand px-3 py-2 font-medium text-brand-foreground text-xs transition-colors hover:bg-brand-hover"
            href={`/scene/${scene.id}`}
          >
            <span>Open</span>
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            aria-label="Present"
            className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
            href={`/scene/${scene.id}/present`}
            target="_blank"
          >
            <Presentation className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  )
}
