# Open-Source Acknowledgments

Beeaver is built on top of substantial open-source work. We're grateful to
the maintainers and contributors of every project listed below.

---

## Foundational engine — Pascal Editor

The core 3D building-editor engine, scene graph, geometry systems, and
WebGPU renderer come from the open-source **Pascal Editor**, released by
**Pascal Group Inc.** under the MIT License.

- **Project:** [pascalorg/editor](https://github.com/pascalorg/editor)
- **License:** [MIT](https://github.com/pascalorg/editor/blob/main/LICENSE)
- **npm packages we consume:** `@pascal-app/core`, `@pascal-app/viewer`,
  `@pascal-app/editor`, `@pascal-app/nodes`, `@pascal-app/mcp`,
  `@pascal-app/ifc-converter`

The full text of Pascal's MIT license is preserved in our own
[`LICENSE`](./LICENSE) file as required.

### What Beeaver adds on top

Beeaver's product layer — the UI/UX restructure (Canva/Framer-style
top bar, redesigned Items catalog), the architect-plan 2D renderer
(wall poché, room labels, dimensions), the prompt-driven furniture
placement (`SuggestItemsPopover`), the Figma-style comment threads
(`CommentsPopover`), the day/night lighting arc with shadow tinting,
the bounded zoom-toward-cursor camera, the Track-A theme system
(Studio Warm/Dusk/Ocean palettes + token plumbing), the `/start`,
`/templates`, `/scenes`, `/palettes`, and `/present` routes, the
USDZ/AR export flow, and the brand itself — are **not** part of
Pascal's open-source release. They are proprietary additions
owned by Beeaver.

---

## Major dependencies

A non-exhaustive list of the third-party libraries powering Beeaver
in addition to the Pascal Editor engine:

- **React** & **Next.js** (Vercel) — MIT
- **React Three Fiber**, **drei**, **@react-three/fiber** (Poimandres) — MIT
- **Three.js** (mrdoob et al.) — MIT
- **Tailwind CSS** (Tailwind Labs) — MIT
- **Radix UI** (WorkOS) — MIT
- **Zustand** (Poimandres) — MIT
- **zundo** (charkour) — MIT
- **cmdk** (pacocoursey) — MIT
- **motion** / Framer Motion (Framer) — MIT
- **lucide-react** (lucide-icons) — ISC
- **iconify** (cyberalien) — MIT
- **Zod** (colinhacks) — MIT
- **Biome** (biomejs) — MIT or Apache-2.0
- **Bun** (Oven) — MIT
- **Supabase** client SDK (Supabase, Inc.) — Apache-2.0

A full `package.json`-derived dependency manifest is available via
`bun pm ls --all` and is exported on the
[`/acknowledgments`](#) page in-app (planned).

---

## Trademarks

"Pascal" and "Pascal Editor" are unregistered or registered trademarks
of **Pascal Group Inc.** Beeaver is not affiliated with, endorsed by,
or sponsored by Pascal Group Inc. — we are an independent product
built on their open-source release.

"Beeaver" and the Beeaver logo are trademarks of Beeaver.

---

*Last updated: 2026-06-05.*
