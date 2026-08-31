# Progress

## Current Milestone

Limbo Trials is an instrumented vertical-slice candidate built around one
standard fifteen-minute run. The code path covers character selection, a
five-weapon build, level-seven evolutions, waves and authored encounters,
curses/rewards, the fourteen-minute Warden, death or victory, results, local
progression, journal discovery, and run analytics.

The slice is structurally complete and remains playable while final owner art is
missing. It is not yet public-demo ready. See
[VERTICAL_SLICE_COMPLETION.md](VERTICAL_SLICE_COMPLETION.md) for the scope and
[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for qualification gates.

## Functional Slice

- Three playable characters with distinct starters, stats, unlocks, and talent
  trees
- Thirty-two weapons, up to five equipped, with levels, focused upgrades,
  synergies, and explicit level-seven evolutions
- Twenty-two enemies across phased, role-capped ambient waves; nine authored
  encounters; elites; curse pressure; and a saved Death Echo
- Reliquaries, fifty artifacts, three powerups, a blood shrine, and the timed
  Blood Market
- Bounded time/player-power threat scaling and source-aware balance telemetry
- A six-attack, three-phase Limbo Warden entering at `14:00`
- Death/victory results, versioned local saves, journal discovery, local playtest
  archives, and optional bounded Supabase submissions

## Completion-Engineering Pass

- Centralized gameplay visuals and audio cues behind typed stable IDs, metadata,
  validation, runtime resolution, and safe development fallbacks.
- Added a generated, usage-based owner-art backlog and technical drawing
  templates so art can be replaced without editing gameplay code.
- Added reusable, opt-in code presentation helpers for restrained flashes,
  outlines, shadows, recoil, squash/stretch, hover, spawn/death treatment, status
  overlays, tint/mirroring, glow/pulse, trails, and impact attachments.
- Added a development-only Content Lab for registry browsing, guide overlays,
  playback control, presentation variants, effect repetition, and lifecycle
  inspection.
- Added a typed semantic gameplay-effect registry over authored VVFX IDs, with
  safe fallbacks and scene-owned handles.
- Completed Tesla Coil's gameplay-side chain orchestration around discharge,
  chain beam, target electricity, impact, and optional final response roles.
- Added deterministic target/range/repeat/tie rules and cancellation when a
  delayed segment's source or target is no longer valid.
- Added pure balance diagnostics for damage, time-to-kill, incoming damage, wave
  pressure/duration, upgrade outliers, and impossible/trivial configurations.
- Hardened development access and browser automation for the `1920x1080` logical
  canvas and kept Dev Mode/Content Lab out of normal production output.

These changes resolve the remaining production-tooling and fallback blockers.
They do not certify final presentation or balance.

## Owner-Art And Audio Blockers

- Produce or approve the demo-critical and required-polish entries in
  [ASSET_PRODUCTION_BACKLOG.md](ASSET_PRODUCTION_BACKLOG.md), in its listed order.
- Validate delivered art in Content Lab against registered dimensions, frames,
  pivot, attachments, transparency, mirroring, and collision/readability guides.
- Approve the existing single-frame/placeholder presentation or replace it where
  the backlog marks it demo-critical.
- Replace or explicitly approve procedural sound effects and ambience/music.
- Confirm ownership, licensing, and credits for every shipped visual, audio,
  font, and VVFX dependency.

Gameplay already supplies configured hit flash, tint/status, and effect
attachments where used. Optional glow, shadow, recoil, hover, spawn/death, trail,
and impact helpers are available for deliberate integration and Content Lab
qualification; they are not globally applied. Final art should not duplicate an
effect that its production specification marks as runtime-owned.

## Manual Playtest Blockers

- Repeated complete runs across all three characters and representative evolved
  five-weapon builds
- Progression, survivability, enemy pressure, upgrade value, curse tradeoffs,
  reliquary/artifact cadence, Blood Market value, and Warden-duration tuning
- High-density readability of enemies, projectiles, hazards, statuses, chain
  lightning, impacts, and camera feedback
- Direct Chrome, Edge, Firefox, and Safari checks at laptop, 16:9, and ultrawide
  sizes, including focus, pause/submenus, restart, and return-to-site
- Final-art, audio-mix, photosensitivity, deployed save migration, analytics,
  leaderboard, and Supabase boundary review
- External playtest feedback from a private distribution build

Automated tests, smoke runs, and headless reports support these sessions; they do
not replace them.

## Known Technical Constraints

- Phaser remains the dominant bundle and may trigger Vite's large-chunk warning.
- Procedural audio is temporary.
- Content and tuning values remain provisional until the manual sessions above.
- Normal production builds intentionally exclude Content Lab and Dev Mode unless
  `VITE_ENABLE_DEV_TOOLS=true` is explicitly set for a test build.
- The repository currently has no formatter command.

## Post-Demo Queue

- Additional characters, weapons, enemies, bosses, biomes, artifacts, and
  presentation variants
- Dual evolutions, buildings, deeper New Game Plus/difficulty, and expanded
  meta-progression
- Controller support, desktop packaging, platform integration, and storefront
  work
- Any general VVFX product expansion not required by a named Limbo Trials effect

## Next Recommended Work

Create and integrate the first demo-critical owner asset from the generated
backlog, inspect it in Content Lab, then complete a standard run and compare its
archived report with the deterministic diagnostics. Repeat one asset and one
playtest decision at a time so presentation and balance changes remain attributable.
