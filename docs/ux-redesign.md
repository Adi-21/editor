# Pascal Editor — UX Redesign Strategy & Spec

> **Audience-first redesign aimed at professional interior designers.**
> Templates ship alongside the blank canvas. A real color/material system replaces
> the current neutral shell. AR/USDZ export turns scenes into shareable artifacts.

**Status:** Proposal, pre-implementation.
**Owner:** TBD.
**Last updated:** 2026-05-13.
**Related code:**
`apps/editor/app/globals.css` ·
`packages/editor/src/components/ui/panels/paint-panel.tsx` ·
`packages/editor/src/components/ui/panels/presets/` ·
`packages/editor/src/components/ui/item-catalog/` ·
`packages/mcp/src/tools/export-glb.ts` ·
`styles/elevation.css`

---

## 1. Why we're doing this

The editor is technically excellent — clean monorepo split (`core` / `viewer` /
`editor` / `mcp`), proper Zustand + Zundo undo/redo, WebGPU rendering, MCP
agent surface — but it currently feels like an **engineering tool, not a
designer tool**. The shell is monochrome OKLCH neutrals
(`apps/editor/app/globals.css:65-134`), the entry surface (`/scenes`) is a flat
list, item materials are mostly placeholders, and there's no way out of the
editor into a format a client can actually walk through (AR/VR).

For our target persona — the professional interior designer — the loop has to
feel closer to **Figma + Framer + Houzz**: pick a starting point that already
looks great, swap in real materials/colors, present to the client in AR.
Everything in this doc serves that loop.

---

## 2. North-star principles

1. **Color is product, not chrome.** Neutrals are the floor, not the ceiling.
   Surfaces should be quiet; the user's scene and palette swatches should carry
   the chromatic weight.
2. **Start populated, never empty.** Blank canvas remains, but the default
   entry shows beautiful, completed rooms. Confidence comes from "edit this,"
   not "build from scratch."
3. **Materials are first-class.** Picking a finish should feel like flipping a
   sample book — large swatches, real previews, palette grouping, save-to-board.
4. **One surface for selection.** Whatever is selected (wall, floor, item, zone)
   shows its color/material options *in the same panel slot*, not buried in
   sub-menus.
5. **Export should feel inevitable.** The "Share" button should produce a link,
   a PDF mood-board, *and* a USDZ in one click — no setup screen.
6. **Pro speed, novice grace.** Every action accessible via keyboard +
   command palette (already have `cmdk`); every action also discoverable via
   a visible toolbar.
7. **Motion serves comprehension.** Use `motion` (already a dep) for object
   selection feedback, panel transitions, palette swatch flips. Never for
   decoration.

---

## 3. Personas

### 3.1 Primary — Mira, Interior Designer, 6 yrs experience

- Works with 4–8 active projects. Bills hourly. Pitches via mood boards.
- Comfortable with Pinterest, SketchUp, Canva, Sketch. Has tried Coohom and
  Planner 5D — found them either too templated (kiddie) or too engineering.
- Pain: explaining a finish swap to a client over WhatsApp. Wants AR
  walk-through she can text.
- Wins: a palette she saves once and reuses across projects. A floor-finish
  picker that *looks* like real swatches. Quick re-skin of a baseline room.

### 3.2 Secondary — Real-estate stager / agent

- Needs: drop in a stock 2BHK template, swap furniture for 3 buyer profiles
  (young couple / family / minimalist), export each as USDZ + photo. **In one
  afternoon.**
- Sensitive to: time per scene, export quality, ease of duplication.

### 3.3 Tertiary — DIY homeowner ("Imagine your home")

- Casual user, mobile-heavy, no CAD background. Comes in from a marketing
  page that pitches "design your dream room."
- Wins: templates, presets, on-rails experience, big buttons, social share.

> **Design priority order:** Mira > Stager > DIY. When tradeoffs hit, Mira
> wins. But the design should *not* feel hostile to the others.

---

## 4. Information architecture

### Current

```
/                       Landing (marketing)
/scenes                 Flat list of saved scenes
/scene/[id]             Editor canvas
```

### Proposed

```
/                       Landing — hero, three persona entries
/start                  NEW. Two equal cards: "From template" | "Blank canvas"
/templates              NEW. Gallery of starter scenes (Framer-style)
/scenes                 My projects — kept, but redesigned (cards, thumbnails,
                        last-edited, palette chips, status)
/scene/[id]             Editor — restructured (see §6)
/palettes               NEW. Mira's saved palettes + curated library
/scene/[id]/present     NEW. Read-only walkthrough + AR/USDZ download page
```

Files to add/edit:
- `apps/editor/app/start/page.tsx` (new)
- `apps/editor/app/templates/page.tsx` (new)
- `apps/editor/app/scenes/page.tsx` (rewrite — currently a single file)
- `apps/editor/app/palettes/page.tsx` (new)
- `apps/editor/app/scene/[id]/present/page.tsx` (new)

---

## 5. Visual language

### 5.1 Foundational decisions

| Decision | Choice | Why |
|---|---|---|
| Color space | Keep OKLCH | Already in use; gives perceptually-uniform interpolation for swatch ramps. |
| Theme modes | `light` · `dark` · `studio` | New: `studio` is a desaturated dark with warm accents for client demos / projector use. |
| Accent strategy | Single "brand accent" + scene-driven dynamic accent | Brand stays consistent in chrome; dynamic accent picks up the dominant scene palette for in-canvas badges (live preview vibe). |
| Corner radius | Existing `0.625rem` + `corner-shape: squircle` (`globals.css:150-158`) | Keep — already feels premium. |
| Elevation | Keep `styles/elevation.css` 0–6 ramp | It's actually a good system. |
| Typography | Keep Barlow + Geist Mono. Add Geist Pixel for measurements badges. | Already wired. |
| Motion | Standardize on `motion` (Framer Motion). `tw-animate-css` for utility-style transitions. | Both already deps. |

### 5.2 Brand palette ("Pascal Studio")

Curated from the user-provided reference palettes. Three named themes,
each interchangeable from the topbar. The neutrals stay the same across all
three; only the accent ramp swaps.

#### Theme A — **Studio Warm** (default for designers)

Inspired by ref-palette: `#FFEED0 / #F4C180 / #00A79D / #007064`.

```
Brand accent     #00A79D   (teal-jade)         — primary interactive
Brand accent +1  #007064   (deep jade)         — hover, pressed
Brand soft       #F4C180   (sand)              — selection rings on canvas
Brand sun        #FFEED0   (cream)             — info surfaces
```

#### Theme B — **Studio Dusk** (for client presentations)

Inspired by `#1A273A / #3E4A62 / #C24D2C / #D9D9D7`.

```
Brand accent     #C24D2C   (terracotta)        — primary interactive
Brand accent +1  #8E3719                       — hover
Brand soft       #3E4A62   (slate)             — selection rings
Brand sun        #D9D9D7   (fog)               — info surfaces
```

#### Theme C — **Studio Ocean** (for real-estate / cool minimalism)

Inspired by `#D6E8EE / #018ABE / #02457A / #001B48`.

```
Brand accent     #018ABE   (cyan-deep)
Brand accent +1  #02457A
Brand soft       #97CADB
Brand sun        #D6E8EE
```

### 5.3 Material palette library (curated, exposed to designer)

Mira sees a "Palette library" in the right rail (see §6.3). These are the
full chip sets from the references, named for designer mental models.
**All 22 palettes listed below — full hex values in the appendix.**

| Group | Name | Mood |
|---|---|---|
| Warm | Terracotta & Sage | grounded, organic |
| Warm | Mediterranean Sun | airy, peach |
| Warm | Autumn Brown | masculine, rustic |
| Cool | Coastal Slate | calm, oceanic |
| Cool | Forest Olive | botanical |
| Cool | Soft Mist | minimal, Scandinavian |
| Bold | Crimson Studio | high-contrast, gallery |
| Bold | Tropic Neon | playful, kid spaces |
| Pastel | Mint Lilac | nursery, soft retail |
| Pastel | Vanilla Mint | café, bakery |
| ... | (full list in §13) | |

### 5.4 Token migration

`apps/editor/app/globals.css:65-134` currently defines a neutral-only token
set. We extend it (not replace) so existing components stay valid:

```css
/* New tokens — add to :root and .dark */
--brand: oklch(0.65 0.10 190);          /* #00A79D in oklch */
--brand-foreground: oklch(0.98 0.005 190);
--brand-hover: oklch(0.50 0.09 190);
--brand-soft: oklch(0.82 0.10 70);      /* sand */
--brand-sun: oklch(0.96 0.04 80);

--selection: oklch(0.78 0.14 70);       /* canvas selection ring */
--selection-strong: oklch(0.65 0.20 70);

--palette-1: oklch(0.96 0.04 80);
--palette-2: oklch(0.82 0.10 70);
--palette-3: oklch(0.65 0.10 190);
--palette-4: oklch(0.45 0.09 190);

/* Theme variants live behind .theme-studio-warm, .theme-studio-dusk,
   .theme-studio-ocean — toggle on <html> via the topbar selector. */
```

Add a `[data-theme="studio-warm"]` / `studio-dusk` / `studio-ocean` data
attribute on `<html>` to swap the four `--brand-*` tokens. Light/dark stays
orthogonal (`.dark` plus `[data-theme=...]` compose).

A full token JSON drop is in §13.

---

## 6. Editor surface — what changes

### 6.1 Topbar (existing `editor-layout-v2.tsx`)

| Change | Reason |
|---|---|
| Add theme selector (Studio Warm / Dusk / Ocean) | Personalization, demo mode. |
| Add "Present" button | Opens `/scene/[id]/present`. |
| Add "Share" menu (link · PDF · USDZ · GLB) | Single-button export, see §8. |
| Move scene-name field inline-edit | Reduce visits to `/scenes` for renames. |
| Add palette-of-scene chip strip | Live-extracted top 5 colors from the scene; clicking a chip opens swatch library. |

### 6.2 Left rail — Tools + Templates

Currently `icon-rail.tsx`. Keep tool icons (Select / Wall / Slab / Item / etc).
Add a **second tier** below the divider:

- **Templates** (lightning-bolt icon) — opens drawer of scene templates.
- **Rooms** — opens drawer of room presets (kitchen / bath / bedroom) you can
  drop into the current scene at cursor.
- **Catalog** — existing item-catalog drawer.
- **Palettes** — saved & curated palettes.

Templates and Rooms drawers reuse the existing `presets/` folder
(`packages/editor/src/components/ui/panels/presets/`) as the data layer. New
UI shell.

### 6.3 Right rail — Properties + Materials (the big one)

Currently the right rail shows one of `wall-panel.tsx` / `slab-panel.tsx` /
`item-panel.tsx` etc. **All of them get a unified "Appearance" section at
the top.** This is where the redesign earns its keep.

Appearance section, per selection type:

```
┌─ Appearance ────────────────────────────┐
│  ◯ ◯ ◯ ◯ ◯  ← five swatches: scene's    │
│             current palette              │
│                                          │
│  [ Pick swatch ]   [ Custom… ]   [ + ]   │
│                                          │
│  Material:  ▢ Matte  ▢ Satin  ▢ Gloss   │
│  Finish:    [Slider: 0 — 100% reflect]  │
│  Texture:   [thumbnail grid: 12 tiles]  │
└──────────────────────────────────────────┘
```

This replaces / extends `paint-panel.tsx`. Per-node-type adapters decide
which controls apply (e.g., a wall gets paint + wallpaper; a slab gets
flooring textures; an item gets fabric/wood/metal swatches).

### 6.4 Canvas overlays

- **Hover badge** carries the brand-soft color for selection ring.
- **Measurement labels** use Geist Pixel for a "real-architect's-tape" feel.
- **Floating action menu** (`floating-action-menu.tsx`) gets a subtle glass
  blur background (squircle, elevation-3) and uses the dynamic scene-accent
  for action highlights.

### 6.5 Mobile

`editor-layout-mobile.tsx` already exists; we don't touch it in v1 of the
redesign except for token inheritance. Mobile-specific work is a follow-up
project.

---

## 7. Templates as a first-class entry (Framer-style, alongside blank)

### 7.1 The /start surface

Two cards. Equal weight. No "recommended" tag — let Mira choose.

```
┌────────────────────────────┐  ┌────────────────────────────┐
│  ▦ ▦ ▦                     │  │           +                │
│  ▦ ▦ ▦   Start from        │  │      Blank canvas          │
│  ▦ ▦ ▦   a template        │  │                            │
│                            │  │  Build from scratch with   │
│  Studio-grade rooms,       │  │  full creative control.    │
│  presets, palettes.        │  │                            │
│                            │  │  → New scene               │
│  → Browse 24 templates     │  │                            │
└────────────────────────────┘  └────────────────────────────┘
```

### 7.2 The /templates gallery

Framer's gallery is the reference: large hero card + filter chips +
"Use this template" → instant duplicate into the user's scenes.

Filter dimensions:
- **Room type** — studio, 1BHK, 2BHK, kitchen, bath, living, bedroom, office.
- **Mood** — minimalist, warm, mid-century, japandi, industrial, coastal.
- **Palette** — chips matching §5.3.

Each template card shows: hero thumbnail, name, palette strip (5 chips),
"Use template" button. Hover plays a 3-second auto-orbit GLB preview using
`@react-three/drei` `<OrbitControls autoRotate>`.

### 7.3 Template data shape

Templates are real scenes serialized as the same JSON used by
`packages/mcp/src/tools/export-json.ts`. Stored in:

```
packages/editor/src/components/ui/panels/presets/templates/
  ├── studio-warm-1bhk.json
  ├── japandi-bedroom.json
  ├── industrial-loft.json
  └── …
```

A `templates/index.ts` enumerates them with metadata
(`{ id, name, mood, room, palette, thumb }`). Adding a template = drop a JSON
+ a thumbnail PNG + a row in the index.

### 7.4 "Remix" pattern (deferred, called out in §11)

User-published templates are out of scope for v1. We keep the schema
shape compatible (`metadata.source = 'template' | 'user'`) so a future
community-templates phase is purely an infra add.

---

## 8. AR / VR export — USDZ pipeline

### 8.1 Why USDZ

Apple Quick Look opens `.usdz` natively on iPhone/iPad/Vision Pro from
Safari, Messages, and Mail with **zero install**. It's the highest-leverage
"send to client" format we can ship. Android still needs `.glb` via
Scene Viewer, so we ship both.

### 8.2 Implementation

Three.js already provides `USDZExporter`:

```ts
// New file: packages/mcp/src/tools/export-usdz.ts
import { USDZExporter } from 'three/examples/jsm/exporters/USDZExporter.js'
// mirror export-glb.ts structure; same scene-tree traversal
```

Pair it with:
- `packages/editor/src/components/editor/export-manager.tsx` — already has
  the export shell. Add USDZ as a destination, alongside GLB and JSON.
- A "Share" button menu on the topbar that calls the export pipeline.

### 8.3 The /scene/[id]/present surface

A read-only page that:
- Shows a turntable autoplay of the scene (camera path defined in the scene
  metadata; otherwise auto-orbit).
- Shows the palette strip (live-extracted top 5 colors).
- Has three big buttons: **Download USDZ** · **Download GLB** · **Copy link**.
- iPhone Safari users: a primary "View in AR" `<a rel="ar">` link that
  triggers Quick Look directly. (No app, no SDK.)

### 8.4 Gotchas

- USDZ doesn't support every PBR material parameter. Map our material set
  to `{ baseColor, roughness, metalness, normal }` only.
- BVH-CSG'd geometry (door/window cutouts) needs to be baked into static
  meshes before export. We already serialize final geometry in
  `export-glb.ts` — reuse that path.
- File size: clamp textures to 1024 for USDZ; designers will be on
  cellular when texting clients.

---

## 9. Component-level spec (what to actually build)

### 9.1 New components

| Component | Path | Notes |
|---|---|---|
| `<SwatchGrid>` | `packages/editor/src/components/ui/swatch-grid.tsx` | Reusable swatch picker — used in Appearance panel + /palettes |
| `<PaletteStrip>` | `packages/editor/src/components/ui/palette-strip.tsx` | 5-chip horizontal strip; used in topbar, /templates cards, /present |
| `<MaterialFinishToggle>` | `packages/editor/src/components/ui/material-finish-toggle.tsx` | Matte / Satin / Gloss segmented control |
| `<TemplateCard>` | `packages/editor/src/components/ui/template-card.tsx` | Used in /templates |
| `<ThemeSwitcher>` | `packages/editor/src/components/ui/theme-switcher.tsx` | Warm / Dusk / Ocean toggle |
| `<ShareMenu>` | `packages/editor/src/components/ui/share-menu.tsx` | Topbar dropdown wrapping export-manager |
| `<PresentationOverlay>` | `packages/editor/src/components/ui/presentation-overlay.tsx` | Used by /scene/[id]/present |

### 9.2 Components to modify

| Component | Path | Change |
|---|---|---|
| `paint-panel.tsx` | `packages/editor/src/components/ui/panels/paint-panel.tsx` | Becomes the engine behind `<SwatchGrid>` for selected nodes. Adds finish + texture rows. |
| `editor-layout-v2.tsx` | `packages/editor/src/components/editor/editor-layout-v2.tsx` | Topbar additions (theme, present, share). |
| `icon-rail.tsx` | `packages/editor/src/components/ui/sidebar/icon-rail.tsx` | Add Templates / Rooms / Palettes sections. |
| `item-catalog.tsx` | `packages/editor/src/components/ui/item-catalog/item-catalog.tsx` | Add palette filter. Items pick up the selected palette by default. |
| `scenes/page.tsx` | `apps/editor/app/scenes/page.tsx` | Card layout w/ thumbnails + palette chips. |
| `globals.css` | `apps/editor/app/globals.css` | Token additions (see §5.4). |
| `export-manager.tsx` | `packages/editor/src/components/editor/export-manager.tsx` | Add USDZ option. |

### 9.3 Selection → material binding

The scene store (`packages/core/src/store/use-scene.ts`) already supports
arbitrary node updates. Material data already lives on nodes (see
`packages/core/src/material-library.ts`). The Appearance panel just calls
`useScene.getState().updateNode(id, { material: { ... } })`. **No store
schema change needed for color/material work.**

What *does* need adding: a per-scene `palette: string[]` field in scene
metadata so saved palettes survive reload. Add to the site or building node
metadata field (already JSON-typed in `BaseNode`).

---

## 10. Roadmap

### Phase 0 — Tokens & theme plumbing (1–2 days)

- Extend `globals.css` with `--brand-*`, `--palette-*`, `--selection-*` tokens.
- Add `[data-theme="studio-warm|dusk|ocean"]` swapping.
- Add `<ThemeSwitcher>` to topbar (no UI redesign yet; just wired).

**Ship criterion:** toggling themes visibly changes accent across all buttons,
panels, selection rings. No regression on existing screens.

### Phase 1 — Appearance panel (3–5 days)

- Build `<SwatchGrid>`, `<PaletteStrip>`, `<MaterialFinishToggle>`.
- Refactor `paint-panel.tsx` to host the new Appearance section.
- Wire per-node-type adapters (wall / slab / item / ceiling).
- Save scene palette to node metadata.

**Ship criterion:** Mira can pick a wall, pick a swatch, see the wall change.
Can save the 5-color palette to the scene.

### Phase 2 — Templates surface (4–6 days)

- Build `/start`, `/templates`, `<TemplateCard>`.
- Author 6 starter templates (studio, 1BHK, kitchen, bedroom, bath, office).
- Hook "Use template" → duplicate scene + redirect to `/scene/[id]`.

**Ship criterion:** new-user flow lands on `/start` and can be in a populated
scene in two clicks.

### Phase 3 — Share + USDZ + Present (3–4 days)

- Implement `export-usdz.ts`.
- Build `<ShareMenu>` and `/scene/[id]/present`.
- Wire `<a rel="ar">` on the present page.

**Ship criterion:** Mira can text a USDZ link to her iPhone and tap it open
in AR Quick Look.

### Phase 4 — Scenes & Palettes redesign (3 days)

- Rewrite `/scenes` with card thumbnails + palette chips.
- Build `/palettes` (curated library + Mira's saved palettes).

**Ship criterion:** Mira can see all her projects at a glance with palette
context, reuse a palette across projects.

### Phase 5 — Polish (ongoing)

- Motion choreography for selection / panel transitions (use `motion`).
- Replace placeholder textures in `material-library.ts` with real PBR sets.
- Mobile redesign (own follow-up).
- Community templates (long horizon, schema already compatible).

**Total estimate for Phases 0–4:** ~14–20 working days for a single
engineer-designer pair.

---

## 11. Risks & open questions

- **Material library realism.** Pretty swatches aren't enough; the rendered
  result needs to match. Need a real PBR texture set sourced or licensed
  (Polyhaven, AmbientCG, or custom). Out of scope for the doc; called out
  as a blocker for Phase 1 ship-readiness.
- **USDZ texture fidelity.** Quick Look on older iOS versions does odd
  things with anisotropic textures. Test on iOS 17 / 18 / 26 before
  committing to "View in AR" as a marketing claim.
- **Theme drift.** Adding three themes triples the chance of accent-color
  contrast bugs. Need to audit every interactive token pair for WCAG AA at
  minimum; AAA where surfaces are large.
- **"Templates alongside blank" risk.** Equal weighting on `/start` may
  push the funnel toward blank canvas (familiar) and hurt template adoption.
  Worth A/B'ing once analytics is in place.
- **Community templates schema.** We say "compatible" but haven't validated
  it survives the user-content moderation surface. Don't promise this in
  marketing until Phase 5.
- **Palette extraction.** "Live-extracted top 5 colors" sounds easy. In
  practice, hitting the canvas pixel buffer per-frame is expensive. Cache
  on scene-save events, not per-frame.

---

## 12. Acceptance review (use this as a self-check before any PR)

- [ ] Does it work in all three themes (Warm / Dusk / Ocean)?
- [ ] Does it work in light AND dark mode within each theme?
- [ ] Does the Appearance panel show *something* for every selectable
      node type, or explicitly say "not applicable"?
- [ ] Does the export bundle include USDZ for any scene that has at
      least one node?
- [ ] Does the keyboard shortcut + `cmdk` palette expose this action?
- [ ] Are motion choices reduced under `prefers-reduced-motion`?
      (Existing block in `globals.css:169-178` already handles this; keep
      using `motion`'s `useReducedMotion` hook.)
- [ ] Does it respect the layer boundaries in `wiki/architecture/layers.md`?
      (No direct Three.js in `core`; no `useEditor` in `viewer`.)

---

## 13. Appendix — Token + palette JSON

### 13.1 Theme tokens (drop-in extension for `globals.css`)

```css
:root {
  /* ── Studio Warm (default) ── */
  --brand:           oklch(0.65 0.10 190);
  --brand-foreground:oklch(0.98 0.005 190);
  --brand-hover:     oklch(0.50 0.09 190);
  --brand-soft:      oklch(0.82 0.10 70);
  --brand-sun:       oklch(0.96 0.04 80);

  --selection:       oklch(0.78 0.14 70);
  --selection-strong:oklch(0.65 0.20 70);

  --palette-1: oklch(0.96 0.04 80);
  --palette-2: oklch(0.82 0.10 70);
  --palette-3: oklch(0.65 0.10 190);
  --palette-4: oklch(0.45 0.09 190);
  --palette-5: oklch(0.25 0.04 240);
}

[data-theme="studio-dusk"] {
  --brand:           oklch(0.58 0.16 35);  /* terracotta */
  --brand-foreground:oklch(0.98 0 0);
  --brand-hover:     oklch(0.45 0.14 35);
  --brand-soft:      oklch(0.42 0.04 250); /* slate */
  --brand-sun:       oklch(0.86 0.005 0);

  --selection:       oklch(0.65 0.14 35);
  --selection-strong:oklch(0.50 0.18 35);
}

[data-theme="studio-ocean"] {
  --brand:           oklch(0.60 0.12 230);
  --brand-foreground:oklch(0.98 0 0);
  --brand-hover:     oklch(0.40 0.11 240);
  --brand-soft:      oklch(0.78 0.06 230);
  --brand-sun:       oklch(0.94 0.02 230);

  --selection:       oklch(0.65 0.10 230);
  --selection-strong:oklch(0.50 0.14 240);
}

@theme inline {
  --color-brand:           var(--brand);
  --color-brand-foreground:var(--brand-foreground);
  --color-brand-hover:     var(--brand-hover);
  --color-brand-soft:      var(--brand-soft);
  --color-brand-sun:       var(--brand-sun);
  --color-selection:       var(--selection);
  --color-selection-strong:var(--selection-strong);
}
```

### 13.2 Curated material palette library (the 22 reference palettes)

Drop the following as `packages/editor/src/components/ui/panels/presets/palettes.json`:

```json
[
  { "id": "plum-blush",        "name": "Plum & Blush",        "mood": "feminine, soft",    "colors": ["#4D3A4D","#BE5CA9","#D59CC5","#EADADA"] },
  { "id": "teal-indigo",       "name": "Teal & Indigo",       "mood": "cool, modern",      "colors": ["#43D9E7","#3EC4D0","#393C83","#2A2C5F"] },
  { "id": "crimson-studio",    "name": "Crimson Studio",      "mood": "bold, gallery",     "colors": ["#2B2024","#A80139","#FD0053","#FFFFFF"] },
  { "id": "marigold-navy",     "name": "Marigold & Navy",     "mood": "high contrast",     "colors": ["#FFD716","#0DA574","#073358","#001F3E"] },
  { "id": "slate-cyan-pop",    "name": "Slate Cyan Pop",      "mood": "playful, retro",    "colors": ["#3B4A6B","#23B2DA","#F1D43A","#F23456"] },
  { "id": "purple-mint",       "name": "Purple & Mint",       "mood": "creative, soft",    "colors": ["#7A56D0","#4FC0E8","#5BE7C4","#F6F7FB"] },
  { "id": "sky-magenta",       "name": "Sky & Magenta",       "mood": "energetic",         "colors": ["#DAEAF7","#0C8ABC","#124E96","#FF008E"] },
  { "id": "lime-teal-noir",    "name": "Lime, Teal & Noir",   "mood": "bold minimal",      "colors": ["#FFF5F4","#B1D430","#1A8B9D","#000000"] },
  { "id": "terracotta-fog",    "name": "Terracotta & Fog",    "mood": "grounded, rustic",  "colors": ["#1A273A","#3E4A62","#C24D2C","#D9D9D7"] },
  { "id": "forest-olive",      "name": "Forest Olive",        "mood": "botanical",         "colors": ["#FAFFA3","#C6E772","#66D47E","#073835"] },
  { "id": "mediterranean-sun", "name": "Mediterranean Sun",   "mood": "warm, coastal",     "colors": ["#FFEED0","#F4C180","#00A79D","#007064"] },
  { "id": "lavender-jade",     "name": "Lavender & Jade",     "mood": "soft retail",       "colors": ["#9765C8","#099A97","#15CDA9","#F0E4E4"] },
  { "id": "autumn-brown",      "name": "Autumn Brown",        "mood": "masculine, rustic", "colors": ["#E2DED3","#857671","#4E413B","#FF6D24"] },
  { "id": "coastal-ice",       "name": "Coastal Ice",         "mood": "fresh, summer",     "colors": ["#4A89AC","#ACE5F6","#E3FCF9","#FAEE5A"] },
  { "id": "sunset-aubergine",  "name": "Sunset & Aubergine",  "mood": "dramatic",          "colors": ["#ED743F","#FFAF50","#423465","#824C97"] },
  { "id": "charcoal-sage",     "name": "Charcoal & Sage",     "mood": "modern minimalist", "colors": ["#3F3F3F","#437A5B","#B4CD93","#FBF5E5"] },

  { "id": "lilac-jade-gradient","name": "Lilac to Jade",      "mood": "soft gradient",     "colors": ["#CCABD8","#8474AF","#6EC6CA","#08979D","#055B5C"] },
  { "id": "teal-olive-gradient","name": "Teal to Olive",      "mood": "earthy gradient",   "colors": ["#54C0CC","#1E4F50","#7EA00E","#DCD064","#213502"] },
  { "id": "mint-lilac",        "name": "Mint Lilac Dream",    "mood": "nursery, café",     "colors": ["#86E3CE","#D0E6A5","#FFDD94","#FA897B","#CCABD8"] },
  { "id": "deep-ocean",        "name": "Deep Ocean",          "mood": "monochrome blue",   "colors": ["#001B48","#02457A","#018ABE","#97CADB","#D6E8EE"] },
  { "id": "terracotta-teal",   "name": "Terracotta & Teal",   "mood": "warm + cool combo", "colors": ["#E25B45","#FF8357","#FAC172","#89D5C9","#ADCB65"] },
  { "id": "dusty-peach-sage",  "name": "Dusty Peach & Sage",  "mood": "boho, gentle",      "colors": ["#F5CEC7","#E79796","#FFC98B","#FFB284","#C6C09C"] }
]
```

These hex values are the *display* palette. When applied as a material, the
runtime converts each hex to OKLCH and stores it in the node's
`material.baseColor` field via `useScene.updateNode`. Texture variants
(matte / satin / gloss) modulate roughness/metalness; finish doesn't change
the color choice.

### 13.3 Default theme assignment

| Persona context | Theme |
|---|---|
| Mira opens the app for the first time | Studio Warm |
| Mira opens her client-presentation tab | Studio Dusk |
| Stager working on a property listing | Studio Ocean |
| DIY homeowner on mobile | Studio Warm (then user-pickable) |

Theme is persisted per-user in localStorage (key `pascal.theme`).
Per-scene override is allowed and overrides global preference when the
scene is opened.

---

## 14. Out of scope (for this doc)

- Pricing / monetization model.
- Auth / SSO changes.
- Server-side rendering pipeline for high-res renders.
- Procedural floorplan generation.
- Plugin architecture for third-party material packs.
- Mobile native app (web AR is sufficient for v1 via USDZ Quick Look).

These belong in follow-up PRDs.

---

*End of doc. Review, edit in line, then convert §10 into tracked tasks.*
