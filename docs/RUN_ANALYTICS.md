# Run Analytics

Completed standard runs are submitted to `public.run_analytics` through the
server-only Netlify Function. The table stores useful indexed summary columns plus
the complete local `RunSummary` as JSONB, including the balance report that was
previously copied into `docs/data.md`.

Every standard run is first recorded anonymously for balance analysis. The result
screen then offers an optional leaderboard-name form. Explicitly publishing the
score creates a public `leaderboard_entries` row using the same `run_id`, without
creating a second analytics record. The landing page only displays the leaderboard
and does not submit or change scores.

## Privacy And Access

- Browser clients cannot read or write `run_analytics`.
- Only the Netlify Function's `service_role` may select or insert analytics rows.
- The optional leaderboard name is the only player-provided identity stored.
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
  created_at,
  player_name,
  character_id,
  victory,
  survival_ms,
  enemies_killed,
  damage_dealt,
  level_reached
from public.run_analytics
order by created_at desc
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
  run_summary #>> '{balance,deathSource}' as death_source,
  count(*) as deaths
from public.run_analytics
where victory = false
group by death_source
order by deaths desc;
```

## Player Progression

Unlocks, souls, meta-upgrade levels, character statistics, and settings remain in
the versioned local save. That is the correct boundary while the game has no
accounts: a public database save endpoint would not have a trustworthy owner.

Reliable cross-device or recoverable cloud saves should be a separate future
system built on Supabase Auth. Each authenticated user would own one save row
protected by user-specific Row Level Security. Local storage can then remain an
offline cache and migration source.
