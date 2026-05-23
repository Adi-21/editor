# Pascal Editor — Progress Log

> Two parallel tracks, same engine / scene graph:
> - **Track A — UX redesign** (interior designers). Strategy: [`docs/ux-redesign.md`](./ux-redesign.md).
> - **Track B — Market v1: tablet-first floorplan → 3D**. Strategy: [`docs/market-v1-tablet.md`](./market-v1-tablet.md).
>
> Branch: `main` (work committed locally only as edits — see "Pending commit").

---

## Where things stand (last session)

### Track A — UX redesign

| Phase | Status | Doc reference |
|---|---|---|
| **Phase 0** — Token plumbing + ThemeSwitcher | ✅ Done | `docs/ux-redesign.md` §10 Phase 0 |
| **Camera tuning** (parallel fix) | ✅ Done | n/a — surfaced as user feedback |
| **Phase 1** — Appearance panel (color + finish + scene palette) | ✅ Done | `docs/ux-redesign.md` §10 Phase 1 |
| **Phase 1.5** — Material catalog (wood/wallpaper/granite/marble/etc) integrated | ✅ Done | n/a — extension on user feedback |
| **Phase 2** — Templates (`/start` + `/templates` + 6 starter rooms) | ✅ Done | `docs/ux-redesign.md` §10 Phase 2 |
| **Phase 3** — Share + USDZ + `/present` | ✅ Done | `docs/ux-redesign.md` §10 Phase 3 |
| **Phase 4** — Scenes & Palettes redesign | ✅ Done | `docs/ux-redesign.md` §10 Phase 4 |
| **Phase 5** — Polish | ⏳ Next | `docs/ux-redesign.md` §10 Phase 5 |

### Track B — Market v1 (tablet floorplan → 3D)

| Phase | Status | Doc reference |
|---|---|---|
| **Strategy doc** — direction approved, spec written, fidelity expanded | ✅ Done | `docs/market-v1-tablet.md` (whole) |
| **B0** — ~~`/design` shell~~ **REVERTED 2026-05-19** (no separate route) | ↩︎ Reverted | §11 B0 |
| **B0′** — Canva/Framer editor UI/UX restructure (DECIDED) | 🔵 In progress | §11 B0′ |
| · B0′.1 — Canva/Framer **top bar** on `/` **and** `/scene` (+ regression fix) | ✅ Done | §11 B0′ |
| · B0′.2 — ~~Build Tools tab~~ **REVERTED** (owner: bottom dock already builds well) | ↩︎ Reverted | §11 B0′ |
| · B0′.2b — Items panel redesign (visual categories, drop tag-cloud) | ✅ Done | §11 B0′ |
| · B0′.3 — Bottom dock kept as-is (owner: "works perfectly") | ✅ N/A (keep) | §11 B0′ |
| · B0′.4 — Visual polish (brand tokens, spacing, empty states) | Pending | §11 B0′ |
| **B1** — Precise mode productised (chaining + auto-room + numeric) **in /scene** | On hold (after B0′) | §11 B1 |
| **B2** — Doors & windows one-tap-on-wall | Pending | §11 B2 |
| **B3** — Plan symbology layer (Rung 1: poché/swings/breaks/labels/dims) | Pending | §11 B3 |
| **B4** — Rooms as typed zones (`zone.metadata.roomType` + auto-guess) | Pending | §11 B4 |
| **B5** — Auto-furnish ruleset → Rung 2 + Rung 3 (largest/riskiest) | Pending | §11 B5 |
| **B6** — The 2D→3D moment (fires auto-furnish) | Pending | §11 B6 |
| **B7** — Sketch mode (sequenced after furnished launch) | Pending | §11 B7 |
| **B8** — Polish & onboarding | Pending | §11 B8 |

> **PIVOT 2026-05-19 (owner):** *No `/design` route — everything stays in
> `/scene`, and that one editor must be understandable to a normal person.*
> The B0 `/design` shell was built then reverted (routes + `DesignShell` +
> `.design-shell` CSS removed; `useFormFactor` + global `viewport`/safe-area
> meta **kept** — additive and now serve `/scene`). All later phases retarget
> `/scene`. **B1+ are on hold until B0′'s scope is decided** (how aggressively
> to simplify the existing editor — see Track B · Pivot section below).
> Scope was also expanded 2026-05-18 to Rung 2 2D + auto-furnished 3D
> (asset-free: catalog ships 2D `floorPlanUrl` + 3D `.glb`). Does not block
> Track A Phase 5.

---

## Phase 0 — Brand themes & token plumbing

Implemented the Studio Warm / Studio Dusk / Studio Ocean theme system orthogonal to light/dark.

**Files added / modified**

- `apps/editor/app/globals.css` — added `--brand`, `--brand-foreground`, `--brand-hover`, `--brand-soft`, `--brand-sun`, `--selection`, `--selection-strong`, `--palette-1..5` tokens. Defaults set in `:root` and `[data-theme="studio-warm"]`. Overrides in `[data-theme="studio-dusk"]` and `[data-theme="studio-ocean"]`. All exposed via `@theme inline` so `bg-brand`, `text-brand-foreground`, etc. work as Tailwind utilities.
- `apps/editor/app/layout.tsx` — inline anti-FOUC bootstrap script reads `localStorage['pascal.theme']` and sets `data-theme` on `<html>` synchronously. SSR default is `studio-warm`.
- `packages/editor/src/components/ui/theme-switcher.tsx` — new `<ThemeSwitcher>` popover with 4-swatch chip trigger + 3-option list. Persists to `localStorage['pascal.theme']`. Exposes `useStudioTheme()` hook + `StudioTheme` type.
- `packages/editor/src/index.tsx` — exported `ThemeSwitcher`, `useStudioTheme`, `StudioTheme`.
- `apps/editor/components/viewer-toolbar.tsx` — mounted `<ThemeSwitcher />` in `CommunityViewerToolbarRight` next to existing `ThemeToggle` (light/dark).

**Ship criterion met:** Toggling a theme on the topbar updates `data-theme` on `<html>`, persists across reloads, and visibly affects the switcher's own active state via `bg-brand/15 text-brand`.

---

## Camera tuning (parallel fix on user feedback)

Replaced default `<CameraControls>` (drei) feel — which was sluggish — with snappier values.

**File modified**

- `packages/editor/src/components/editor/custom-camera-controls.tsx`
  - Added `useEffect` setting `dollyToCursor: true`, `smoothTime: 0.12`, `draggingSmoothTime: 0.04`, `dollySpeed: 1.6`, `truckSpeed: 2.5`, `azimuthRotateSpeed: 1.2`, `polarRotateSpeed: 1.2`.
  - Changed `minDistance` 10 → 1 and `maxDistance` 100 → 250.

The biggest win is `dollyToCursor: true` — wheel-zoom now tracks the cursor (Figma/SketchUp behavior) instead of dollying along a fixed axis.

---

## Phase 1 — Per-node Appearance panel

Unified color + finish + scene-palette persistence for **wall**, **slab**, and **ceiling** node panels.

**Files added**

- `packages/editor/src/components/ui/appearance/swatch-grid.tsx` — `<SwatchGrid>` clickable color tile grid.
- `packages/editor/src/components/ui/appearance/palette-strip.tsx` — `<PaletteStrip>` horizontal multi-chip strip.
- `packages/editor/src/components/ui/appearance/material-finish-toggle.tsx` — `<MaterialFinishToggle>` Matte / Satin / Gloss segmented control. Maps to `{ roughness, metalness }`. Exports `FINISH_VALUES` and `finishFromMaterial()` round-trip helper.
- `packages/editor/src/components/ui/appearance/appearance-section.tsx` — the unified `<AppearanceSection>` mounted into the per-node panels.
- `packages/editor/src/lib/scene-palette.ts` — `readScenePalette()`, `writeScenePalette()`, `useScenePalette()` hook. Stores `palette: string[]` on the **site node's `metadata.palette`** (BaseNode JSON metadata field — no schema change needed).
- `packages/editor/src/components/ui/panels/presets/palettes.json` — 22 curated palettes (verbatim from `docs/ux-redesign.md` §13.2).

**Files modified**

- `packages/editor/src/components/ui/panels/wall-panel.tsx` — mounted `<AppearanceSection node={node} />` above Dimensions.
- `packages/editor/src/components/ui/panels/slab-panel.tsx` — same, above Elevation.
- `packages/editor/src/components/ui/panels/ceiling-panel.tsx` — same, above Height.
- `packages/editor/src/index.tsx` — exported `AppearanceSection`, `SwatchGrid`, `PaletteStrip`, `MaterialFinishToggle`, `useScenePalette`, etc.

**How it wires**

- Click a swatch → `applyPaint({ material: customSchemaWithColorAndFinish, materialPreset: undefined })`. Uses existing `buildWallSurfaceMaterialPatch` (walls) / `buildSingleSurfaceMaterialPatch` (slab/ceiling) from `material-paint.ts`.
- Wall side toggle (Interior / Exterior) — only for walls, drives `wallSide` local state, paints the chosen side independently.
- Palette library popover (22 entries) → replaces the scene's 5-swatch palette via `writeScenePalette`.
- "Reset" → restores Mediterranean Sun default palette.

**Ship criterion met:** Pick a wall → pick a swatch → wall changes color. Save a palette → refresh → palette persists.

---

## Phase 1.5 — Material catalog integrated into Appearance

After Phase 1 shipped, the user pointed out the existing `<MaterialPicker>` (with `wood / wallpaper / parquet / granite / marble / other` tabs) was already mounted in `roof-panel.tsx` / `fence-panel.tsx` / `stair-panel.tsx` but **not** in wall/slab/ceiling. Integrated it into `<AppearanceSection>`.

**File modified**

- `packages/editor/src/components/ui/appearance/appearance-section.tsx` — embedded `<MaterialPicker>` with `value`, `selectedMaterialPreset`, `onChange`, `onSelectMaterialPreset` props. Swatch click writes `{material: custom, materialPreset: undefined}`; catalog click writes `{material: undefined, materialPreset}` — they're mutually exclusive per the `buildXPatch` semantics. Added disclaimer when a catalog preset is active that picking a finish will convert that surface to paint.

**Catalog already in repo** (`packages/core/src/material-library.ts`, no authoring needed):

| Category | Count |
|---|---|
| Wood | 5 |
| Wallpaper | 3 |
| Parquet | 2 |
| Granite | 1 |
| Marble | 2 |
| Other | 3+ (white / metal / glass presets) |

Granite has only 1 entry — call-out for future expansion (Polyhaven/AmbientCG PBR sets, drop into `public/material/<kind>/`).

---

## Phase 2 — Templates surface

`/start` + `/templates` + `<TemplateCard>` + 6 starter rooms + "Use template" → POST → scene flow.

**Files added**

- `packages/editor/src/components/ui/panels/presets/templates/builders.ts` — `buildRoom({ width, depth, height, palette })` factory. Parses Site → Building → Level → 4 Walls + Slab + Ceiling via Zod schemas. Mirrors `use-scene.ts` `loadScene` pattern (Site contains the Building object in `children`, Level contains child IDs).
- `packages/editor/src/components/ui/panels/presets/templates/index.ts` — `TEMPLATES` array (6 entries) + `findTemplate(id)`. Each entry has a `build()` thunk that generates fresh IDs per call.
- `apps/editor/components/template-card.tsx` — `<TemplateCard>` with palette-gradient hero, room + mood badges, `<PaletteStrip>`, "Use template" button using `bg-brand`.
- `apps/editor/lib/templates.ts` — `createSceneFromTemplate(template)` helper that calls `template.build()` then POSTs to `/api/scenes`.
- `apps/editor/app/templates/page.tsx` — `/templates` gallery with room + mood filter chips, responsive 1/2/3-col grid.
- `apps/editor/app/start/page.tsx` — `/start` with two equal cards: "Start from template" → `/templates`, "Blank canvas" → POST empty graph.

**File modified**

- `packages/editor/src/index.tsx` — exported `TEMPLATES`, `TemplateEntry`, `TemplateRoom`, `TemplateMood`, `findTemplate`.

**Templates shipped**

| ID | Name | Size | Mood |
|---|---|---|---|
| `studio-warm` | Studio · Warm | 5 × 4 m | warm |
| `bedroom-japandi` | Bedroom · Japandi | 4 × 3.5 m | japandi |
| `kitchen-coastal` | Kitchen · Coastal | 4 × 3 m | coastal |
| `living-warm` | Living room · Warm | 6 × 5 m | warm |
| `bath-minimal` | Bathroom · Minimal | 2.5 × 2 m | minimal |
| `office-industrial` | Home office · Industrial | 4 × 3 m | industrial |

Each template writes its palette to `site.metadata.palette`, so the Appearance panel's Scene palette is pre-populated when the new scene opens.

**End-to-end verified** via a smoke `bun run` script: builder produced a 9-node graph (`site + building + level + 4 walls + slab + ceiling`); server returned **HTTP 201** with `nodeCount: 9`; the new scene's `/scene/<id>` page renders.

Two test scenes created during the smoke pass (visible in `/scenes`):
- `Studio · Warm (test)` — empty graph baseline.
- `Studio · Warm (smoke)` — 9-node template graph.

---

## Phase 3 — Share + USDZ + Present

USDZ/GLB export + `<ShareMenu>` topbar dropdown + a standalone read-only
`/scene/[id]/present` page with AR Quick Look.

**Decision (asked + answered this session)**

- **Present page renders via the standalone `<Viewer>`** (not the Editor in
  preview mode). The present surface drives the **core** `useScene` store
  directly — no editor selection/tool state — and mounts `<ExportManager>` +
  drei `<OrbitControls autoRotate>` as `<Viewer>` children. Frames tick because
  `<FrameLimiter fps={50}>` runs a continuous RAF `advance()` loop even though
  the Canvas is `frameloop="never"`.
- **Share menu = Copy link · Download GLB · Download USDZ now.** The doc §8
  also lists a PDF mood-board; there's no PDF infra — deferred to Phase 5
  polish (see Outstanding items).

**Files added**

- `packages/editor/src/components/ui/share-menu.tsx` — `<ShareMenu>` popover
  (mirrors `<ThemeSwitcher>` popover conventions). Copy link, Download GLB,
  Download USDZ; driven by `useViewer().exportScene`. Disabled until the
  exporter registers.
- `apps/editor/components/present-view.tsx` — client present surface:
  standalone `<Viewer>` + `<ExportManager>` + autorotate `<OrbitControls>`,
  glass overlay with scene name, "Edit" link, `<PaletteStrip>` (live from
  `useScenePalette()`), and GLB / USDZ / **View in AR** / Copy-link buttons.
- `apps/editor/app/scene/[id]/present/page.tsx` — server route, mirrors the
  `/scene/[id]` fetch (`resolveBaseUrl` + `fetchScene`), renders `<PresentView>`.

**Files modified**

- `packages/viewer/src/store/use-viewer.ts` (+ tracked `use-viewer.d.ts`) —
  `exportScene` / `setExportScene` widened to
  `(format?: 'glb'|'stl'|'obj'|'usdz', options?: { download?: boolean }) => Promise<Blob | void>`.
- `packages/editor/src/components/editor/export-manager.tsx` — added the USDZ
  branch (`three/examples/jsm/exporters/USDZExporter.js`, `parseAsync`); every
  branch now returns its `Blob`; `options.download === false` skips the auto
  download (used by the AR-link path). Default behavior unchanged for existing
  GLB/STL/OBJ callers (`settings-panel`, command palette).
- `packages/editor/src/index.tsx` — exported `ExportManager`, `ShareMenu`.
- `packages/editor/src/components/ui/command-palette/editor-commands.tsx` —
  added `editor.export.usdz` ("Export for AR (USDZ)") next to the GLB command
  (satisfies the doc §12 cmdk-discoverability acceptance check).
- `apps/editor/components/viewer-toolbar.tsx` — `CommunityViewerToolbarRight`
  now mounts `<PresentButton>` (links to `/scene/[id]/present` via
  `useParams().id`, opens in a new tab) and `<ShareMenu>`.

**Build note (important)** — `@pascal-app/viewer` is consumed as built
`dist/` (`package.json` `"types": "./dist/index.d.ts"`), not `src`. After
changing a viewer `src` type you must rebuild it or the editor/app tsc still
sees the old signature: `cd packages/viewer && bun run build`. `dist/` is
gitignored, so this is local-only and not in the diff.

**Ship criterion (doc §10 Phase 3)** — Share menu and the present page both
produce a USDZ; `viewInAr()` generates the USDZ blob and synthesizes an
`<a rel="ar"><img></a>` click for iOS Quick Look. Type-check clean (21
pre-existing baseline errors only; none in any file added/modified this
session — verified from both `packages/editor` and `apps/editor`).

> **AR-link caveat:** Quick Look is handed a **blob: URL**. iOS Safari accepts
> this in current versions, but it is less robust than a real
> `Content-Type: model/vnd.usdz+zip` server response. A served-USDZ endpoint is
> the durable path — tracked under Outstanding items, not a Phase 3 blocker.

---

## Phase 4 — Scenes & Palettes redesign

Card-based `/scenes` with palette chips + a new `/palettes` library
(curated 22 + palettes-in-use) that can reuse a palette into a fresh scene.

**Files added**

- `packages/editor/src/lib/curated-palettes.ts` — `CURATED_PALETTES` +
  `CuratedPalette` type, single source of truth wrapping `palettes.json`.
- `apps/editor/lib/palettes.ts` — `extractPaletteFromGraph(graph)` (server-safe
  site-node palette read mirroring `readScenePalette`) + `createSceneWithPalette`
  (POSTs a `buildRoom`-seeded graph — the Phase 2 builder — to `/api/scenes`).
- `apps/editor/components/scene-card.tsx` — `<SceneCard>` (palette-gradient or
  thumbnail hero, node/version badges, `<PaletteStrip>`, relative "Edited …",
  Open + Present links). Plain server component (no client state).
- `apps/editor/components/palettes-view.tsx` — `<PalettesView>` client:
  "In your scenes" (distinct palettes grouped by signature, scene links) +
  "Curated library" (filtered by a search box on name/mood). Shared
  `<PaletteCard>` with Copy (clipboard) + New scene (→ `createSceneWithPalette`).
- `apps/editor/app/palettes/page.tsx` — server route; fetches scenes + their
  graphs, builds `ScenePaletteUsage[]`, renders `<PalettesView>`.

**Files modified**

- `apps/editor/app/scenes/page.tsx` — rewritten: parallel per-scene graph
  fetch → palette, `<SceneCard>` grid, `/palettes` header link, better empty
  state (Browse templates + Create).
- `packages/editor/src/index.tsx` — exported `CURATED_PALETTES`,
  `CuratedPalette`, `buildRoom`, `RoomSpec`.
- `packages/editor/src/components/ui/appearance/appearance-section.tsx` —
  dropped its local `palettes.json` import + `PaletteEntry`/`LIBRARY`; now
  consumes the shared `CURATED_PALETTES` (DRY).

**Scope decisions**

- **"Mira's saved palettes" = palettes detected across her scenes.** There is
  no user-level palette-board persistence yet (palettes live per-scene in
  `site.metadata.palette`); a dedicated saved-board needs auth/storage and is
  out of Phase 4 scope. The "In your scenes" section + curated library +
  Copy/New-scene reuse satisfy the §10 Phase 4 ship criterion.
- **`/scenes` + `/palettes` fetch each scene's graph** to read its palette
  (the list endpoint is metadata-only). Bounded by `limit=50`, parallel.
  Folding palette into `listScenes` is the durable fix — Outstanding items.
- **`@pascal-app/editor` is consumed as source** (`exports["."] =
  "./src/index.tsx"`), so new exports need no rebuild — unlike
  `@pascal-app/viewer` (built `dist/`).

**Ship criterion (doc §10 Phase 4)** — `/scenes` shows every project with its
palette at a glance; `/palettes` lets Mira copy or instantiate any palette
(curated or in-use) into a new scene. Type-check clean from both
`packages/editor` and `apps/editor` (21 pre-existing baseline errors only;
none in any file added/modified this session).

---

## Track B · Pivot (2026-05-19) — `/design` reverted, everything in `/scene`

Owner direction: **no `/design` route; keep everything in `/scene`, and the
one editor must be understandable to a normal person.** B0 (the `/design`
tablet shell) was built then reverted the same day.

**Removed** (the B0 shell): `apps/editor/app/design/page.tsx`,
`apps/editor/app/design/[id]/page.tsx`,
`apps/editor/components/design-shell.tsx`, and the `.design-shell` block in
`globals.css` (dead after the routes went).

**Kept** (additive, safe, now repurposed to make `/scene` itself
tablet-capable):
- `packages/editor/src/hooks/use-mobile.ts` — `useFormFactor()` →
  `'phone' | 'tablet' | 'desktop'` (768 / 1280), `useIsMobile` untouched.
  Exported from editor index.
- `apps/editor/app/layout.tsx` — `export const viewport`
  (`viewportFit:'cover'` for `env(safe-area-inset-*)` + `themeColor`).
  Comments de-`/design`'d.

Type-check clean after revert: `packages/editor` and `apps/editor` both 21
pre-existing baseline `error TS` lines, none in any kept/changed file.

**B0′ scope — DECIDED 2026-05-19 (owner):** features mostly exist; *first*
make `/scene` look & feel like **Canva/Framer** (one clean sidebar holding
everything + reuse the existing top 2D/3D toggle), integrate new features
after. Pure UI/UX recomposition, no new engine. Slices B0′.1–.4 in
`docs/market-v1-tablet.md` §11 B0′.

**B0′.1 — Canva/Framer top bar (done).** Added `apps/editor/components/
scene-topbar.tsx`: left = Pascal mark + "All scenes" + editable-later scene
name; centre = the existing **2D/3D/Split** `ViewModeControl` as the primary
control; right = Walkthrough · Theme · ThemeSwitcher · Present · Share.
Wired via SceneLoader `navbarSlot` (was unused). `viewer-toolbar.tsx`:
exported `ViewModeControl`/`ThemeToggle`/`WalkthroughButton`/`PresentButton`
for reuse; `CommunityViewerToolbarLeft` slimmed to just the sidebar-collapse
(2D/3D moved to the bar — no duplication). Removed the redundant floating
"All scenes" pill from SceneLoader. **No behaviour change — pure
recomposition.** `CommunityViewerToolbarRight` (dense advanced cluster) kept
for now; it gets tamed in B0′.3. Type-clean (21 baseline, none in B0′.1
files).

**RSC build-error fix (same session) — `/scenes` & `/palettes` were broken.**
Owner hit a Turbopack build error: a Phase-4 file, `apps/editor/lib/
palettes.ts`, imported the **`@pascal-app/editor` barrel** for a constant +
type; that barrel is consumed as source and pulls hook-using files lacking
`'use client'` (`settings-panel/index.tsx`, `keyboard-shortcuts-dialog.tsx`),
so the `/scenes` **Server Component** failed. Fix: (1) added `'use client'`
to those two leaf files (correct — they use hooks); (2) hardened
`lib/palettes.ts` to be barrel-free — inlined `DEFAULT_SCENE_PALETTE`,
`import type { SceneGraph }` only (erased); (3) moved `createSceneWithPalette`
(needs runtime `buildRoom`) to `lib/create-scene-with-palette.ts` (`'use
client'`, imported only by `palettes-view.tsx`). **`bun run build` now
compiles all 9 routes.** Process lesson: **`tsc --noEmit` does NOT catch
React Server Component boundary errors** — Phases 3/4/B0′ were tsc-clean but
this slipped through. Validation going forward must include `bun run build`
(from `apps/editor`), not just `tsc`.

**2D architect-plan look + Notes feature (2026-05-20, owner-directed).**
Goal owner stated: 2D should look like the reference architect floor plan
(solid poché walls, room labels with sq ft, door swings, window mullions,
dimension strings, furniture symbols) — all in the existing `/scene` 2D
view, NO new routes. **And** every area (room, wall, ceiling, floor, item)
should accept a free-form text note so users describe how they want to
decorate it, with minimum effort. Works in 2D and 3D (panels are
viewMode-agnostic).

**Done so far:**
- **Slice 1 — Wall poché**: in `floorplan-panel.tsx` (line ~4319) the wall
  polygon's default fill changed from `palette.wallFill` (light grey) to
  `palette.wallStroke` (the dark stroke colour). Walls now render as
  solid-filled architect-style poché instead of thin outlines. Selected
  state stays `#ffffff` against the dark, which is good contrast.
- **Slice 2 — Always-on room labels**: same file (~line 4107) — the slab
  label block lost its `if (isSelected)` gate. Each room now renders a
  two-line label at its centroid: room name (with trailing " Slab" stripped
  for clean defaults like "Room 1") above the computed area
  (`formatArea(area, unit, metersPerUnit)` — m² or sq ft per the toolbar
  unit toggle). Two `<text>` elements wrapped in a `<g pointerEvents="none">`.
- **Notes feature**: new
  `packages/editor/src/components/ui/notes/notes-section.tsx` (`NotesSection`,
  exported from editor index) — reusable PanelSection-styled textarea that
  reads/writes `node.metadata.notes` via `useScene.updateNode`. Saves on
  blur and Cmd/Ctrl+Enter; placeholder customisable per host panel. Mounted
  alongside AppearanceSection in `slab-panel`, `wall-panel`, `ceiling-panel`,
  and after the geometry sections in `item-panel`. **No schema change** —
  uses each BaseNode's existing JSON `metadata` field, same trick as
  Track A's `site.metadata.palette` and Track B's `zone.metadata.roomType`.
  Prop type intentionally loose (`node: { id: string; metadata?: unknown }`)
  to accept any node from the scene store without dragging the zod
  `JSONType` union into callers — internal type guards do the narrowing.

**Architect-plan symbology already in place** (Explore agent mapped
`floorplan-panel.tsx` ~15.7k LOC): doors render swing arcs (line ~4909),
windows have mullion lines (~4634), zone labels are draggable, items render
their `floorPlanUrl` PNG (~line 6247). Outer dimension strings and a
compass rose are *not* yet rendered — pending if needed after owner sees
the current state.

**Validation**: `bun run build` ✅ (14 routes), `tsc --noEmit` ✅ (21
pre-existing baseline, none in any changed/added file). 

**Bug fix same session (owner-reported):** in 2D, items were **unselectable
unless** `phase` was `structure` or `furnish`. Default `phase` is `site`,
so on a fresh scene you couldn't click any item to edit it — and the right-
side floating panel (and therefore Notes) never appeared. Walls and slabs
never had this gate. Fix in `floorplan-panel.tsx` (~line 9143-9174):
dropped `isFloorplanItemContextActive`/`isFloorplanStructureContextActive`
from `canSelectFloorplanItems`, `canSelectFloorplanStairs`,
`canSelectFloorplanSpawns` and their `canFocus*` siblings, so items / stairs
/ spawns now match walls' "selectable in any phase when mode=select &
tool=click" behaviour. Validated `bun run build` + tsc.

**Panel position note:** `PanelWrapper` (per-node panels) renders as a
fixed floating panel at `top-20 right-4 z-50` on desktop; on mobile it goes
into the bottom sheet. So selecting a wall/slab/ceiling/item brings up the
top-right floating panel.

**NotesSection REMOVED 2026-05-21 (owner feedback: not what was wanted).**
Reverted from slab/wall/ceiling/item panels; deleted
`packages/editor/src/components/ui/notes/`; removed editor-index export.

**Selection popover offset raised** (`floating-action-menu.tsx` ~line 137):
`yOffset` for structural nodes (walls/slabs) bumped 0.8 → 1.6 m so the
"H 2.5m" / dimension labels above the box don't get covered by the
curve/duplicate/delete icon pill.

**Prompt-driven item placement (B-feature, owner-directed).** New
`packages/editor/src/components/ui/suggest-items/suggest-items-popover.tsx`
(`<SuggestItemsPopover>`): a ✨ (Sparkles) icon mounted in the selection
popover (`NodeActionMenu`). Self-hides unless a single **slab** is
selected. On click → Radix popover with a textarea. Type "kitchen
appliances" / "sofa coffee table" / "bedroom" → on submit, keywords are
scored against `CATALOG_ITEMS` (`category` weight 3, exact-tag 2,
partial-tag 1, name-exact 3, name-includes 1) and the top 4 distinct
matches are `ItemNode.parse(…)` + `useScene.createNode` placed at the
slab polygon's centroid with a small spread (`SPREAD_RADIUS_M = 0.9 m`)
so they don't stack. **No LLM** — pure keyword scoring per owner's
"keyword based, not AI" requirement. Works in **2D and 3D** because the
popover lives in `NodeActionMenu` which is rendered in both surfaces.
Validated: `tsc` 21 baseline (none in my files), `bun run build`
✅ all 14 routes.

**Figma-style comments (B-feature, done same thread 2026-05-21).** New
`packages/editor/src/components/ui/comments/comments-popover.tsx`
(`<CommentsPopover>`) — 💬 (MessageSquare) icon mounted in `NodeActionMenu`
right next to the ✨ Suggest-items popover. Self-contained: reads
selected single-node from `useViewer`/`useScene`, exposes a thread of
`{ id, text, createdAt }` entries stored on `node.metadata.comments[]`.
Internal type guards narrow the JSON metadata. Add via Cmd/Ctrl+Enter
or the send button; delete per-comment (hover row → trash). Brand-coloured
count badge on the icon when the selected node has any comments. Works on
**any** selected node (walls, slabs, ceilings, items, doors, windows…) in
both 2D and 3D — same shared popover surface.

**Open follow-up:** canvas-level marker rendering (a small floating badge
on commented nodes in 2D and 3D so users see at-a-glance where the
comments live, without selecting first). Defered — requires per-surface
markers and isn't needed for the basic "select → read/write" loop. Will
add when owner asks.

---

**B0′.2 reverted + Items redesigned (2026-05-19/20, owner feedback).** Owner:
the **bottom dock already builds perfectly** — drop the redundant Build tab;
keep **Scene · Items · Settings**; make **Items** a clean categorized visual
catalog; *then* focus on making 2D layouts in the editor.
- Reverted: removed the Build tab from `app/page.tsx` + `scene-loader.tsx`
  SIDEBAR_TABS; **deleted** `tools-panel/` + its editor-index export (dead).
  `scene-loader.tsx` now carries **Scene · Items · Settings** (it previously
  had only Scene — keeping Items/Settings there is the wanted improvement).
  Bottom ActionMenu/dock left exactly as-is (owner: works perfectly) — B0′.3
  "tame the dock" is dropped.
- Items redesign (`packages/editor/src/components/ui/sidebar/panels/
  items-panel/index.tsx` rewritten + `item-catalog/item-catalog.tsx` grid):
  **removed the overwhelming functional/placement tag-chip cloud** (dozens of
  chips that buried the grid); categories now a clean 3-col grid of big
  visual tiles (icon + label + per-category count, brand active state);
  kept Search + Library/Community/Mine; **bigger 3D-thumbnail grid**
  (`minmax(90→108px)`, gap 2→2.5). Item cards already render rendered 3D
  thumbnails. Validated: `bun run build` (all routes) + tsc (21 baseline,
  none in changed files).
- **Next focus (owner):** 2D layout creation in the editor (the Track B core
  — drawing the floorplan in 2D view). B1 territory.

<!-- superseded note kept for history -->
**(superseded) B0′.2 — unified sidebar.** New
`packages/editor/src/components/ui/sidebar/panels/tools-panel/index.tsx`
(`ToolsPanel`, exported from editor index): a Canva/Framer creation panel —
plain rows **Select · Wall · Door · Window · Room · Floor · Stairs ·
Furniture** with icon+label+hint, **zero phase/mode/structure-layer
vocabulary**. `pickTool()` drives the existing store with the correct
transition order (setPhase→setStructureLayer→setMode('build')→setTool last,
since `setTool` is a plain set and never overridden after); Furniture →
`setPhase('furnish')` + jumps to the Items tab. Added a **Build** tab
(first) to `SIDEBAR_TABS` in `app/page.tsx`; `scene-loader.tsx` previously
had **only** a Scene tab — now Build · Scene · Items · Settings (Items was
required for the Furniture jump to land somewhere). Validated with
`bun run build` (14 routes compile) + tsc (21 baseline, none in changed
files). Bottom ActionMenu still present (B0′.3); tools now also live in the
sidebar with no jargon.

**B0′.1 fix-up (same session, after owner screenshots):** the top bar was
only wired into `SceneLoader` (`/scene/[id]`), so on `/` (the local editor
the owner was testing) removing 2D/3D from the left pill **dropped the
toggle entirely** — a regression. Fixed: `SceneTopBar` props made optional
(local `/` variant shows "Local · not saved · Save/open"); wired into
`apps/editor/app/page.tsx` via `navbarSlot` (removed the old floating
"Local editor" pill). Also de-duplicated by slimming
`CommunityViewerToolbarRight` to **advanced view toggles only** (Level /
Wall / Grid / Unit / Camera) — Theme/Walkthrough/Preview/Present/Share now
live only in the top bar (partial B0′.3). Both `/` and `/scene/[id]` now
share the one coherent bar. Type-clean (21 baseline, none in changed files).

---

## How to resume next session

1. **Dev server** — was running on `http://localhost:3002` via `bun dev` in a background task. If you need to kill it: `pkill -f "bun dev"` or `pkill -f "next dev"`. To restart: `cd /Users/adi-21/workspace/editor && bun dev`.
2. **Pending commit** — none of this work has been committed yet. `git status` will show all the new files + modifications. Branch is `main`. When ready, group as:
   - One commit: Phase 0 (`globals.css`, `layout.tsx`, `theme-switcher.tsx`, viewer toolbar wiring).
   - One commit: camera tuning (`custom-camera-controls.tsx`).
   - One commit: Phase 1 + 1.5 (`appearance/*`, `scene-palette.ts`, `palettes.json`, panel mountings).
   - One commit: Phase 2 (`templates/*`, `template-card.tsx`, `templates.ts`, `/start`, `/templates`).
   - One commit: Phase 3 (`use-viewer.ts`/`.d.ts`, `export-manager.tsx`, `share-menu.tsx`, `editor-commands.tsx`, editor `index.tsx` exports, `present-view.tsx`, `app/scene/[id]/present/`, `viewer-toolbar.tsx`).
   - One commit: Phase 4 (`curated-palettes.ts`, editor `index.tsx` exports, `appearance-section.tsx` DRY, `apps/editor/lib/palettes.ts`, `scene-card.tsx`, `palettes-view.tsx`, `app/scenes/page.tsx`, `app/palettes/page.tsx`).
   - One commit: Track B pivot (kept `hooks/use-mobile.ts` `useFormFactor`, editor `index.tsx` exports, `app/layout.tsx` `viewport`; **`/design` routes + `DesignShell` + `.design-shell` CSS deleted** — net of the reverted B0).
   - Plus one docs commit (`docs/ux-redesign.md`, `docs/market-v1-tablet.md`, `docs/progress.md`).
3. **Type-check** — `bunx tsc --noEmit` from `packages/editor/` (21 pre-existing `error TS` lines) and `apps/editor/` (same 21, all from `packages/editor/src/...`). None from any file added/modified/kept across Track A Phases 0–4 or the Track B pivot. **First rebuild `@pascal-app/viewer`** (`cd packages/viewer && bun run build`) — editor/app tsc reads viewer's `dist/` types. `@pascal-app/editor` is consumed as source — no rebuild.
4. **Next** — Track B **B0′**: decide how aggressively to simplify the *existing* `/scene` editor for a normal person (the open scope question — see "Track B · Pivot"). **B1+ are on hold until that's locked.** Track A Phase 5 (Polish) remains open in parallel: motion choreography, real PBR textures, `/` → `/start` CTA, fold palette into `listScenes`, per-scene palette → theme tokens.

---

## Outstanding items / follow-ups

- **More material catalog entries** — granite has only 1 entry; wallpaper has 3; marble has 2. Use Polyhaven/AmbientCG PBR sets and drop into `public/material/<kind>/`, mirror existing entry shape in `material-library.ts`.
- **Multi-surface AppearanceSection** — roof / stair / fence / column have multiple material roles (top/edge/wall, railing/tread/side, etc.). They already use `<MaterialPicker>` standalone; unifying under `<AppearanceSection>` is a follow-up.
- **Real template thumbnails** — currently a palette gradient hero. Replace with rendered PNGs (3-second autorotate GLB previews per doc §7.2) once a thumbnail render pipeline is wired.
- **Landing → /start** — `/` doesn't yet point at `/start`. Wire the marketing CTA (Phase 5 polish).
- **Fold palette into `listScenes`** — `/scenes` and `/palettes` currently fetch every scene's full graph just to read `site.metadata.palette`. Return palette (or a 5-color summary) from the list endpoint / storage adapter to drop the N graph reads. Touches `@pascal-app/mcp` storage — Phase 5.
- **(Track B B0′) Lock the simplification approach for `/scene`** — the open scope question that blocks B1+. When tackled, also do the iPad-on-`/scene` touch pass (the `touch-action`/`100dvh`/safe-area work that the deleted `.design-shell` did, now applied to the scene editor wrapper instead) and decide if a tablet `<Editor>` layout variant is needed.
- **Item recolor** — Phase 1 intentionally skipped `item` nodes (separate catalog/asset pipeline). Doc puts this in Phase 5 polish.
- **PDF mood-board export** — doc §8 lists it in the Share menu; deferred (no PDF infra). Phase 5 polish: render palette + a canvas screenshot to PDF (jspdf or similar), add as a fourth `<ShareMenu>` entry.
- **Served-USDZ endpoint** — the present page's "View in AR" hands Quick Look a blob: URL. Robust path is a real route serving the USDZ with `Content-Type: model/vnd.usdz+zip` (e.g. `GET /api/scenes/[id]/model.usdz`), then `<a rel="ar" href="…/model.usdz">`. Pairs with the scene-save/thumbnail server work, which is still stubbed.
- **Present-page camera framing** — `<OrbitControls>` uses a fixed `target=[0,1.2,0]` + the viewer's default cam. Good enough for the modest starter rooms; compute a scene bbox to auto-fit for larger/off-origin scenes (Phase 5 polish).
- **iOS AR fidelity testing** — doc §11 calls for testing Quick Look on iOS 17/18/26 before marketing "View in AR"; not yet done.

---

## Decisions worth re-reading before next phase

- **`paint-panel.tsx` is the eyedropper paint *mode*** — a different feature surface from the per-node Appearance section. **Don't merge or touch it.**
- **Site contains the full Building object in `children`** (not just the ID) per the seeded `loadScene()` pattern. Level and below contain child IDs. The `apiGraphSchema` `superRefine` validates each node against `AnyNode`, so deviating from this pattern would fail at the API boundary.
- **Theme axis is orthogonal to dark mode.** `data-theme` lives on `<html>`. `.dark` lives on the editor's outer div. Compose freely. Adding broad `bg-brand` usage to other surfaces is fine; just make sure both axes render correctly.
- **Per-scene palette overrides per-user theme.** Doc §13.3 says this; still not enforced (Phase 4 chose not to — it isn't part of the §10 Phase 4 deliverables and touches the editor runtime theme tokens). Revisit in Phase 5 if it matters: on scene open, push `site.metadata.palette` into the `--palette-*` / accent tokens.
- **No user-level palette board.** Palettes are per-scene (`site.metadata.palette`). `/palettes` "In your scenes" is derived, not a saved board. A real saved-palette feature needs auth/storage — long-horizon, schema already compatible.
