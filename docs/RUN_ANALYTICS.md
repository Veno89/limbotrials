# Run Analytics

Completed standard runs are submitted to `public.run_analytics` through the
server-only Netlify Function. The table stores useful indexed summary columns plus
the complete local `RunSummary` as JSONB, including the balance report that was
previously copied into `docs/data.md`.

The current result screen presents a name-gated **Upload Run** panel. Its button
stays disabled until the player enters a valid leaderboard name; one successful
submission stores private analytics and creates the public `leaderboard_entries`
row with the same `run_id`. The submission session still reuses one `run_id`, so
older or diagnostic anonymous submissions can later become named public scores
without duplicating the analytics row. In that fallback case, the existing
analytics row may keep `player_name` as `null`; join on `run_id` to
`leaderboard_entries` when the published name matters. The landing page only
displays the leaderboard and does not submit or change scores.

## Privacy And Access

- Browser clients cannot read or write `run_analytics`.
- Only the Netlify Function's `service_role` may select or insert analytics rows.
- The leaderboard name is the only player-provided identity stored.
- The public leaderboard remains read-only for browser clients.

Use the Supabase SQL Editor or authenticated administrative tooling to analyze
private run data.

## Local Workspace Access

Copy `.env.example` to the ignored `.env` file and fill in `SUPABASE_URL` and
`SUPABASE_SECRET_KEY`. The secret key must never use a `VITE_` prefix or be
committed.

Inspect the five latest runs without printing their full JSON summaries:

```powershell
npm run analytics:latest
```

Inspect one full stored run summary:

```powershell
npm run analytics:latest -- --limit=1 --full
```

Filter by an exact run ID:

```powershell
npm run analytics:latest -- --run-id=00000000-0000-0000-0000-000000000000 --full
```

The command performs read-only queries against `run_analytics` and never prints
the configured credentials. Treat the local secret key as an administrator
credential and rotate it immediately if it is exposed.

## Useful Queries

Recent runs:

```sql
select
  analytics.created_at,
  coalesce(analytics.player_name, leaderboard.player_name) as player_name,
  analytics.character_id,
  analytics.victory,
  analytics.survival_ms,
  analytics.enemies_killed,
  analytics.damage_dealt,
  analytics.level_reached
from public.run_analytics as analytics
left join public.leaderboard_entries as leaderboard
  on leaderboard.run_id = analytics.run_id
order by analytics.created_at desc
limit 50;
```

Overall difficulty:

```sql
select
  count(*) as runs,
  round(avg(survival_ms) / 60000.0, 2) as average_minutes,
  round(avg(enemies_killed), 1) as average_kills,
  round(avg(damage_dealt), 1) as average_damage,
  round(100.0 * avg(victory::int), 1) as victory_percent
from public.run_analytics;
```

Weapon performance across recorded runs:

```sql
select
  weapon ->> 'id' as weapon_id,
  count(*) as runs_equipped,
  round(avg((weapon ->> 'damage')::numeric), 1) as average_damage,
  round(avg((weapon ->> 'dps')::numeric), 1) as average_dps,
  sum((weapon ->> 'kills')::integer) as total_kills
from public.run_analytics
cross join lateral jsonb_array_elements(
  run_summary -> 'balance' -> 'weaponResults'
) as weapon
group by weapon_id
order by average_damage desc;
```

Most common death sources:

```sql
select
  coalesce(
    run_summary #>> '{balance,deathSource}',
    run_summary #>> '{deathEcho,causeOfDeath}',
    'unknown'
  ) as death_source,
  count(*) as deaths
from public.run_analytics
where victory = false
group by death_source
order by deaths desc;
```

Curse progression for recent runs:

```sql
select
  created_at,
  run_id,
  run_summary #>> '{curse,tierLabel}' as final_curse_tier,
  (run_summary #>> '{curse,level}')::integer as final_curse,
  event ->> 'id' as event_id,
  round(((event ->> 'atMs')::numeric / 1000.0), 1) as at_seconds
from public.run_analytics
cross join lateral jsonb_array_elements(run_summary -> 'balance' -> 'timeline') as event
where event ->> 'id' like 'curse:%'
   or event ->> 'id' like 'curse-event:%'
order by created_at desc, at_seconds asc
limit 100;
```

## Player Progression

Unlocks, souls, meta-upgrade levels, character statistics, and settings remain in
the versioned local save. That is the correct boundary while the game has no
accounts: a public database save endpoint would not have a trustworthy owner.

Reliable cross-device or recoverable cloud saves should be a separate future
system built on Supabase Auth. Each authenticated user would own one save row
protected by user-specific Row Level Security. Local storage can then remain an
offline cache and migration source.
