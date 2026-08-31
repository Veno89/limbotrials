# Vertical Slice Completion

## Scope

The smallest complete Limbo Trials experience is one standard fifteen-minute
arena run:

1. Choose one of three characters.
2. Build a loadout of up to five of the thirty-two registered weapons.
3. Advance weapons through level six and choose their explicit level-seven
   evolutions.
4. Survive the phased ambient waves and nine authored encounters while using
   upgrades, curses, reliquaries, artifacts, powerups, the blood shrine, and the
   Blood Market.
5. Meet the six-attack, three-phase Limbo Warden at `14:00`.
6. Reach death or victory, review the result, and preserve local progression and
   run analytics.

This is the first-complete-build boundary. It does not include every idea in the
longer roadmap, and structural completion is not the same as public-demo
qualification.

## Functional Today

- The complete menu -> character select -> arena -> outcome -> result loop exists.
- Three characters, thirty-two weapons, twenty-two enemies, fifty artifacts,
  three powerups, curses, reliquaries, the blood shrine, and the Blood Market are
  represented by typed content definitions.
- Weapons have level progression, explicit level-seven evolutions, focused
  upgrades, telemetry attribution, and a five-slot loadout limit.
- The fifteen-minute wave schedule contains role caps, authored encounters,
  bounded threat scaling, and the Warden entrance at fourteen minutes.
- Death and victory feed the result flow, versioned local progression, journal
  discovery, local playtest archiving, and optional Supabase submission.
- Development presets and telemetry make focused combat and pacing checks
  repeatable without changing standard-run rules.

## Code Completion In This Pass

The remaining non-art production work is bounded to the following contracts:

- A typed visual/audio manifest is the source of truth for stable asset IDs,
  imports, dimensions, frames, animation, origins, scale, depth, mirroring,
  tinting, collision footprints, attachment points, requirement level,
  provenance, and safe development fallbacks.
- Validation rejects duplicate IDs, invalid dimensions or frame ranges,
  impossible animation settings, missing required attachment points, and
  fallback cycles. Missing required files produce deduplicated diagnostics.
- A resolver keeps gameplay independent from filenames and makes replacement of
  owner artwork a manifest-only operation.
- A development-only Content Lab previews registered visual assets and gameplay
  effects, including guides, animation controls, presentation variants, repeated
  lifecycle tests, and live-object counts.
- A typed gameplay-effect registry separates semantic roles from VVFX filenames.
  Tesla Coil requests a discharge, chain beam, target electricity, impact, and
  optional final-chain response without knowing how each effect is authored.
- VVFX playback has bounded lifecycle ownership, safe missing-effect fallbacks,
  deterministic seed support, moving attachment/end-point support, and scene
  cleanup. Combat remains authoritative if presentation cannot play.
- Deterministic chain targeting defines range, maximum targets, repeat rules,
  tie-breaking, delayed-segment validation, cancellation, and cleanup.
- Pure headless balance diagnostics report damage ranges, representative
  time-to-kill, incoming damage, wave pressure/duration, upgrade outliers, and
  impossible or trivial configurations. These are diagnostics, not a fun or
  balance verdict.
- Development tooling can reach focused encounters and outcomes quickly, inspect
  collision/attachment guides, and trigger registered presentation effects.

The automated gates for this pass are documented in
[TESTING.md](TESTING.md). A passing gate proves only the behavior it exercises.
After those gates pass on the final revision, no known demo-critical code blocker
remains inside this slice. Any failing content check, test, build, production
exclusion scan, or normal-flow smoke remains a code blocker; it must not be
reclassified as owner-art or manual-playtest work.

## Owner-Created Asset Blockers

The game must remain playable with existing owner-created art and development
fallbacks, but a public demo still requires the owner to create or explicitly
approve the demo-critical art listed in
[ASSET_PRODUCTION_BACKLOG.md](ASSET_PRODUCTION_BACKLOG.md). That generated
document is the canonical owner-facing creative checklist: it groups recognizable
subjects and supplies concise, theme-consistent design prompts. Exact filenames,
dimensions, frames, orientation, pivot, transparency, attachments, and
runtime-presentation coverage remain canonical in `src/game/data/assets.ts` and
are qualified with the technical templates and Content Lab.

These are presentation and rights blockers, not reasons to hardcode temporary
asset paths into gameplay. No AI-generated or downloaded visual assets should be
added by this completion workflow. Technical SVG guides are blank production
templates, not final artwork.

Audio remains procedural placeholder content. Final authored audio, music,
licensing/ownership records, and an explicit approval decision are required for a
public demo.

## Manual Qualification Blockers

The following cannot be declared complete by unit tests, static inspection, a
headless balance report, or the automated browser smoke:

- Several completed fifteen-minute keyboard runs across all three characters.
- Representative evolved builds, curse levels, reliquary/artifact paths,
  powerups, Blood Market visits, and Warden fights.
- Subjective readability of projectiles, hit feedback, status overlays, hazards,
  crowd pressure, and final owner art at realistic density.
- Pacing, survivability, weapon value, upgrade value, Warden duration, and audio
  mix decisions based on archived run reports.
- Hands-on Chrome, Edge, Firefox, and Safari checks at laptop, standard 16:9, and
  ultrawide viewports, including keyboard focus and pause/resume behavior.
- Deployed save migration, analytics submission, leaderboard behavior, and
  Supabase security-boundary checks.
- Photosensitivity review, final asset rights/credits, and external playtest
  feedback.

Until those gates and the demo-critical owner-art work are complete, the project
is a structurally complete, instrumented vertical-slice candidate—not a
public-demo-ready release.

## Post-Demo Work

Keep the following outside the first-complete-build boundary unless a confirmed
defect makes one necessary:

- More characters, weapons, enemies, bosses, biomes, artifacts, and cosmetic
  variants.
- Dual evolutions, buildings, deeper New Game Plus or difficulty systems, and
  broader meta-progression.
- Controller support, desktop packaging, platform integration, and storefront
  features.
- A general-purpose VVFX editor/runtime expansion unrelated to a named Limbo
  Trials production need.
- Global presentation changes that force one animation or effect language onto
  every entity.

## Completion Evidence

Use these evidence classes independently:

- **Automated:** validation, lint, typecheck, unit/integration tests, production
  build, production-bundle exclusion check, and scripted browser smoke.
- **Diagnostic:** headless balance reports and captured development scenarios.
- **Observed:** direct browser interaction, console inspection, screenshots, and
  viewport checks.
- **Subjective:** owner review of art, readability, game feel, pacing, balance,
  audio, and accessibility risk.
- **External:** deployed services, asset rights, and outside playtest feedback.

Do not convert a pass in one class into a claim about another.
