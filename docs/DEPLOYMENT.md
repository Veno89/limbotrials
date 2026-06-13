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

The currently deployed site is already connected to a Supabase project, but that
project returns `PGRST205` because `public.leaderboard_entries` has not yet been
created. Run the SQL file in the same project whose URL is stored in
`VITE_SUPABASE_URL`.

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

Add these in Netlify under **Site configuration > Environment variables**:

| Variable | Scope | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Builds | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Builds | Supabase publishable key |
| `SUPABASE_URL` | Functions | Supabase project URL |
| `SUPABASE_SECRET_KEY` | Functions | Supabase secret key |
| `ALLOWED_ORIGIN` | Functions | `https://limbotrials.netlify.app` |

Never prefix the secret key with `VITE_`; Vite-prefixed values are embedded in the
public browser bundle. Trigger a new deploy after changing build-time variables.

The public `VITE_` variables are already present on the current site. The remaining
required dashboard work is:

1. Run `supabase/leaderboard.sql`.
2. Add `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `ALLOWED_ORIGIN` to Netlify.
3. Trigger a new production deploy.

For local end-to-end function testing, copy `.env.example` to `.env` and run
`npx netlify dev`. Ordinary `npm run dev` serves the landing page and game but does
not emulate the Netlify Function.

## 4. Verify The Deployment

1. Open `https://limbotrials.netlify.app`.
2. Confirm the leaderboard reports `LIVE RECORDS` or `NO SOULS RECORDED`, not
   `AWAITING SUPABASE`.
3. Enter a leaderboard name and complete or end a standard run.
4. Return to the landing page and confirm the score appears under damage and kills.
5. Open `https://limbotrials.netlify.app/api/leaderboard` and confirm it returns:

   ```json
   { "configured": true, "databaseReachable": true }
   ```

6. Confirm requests to `/api/leaderboard` reject malformed payloads and that direct
   anonymous inserts into Supabase fail.

## Troubleshooting

| Symptom | Meaning | Fix |
| --- | --- | --- |
| Landing page says `AWAITING SUPABASE` | Public build variables are missing | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy |
| Landing page says `RECORDS UNAVAILABLE` and Supabase returns `PGRST205` | The leaderboard table does not exist in the configured project | Run `supabase/leaderboard.sql` in that project |
| `/api/leaderboard` returns `404` | The Netlify Function was not deployed | Confirm Functions directory is `netlify/functions` and redeploy |
| Health endpoint returns `configured: false` | Server-only Netlify variables are missing | Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, then redeploy |
| Health endpoint returns `configured: true, databaseReachable: false` | Function credentials exist but the table/key is wrong | Run the SQL in the matching project and verify the secret key |

## Security Boundary

The function validates names, score bounds, character IDs, run duration, duplicate
run IDs, and origin. This prevents accidental or trivial malformed writes, while
RLS prevents browser clients from inserting directly.

Because the game simulation runs entirely in the browser, a determined player can
still fabricate a plausible score request. Treat the leaderboard as a public
playtest record until stronger authentication or server-side run attestation is
introduced.
