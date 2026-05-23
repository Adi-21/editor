import type { SceneGraph } from '../../../../../lib/scene'
import { buildRoom } from './builders'

export type TemplateRoom =
  | 'studio'
  | 'bedroom'
  | 'kitchen'
  | 'living'
  | 'bath'
  | 'office'

export type TemplateMood = 'warm' | 'minimal' | 'coastal' | 'japandi' | 'industrial' | 'boho'

export interface TemplateEntry {
  id: string
  name: string
  description: string
  room: TemplateRoom
  mood: TemplateMood
  palette: string[]
  build: () => SceneGraph
}

export const TEMPLATES: TemplateEntry[] = [
  {
    id: 'studio-warm',
    name: 'Studio · Warm',
    description: 'A 5 × 4 m studio with a Mediterranean-sun palette.',
    room: 'studio',
    mood: 'warm',
    palette: ['#FFEED0', '#F4C180', '#00A79D', '#007064'],
    build: () =>
      buildRoom({
        width: 5,
        depth: 4,
        height: 2.7,
        palette: ['#FFEED0', '#F4C180', '#00A79D', '#007064'],
      }),
  },
  {
    id: 'bedroom-japandi',
    name: 'Bedroom · Japandi',
    description: 'Quiet 4 × 3.5 m bedroom shell — earthy neutrals.',
    room: 'bedroom',
    mood: 'japandi',
    palette: ['#E2DED3', '#857671', '#4E413B', '#FF6D24'],
    build: () =>
      buildRoom({
        width: 4,
        depth: 3.5,
        height: 2.6,
        palette: ['#E2DED3', '#857671', '#4E413B', '#FF6D24'],
      }),
  },
  {
    id: 'kitchen-coastal',
    name: 'Kitchen · Coastal',
    description: 'Open 4 × 3 m kitchen shell with a cool deep-ocean palette.',
    room: 'kitchen',
    mood: 'coastal',
    palette: ['#D6E8EE', '#97CADB', '#018ABE', '#02457A'],
    build: () =>
      buildRoom({
        width: 4,
        depth: 3,
        height: 2.7,
        palette: ['#D6E8EE', '#97CADB', '#018ABE', '#02457A'],
      }),
  },
  {
    id: 'living-warm',
    name: 'Living room · Warm',
    description: 'Spacious 6 × 5 m living room with terracotta accents.',
    room: 'living',
    mood: 'warm',
    palette: ['#FFEED0', '#F5CEC7', '#E79796', '#C24D2C'],
    build: () =>
      buildRoom({
        width: 6,
        depth: 5,
        height: 2.8,
        palette: ['#FFEED0', '#F5CEC7', '#E79796', '#C24D2C'],
      }),
  },
  {
    id: 'bath-minimal',
    name: 'Bathroom · Minimal',
    description: 'Compact 2.5 × 2 m bathroom shell in soft mist.',
    room: 'bath',
    mood: 'minimal',
    palette: ['#FFF5F4', '#D9D9D7', '#3E4A62', '#1A273A'],
    build: () =>
      buildRoom({
        width: 2.5,
        depth: 2,
        height: 2.5,
        palette: ['#FFF5F4', '#D9D9D7', '#3E4A62', '#1A273A'],
      }),
  },
  {
    id: 'office-industrial',
    name: 'Home office · Industrial',
    description: 'A 4 × 3 m office with charcoal-sage industrial palette.',
    room: 'office',
    mood: 'industrial',
    palette: ['#3F3F3F', '#437A5B', '#B4CD93', '#FBF5E5'],
    build: () =>
      buildRoom({
        width: 4,
        depth: 3,
        height: 2.7,
        palette: ['#3F3F3F', '#437A5B', '#B4CD93', '#FBF5E5'],
      }),
  },
]

export function findTemplate(id: string): TemplateEntry | undefined {
  return TEMPLATES.find((entry) => entry.id === id)
}
