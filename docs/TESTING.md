# Testing Strategy

## Evidence Boundaries

The repository uses several complementary checks. Keep their conclusions
separate:

- **Static:** content validation, TypeScript, ESLint, and production-bundle scans.
- **Automated behavior:** Vitest and scripted Chromium/Edge smoke flows.
- **Diagnostic:** deterministic balance summaries and development laboratory runs.
- **Observed:** direct browser interaction, screenshots, console review, and
  viewport checks.
- **Subjective:** game feel, balance, readability, audio, accessibility risk, and
  final-art approval.

A green automated gate does not by itself prove visual quality, accessibility,
security, performance on target hardware, fun, final balance, or public-demo
readiness.

## Commands

```bash
npm run validate:content     # Asset/effect/content registry integrity
npm run assets:backlog:check # Generated backlog agrees with the manifest
npm run balance:diagnostics  # Deterministic numeric diagnostic report
npm run typecheck            # Strict TypeScript checks
npm run lint                 # ESLint
npm test                     # Vitest suite
npm run build                # Typecheck and Vite production build
npm run check:prod-bundle    # Normal bundle excludes development scenes
npm run smoke:dev            # Scripted development-flow browser smoke
npm run smoke:prod           # Scripted built-production browser smoke
npm run verify               # Aggregate non-browser source/content/build gate
npm run verify:release       # Full local gate including both browser smokes
```

There is no formatter script in the current repository. Do not claim formatting
was verified unless a formatter and command are added later.

## Content Validation

`npm run validate:content` checks the registries that bridge content and runtime:

- Stable visual/audio asset IDs and explicit imported source files
- Duplicate IDs
- Expected dimensions, frame geometry/ranges, and animation configuration
- Required attachment points and finite origins, scales, and collision footprints
- Required/optional status and valid fallback chains without cycles
- Gameplay texture references resolving through the manifest
- Stable authored VVFX IDs, semantic gameplay-effect roles, dependencies, Beam
  placement contracts, and safe fallbacks

Runtime missing-resource messages are deduplicated so repeated spawns do not flood
the console. A development fallback proves the loop can continue; it does not turn
missing demo-critical owner art into a completed asset.

## Vitest Coverage

Tests under `src/game/tests/` import browser-independent rules. Coverage includes:

- Save migration, local progression, journal discovery, and run summaries
- Damage, XP, upgrade selection, stack limits, weapon levels, and evolution gates
- Threat, waves, encounters, curses, artifacts, characters, talent trees,
  statuses, Death Echoes, and leaderboard validation
- Weapon geometry/behavior rules and focused upgrade effects
- Asset manifest validation, resolver/fallback behavior, and effect-registry
  contracts
- Deterministic chain-lightning target selection, tie-breaking, range/repeat
  rules, cancellation decisions, and lifecycle ownership
- Headless balance diagnostic calculations and impossible/trivial configuration
  flags

Keep pure logic outside modules that initialize Phaser or touch `window`; Node
tests should not need a browser simply to validate a selection or lifecycle rule.

## Headless Balance Diagnostics

`npm run balance:diagnostics` reports theoretical damage ranges/DPS,
representative enemy time-to-kill, player damage intake, wave duration/pressure,
upgrade value outliers, and impossible or trivial configurations.

The report is a deterministic review aid. It does not simulate player movement,
targeting efficiency, crowd geometry, input skill, visual clarity, or fun. Use it
to identify candidates for a real playtest, then compare archived full-run
telemetry before changing balance.

## Browser Smoke

The smoke script uses `playwright-core` with an installed Chrome, Edge, or
Chromium executable. Set `CHROME_PATH` when auto-detection is insufficient.

The development smoke verifies the website/game boundary, menu, settings,
character selection, run start, pause/resume, Dev Mode simulation controls and
guides, a named Tesla role, Content Lab access, a forced loss/result, and return
to the website. The production
smoke exercises the built site and normal game flow while ensuring ordinary
production output does not expose development scenes. Captures are written under
`.smoke/development/` and `.smoke/production/`.

The script maps logical `1920x1080` game coordinates through the live canvas
bounds. It checks scene reachability and browser errors, not subjective rendering
quality. Review captures and repeat important paths hands-on before release.

## Content Lab Checks

Run `npm run dev`, begin a trial, and press `F11`, or load the local app with
`?content-lab=1`. For each newly added or replaced asset/effect:

1. Select its stable ID and verify the displayed metadata.
2. Inspect origin/pivot, attachment, bounds, and collision guides.
3. Exercise play, pause, restart, frame step, configured FPS, and slow motion.
4. Inspect mirror, tint/palette, hit flash, outline, shadow, glow, and status
   variants that the manifest permits.
5. Repeat the effect and confirm its live-object count returns to baseline.
6. Test against multiple backgrounds and useful zoom levels.

Content Lab and Dev Mode are development-only by default. A production-mode test
bundle must opt in with `VITE_ENABLE_DEV_TOOLS=true`; normal production validation
must leave them out.

## CI

`.github/workflows/ci.yml` is the executable source of truth for hosted checks.
It installs from the lockfile, runs `npm run verify`, exercises both development
tooling and production browser flows, and retains both sets of smoke captures as
an artifact. Treat those screenshots and console checks as automated evidence,
not hands-on qualification.

## Manual Release Matrix

Before a public demo, perform and record:

- Multiple complete fifteen-minute runs, including victory and death
- All three characters and representative level-seven/evolved five-weapon builds
- Curses, reliquaries/artifacts, all powerups, blood shrine, Blood Market, Death
  Echo, late encounters, and several Warden attacks/phases
- Chrome, Edge, Firefox, and Safari where supported
- Laptop, standard 16:9, and ultrawide layouts
- Keyboard focus, pause/submenu return, restart, save migration, and return-to-site
- Final owner-art readability, audio mix, photosensitivity risk, console/network
  logs, deployed analytics, leaderboard behavior, and Supabase access boundaries

Record **Passed**, **Failed**, **Blocked**, and **Untested** explicitly. Do not
collapse unavailable browsers or services into a pass.
