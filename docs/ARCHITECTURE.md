# Architecture

## Responsibilities

```text
src/game/
  config/     Feature switches and shared balance limits
  data/       Typed content declarations: enemies, weapons, upgrades, waves, meta upgrades
  scenes/     Scene flow and high-level orchestration
  systems/    Focused gameplay and pure-logic systems
  tests/      Vitest coverage for pure rules
  types/      Shared game contracts
  ui/         Reusable UI helpers and HUD
  utils/      Shared pure modifier and clamping utilities
```

`GameScene` owns the run lifecycle and composes focused systems. It does not contain weapon, movement, spawn, pickup, save, damage, or HUD implementation details.

## Runtime Systems

- `RunState`: mutable state for one trial, active elapsed run time, equipped weapons, per-weapon levels/stats, applied progression, and the current threat snapshot.
- `BalanceTelemetry`: pure event aggregation and one-minute balance reporting.
- `BalancePresetSystem`: applies data-defined focused test scenarios.
- `BalanceReportStore`: persists only the latest completed report outside permanent progression.
- `DebugControlsSystem`: development shortcuts and live-overlay coordination.
- `PlayerMovementSystem`: keyboard movement and dash timing.
- `PlayerVisualSystem`: optional character-specific directional presentation layered over the unchanged physics body.
- `EnemySpawnSystem`: phased role-based spawn sessions, ambient population cap, weighted elite pools, and boss timing.
- `RunEventSystem`: authored one-off formations and encounter beats independent from ambient population targets.
- `EnemySystem`: enemy instances, movement coordination, contact damage, health, and spawn-time threat scaling.
- `EnemyAbilitySystem`: telegraphed brute charges, caster/archer projectiles, stalker lunges, screamer danger zones, and threat-scaled ability damage.
- `ChestSystem`: bounded player-relative reliquary spawning, proximity opening, objective data, and despawn behavior.
- `LootRevealSystem`: non-modal soul-lock burst, curved reward travel, and player-side loot receipt after a reliquary opens.
- `BossAttackSystem`: the Warden's six telegraphed attack patterns and focused boss-only telegraph, lane, and hazard helpers.
- `WeaponSystem`: weapon cooldowns and data-driven behavior dispatch for nine weapons.
- `WeaponEvolutionSystem`: level-seven capstone effects.
- `WeaponUpgradeEffectSystem`: three focused authored pre-evolution effects for projectile splintering, spreading area blasts, and delayed judgment echoes.
- `CrimsonOrbitSystem`: focused persistent runtime controller for evolved Bloodletter Axe positioning and repeated collision checks.
- `WeaponSynergySystem`: cached loadout-pair bonuses.
- `PickupSystem`: soul drops, bounded pickup consolidation, magnet movement, and collection.
- `PowerupSystem`: cooldown-bounded random healing, vacuum, and temporary frenzy drops plus guaranteed elite drops.
- `UpgradeOfferSystem`: queued standard/curse choices, rerolls, and skip rewards.
- `ArenaShrineSystem`: proximity interaction for the arena's blood shrine.
- `JuiceSystem`: visual feedback hooks, warning replacement, and throttled screen shake.
- `AudioSystem`: shared procedural placeholder tones and ambient audio.
- `EnemySeparationSystem`: local spatial-hash crowd repulsion.
- `HudSystem`: fixed-camera run information.
- `ArtifactBar`: acquired-artifact icons, rarity frames, and tooltips.
- `ChestObjectiveHud`: direction, distance, and remaining lifetime for the nearest active reliquary.
- `PlayerStatusVisualSystem`: player-following shield state and generic timed-powerup duration bars.

The reliquary uses the dedicated transparent asset at `assets/sprites/items/reliquary_chest.png`. General armor and artifact icons continue using their existing item textures; the reliquary texture key is not reused as a generic icon.

Haunted's directional source sheet lives at `assets/sprites/playersprites/Haunted_walk_sheet.png`. `PlayerVisualSystem` currently selects one stable, sword-readable front, back, left, or right frame and applies a restrained spectral hover while the original physics image remains the authoritative collision and targeting object.

Generated walk cycles are not integrated unless every adjacent pose has a meaningfully different limb silhouette, opposite steps are symmetric, and the complete weapon remains readable in every frame. The rejected generated sheets relied on repeated poses, produced a limp, and allowed inconsistent sword occlusion.
- `WeaponActionBar`: data-driven equipped-weapon slots and cooldown presentation.
- `StatsPanel`: reusable live global/per-weapon build dropdown shared by gameplay and upgrade scenes.
- `BalanceDebugOverlay`: development-only live sample metrics.
- `SaveSystem`: versioned storage, defaults, purchases, run-history recording, and unlock migration.
- `SpecialEffectHandlers`: typed registry for the small number of artifact effects that cannot be expressed as modifiers.

## Runtime Clocks

`RunState.elapsedMs` is the authoritative active run clock. Run progression,
reliquary scheduling and expiry, random powerups, temporary buffs, shield refresh,
encounters, elites, and boss entrance use it so upgrade and pause scenes do not
advance gameplay.

Phaser scene time remains appropriate for frame-level combat cooldowns, projectile
lifetimes, telegraph resolution, and presentation callbacks because those systems
are internally scene-bound and pause with the scene.

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

`systems/enemyAbilityRules.ts` owns the authored elite-charge distance, duration,
and derived movement multiplier so the red telegraph and actual charge cannot drift
apart. `systems/weaponRules.ts` similarly derives Bloodletter Axe's outbound and
lifetime timing from its current range and projectile speed.

## Stat Modifier Stacking Order

Run stats are applied in this order:

1. Base player stats
2. Character stat overrides
3. Permanent legacy modifiers
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
- `data/powerups.ts`: powerup presentation, pickup explanations, and optional timed-effect duration

Artifacts may declare `special` only when its ID exists in `SpecialEffectHandlers`. Tooltip-only special effects are not allowed.

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

XP-risk upgrades use the normal typed stat-modifier path. `xpGain` changes collected
run XP, while `threatPowerBonus` contributes directly to the bounded power score in
`threatRules.ts`; it does not bypass the threat cap or mutate existing enemies.

## Website And Leaderboard

`src/main.ts` owns the website shell and lazy-loads Phaser only after the visitor
starts the game. `site/landingPage.ts` owns the static marketing page composition,
while `site/leaderboardPanel.ts` owns leaderboard rendering and interaction.

The public browser client reads `leaderboard_entries` through Supabase using the
publishable key. Completed standard runs submit through the bounded
`netlify/functions/submit-score.ts` endpoint, which owns the server-only secret key.
Pure score limits and parsing live in `leaderboard/scoreSubmissionRules.ts` so the
function boundary remains deterministic and tested.

## Add An Enemy

1. Add its ID to `EnemyId`.
2. Add a definition in `data/enemies.ts`.
3. Preload its texture in `PreloadScene`.
4. Add the ID to the desired role session in `data/waves.ts`.
5. Add it to an authored event or weighted elite pool when it should headline a specific run phase.

Only genuinely new behavior should require an `EnemySystem` change.

## Add An Upgrade

1. Add its ID to `UpgradeId`.
2. Add a definition in `data/upgrades.ts`.
3. Choose `weapon`, `weapon-level`, `weapon-upgrade`, `weapon-evolution`, `stat`, or `curse`.
4. Prefer typed `StatModifier` or `WeaponModifier` effects.

## Add An Artifact

1. Add its typed ID and definition in `data/artifacts.ts`.
2. Prefer stat or weapon modifiers.
3. Add a typed special-effect handler before declaring a `special`.
4. Assign an existing pool tier and verify locked tiers remain filtered.

## Add A Character

1. Add its typed ID and definition in `data/characters.ts`.
2. Add its preload asset key.
3. Add default migrated run stats in `SaveSystem`.
4. Add and test its unlock condition.

## Add A Weapon

1. Add its ID and definition, base stats, behavior, and level growth in `data/weapons.ts`.
2. Reuse an existing behavior or add its focused firing method in `WeaponSystem`.
3. Add a categorized weapon unlock definition.

Weapon behavior is the one content area that intentionally uses strategies in code because projectile, radial, and delayed-area attacks have different runtime needs.

## Assets

`data/assets.ts` imports the selected supplied art as Vite asset URLs. Development and production therefore load the same files, while production copies only art referenced by the playable slice.
