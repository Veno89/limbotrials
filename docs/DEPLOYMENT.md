# Netlify And Supabase Deployment

The website, Phaser game, public leaderboard, and score-submission function are
designed to deploy together from the repository root.

## 1. Create The Supabase Leaderboard

1. Open the Supabase SQL editor.
2. Run [`supabase/leaderboard.sql`](../supabase/leaderboard.sql).
3. Confirm `public.leaderboard_entries` exists and has Row Level Security enabled.
4. Confirm the `Public leaderboard read` policy exists.

The browser receives read-only access. Inserts happen only through the Netlify
Function using a server-only secret key.

## 2. Netlify Build Settings

Use these values when importing `Veno89/limbotrials`:

| Netlify field | Value |
| --- | --- |
| Team | `Veno89's team` |
| Project name | `limbotrials` |
| Branch to deploy | `main` |
| Base directory | Leave empty |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Functions directory | `netlify/functions` |

These settings are also committed in [`netlify.toml`](../netlify.toml).

## 3. Netlify Environment Variables

Add these in Netlify under **Site configuration → Environment variables**:

| Variable | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Builds | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Builds | Supabase publishable key |
| `SUPABASE_URL` | Functions | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Functions | Supabase secret key |
| `ALLOWED_ORIGIN` | Functions | `https://limbotrials.netlify.app` |

Never prefix the secret key with `VITE_`; Vite-prefixed values are embedded in the
public browser bundle. Trigger a new deploy after changing build-time variables.

For local end-to-end function testing, copy `.env.example` to `.env` and run
`npx netlify dev`. Ordinary `npm run dev` serves the landing page and game but does
not emulate the Netlify Function.

## 4. Verify The Deployment

1. Open `https://limbotrials.netlify.app`.
2. Confirm the leaderboard reports `LIVE RECORDS` or `NO SOULS RECORDED`, not
   `AWAITING SUPABASE`.
3. Enter a leaderboard name and complete or end a standard run.
4. Return to the landing page and confirm the score appears under damage and kills.
5. Confirm requests to `/api/leaderboard` reject malformed payloads and that direct
   anonymous inserts into Supabase fail.

## Security Boundary

The function validates names, score bounds, character IDs, run duration, duplicate
run IDs, origin, and request rate. This prevents accidental or trivial malformed
writes, while RLS prevents browser clients from inserting directly.

Because the game simulation runs entirely in the browser, a determined player can
still fabricate a plausible score request. Treat the leaderboard as a public
playtest record until stronger authentication or server-side run attestation is
introduced.
