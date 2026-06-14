# Netlify And Supabase Deployment

The website, Phaser game, public leaderboard, private run analytics, and run-submission function are
designed to deploy together from the repository root.

## 1. Create The Supabase Run Tables

1. Open the Supabase SQL editor.
2. Run [`supabase/leaderboard.sql`](../supabase/leaderboard.sql).
3. Confirm `public.leaderboard_entries` and `public.run_analytics` exist with Row
   Level Security enabled.
4. Confirm the `Public leaderboard read` policy exists only on
   `leaderboard_entries`.

The browser receives read-only leaderboard access and no analytics-table access.
All inserts happen through the Netlify Function using a server-only secret key.

The public browser read is confirmed healthy after applying the complete SQL file.
The health endpoint also returns a non-sensitive Supabase error code when the
server-only score submission connection needs attention.

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

All five production variables must be present on the current site. The public and
server Supabase URLs must point to the same project.

1. Reload the landing page and confirm the public leaderboard is available.
2. Open the health endpoint and confirm the server connection is healthy.

A new Netlify deploy is only required after changing an environment variable or
application code. Applying the SQL takes effect without a redeploy.

For local end-to-end function testing, copy `.env.example` to `.env` and run
`npx netlify dev`. Ordinary `npm run dev` serves the landing page and game but does
not emulate the Netlify Function.

## 4. Verify The Deployment

1. Open `https://limbotrials.netlify.app`.
2. Confirm the leaderboard reports `LIVE RECORDS` or `NO SOULS RECORDED`, not
   `AWAITING SUPABASE`.
3. Enter a leaderboard name and complete or end a standard run.
4. Return to the landing page and confirm the score appears under damage and kills.
5. Open `https://limbotrials.netlify.app/api/runs` and confirm it returns:

   ```json
   {
     "configured": true,
     "databaseReachable": true,
     "leaderboardReachable": true,
     "analyticsReachable": true
   }
   ```

6. Confirm requests to `/api/runs` reject malformed payloads and that direct
   anonymous inserts into both Supabase tables fail.
7. Confirm the result screen reports that analytics and the named leaderboard
   score were recorded.
8. Finish a run without a saved name, enter one on the result screen, and confirm
   the same run appears on the public leaderboard without a duplicate analytics row.

## Troubleshooting

| Symptom | Meaning | Fix |
| --- | --- | --- |
| Landing page says `AWAITING SUPABASE` | Public build variables are missing | Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, then redeploy |
| Landing page says `RECORDS UNAVAILABLE` and Supabase returns `PGRST205` | The table is absent or hidden from the anonymous Data API role | Rerun the complete `supabase/leaderboard.sql` in that project |
| `/api/runs` returns `404` | The Netlify Function was not deployed | Confirm Functions directory is `netlify/functions` and redeploy |
| Health endpoint returns `configured: false` | Server-only Netlify variables are missing | Add `SUPABASE_URL` and `SUPABASE_SECRET_KEY`, then redeploy |
| Health endpoint returns `configured: true, databaseReachable: false` | Function credentials exist but the table/key is wrong | Run the SQL in the matching project and verify the secret key |
| Health endpoint returns database error `42501` | Automatic table grants are disabled and `service_role` lacks access | Rerun the complete SQL file to grant narrowly scoped server read/insert access |
| Health endpoint is healthy but landing page returns `PGRST205` | The function can reach the table, but the anonymous read grant/policy is missing or stale | Rerun the complete SQL file to restore grants and reload PostgREST |

## Security Boundary

The function validates names, score bounds, character IDs, run duration, duplicate
run IDs, report shape, report size, and origin. This prevents accidental or trivial
malformed writes, while RLS prevents browser clients from inserting directly.

Because the game simulation runs entirely in the browser, a determined player can
still fabricate a plausible score request. Treat the leaderboard as a public
playtest record until stronger authentication or server-side run attestation is
introduced.

See [`RUN_ANALYTICS.md`](RUN_ANALYTICS.md) for access boundaries and analysis
queries.
