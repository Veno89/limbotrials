# Architecture

## Responsibilities

```text
src/game/
  assets/     Typed visual/audio manifest contracts, validation, and resolution
  balance/    Browser-independent diagnostic models
  config/     Feature switches and shared balance limits
  data/       Typed content declarations: enemies, weapons, upgrades, waves, meta upgrades
  presentation/ Optional reusable code-driven sprite presentation
  scenes/     Scene flow and high-level orchestration
  systems/    Focused gameplay and pure-logic systems
  tests/      Vitest coverage for pure rules
  types/      Shared game contracts
  ui/         Reusable UI helpers and HUD
  utils/      Shared pure modifier and clamping utilities
  vfx/        Semantic gameplay-effect registry and VVFX Runtime JSON bridge
```

`GameScene` owns the run lifecycle and composes focused systems. It does not contain weapon, movement, spawn, pickup, save, damage, or HUD implementation details.

## Runtime Systems

- `RunState`: mutable state for one trial, active elapsed run time, equipped weapons, per-weapon levels/stats, applied progression, and the current threat snapshot.
- `CurseSystem`: run-local curse total, tier lookup, threshold crossings, and curse gain results.
- `BalanceTelemetry`: pure event aggregation and one-minute balance reporting.
- `BalancePresetSystem`: applies data-defined focused test scenarios.
- `DebugControlsSystem`: development shortcuts and live-overlay coordination.
- `AssetResolver`: resolves stable visual IDs to explicit file imports or declared
  primitive/asset fallbacks and transforms named attachment points into world
  coordinates.
- `assetValidation`: validates the visual/audio manifest, fallback graph, frames,
  dimensions, animation, collision, attachments, and live content references.
- `DevModeSettings`: localStorage-backed dev-only preferences such as invincibility; no personal dev preset data is committed.
- `devWeaponModel`: pure weapon-to-unlock/level/evolution/focused-upgrade mapping for local dev tools.
- `JournalDiscoverySystem`: save-backed content discovery for the player journal, including sanitization and run-summary inference.
- `PlayerMovementSystem`: keyboard movement and dash timing.
- `PlayerVisualSystem`: optional character-specific directional presentation layered over the unchanged physics body.
- `EnemySpawnSystem`: phased role-based spawn sessions, ambient population cap, weighted elite pools, and boss timing.
- `RunEventSystem`: authored one-off formations and encounter beats independent from ambient population targets.
- `EnemySystem`: enemy instances, movement coordination, contact damage, health, and spawn-time threat scaling.
- `EnemyAbilitySystem`: telegraphed brute charges, caster/archer projectiles, stalker lunges, screamer danger zones, and threat-scaled ability damage.
- `ChestSystem`: bounded player-relative reliquary spawning, proximity opening, objective data, and despawn behavior.
- `LootRevealSystem`: non-modal soul-lock burst, curved reward travel, and player-side loot receipt after a reliquary opens.
- `BossAttackSystem`: the Warden's six telegraphed attack patterns and focused boss-only telegraph, lane, and hazard helpers.
- `WeaponSystem`: weapon cooldowns and data-driven behavior dispatch for thirty-two weapons.
- `WeaponEvolutionSystem`: level-seven capstone effects.
- `WeaponUpgradeEffectSystem`: focused authored weapon effects for projectile splintering, spreading area blasts, delayed judgment echoes, and status application triggers.
- `StatusEffectSystem`: data-defined enemy status lifetimes, stack refreshes, compact debuff icons, and damage-over-time ticks with weapon attribution.
- `CrimsonOrbitSystem`: focused persistent runtime controller for evolved Bloodletter Axe positioning and repeated collision checks.
- `AcidPoolSystem`: focused persistent runtime controller for player-created acid pools, tick timing, pool visuals, and evolved poison application.
- `WeaponSynergySystem`: cached loadout-pair bonuses.
- `CursedRewardMutationSystem`: central mutation layer that turns eligible upgrade or artifact offers into cursed variants without duplicating the base reward systems.
- `ConditionalUpgradeSystem`: runtime bridge for typed conditional upgrades that depend on movement, dash windows, shields, target kind, and enemy deaths.
- `ArtifactEffectSystem`: runtime bridge for typed artifact effects that depend on pickups, dashes, shield breaks, enemy deaths, and one-time claim rewards.
- `DeathEchoSystem`: one-run controller that turns the latest saved death snapshot into a readable generated Echo encounter.
- `PickupSystem`: soul drops, bounded pickup consolidation, magnet movement, and collection.
- `ShopSystem`: active-run Blood Market scheduling, world presence, proximity interaction, expiry, and objective state.
- `shopRules`: pure spawn-chance, blood-affordability, and shop-exclusive offer selection rules.
- `ArenaFloorSystem`: weighted rendering of the supplied 128px arena tiles; `arenaFloorRules` keeps decorative variants sparse and deterministic.
- `pickupAttractionRules`: pure XP-globe sizing, normal magnet speed, and Soul Vacuum motion profiles.
- `PowerupSystem`: cooldown-bounded random healing, vacuum, and temporary frenzy drops plus guaranteed elite drops.
- `UpgradeOfferSystem`: queued standard/curse choices, rerolls, and skip rewards.
- `ArenaShrineSystem`: proximity interaction for the arena's blood shrine.
- `JuiceSystem`: visual feedback hooks, warning replacement, and throttled screen shake.
- `GameplayEffectRegistry`: typed semantic sequences and roles over raw VVFX file
  IDs, placement contracts, depth, timing, feedback, and code fallbacks.
- `VvfxSystem`: scene-scoped catalog, preload, point/Beam placement, deterministic
  seed overrides, managed playback handles, centralized warnings, active-effect
  diagnostics, moving endpoint updates, cancellation, and shutdown cleanup.
- `SpritePresentationSystem`: opt-in, configurable code-driven hit flash, outline,
  shadow, recoil, squash/stretch, hover, spawn/death, status, tint/mirror,
  glow/pulse, trail, and impact presentation.
- `AudioSystem`: manifest file playback for SFX/ambience with live volume updates,
  bounded SFX cleanup, one-file ambience ownership, and deduplicated procedural
  fallback when an imported source cannot play.
- `EnemySeparationSystem`: local spatial-hash crowd repulsion.
- `HudSystem`: fixed-camera run information.
- `JournalScene`: player-facing encyclopedia for discovered weapons, evolutions, artifacts, enemies, bosses, buffs, and debuffs. Unknown entries render as `???`.
- `DevModeScene`: Vite-dev-only test overlay for invincibility, exact upgrade/artifact grants, weapon grants, powerups, enemy spawns, and a high-health target dummy.
- `ContentLabScene`: development-only registry browser for assets, animation,
  guides, presentation variants, gameplay effects, and lifecycle/load checks.
- `DevWeaponPanel`: weapon-centric local test controls for adding, leveling, evolution preparation, evolution, and focused upgrades.
- `ArtifactBar`: acquired-artifact icons, rarity frames, and tooltips.
- `ChestObjectiveHud`: direction, distance, and remaining lifetime for the nearest active reliquary.
- `PlayerStatusVisualSystem`: player-following shield state and generic timed-powerup duration bars.

Gameplay code does not assume a legacy asset path is authoritative. The manifest
identifies the currently approved source, provenance, replacement target, and
fallback for each stable ID. Character sprites are currently single-image
presentation with restrained code-driven motion where configured; no generated
directional walk sheet is part of the active asset contract.
- `WeaponActionBar`: data-driven equipped-weapon slots and cooldown presentation.
- `StatsPanel`: reusable live global/per-weapon build dropdown shared by gameplay and upgrade scenes.
- `BalanceDebugOverlay`: development-only live sample metrics.
- `SaveSystem`: versioned storage, defaults, purchases, run-history recording, and unlock migration.
- `SpecialEffectHandlers`: typed registry for artifact effects that change structural run rules, such as weapon slot cap or universal pierce.
- `deathEchoRules`: pure snapshot validation, snapshot creation, Echo stat scaling, ability translation, and spawn-plan rules.
- `conditionalUpgradeRules`: pure damage multipliers, cursed/Echo target detection, and conditional soul-reward values.

## Runtime Clocks

`RunState.elapsedMs` is the authoritative active run clock. Run progression,
reliquary scheduling and expiry, random powerups, temporary buffs, shield refresh,
encounters, elites, and boss entrance use it so upgrade and pause scenes do not
advance gameplay.

Phaser scene time remains appropriate for frame-level combat cooldowns, projectile
lifetimes, telegraph resolution, and presentation callbacks because those systems
are internally scene-bound and pause with the scene.

## Authored VVFX effects

`vfx/discoveredVvfxCatalog.ts` discovers
`vfx/effects/*.vvfx-runtime.json` at build time. The filename without
`.vvfx-runtime.json` is the stable effect ID. Catalog creation validates and
normalizes every export through `@vvfx/phaser-runtime`, records whether a Beam
layer is present, and reports collisions or malformed files instead of letting
individual weapons interpret JSON.

`GameplayEffectRegistry.ts` is the gameplay-facing boundary. A typed sequence
maps semantic roles to raw Runtime JSON IDs, placement, depth, duration, Beam
fitting, and a safe code fallback. Weapons and enemies request the sequence/role;
they never inspect layer composition or depend directly on an export filename.

Tesla Coil's `tesla-chain` sequence is the reference integration. It defines
`initialDischarge`, `beam`, `targetElectricity`, `impact`, and `finalChain` roles.
The first two roles currently map to the authored `chain-lightning` and
`tesla-chain-link` Beam exports. Target electricity, impact, and the optional
final response can use restrained primitive pulse fallbacks until dedicated
exports are supplied. Replacing a role in the registry requires no weapon change.

`VvfxSystem` preloads each effect once per scene and owns every managed runtime
handle until completion, cancellation, or scene shutdown. Managed handles expose
play, pause, restart, stop, frame stepping, position/end-point updates, and live
diagnostics. A caller may provide a deterministic seed and depth. Beam playback
may crop short links, adjust thickness, and cap an authored tail without mutating
the export; non-Beam layers retain their authored size and behavior.

When an entity moves, orchestration resolves its named manifest attachment point
and updates the managed position or Beam endpoints. A missing attachment falls
back to the entity center. Screen-space callers convert through the active camera
before passing coordinates; the Runtime JSON bridge remains world-coordinate
based.

Gameplay remains authoritative. If visual playback fails, errors are reported
once and the semantic code fallback plays while combat still resolves. Asking to
fit endpoints onto an export without a usable Beam produces one deduplicated
development warning and midpoint playback; it does not stretch non-Beam artwork.
When an effect has a meaningful authored impact moment, the behavior's delayed
damage should use that moment explicitly; Meteor Hammer's current export lands at
450 ms.

## Threat Scaling

`systems/threatRules.ts` is a pure bounded rules module. Time establishes the
minimum threat tier; player level and weapon progression may push it higher. Normal
enemy health and damage multipliers are captured when an enemy spawns, preventing
existing enemies from changing underneath the player. Bosses are explicitly
excluded from generic threat multipliers and receive encounter-specific tuning.

`BalanceTelemetry` records threat tier transitions rather than emitting a sample
every frame. The live debug overlay displays time threat, power threat, active
threat, and current health/damage multipliers.

## Safety Rails

`config/featureFlags.ts` controls expansion systems at their integration boundaries. Disabled systems must leave the standard run playable.

`config/balanceConfig.ts` owns shared hard limits and tuning values, including player caps, artifact rarity weights, active hazard limits, and chest timing. Content files should not duplicate those values.

Crimson Orbit's pure profile calculation lives in `systems/crimsonOrbitRules.ts`.
It converts current Bloodletter stats and attack speed into bounded axe count,
radius, size, angular speed, hit cadence, and damage scale. `CrimsonOrbitSystem`
owns only its persistent visuals and collision timing; final damage and telemetry
remain routed through `WeaponSystem`.

Poison Flask's pure pool and travel rules live in `systems/acidPoolRules.ts`.
`AcidPoolSystem` owns lingering pool lifetime, tick cadence, and poison status
application, while final damage and telemetry remain routed through `WeaponSystem`.

`systems/enemyAbilityRules.ts` owns the authored elite-charge distance, duration,
and derived movement multiplier so the red telegraph and actual charge cannot drift
apart. `systems/weaponRules.ts` similarly derives Bloodletter Axe's outbound and
lifetime timing from its current range and projectile speed.

## Stat Modifier Stacking Order

Run stats are applied in this order:

1. Base player stats
2. Character stat overrides
3. Character talent modifiers and typed talent effects
4. Run artifacts
5. Temporary upgrades, buffs, and curses
6. Future building effects
7. Future difficulty effects
8. Hard caps

`mode: 'add'` adds the declared value. `mode: 'multiply'` uses a factor, so a 12% increase is `1.12` and a 15% reduction is `0.85`. All stat and weapon mutations must use `utils/statModifiers.ts`.

## Expansion Registries

- `data/artifacts.ts`: artifact definitions plus availability and weighted roll rules
- `data/characters.ts`: character definitions and unlock evaluation
- `data/enemies.ts`: enemy definitions, including hazard and bomb specialists
- `data/statusEffects.ts`: status-effect definitions, icon textures, stack caps, durations, and tick cadence
- `data/talentTree.ts`: character talent paths, node definitions, point thresholds, and tree layout metadata
- `data/powerups.ts`: powerup presentation, pickup explanations, and optional timed-effect duration

Artifacts may declare `special` only when its ID exists in `SpecialEffectHandlers`. Artifacts may declare `effect` only when its ID is handled by `ArtifactEffectSystem`. Tooltip-only special effects are not allowed.
Talent major nodes may declare `effect` only when its ID exists in `TalentEffectHandlers`. Smaller talent nodes should prefer normal `StatModifier` or `WeaponModifier` entries.

## Data-Driven Content

Content IDs are string unions in `types/gameTypes.ts`. Definitions live in `data/` and are consumed by systems. Upgrade definitions carry one of six categories and reusable typed character or weapon modifiers.

Normal level-up choices and curse-event choices use separate selection pools. Weapon levels and focused upgrades advance their target through level five. At level six, focused upgrades pause and the normal selection pool guarantees one eligible explicit evolution choice that advances the selected weapon to level seven. Any remaining focused upgrades then return as evolved specializations: `RunState` applies their typed modifiers or effects without advancing beyond level seven. Weapon evolution behavior remains authored on weapon definitions. Weapon synergies are declared in `data/weaponSynergies.ts`.

Balance preset definitions live in `data/balancePresets.ts`. Gameplay systems report facts to `BalanceTelemetry`; they do not calculate or render reports themselves.

Focused cadence tradeoffs are ordinary `weapon-upgrade` definitions containing
multiple typed `WeaponModifier` entries. They do not require a generic behavior
engine. `RunState.applyUpgrade` enforces each definition's `maxStacks`, so offers,
presets, debug controls, and future callers share the same stacking boundary.
`UpgradeSystem` excludes focused choices only while their weapon is waiting at level
six, allowing unused choices to specialize an evolved weapon without creating level
eight.

Authored behavior-changing upgrades declare a typed `weaponEffect` ID.
`WeaponUpgradeEffectSystem` owns only the small set of runtime callbacks those
effects require, while `weaponUpgradeEffectRules.ts` owns their bounded target
counts, geometry, delays, radii, and damage scales. Runtime activation resolves
through `RunState.hasWeaponEffect`, making the typed definition the actual contract.

Bleed and poison definitions live in `data/statusEffects.ts`; timing and stacking
rules live in `statusEffectRules.ts`; and `StatusEffectSystem` owns runtime icons,
expiry, and tick damage. Weapons, enemies, bosses, artifacts, or talents should
apply statuses through `StatusEffectSystem` rather than duplicating DOT timers.

XP-risk upgrades use the normal typed stat-modifier path. `xpGain` changes collected
run XP, while `threatPowerBonus` contributes directly to the bounded power score in
`threatRules.ts`; it does not bypass the threat cap or mutate existing enemies.

Conditional upgrades declare a typed `conditionalEffect` ID. `RunState` exposes
owned conditional effects, `UpgradeSystem` evaluates simple data requirements such
as shield availability, and `ConditionalUpgradeSystem` owns runtime checks for
movement, dash windows, shield state, elite targets, cursed enemies, Echoes, and
enemy-death rewards. Keep new conditional families in that path unless they need a
more focused system of their own.

Curse thresholds and unlock rules live in `data/curse.ts`. `RunState` owns the
active `CurseSystem`, upgrade and artifact selection apply curse through typed
reward metadata, and spawn/boss systems read curse snapshots instead of duplicating
threshold checks. Cursed reward mutation is centralized in
`CursedRewardMutationSystem`; normal reward definitions remain valid base content.

Death Echo data is saved as a compact `DeathEchoSnapshot` by `SaveSystem` after
failed standard runs. Future runs use `DeathEchoSystem` and `deathEchoRules.ts` to
translate the old build into capped enemy-safe abilities rather than reusing player
combat or controller code.

Character talent trees replace the old flat legacy upgrade cards. `SaveSystem`
owns save migration and records legacy souls on the character used for each run.
`TalentTreeSystem` owns point math, prerequisites, path gates, mutually exclusive
choice pairs, and refunds. `MetaProgressionScene` renders the current first-pass
tree UI but does not own allocation rules. `RunState` applies allocated talent
modifiers at run start and delegates typed non-stat effects to
`TalentEffectHandlers`.

Bone Scythe uses the shared geometry in `scytheRules`: its baseline attack,
Crimson Harvest application, and evolved follow-up all use a forward 180-degree
sweep based on the player's last movement direction. Haunted's Reaper capstone
changes that shared profile to 360 degrees through a typed talent effect.

Journal discovery is part of the versioned local save. Runtime systems should
record discovery at the moment content is actually seen or claimed: weapon unlocks,
weapon evolutions, artifact claims, enemy spawns, powerup collection, and status
application. `JournalDiscoverySystem` also infers discoveries from completed run
summaries as a backup. Journal UI should read from the model in `journalModel.ts`
rather than duplicating data-file traversal in scene code. Each category also owns
a save-backed seen list; main-menu and category badges count discovered entries
that have not yet been viewed.

Dev Mode and Content Lab are registered only when `import.meta.env.DEV` is true,
or when a production-mode diagnostic build explicitly sets
`VITE_ENABLE_DEV_TOOLS=true`. Normal production builds do not statically include
their scene code. The production-bundle scan enforces this boundary.

The Dev Mode overlay applies real `RunState` upgrades, artifacts, weapons,
powerups, enemy spawns, encounter resets, speed changes, and outcomes so test
setups exercise the same paths as normal play. Persisted preferences use browser
localStorage; optional local preset files are ignored by git. Weapon progression
controls derive their definitions through `devWeaponModel` rather than
maintaining a second hardcoded progression map.

Content Lab reads the same asset and gameplay-effect registries as gameplay. It
does not maintain a second preview-only inventory. Its repeated-playback and
live-object diagnostics are supporting lifecycle evidence, while hands-on review
is still required for pivots, scale, animation, visual clarity, and final art.

Pause-menu submenus use a typed return target through `MenuNavigationSystem`.
Journal and Settings replace the pause overlay while `GameScene` remains paused,
are explicitly moved above the paused game, then start a fresh `PauseScene` when
returning. Pause actions call the public `GameScene` lifecycle instead of passing
function callbacks through scene data.

The Blood Market is a separate timed world event rather than a chest variant.
`data/shop.ts` owns its catalogue and HP prices. Shop rewards declare
`source: 'shop'`; normal upgrade and reliquary selection exclude that source
centrally. `ShopScene` pauses the active run, while `RunState.spendBlood` ensures
a purchase can never consume the player's final HP.

`PickupSystem` owns XP-globe runtime state and collection callbacks. Soul Vacuum
marks existing pickups for staggered attraction and lets them complete through the
same collection path as ordinary magnet movement; it does not bypass XP, soul,
artifact, telemetry, or level-up handling.

## Website And Leaderboard

`src/main.ts` owns the website shell and lazy-loads Phaser only after the visitor
starts the game. `site/landingPage.ts` owns the static marketing page composition,
while `site/leaderboardPanel.ts` owns leaderboard rendering and interaction.

The public browser client reads `leaderboard_entries` through Supabase using the
publishable key. Completed standard runs submit through the bounded
`netlify/functions/submit-run.ts` endpoint, which owns the server-only secret key.
`analytics/runSubmissionRules.ts` validates and size-bounds the complete run record.
The function privately stores full run analytics and conditionally writes a public
leaderboard row when a valid player name is present. The current result-screen UI
requires a valid name before enabling **Upload Run**, while the underlying
submission session still reuses one `run_id` so older or diagnostic anonymous
analytics submissions can be named later without duplicating analytics.

Permanent progression remains in the versioned local `SaveSystem`. Moving it to
Supabase requires authenticated ownership and user-specific RLS; it must not share
the anonymous run-analytics write boundary.

## Add An Enemy

1. Add its ID to `EnemyId`.
2. Add a definition in `data/enemies.ts`.
3. Reference a stable manifest asset ID; do not add an ad hoc preload or direct
   filename import.
4. Add the ID to the desired role session in `data/waves.ts`.
5. Add it to an authored event or weighted elite pool when it should headline a specific run phase.
6. Add `spawnRequirements` only when the enemy is gated by curse tier, curse level, or curse tags.

Only genuinely new behavior should require an `EnemySystem` change.

## Add An Upgrade

1. Add its ID to `UpgradeId`.
2. Add a definition in `data/upgrades.ts`.
3. Choose `weapon`, `weapon-level`, `weapon-upgrade`, `weapon-evolution`, `stat`, or `curse`.
4. Prefer typed `StatModifier` or `WeaponModifier` effects.
5. Add a `WeaponUpgradeEffectId` and handler in `WeaponUpgradeEffectSystem` before declaring a runtime `weaponEffect`.
6. Add `curse` metadata only for authored cursed rewards; generated cursed variants should stay in `CursedRewardMutationSystem`.

## Add A Status Effect

1. Add its ID to `StatusEffectId`.
2. Add its definition in `data/statusEffects.ts`.
3. Add or update pure stacking/timing rules in `statusEffectRules.ts`.
4. Apply it through `StatusEffectSystem` from the focused weapon, enemy, boss, artifact, or talent system that owns the trigger.
5. Add focused tests for stacking, expiry, and any content trigger that applies it.

## Add An Artifact

1. Add its typed ID and definition in `data/artifacts.ts`.
2. Use stat or weapon modifiers for baseline values.
3. Add an `ArtifactEffectId` and handler in `ArtifactEffectSystem` before declaring a runtime `effect`.
4. Add a typed special-effect handler before declaring a structural `special`.
5. Assign an existing pool tier and verify locked tiers remain filtered.
6. Let the mutation layer create ordinary cursed variants unless the artifact needs a hand-authored cursed identity.

## Add A Talent Node

1. Add its path/slug-backed definition in `data/talentTree.ts`.
2. Prefer `StatModifier` or `WeaponModifier` for small and medium nodes.
3. Add a `TalentEffectId` and handler in `TalentEffectHandlers` before declaring a major non-stat effect.
4. Give deep nodes a `pathPointsRequired` value and concrete prerequisites.
5. Use `choiceGroup` only for mutually exclusive alternatives.
6. Add or update focused `TalentTreeSystem` tests when changing point rules, prerequisites, or effects.

## Add A Character

1. Add its typed ID and definition in `data/characters.ts`.
2. Add or reuse a stable manifest asset ID and its collision/attachment metadata.
3. Add default migrated run stats in `SaveSystem`.
4. Add and test its unlock condition.

## Add A Weapon

1. Add its ID and definition, base stats, behavior, and level growth in `data/weapons.ts`.
2. Reuse an existing behavior or add its focused firing method in `WeaponSystem`.
3. Assign stable manifest icon/projectile IDs and a semantic gameplay-effect
   sequence when authored presentation is needed.
4. Add a categorized weapon unlock definition.
5. Add level, evolution, focused-upgrade, balance-preset, and cadence coverage when the weapon introduces a new role.

Weapon behavior is the one content area that intentionally uses strategies in code because projectile, radial, and delayed-area attacks have different runtime needs.

## Assets

`data/assets.ts` exports `ASSET_MANIFEST`, `VISUAL_ASSET_MANIFEST`, and
`AUDIO_ASSET_MANIFEST`; this is the only preload inventory. Every visual definition carries
a stable ID, explicit Vite file import when a source exists, category/use,
dimensions and frames, animation, origin/scale/depth, mirror/tint rules, collision,
attachments, exact named runtime display contracts, requirement status,
provenance, fallback, and optional production specification. Audio entries use
the same stable-ID boundary, declare their canonical owner-delivery path, and
retain a procedural development fallback when no source file is installed.

`PreloadScene` iterates resolved file entries, while primitive fallbacks are
created under the requested stable key. `AssetResolver` follows asset-reference
fallbacks without leaking the substitute ID to gameplay and converts normalized
attachment metadata to world coordinates with flip/rotation support. Validation
reports duplicate IDs, missing files, invalid dimensions/frame ranges/animation,
invalid collision/origins, absent required attachments, unknown fallbacks, and
fallback cycles. Diagnostics are sorted and emitted once.

Development and production load the same explicitly imported source files, so
Vite copies only registered art reachable from the playable slice. A missing
fallback preserves developer playability; it does not satisfy a required final-art
task.

### Add Or Replace An Asset

1. Choose the owner-facing name and themed prompt in
   `docs/ASSET_PRODUCTION_BACKLOG.md`, then read the matching technical production
   spec in `src/game/data/assets.ts`. Start with a guide under `assets/templates/`
   when available.
2. Create the final owner asset at the manifest's registered target path.
   Technical guides are templates only; do not introduce generated/downloaded AI
   artwork.
3. Update the existing manifest entry's explicit import and metadata, or add one
   new stable ID before content references it. For a primitive/alias production
   row, add the imported `{ filePath, url }` as its `source`; keep the stable ID
   and fallback in place.
4. Keep attachment names stable so weapons/effects continue to resolve their
   source and target points.
5. Regenerate the creative checklist, run `npm run validate:content`, and inspect
   the asset in Content Lab before the normal typecheck/test/build/smoke gates.

### Add Or Replace A Gameplay Effect

1. Export Runtime JSON to `vfx/effects/<stable-id>.vvfx-runtime.json`.
2. Map that raw ID to a typed semantic sequence role in
   `GameplayEffectRegistry.ts`; declare placement, depth, timing, Beam fitting,
   and fallback there.
3. Reference only the semantic sequence in gameplay data/code.
4. Validate Beam/dependency contracts, then inspect playback, repetition,
   attachment updates, and cleanup in Content Lab.
5. Add focused deterministic tests for any new target, timing, cancellation, or
   damage rule. Do not place those gameplay rules inside the visual registry.
