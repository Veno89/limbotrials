# Roadmap

## Active Next Milestone

The next combat direction is specified in `docs/NEXT_COMBAT_EXPANSION.md`.

- [x] Fix run-clock inconsistencies, beginning with reliquary timing
- [x] Add bounded time-and-player-power threat escalation without slowing progression
- [x] Rebuild the Warden around a 120,000 HP first target and several active-dodge attacks
- [x] Replace the evolved Bloodletter Axe behavior with Crimson Orbit
- [x] Resolve elite-charge distance/color, Bloodletter outbound range, and reliquary presentation feedback
- [x] Establish distinct cadence, power, strength, and weakness targets for all existing weapons
- [x] Add the core curse, cursed reward mutation, curse-gated spawn pressure, and Death Echo foundation
- [x] Add first meaningful weapon and risk/reward upgrade families: cadence tradeoffs, authored weapon effects, post-evolution specializations, axe-count scaling, and XP/threat risk
- [x] Add the first conditional upgrade families around movement, dashes, shields, elite hunting, and curse/Echo interaction
- [x] Add visible curse escalation, curse surge events, curse-specific enemy stat pressure, and first Cinder Reliquary containment tuning
- [x] Start the build-defining artifact pass with lower reliquary frequency and typed runtime effects for every redesigned regular stat relic
- [x] Add handmade XP/Wailing Shards asset swaps and the first bleed/poison status-effect foundation with a Bone Scythe bleed upgrade
- [x] Add save-backed Journal discovery UI and local-only dev test overlay
- [ ] Use uploaded Supabase run data to tune curse pressure, conditional upgrades, Warden duration, and Cinder containment while expanding the weapon roster in small chunks
- [x] Add first additional weapon: Poison Flask with lobbed impact, acid pools, and poison-applying evolution
- [x] Add the first timed Blood Market event with HP purchases and shop-exclusive rewards
- [ ] Add four additional weapons individually, each with a unique evolution
- [ ] Follow with unique artifact assets, deeper artifact families, NG+ Lite with optional Torments, and later distinct bosses

## Phase 1: Playable Foundation

- [x] Phaser 4, Vite, strict TypeScript, ESLint, Vitest
- [x] Preload, main menu, arena, movement, camera, and dash
- [x] Enemy spawning, pursuit, health, contact damage, and death
- [x] Auto-fire, soul drops, XP, level-up choices, and game over
- [x] Focused systems and typed data files
- [x] Accurate project documentation

## Phase 2: Content And Feel

- [x] Three weapons
- [x] Ten or more categorized upgrades
- [x] Four regular enemy types
- [x] Timed wave scaling and elite enemy
- [x] Phased enemy replacement, specialist behaviors, and varied elite pools
- [x] HUD and core impact feedback
- [x] Adaptive weapon action bar with cooldowns
- [x] Categorized weapon/level/upgrade/stat progression
- [x] Five-weapon cap and early weapon-offer weighting
- [x] Ten thematic weapons with per-weapon levels
- [x] Versioned local save and simple permanent progression
- [ ] Balance pass based on real play sessions
- [ ] Replace selected concept sprites with animation-ready sheets
- [x] Add enemy separation
- [ ] Tune spawn pressure through full-run play sessions

## Phase 3: Boss And Run Completion

- [x] Limbo Warden entrance warning
- [x] Pursuit, telegraphed shockwave, and summons
- [x] Victory screen, run rewards, and permanent-upgrade spending
- [x] Placeholder sound effects and music hooks
- [x] Settings screen for feedback and volume
- [x] More boss attack variation and phase tuning

## Phase 4: Vertical Slice Polish

- [x] Onboarding/tutorial prompts
- [ ] Replace concept sprites with animation-ready enemy sheets
- [x] Improved attack effects
- [x] Upgrade-card icon and layout polish
- [x] Player-facing content journal with hidden undiscovered entries
- [x] Local-only dev mode for invincibility, exact content grants, enemy spawning, and target dummies
- [x] Compact vertical Main/Pause menus, larger XP globes, animated Soul Vacuum suction, and weapon-centric dev progression controls
- [x] Performance profiling at 150-300 enemies
- [x] Asset build optimization; do not copy unused source art
- [ ] Controller support
- [x] Browser/itch.io release checklist
- [ ] Desktop/Steam packaging investigation

## Phase 5: Gameplay Depth

- [x] Brute charge, ranged Void Caster, and Screamer danger-zone behaviors
- [x] Gravebound Archer ranged pressure and Veil Stalker lunge behavior
- [x] Authored encounter beats and guaranteed elite power rewards
- [x] Explicit level-seven evolution choices for the original nine weapons and Poison Flask
- [x] Loadout synergies with visible HUD callouts
- [x] Separate risk/reward curse event pool
- [x] Run-level curse tiers, cursed reward mutation, curse-gated enemies, and a first Death Echo return
- [x] Upgrade reroll and skip-for-souls controls
- [x] Perfect-dodge cooldown reward
- [x] Rare healing, soul-vacuum, and temporary frenzy drops
- [x] One-use blood shrine arena interaction
- [x] Third Warden attack, timed phase escalation, and earlier boss entrance
- [x] Per-weapon damage and kill results
- [x] Reroll-focused legacy unlock

## Phase 6: Balance And Accessibility

- [x] Add source-aware balance telemetry and one-minute pressure buckets
- [x] Add detailed balance reports and Supabase run-analytics persistence
- [x] Add focused data-defined balance presets and live telemetry overlay
- [ ] Complete repeated full-run balance sessions with varied loadouts
- [ ] Tune curse risk, evolution power, elite rewards, and powerup frequency through repeated full-run sessions
- [ ] Add reduced-effects and high-contrast telegraph options
- [ ] Add controller support and controller glyphs
- [ ] Add optional challenge modifiers after the baseline run is proven fun

## Expansion Milestone: Replay Variety

- [x] Phase 0 safety rails: feature flags, central balance limits, stat utilities, typed special effects
- [x] Phase 1 readability and enemy variety: red danger language, capped hazards, three specialist enemies
- [x] Phase 2 artifacts and chests: run-only rewards, tier unlocks, artifact HUD
- [x] Phase 3 characters V1: three characters, selection scene, stat profiles, unlock tracking
- [x] Reliquary discoverability, labeled artifact tooltips, shake-safe HUD bounds, and longer pre-evolution weapon progression
- [ ] Phase 4 dual-evolution prototype; Crimson Orbit exists as Bloodletter Axe's current capstone, but alternate evolution paths and selection are still pending
- [ ] Phase 5 arena buildings V1
- [x] Phase 6 talent tree V1 foundation: large character trees, legacy-soul point track, save wipe, allocation rules, and first playable UI
- [ ] Phase 7 New Game+ Lite

## Explicitly Later

No multiplayer, backend, accounts, procedural rooms, crafting, inventory grid, full campaign, Steamworks, modding, or hub-building expansion until the arena loop is proven fun.
