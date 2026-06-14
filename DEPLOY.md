# Deploying Beeaver to Vercel

The repo is set up to deploy `apps/editor` (the Next.js app) to Vercel from
the `main` branch of `github.com/Adi-21/editor`. All Beeaver branding,
config, and Vercel hints are committed.

## One-time Vercel setup

1. Go to <https://vercel.com/new>
2. **Import Git Repository** → select `Adi-21/editor`
3. When prompted for project settings, point Vercel at the right sub-folder:
   - **Root Directory:** `apps/editor`
   - (Framework will auto-detect as **Next.js**)
   - **Build / Install commands:** leave at defaults — `apps/editor/vercel.json`
     already overrides them to use Bun + Turborepo (`bun run build --filter=editor`).
4. Add **Environment Variables** (Settings → Environment Variables). The
   minimum to get the static pages rendering is just `NEXT_PUBLIC_APP_URL`.
   For real scene save/load you also need the Supabase keys + the
   `BEEAVER_SCENE_API_TOKEN`. Full list with descriptions: see
   [`.env.example`](./.env.example).
5. **Deploy**. The first build takes ~3–5 min (large Three.js / WebGPU bundle).

## Domain setup

1. In Vercel → Project → **Settings → Domains** add `beeaver.in`.
2. Update your DNS provider with the records Vercel shows (typically an
   A or CNAME).
3. Once verified, Vercel auto-issues the HTTPS cert.

## What works without any env vars

- `/` — local editor (scenes don't persist; everything stays in memory)
- `/start`, `/templates`, `/scenes` (empty list), `/palettes`, `/privacy`, `/terms`
- The 3D viewer, 2D plan, prompt/comment popovers, day-night arc

## What needs env vars set

- Persistent scene save/load → `SUPABASE_*` + `BEEAVER_SCENE_API_TOKEN`
- `/present` share links resolving correctly → `NEXT_PUBLIC_APP_URL`
- Origin-locked API → `BEEAVER_SCENE_API_ORIGINS`

## Catalog assets warning

The 110-item furniture catalog currently hot-links Pascal's Supabase bucket
(`byrpxoiotywskoojsrzd.supabase.co`). It will *work* on a Vercel deploy
(public URLs), but:

- Pascal can revoke / change those URLs at any time.
- The 3D model files have their own licenses we haven't audited.

For a permanent production: migrate assets to your own storage and update
`packages/editor/src/components/ui/item-catalog/catalog-items.tsx`. Tracked
in the progress log as a follow-up.

## Troubleshooting

**Build fails with `dotenv: ENOENT .env.local`** — fixed in this commit; the
build script no longer wraps `next build` in `dotenv-cli`.

**Build fails with `Module not found '@pascal-app/nodes'`** — fixed; the
package is in `transpilePackages` of `next.config.ts`.

**RSC boundary error on `/scenes`** — already debugged in May; verify nothing
in `apps/editor/lib/palettes.ts` re-introduces a runtime import of
`@pascal-app/editor` (it must stay `import type` only).
