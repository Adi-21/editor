# Pascal — Market v1: Tablet-First Floorplan → 3D

> **A focused, finger/pencil-native flow where anyone draws a house layout
> in minutes, labels what's a wall / door / window, and taps once to walk
> through it in 3D.**
>
> This is **Track B** — the go-to-market product. It runs alongside Track A
> (the interior-designer redesign, `docs/ux-redesign.md`, Phases 0–5) and
> reuses the same engine. Per-session progress is logged in
> `docs/progress.md`.

**Status:** Proposal, pre-implementation.
**Last updated:** 2026-05-18.
**Approved direction (from product owner):**

| Decision | Choice |
|---|---|
| Delivery | **Responsive web** — works on iPad in the browser. No PWA/native packaging in v1. |
| v1 scope | **Draw → architect 2D (Rung 2) → one-tap *auto-furnished* 3D.** The 2D bar is *image 2 exactly* (poché, room labels + computed dims, dimension strings, door swings, window breaks, **2D furniture symbols**). The 3D payoff is **auto-furnished by room type + floor materials**, looking like images 3 & 4 — not an empty shell. Manual per-item interior design stays v2. |
| Shell | **REVISED 2026-05-19 — NO separate route.** There is no `/design`. The single `/scene/[id]` editor *is* the product, and it must be **understandable to a normal, non-CAD person**. We make *that* editor approachable (simple default, progressive disclosure of power tools) rather than building a parallel shell. The `/design` route + `DesignShell` from B0 were removed. |
| Hard north-star | **A normal person opens `/scene/[id]` and gets it without a manual.** Any change that makes the editor read as an engineering tool fails review. This outranks feature breadth. |
| Drawing model | **Both modes, switchable** — snap-assisted polyline *and* free-sketch auto-straighten. |
| Visual bar | **Rung 2** for 2D (see §4.5) + **auto-furnished** 3D. Reference images: 1 = today, 2 = 2D target, 3 & 4 = 3D target. |

---

## 1. Why this, why now

The engine is already strong: a unified scene graph, a full tool set (wall,
door, window, slab, ceiling, roof, stair, column, zone, furniture), a 2D
floorplan rendering subsystem (`editor-2d/`), live measurement/angle HUDs,
snapping, and a single `viewMode: '3d' | '2d' | 'split'` switch where **2D and
3D are the same data**. What's missing is not capability — it's a **single,
opinionated, touch-native path** that a non-CAD person can finish in minutes
on an iPad.

Market v1 is deliberately narrow: **draw → label → 3D**. It is the wedge.
Everything else (room design, materials, AR, the designer redesign) already
exists or is on Track A and slots in later without rework, because it's all
the same scene graph.

---

## 2. The core loop (the whole product in one sentence)

```
 ┌──────────┐   ┌───────────┐   ┌───────────┐   ┌────────────┐   ┌───────────┐
 │ 1. Sketch│──▶│ 2. Architect│─▶│ 3. Name   │─▶│ 4. Tap     │──▶│ 5. Walk   │
 │  the plan│   │  2D auto-   │  │  the rooms│  │ "See in 3D"│   │ a FURNISHED│
 │ finger/  │   │  drawn      │  │ (bedroom, │  │   ✨        │   │ 3D home   │
 │ pencil   │   │ (image 2)   │  │  kitchen…)│  │ auto-furnish│  │ (img 3/4) │
 └──────────┘   └───────────┘   └───────────┘   └────────────┘   └───────────┘
```

1. **Sketch the plan.** Two drawing modes (§6). Walls chain corner-to-corner;
   closing a loop forms a room.
2. **It renders as an architect's plan.** As you draw, the 2D view *is*
   image 2: wall poché, door-swing arcs, window breaks, overall dimension
   strings, room labels with **computed** sizes (§4.5).
3. **Name the rooms.** A closed loop = a room (zone). One tap assigns a type
   (Bedroom / Living / Kitchen / Bath / …). That type drives both the 2D
   furniture symbols *and* the 3D auto-furnish. Sensible default guessed from
   size/adjacency; always one-tap correctable.
4. **Tap "See in 3D ✨."** Choreographed transition (§8) **+ auto-furnish**:
   per room type, furniture from the existing 110-item catalog is placed via
   existing placement strategies; floors get a material. Result targets
   images 3 & 4, not an empty shell.
5. **Walk a furnished home.** Orbit / first-person on the same scene; Share
   (Track A `/present` + USDZ, reused verbatim).

Two bars, both must hold: (a) the loop completes in **< 3 min for a 1-BHK on
an iPad with a finger**; (b) the furnished 3D is **recognisably image-3/4
quality**, not a grey box with stock props.

---

## 3. Personas (tablet-first)

| Persona | Context | Win |
|---|---|---|
| **Real-estate agent (primary)** | On-site with an iPad. Sketches a listing's layout while walking it. | A 3D walkthrough to text a buyer that afternoon. |
| **Small builder / contractor** | Site visit, dusty hands, Apple Pencil. Wants quick as-built + proposed. | Rough plan → 3D to align with the client on the spot. |
| **DIY homeowner** | Couch, iPad, no CAD background. | "Draw my flat, see it real" with zero learning. |
| **Designer (Track A)** | Studio, may start here then go deep on materials. | The plan they make here opens straight into the full editor. |

> Priority when tradeoffs hit: **Agent > Builder > DIY > Designer.** The flow
> must never *require* precision the agent doesn't have, but must *allow* the
> precision the builder wants (typed length/angle).

---

## 4. Delivery: responsive web, and the iPad reality

v1 ships as **plain responsive web** — no PWA install, no native wrapper, no
App Store. It must be excellent in **iPad Safari** at the common sizes:

| Device | CSS px (portrait) | CSS px (landscape) |
|---|---|---|
| iPad mini / 9.7" | 768 × 1024 | 1024 × 768 |
| iPad 10.9" / Air | 820 × 1180 | 1180 × 820 |
| iPad Pro 11" | 834 × 1194 | 1194 × 834 |
| iPad Pro 12.9" | 1024 × 1366 | 1366 × 1024 |

**The seam to fix.** `useIsMobile()` (`packages/editor/src/hooks/use-mobile.ts`)
flips at **768 px** into the phone bottom-sheet layout (`editor-layout-mobile`).
Every iPad portrait size is ≥ 768, so iPad currently gets the **desktop**
layout (dense, hover-oriented, small targets) — wrong for touch. v1 introduces
a **tablet tier** between phone and desktop:

```
 phone            tablet (NEW)                 desktop
 ───────┬──────────────────────────┬───────────────────────▶  width
       768                       1280
   bottom-sheet    /design tablet shell      full editor
```

- New breakpoint hook surface (extend `use-mobile`, don't fork it):
  `useFormFactor() → 'phone' | 'tablet' | 'desktop'`.
- "Responsive web" + "new tablet-first flow" are **not** in tension: `/design`
  is a *route + layout variant*, not a separate app. At tablet width (or when
  entered from the tablet CTA) the app renders the `/design` shell; the same
  URL on desktop renders a comfortable wide variant of the same shell.
- iPad Safari specifics to honour: `100svh`/`100dvh` (toolbar resize), safe-
  area insets, disable double-tap-zoom & long-press callout & overscroll on
  the canvas (`touch-action: none` is partly set in camera controls — audit
  and extend), no `:hover`-only affordances.

---

## 4.5 Visual fidelity — the v1 bar (the four reference images)

The product owner supplied four images. They define the bar end-to-end:

| Image | Means | Role |
|---|---|---|
| **1** | Today's 2D: disconnected wall strokes + grey boxes, no symbology | The gap we are closing (Rung 0) |
| **2** | Architect plan: poché walls, door swings, window breaks, room labels + computed dims, 40'×30' dimension strings, **2D furniture/fixture symbols** | **v1 2D bar = Rung 2 (this exactly)** |
| **3 & 4** | Rendered **furnished** top-down: real furniture, floor materials, rugs, shadows | **v1 3D bar = auto-furnished, recognisably this** |

### Fidelity ladder

```
 Rung 0  raw lines + boxes ............................. today
 Rung 1  poché + room labels + computed dims +          ▲ huge perceived
         dimension strings + door swings + window breaks │ jump, low cost
 Rung 2  Rung 1 + 2D furniture/fixture symbols ........ ◀ v1 2D BAR (image 2)
 Rung 3  furnished 3D (real assets + materials + light) ◀ v1 3D PAYOFF (3/4)
```

### Why Rung 2 + Rung 3 are affordable here (grounded in code)

The catalog is the unlock. `CATALOG_ITEMS`
(`packages/editor/src/components/ui/item-catalog/catalog-items.tsx`) has
**110 items**, each carrying **both representations**:

- `floorPlanUrl` — a 2D top-view PNG → **the Rung-2 furniture symbol, for free**.
- `src` (`.glb`) + `dimensions` + `offset`/`rotation`/`scale` → **the Rung-3 3D asset**.

Coverage spans the residential set images 2–4 need: Sofa / "leather couch",
Double·Single·Bunk beds, Bedside Table, Dining Table + Chairs, Stove, Fridge,
Kitchen Counter/Cabinet/Bar/Shelf, Toilet, Bathroom Sink, Showers, Carpets,
plants, cars (garage). Placement is not new geometry either —
`tools/item/placement-strategies.ts` already exposes `floorStrategy`,
`wallStrategy`, `wall-side`, `checkCanPlace`.

So Rung 2 + Rung 3 reduce to **rules over existing assets + existing
placement**, not new engine work. The genuinely new pieces are §4.5.1–.3.

### 4.5.1 Plan symbology layer (Rung 1)

A 2D presentation layer over the existing `editor-2d/renderers/` (which
already has a measurements/dimension layer to extend): wall **poché** fill,
**door-swing arcs**, **window breaks** in the wall run, **room labels** with
**computed** area/size from the zone polygon, **overall dimension strings**.
Pure rendering — no scene-graph change. This alone converts image 1 → an
architect plan and is the single highest-leverage Track B deliverable.

### 4.5.2 Rooms = typed zones (drives everything downstream)

A closed wall loop already yields a slab; v1 also creates/uses a **zone** for
the room. `zone` (`packages/core/src/schema/nodes/zone.ts`) has `name` +
json `metadata` — store the room type as **`zone.metadata.roomType`**
(`'bedroom' | 'living' | 'kitchen' | 'bath' | 'dining' | 'closet' |
'garage' | 'hall' | …`). No schema change — same pattern Track A used for
`site.metadata.palette`. Type is auto-guessed (area + adjacency heuristics)
and one-tap correctable. `roomType` is the single key that drives 2D symbols,
3D furniture, *and* the floor material.

### 4.5.3 Auto-furnish ruleset (Rung 2 symbols + Rung 3 3D)

A declarative table: `roomType → [{ catalogId, strategy, anchor, count,
clearance }]`. At "See in 3D", for each typed zone the rules instantiate
catalog items through the **existing** placement strategies + `checkCanPlace`
(collision/clearance), and assign a floor material via Track A's material
system. The **same placed items** render their `floorPlanUrl` in the 2D view
→ image 2's furniture symbols, and their `.glb` in 3D → images 3/4. One
ruleset, both fidelities, zero asset authoring.

**Honest gaps vs images 3/4:** they are *stylised* renders (soft shadows,
landscaping, pool, cars staged). v1 targets *recognisably* that — furnished,
correct, good materials — not a pixel match. Pool / exterior landscaping /
site is v2 unless catalog coverage is trivial (cars exist; pool does not).

---

## 5. Information architecture

**No new routes.** (Revised 2026-05-19 — the `/design` split was rejected.)

```
/                     Landing — add a "Design a home" CTA → /start (or /scenes)
/scene/[id]           THE editor. One surface for everyone — must be
                      understandable to a normal person. All Track B work
                      (simple draw → label → 3D → auto-furnish) lands HERE.
/scene/[id]/present   Existing (Track A Phase 3) — reused for sharing.
/scenes /palettes /start /templates   Existing (Track A).
```

There is exactly one editor. The hard problem is no longer "where does the
simple flow live" — it's "**make the one editor simple by default** without
removing the power that already exists." Progressive disclosure, not a fork.
Same scene graph, same API (`/api/scenes`); nothing to import/export between
surfaces because there is only one surface.

---

## 6. The drawing model (both modes, switchable)

A segmented control on the canvas toolbar: **✎ Sketch** ⟷ **📐 Precise**.
Switchable at any time; they produce identical `WallNode`s so mixing is fine.

### 6.1 Precise mode — snap-assisted polyline (enhance, don't rebuild)

The existing `WallTool` (`components/tools/wall/wall-tool.tsx`) is **already**
this, minus chaining: tap a point, tap the next, snap to 45°/90°, snap to
existing walls/endpoints, live length + angle HUD. v1 changes:

- **Continuous chaining.** After placing a segment, the end becomes the next
  start automatically (don't reset `buildingState` to 0). Double-tap / tap the
  origin point / "Done" closes the run.
- **Auto-room on close.** Closing a loop fills a floor slab (the codebase
  already has slab tooling and recent "auto-slab planning"; wire close → slab).
- **Typed precision.** Tapping the length/angle HUD opens a numeric pad
  (builder persona): type `3.50 m`, `90°`. Pencil hover (where supported)
  previews the next segment.
- **Touch ergonomics.** Snap radius scales with input: bigger for finger,
  tighter for Pencil. A magnifier loupe near the fingertip while placing
  (the finger occludes the point).

### 6.2 Sketch mode — free stroke, auto-straighten (new)

A new tool, same output path (`createWallOnCurrentLevel`), built on the same
`grid:move`/`grid:click` + pointer stream:

1. Capture the raw pointer/Pencil stroke (one continuous gesture = one or many
   walls).
2. **Simplify** (Ramer–Douglas–Peucker) to corner points.
3. **Regularise**: snap near-axis segments to axis, near-90° corners to 90°,
   collinear merges, near-equal lengths equalised, endpoints within ε welded.
4. Show the cleaned polyline as a **preview with Undo/Accept**, then commit as
   `WallNode`s. Never silently mangle the user's stroke — always previewed.
5. Closed-ish strokes auto-close → room (same path as §6.1).

Sketch gets you 80% in one gesture; Precise tunes the last 20%. The numeric
HUD + drag handles (existing move/endpoint tools) do the tuning.

### 6.3 Gesture grammar (must be unambiguous)

| Gesture | Action |
|---|---|
| 1-finger / Pencil drag on canvas | **Draw** (active tool) |
| 1-finger tap | Place point / select |
| 2-finger drag | **Pan** |
| 2-finger pinch | **Zoom** (camera-controls already supports pinch dolly+truck) |
| 2-finger tap | Undo (industry-familiar) |
| Long-press element | Context menu (existing action-menu layer) |
| 3-finger swipe | (reserved — leave for OS) |

Pencil-down always means *draw* even when a finger is also down (palm
rejection): if `PointerEvent.pointerType === 'pen'`, it owns the draw; touches
become camera/gesture only. This disambiguation is the single most important
tablet detail and must be designed in from the first tool.

---

## 7. Semantic elements (wall / door / window)

No separate "labelling" step — the **tool is the label**:

- **Wall**: the structural draw (§6).
- **Door / Window**: existing wall-attached tools (`tools/door`,
  `tools/window`, with `door-math` / `window-math` solving placement on a wall
  span). v1 makes them **one-tap on a wall**: pick Door, tap a wall, a default-
  width door drops at the tap, draggable along the span; width via the numeric
  HUD. Same for Window (+ sill height).
- On-canvas the plan reads like an architect's plan: door swing arcs, window
  mullion ticks (the `editor-2d` renderers already draw plan symbology — reuse,
  don't reinvent).
- A minimal palette of element types only: **Wall, Door, Window, (Room is
  implicit from a closed loop)**. Everything else (stairs, roofs, furniture)
  is **hidden in v1** to keep the tablet flow ruthless — they still exist for
  the "full editor" escape hatch.

---

## 8. The 2D → 3D moment

Technically a `setViewMode('2d' → '3d')` on the same graph. **Product-wise it
is the wow** and must be choreographed, not instant:

- A single primary button: **"See in 3D ✨"** (and back: **"Edit plan"**).
- Transition (respect `prefers-reduced-motion`; `motion` is already a dep):
  walls extrude upward from their plan lines, openings punch through, floor
  and a soft ceiling fade in, camera eases from top-down ortho to a 3/4 orbit.
  ~1.2 s, skippable by touch.
- Lands in orbit with a one-tap **Walkthrough** (first-person already exists)
  and **Share** (Track A `/present` + USDZ already exists — reuse verbatim).
- No settings, no export dialog. One tap out, one tap back.

---

## 9. Tablet UX system

- **Hit targets** ≥ 44×44 pt (Apple HIG); primary actions 56 pt. All current
  toolbar items are ~32 px — a tablet control scale is required, not a tweak.
- **Reachability**: primary actions on the **bottom** and **sides**
  (thumb arcs in both orientations), never a top menu bar as the main path.
- **One-hand / two-hand**: drawing is one gesture; mode/precision controls
  reachable by the holding hand.
- **Feedback**: snap = haptic-ish sound (sfx bus already emits
  `sfx:grid-snap`) + visual tick; commit = confirming cue. Tablet users can't
  see a status bar — feedback is on-canvas.
- **No hover dependence.** Every hover affordance in the reused components
  needs a tap/long-press equivalent in the `/design` shell.
- **Orientation**: portrait = plan-dominant with a bottom tool dock; landscape
  = plan + a side rail. Same components, responsive arrangement.
- **Onboarding**: a 10-second interactive coach mark on first `/design`
  ("Draw a wall →", "Close the room", "Tap See in 3D"). No tutorial wall.

---

## 10. Architecture & reuse map

> Respect `wiki/architecture/` layer boundaries: all of this is **editor /
> apps** layer. Nothing here touches `core` (data) or `viewer` (rendering)
> beyond what the existing tools already do. Read `wiki/architecture/tools.md`,
> `events.md`, `layers.md` before building tools/shell.

| Need | Reuse (exists) | Build (new, editor/apps layer) |
|---|---|---|
| Scene data / API | scene graph, `/api/scenes`, autosave (`SceneLoader`) | — |
| Precise drawing | `WallTool`, `wall-drafting`, snapping, length/angle HUD | chaining + auto-close + numeric pad |
| Sketch drawing | `grid:*` event stream, `createWallOnCurrentLevel` | stroke capture → RDP → regularise → preview tool |
| Doors / windows | `door-tool` / `window-tool`, `*-math` | one-tap-on-wall tablet interaction |
| Rooms / floors | slab tooling, auto-slab planning, `zone` node (`name`+json `metadata`) | wire loop-close → slab + zone; `zone.metadata.roomType` + auto-guess + one-tap type UI |
| Plan symbology (Rung 1) | `editor-2d/renderers/` incl. measurement/dimension layer | poché fill, door-swing arcs, window breaks, room labels w/ computed dims, dimension strings |
| Furniture assets | `CATALOG_ITEMS` (110 items: `floorPlanUrl` 2D **and** `.glb`+`dimensions` 3D) | — (asset library already complete) |
| Auto-furnish | `placement-strategies.ts` (`floor`/`wall`/`wall-side`), `checkCanPlace`, item tool | declarative `roomType → items[]` ruleset + the orchestration at tap→3D |
| 2D furniture symbols (Rung 2) | placed items carry `floorPlanUrl` | render `floorPlanUrl` for items in the 2D plan view (verify not already done) |
| Floor materials | Track A material system / scene palette | per-`roomType` default floor material |
| 2D ↔ 3D | `viewMode`, `editor-2d` renderers, first-person | the choreographed transition + single button + auto-furnish trigger |
| Share | Track A `/present`, USDZ, ShareMenu | — (reuse) |
| Tablet shell | `editor-layout-mobile`, `bottom-sheet`, `use-mobile`, action-menu | `useFormFactor`, `/design` shell, tablet control scale |
| Power escape | `/scene/[id]` editor | a nav link only |

**Net new surface is additive and asset-free**: a simpler default for the
*existing* `/scene` editor (no new route/shell), one new tool (sketch),
wall-chaining, tap-on-wall openings, a **plan-symbology render layer**, a
**room-type field + auto-guess**, a **declarative auto-furnish ruleset** over
the existing 110-item catalog + existing placement strategies, per-room floor
materials, one transition. **No new 3D engine work and no asset authoring** —
the catalog already ships both 2D and 3D representations.

---

## 11. Phased roadmap (Track B)

> Track A (`ux-redesign.md`) Phases 0–4 are done, 5 ongoing. Track B is
> independent and can run in parallel; it only consumes Track A's `/present`.

### B0 — ~~/design shell~~ → SUPERSEDED (2026-05-19)
Original B0 (form-factor tier + `/design` shell) was built then **reverted**
on owner direction: no separate route. **Kept** from it (additive, safe):
`useFormFactor()` in `use-mobile.ts` and the global `viewport`/safe-area meta
— both now serve making `/scene/[id]` itself tablet-capable. **Removed:**
`/design`, `/design/[id]`, `DesignShell`, `.design-shell` CSS.
**Replaced by B0′ below.**

### B0′ — Canva/Framer editor UI/UX restructure (DECIDED 2026-05-19)
**Owner direction:** the engine/features are mostly already there; *first*
make `/scene` **look & feel like Canva/Framer — one clean sidebar that holds
everything + reuse the existing top 2D/3D toggle**; integrate new features
only *after*. Pure UI/UX recomposition of existing components — **no new
engine/features in B0′**.

Today's chrome (to restructure, not rebuild):
- No real top bar (2D/3D lives in a floating pill `ViewModeControl`).
- Dense floating top-right pill cluster (levels/wall/grid/unit/theme/camera/
  walkthrough/preview/present/share).
- Bottom-center floating **ActionMenu** = the confusing part: phases
  (site/structure/furnish), modes (select/edit/delete/build/paint),
  `StructureTools`, `ControlModes`, paint tray.
- Left: simple resizable `TabBar` sidebar (Scene/Items/Settings).

Target (Canva/Framer):
- **Top bar** (`navbarSlot`, currently unused): app mark + editable scene
  name + "All scenes"; the existing **2D/3D/Split toggle** surfaced here as
  the primary control; right = Present · Share · Theme · Walkthrough.
- **One left sidebar** (icon rail → expanding panel, Canva pattern) that
  holds *everything*: **Tools** (Select/Wall/Door/Window/Room/Furniture —
  relocated out of the bottom ActionMenu), **Layers** (existing site/scene
  tree), **Items** (existing catalog), **Settings**.
- Bottom ActionMenu slimmed to contextual controls only (or removed); no
  phase/mode jargon surfaced to a normal user.
- Center canvas unchanged. 2D→3D = the existing toggle (productised moment
  is a later phase, not B0′).

**Slices** (incremental, low-risk, all recomposition in `apps/editor` +
thin editor-package surfacing):
- **B0′.1 Top bar** — new `scene-topbar.tsx`, wired via SceneLoader
  `navbarSlot`; retire the floating top pills. *(this session)*
- **B0′.2 Unified sidebar** — Canva-style icon rail + Tools panel
  (Select/Wall/Door/Window/Room/Furniture driving `useEditor`), plus
  Layers/Items/Settings; remove phase/mode vocabulary from the default view.
- **B0′.3 Tame the bottom ActionMenu** — contextual-only; advanced controls
  behind a quiet "Advanced".
- **B0′.4 Visual polish** — Track A brand tokens, spacing, empty states so
  it reads Canva/Framer-clean.

**Ship:** a non-CAD person opens `/scene/[id]`, sees a clean top bar with
2D/3D and a single sidebar, and can pick "Wall" and draw — no manual, no
"phase/mode" jargon. Then B1+ build on this shell.

### B1 — Precise mode, productised (3–4 d)
Wall chaining + close-to-room (auto-slab) + numeric length/angle pad + finger/
Pencil snap-radius + loupe — **in `/scene`**. **Ship:** draw a closed 1-BHK
by tapping corners (mouse or finger); it forms rooms; lengths typeable.

### B2 — Doors & windows, one-tap-on-wall (2–3 d)
Tablet tap-on-wall placement + drag-along-span + numeric width/sill.
**Ship:** add doors/windows to the B1 plan by tapping walls.

### B3 — Plan symbology layer · Rung 1 (3–4 d)
The image-1 → architect-plan jump. Over `editor-2d/renderers/`: wall poché,
door-swing arcs, window breaks, room labels with **computed** size, overall
dimension strings. Pure render layer, no graph change.
**Ship:** the B1+B2 plan visually reads as image 2 *minus furniture*.

### B4 — Rooms as typed zones (2–3 d)
Loop-close → slab **+ zone**; `zone.metadata.roomType` with area/adjacency
auto-guess; one-tap type chooser (tablet). Room label shows name + type.
**Ship:** every room is typed (auto + correctable); type persists.

### B5 — Auto-furnish ruleset → Rung 2 + Rung 3 (5–7 d)
Declarative `roomType → [{catalogId, strategy, anchor, count, clearance}]`.
Orchestrator instantiates catalog items via existing placement strategies +
`checkCanPlace`; per-room floor material. Placed items' `floorPlanUrl`
renders in 2D (→ image 2 furniture symbols) and `.glb` in 3D (→ images 3/4).
**Ship:** typed plan → furnished in both 2D and 3D with no manual placement.
*Largest, riskiest phase — quality of placement rules is the work, not plumbing.*

### B6 — The 2D→3D moment (2–3 d)
Single "See in 3D ✨" / "Edit plan"; choreographed transition that also fires
auto-furnish (B5); land in orbit + Walkthrough; reuse Track A Share.
`prefers-reduced-motion`. **Ship:** full §2 loop end-to-end on an iPad,
< 3 min, landing in a furnished image-3/4-grade scene.

### B7 — Sketch mode (3–5 d)
Stroke capture → simplify → regularise → previewed commit; closed-stroke →
room. Sequenced after B6 so the furnished payoff ships first; per §12 it's a
separable fast-follow. **Ship:** one finger stroke → clean square room.

### B8 — Polish & onboarding (ongoing)
Coach marks, palm-rejection hardening, haptic/sound, portrait/landscape
arrangement, empty/error states, `/` "Design a home" CTA, furnish-quality
tuning on real plans.

**Estimate B0–B6 (the furnished launch path):** ~22–30 working days. Sketch
(B7) is +3–5 and not on the critical path. The added scope vs. the original
estimate is almost entirely **B3+B4+B5** (symbology + typing + auto-furnish);
B5 dominates and should be timeboxed with a "good enough furnish" bar set
against images 3/4 on 3–4 real plans.

---

## 12. Risks & open questions

- **Palm rejection** is make-or-break and browser-dependent (`pointerType`
  is reliable on iPad Safari; verify across iOS versions). Design the
  Pencil-owns-draw rule into B0, not retrofitted.
- **WebGPU on iPad Safari**: the viewer assumes WebGPU. Confirm the target
  iOS versions render the scene; have a graceful message if not. (The viewer
  already logs device/adapter — extend to a user-facing fallback.)
- **Sketch regularisation feel**: too aggressive = "it changed my drawing";
  too soft = crooked walls. Must always preview + be undoable. Tune on real
  finger input, not mouse.
- **The 768 breakpoint**: other code paths assume `useIsMobile()` binary.
  Auditing every consumer when adding a third tier is a real cost — additive
  (`useFormFactor` alongside `useIsMobile`) limits blast radius.
- **Auto-furnish quality is THE risk (B5).** The plumbing is cheap (assets +
  placement exist); making rooms look *designed* — not props scattered — is
  hard. Beds clear of door swings, sofas facing a focal wall, walkways open,
  kitchen along a run. Mitigation: per-`roomType` hand-tuned rules with
  clearance, `checkCanPlace` collision rejection, and an explicit bar:
  side-by-side vs images 3/4 on ≥ 4 real plans before B5 ships.
- **Catalog coverage gaps vs images 3/4.** Images 3/4 show pool, landscaping,
  staged cars, decor density we may not match. Set expectation = *recognisably*
  furnished, not pixel-match. Pool/exterior/site is explicitly v2.
- **Render look ≠ stylised mockups.** Images 3/4 are illustrative renders;
  our output is the real-time WebGPU scene from a top/orbit camera. Good, but
  communicate "interactive 3D" not "marketing render" internally.
- **iPad perf with many GLBs.** A furnished home is dozens of meshes on iPad
  Safari WebGPU. Budget: instancing/repeats, draco/meshopt if not already,
  lazy-load by room, cap counts in the ruleset. Measure on device in B5.
- **Room auto-typing accuracy.** Wrong guesses furnish wrongly. Keep the guess
  weak but the one-tap correction *prominent*; never auto-furnish a room whose
  type the user hasn't confirmed at least implicitly.
- **Scope creep**: stairs/roofs/multi-storey will be requested in v1. Holding
  the line (escape hatch to full editor) is a product decision, restated so it
  isn't relitigated mid-build.
- **"Both drawing modes" doubles drawing-UX surface.** Sketch (B7) is
  deliberately sequenced after the furnished launch (B0–B6); Precise alone is
  a viable launch and Sketch is a fast-follow if timeboxed.

---

## 13. Acceptance checklist (self-check before any Track B PR)

- [ ] Works in iPad Safari portrait **and** landscape at 768–1366 px.
- [ ] Every action reachable by thumb; no hover-only affordance; targets ≥ 44 pt.
- [ ] Pencil-down draws even with a palm/finger down (palm rejection holds).
- [ ] 1-finger draws, 2-finger pans/zooms, no accidental draw while panning.
- [ ] Sketch/Precise produce identical `WallNode`s and interoperate.
- [ ] Closing a loop makes a room (slab **+ typed zone**) every time.
- [ ] 2D view reads as image 2: poché, swings, breaks, computed room
      sizes, dimension strings, **furniture symbols**.
- [ ] Every room is typed (auto-guess + one-tap correction) before furnishing.
- [ ] "See in 3D" auto-furnishes per room type + floor materials; result is
      recognisably image-3/4 quality on the test plans (no collisions /
      blocked doors / furniture in walls).
- [ ] "See in 3D" round-trips with no data loss; reduced-motion respected.
- [ ] "Open in full editor" opens the *same* scene at `/scene/[id]`.
- [ ] No new Three.js in `core`; no `useEditor` in `viewer`
      (`wiki/architecture/layers.md`).
- [ ] Existing desktop editor + Track A flows unchanged.

---

## 14. Out of scope for v1 (explicitly)

**Now IN v1** (moved in, 2026-05-18, per owner): auto-furnish by room type,
2D furniture symbols, per-room floor materials, plan symbology (Rung 1–2),
auto-furnished 3D (Rung 3).

**Still OUT of v1:** *manual* per-item interior design / re-colour deep-dive
(that polished editing is Track A — auto-furnish just seeds it); user-editable
furnish rules; pool / exterior landscaping / site work; stairs / roofs /
multi-storey in the tablet flow; PWA/native packaging; offline; auth/teams;
floorplan-photo import (MCP vision tool exists — a v2 on-ramp); pricing;
collaboration. None require rework — one scene graph, and auto-furnish output
opens directly in Track A's full editor for manual refinement.

---

*End of doc. Review and edit in line; then B0–B6 become tracked phases in
`docs/progress.md`.*
