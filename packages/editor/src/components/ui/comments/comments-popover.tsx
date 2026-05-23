'use client'

import { type AnyNodeId, useScene } from '@pascal-app/core'
import { useViewer } from '@pascal-app/viewer'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../../lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'

interface CommentEntry {
  id: string
  text: string
  createdAt: string
}

function isMetadataRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readComments(metadata: unknown): CommentEntry[] {
  if (!isMetadataRecord(metadata)) return []
  const raw = metadata.comments
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (c): c is CommentEntry =>
      isMetadataRecord(c) &&
      typeof c.id === 'string' &&
      typeof c.text === 'string' &&
      typeof c.createdAt === 'string',
  )
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Date.now() - then
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return new Date(iso).toLocaleDateString()
}

function newCommentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function useSelectedNode() {
  const selectedIds = useViewer((s) => s.selection.selectedIds)
  return useScene((s) => {
    if (selectedIds.length !== 1) return null
    const id = selectedIds[0]
    return id ? (s.nodes[id as AnyNodeId] ?? null) : null
  })
}

/**
 * Figma-style comments — anchored to any node. Click the 💬 icon in the
 * selection popover, read or add comments (stored on `node.metadata.comments`
 * — no schema change, same pattern as palettes/roomType/notes-attempt-revert).
 * Visible in both 2D and 3D because the host popover lives in both.
 */
export function CommentsPopover({ className }: { className?: string }) {
  const node = useSelectedNode()
  const updateNode = useScene((s) => s.updateNode)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')

  // Clear draft when selection changes
  useEffect(() => {
    setDraft('')
  }, [node?.id])

  if (!node) return null

  const comments = readComments((node as { metadata?: unknown }).metadata)

  const persist = (next: CommentEntry[]) => {
    const meta = (node as { metadata?: unknown }).metadata
    const base = isMetadataRecord(meta) ? meta : {}
    const nextMetadata: Record<string, unknown> = { ...base }
    if (next.length > 0) nextMetadata.comments = next
    else delete nextMetadata.comments
    updateNode(node.id as never, { metadata: nextMetadata } as never)
  }

  const handleAdd = () => {
    const text = draft.trim()
    if (!text) return
    const entry: CommentEntry = {
      id: newCommentId(),
      text,
      createdAt: new Date().toISOString(),
    }
    persist([...comments, entry])
    setDraft('')
  }

  const handleDelete = (id: string) => {
    persist(comments.filter((c) => c.id !== id))
  }

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger asChild>
        <button
          aria-label={`Comments (${comments.length})`}
          className={cn(
            'tooltip-trigger relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
            comments.length > 0 && 'text-foreground',
            className,
          )}
          title={
            comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'}` : 'Comment'
          }
          type="button"
        >
          <MessageSquare className="h-4 w-4" />
          {comments.length > 0 && (
            <span className="-top-1 -right-1 absolute flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 font-semibold text-[9px] text-brand-foreground">
              {comments.length > 9 ? '9+' : comments.length}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="center" className="w-80 p-0" side="top" sideOffset={8}>
        <div className="border-border/60 border-b px-3 py-2">
          <p className="font-medium text-xs">Comments</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Leave notes on what should change. Anyone opening this scene can read them.
          </p>
        </div>

        {comments.length > 0 ? (
          <ul className="max-h-56 divide-y divide-border/40 overflow-y-auto">
            {comments.map((c) => (
              <li className="group flex items-start gap-2 px-3 py-2" key={c.id}>
                <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand/15 text-[10px] font-semibold text-brand">
                  ·
                </span>
                <div className="min-w-0 flex-1">
                  <p className="whitespace-pre-wrap break-words text-xs leading-snug">{c.text}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {relativeTime(c.createdAt)}
                  </p>
                </div>
                <button
                  aria-label="Delete comment"
                  className="invisible flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive group-hover:visible"
                  onClick={() => handleDelete(c.id)}
                  type="button"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-3 py-4 text-center text-[10px] text-muted-foreground">
            No comments yet.
          </div>
        )}

        <div className="border-border/60 border-t p-2.5">
          <div className="flex items-end gap-2">
            <textarea
              autoFocus={open}
              className="min-w-0 flex-1 resize-none rounded-md border border-border bg-background px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              placeholder="Add a comment…"
              rows={2}
              value={draft}
            />
            <button
              aria-label="Add comment"
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-brand text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              disabled={draft.trim().length === 0}
              onClick={handleAdd}
              title="Add comment (Cmd/Ctrl + Enter)"
              type="button"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
