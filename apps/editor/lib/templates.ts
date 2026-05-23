'use client'

import type { TemplateEntry } from '@pascal-app/editor'

export interface CreateSceneFromTemplateResult {
  id: string
}

export async function createSceneFromTemplate(
  template: TemplateEntry,
): Promise<CreateSceneFromTemplateResult> {
  const graph = template.build()
  const response = await fetch('/api/scenes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: template.name, graph }),
  })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Failed to create scene from template (${response.status}): ${text}`)
  }
  const meta = (await response.json()) as { id: string }
  return { id: meta.id }
}
