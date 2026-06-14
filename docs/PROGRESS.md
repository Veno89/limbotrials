# Progress

## Completed

- Created the Phaser 4.1 browser project from the original asset-only workspace.
- Integrated supplied menu, player, enemy, boss, projectile, item, floor, prop, and light-source art.
- Implemented a complete start-run-to-death-or-victory loop.
- Added nine weapons, categorized progression definitions, ten regular enemies, two elites, and one boss.
- Added run rewards, versioned local save data, and three permanent upgrades.
- Added strict type checking, linting, 118 automated tests, production build, and a Chrome smoke test.
- Added save-backed feedback and volume settings plus procedural placeholder audio.
- Added spatial-hash enemy separation and a phased Warden soul-prison attack.
- Reduced the production build from roughly 106 MB to roughly 22 MB by shipping only referenced art.
- Expanded browser smoke coverage across the menu, settings screen, and boss arena.
- Added a repeatable development-only 200-enemy stress spawn and browser FPS sample.
- Improved relic cards with rank context, rarity treatment, and `1`/`2`/`3` keyboard selection.
- Added visible Bone Scythe sweeps and Hellfire Sigil telegraphs.
- Added an adaptive action bar that creates, removes, and re-centers weapon slots with live cooldown overlays.
- Changed the starting weapon to Bone Scythe and added a clearer multi-blade spectral sweep.
- Added Grave Lance, Wailing Shards, and Cinder Reliquary for six total weapons.
- Added Ashen Longbow, Bloodletter Axe, and Dirge Staff with distinct volley, returning, and multi-target behaviors.
- Added a reusable live stats dropdown for gameplay and upgrade decisions.
- Rebuilt level-up progression into Weapons, Weapon Levels, Weapon Upgrades, and Stats.
- Added per-weapon levels/stats, early weapon-offer weighting, and a five-weapon loadout cap.
- Added three movement-changing enemy behaviors and authored encounter beats.
- Added explicit level-seven evolution choices, loadout synergies, and per-weapon result statistics.
- Added separate curse events, rerolls, skip rewards, rare powerups, and a blood shrine.
- Added perfect-dodge cooldown rewards and a third Warden attack with timed escalation.
- Added a reroll-focused permanent unlock and upgraded save data to version 3.
- Added source-aware balance telemetry, one-minute pressure buckets, and exact upgrade-choice history.
- Added eight focused balance presets, a live development overlay, persistent multi-tab reports, and JSON export.
- Reworked waves around bounded target populations and batched replenishment, with continuously replenishing balance presets.
- Extended the standard trial to fifteen minutes with role-capped ambient sessions, nine authored encounter beats, a fourteen-minute Warden entrance, lower normal-enemy XP, and bounded pickup consolidation.
- Reworked weapon-targeted upgrades to advance weapon levels, guaranteed evolution choices for level-six weapons, adjusted the XP curve, bounded random powerups with cooldowns, reduced fodder contact damage, smoothed pressure tiers, and fixed pressure sampling after scene restarts.
- Added phased enemy replacement, five new enemy definitions, a second elite, archer/stalker behaviors, varied late-run encounters, and explicit Warden-spawn telemetry.
- Added expansion feature flags, shared balance limits, reusable stat clamping, and typed artifact special-effect handlers.
- Added red enemy projectile/telegraph language, capped active hazards, and distinct Plague Crawler, Ember Imp, and Grave Defiler visuals.
- Completed run-only artifacts and chests with tier filtering, weighted no-duplicate rewards, save-backed unlocks, and an artifact HUD.
- Added Haunted, The Penitent, and Ashwalker with character selection, stat profiles, starter weapons, unlock tracking, and result notices.
- Upgraded save data to version 5 with safe defaults for character and artifact progression.
- Made reliquaries discoverable with a nearby spawn ring, world label, spawn warning, and direction/distance/countdown tracker.
- Labeled the artifact HUD, fixed its hover targets and tooltip bounds, removed HUD-clipping gameplay zoom, and restrained repeated screen shake and warning overlap.
- Extended pre-evolution weapon progression to level six, advanced evolutions to level seven, and lifted Bone Scythe baseline and evolved follow-up damage without nerfing any weapon.
- Added player-following shield feedback, generic timed-buff duration bars, explicit powerup pickup explanations, and a compact relative-scale reliquary pulse.
- Added a dedicated transparent reliquary chest asset and a non-modal walk-in loot ritual with soul-lock fragments, curved reward travel, and a player-side receipt.
- Removed the reliquary's persistent circle and added an experimental high-definition Haunted walk sheet with four directions, three stride poses per direction, and a presentation-only animation controller.
- Replaced the first Haunted sheet after playtest feedback exposed near-static limbs; the stricter replacement uses opposite contact strides, raised-knee passing poses, visible arm changes, and sequential smoke captures.
- Rejected the generated walk cycles after further review exposed repeated poses, limping cadence, and inconsistent sword occlusion; Haunted now uses stable directional frames with an intentional spectral hover.
- Unified run-bound scheduling around active run time for reliquaries, shield refresh, temporary buffs, powerups, encounters, elites, and boss entrance.
- Added bounded time-and-player-power threat tiers, spawn-time non-boss health and damage scaling, live threat display, and tier-transition telemetry.
- Rebuilt the Limbo Warden with 120,000 base health, readable phase transitions, phase-aware attack selection, and Shattered Judgment, Cathedral Rupture, and Condemned Star alongside its original three attacks.
- Replaced Bloodletter Axe's evolved return behavior with Crimson Orbit, then strengthened it to three-to-five continuous axes with bounded count, radius, size, rotation, and repeated-hit cadence.
- Added a dedicated Crimson Orbit balance lab, continuous-orbit stats presentation, focused rule tests, and browser captures for the evolution and its live build details.
- Corrected elite charges to traverse their full red telegraphed route and corrected unevolved Bloodletter Axe to complete its maximum-range outbound throw before returning.
- Removed the reliquary's floating world label and replaced its boxed objective window with a compact compass, distance, and timer line.
- Applied the first existing-weapon cadence pass: faster Soul Bolt fire and slower, substantially heavier Hellfire Sigil, Grave Lance, and Dirge Staff attacks.
- Completed the existing-weapon cadence pass with a dependable Bone Scythe, denser Wailing Shards, a very slow large Cinder Reliquary pulse, and a deliberate fixed-count Ashen Longbow volley.
- Added the first behavior-changing upgrade family: four rare one-stack cadence tradeoffs that exchange higher impact or projectile density for longer downtime, with max stacks enforced by `RunState`.
- Added the F9 Weapon Identity Lab, stats and full-cadence browser captures, and focused cadence, preset, and upgrade-rule coverage.
- Added typed authored upgrade effects: Soul Bolt splinters into nearby souls, Hellfire spreads into delayed side blasts, and Dirge judgments leave delayed echoes.
- Added Forbidden Tutelage with visible XP gain and explicit bounded threat-power cost, plus the F10 Upgrade Effects Lab and deterministic effect-rule coverage.
- Added Headsman's Procession so Bloodletter projectile count creates multiple returning throws and strengthens Crimson Orbit from three baseline axes up to five with wider bounded coverage.
- Kept unused focused weapon upgrades eligible after evolution as clearly labeled level-seven specializations, with level six reserved for explicit evolution and the F7 Crimson Orbit Lab applying axe-count stacks after evolution.
- Added a thematic Tailwind landing page, lazy game launch/return flow, public Supabase damage and kill leaderboards, and bounded server-only score submission through a Netlify Function.
- Added a non-destructive leaderboard health endpoint and conservative Netlify Function packaging after live deployment diagnostics exposed a missing function route and an uncreated Supabase leaderboard table.
- Added private Supabase run analytics, combined bounded run submissions, visible result-screen submission status, and persistent typed leaderboard names.
- Added an end-screen leaderboard-name form and idempotent run submissions so anonymous analytics can become a named public score without duplication.

## Current State

The prototype is playable and instrumented for repeatable full-run balance sessions. The fifteen-minute run now includes three playable characters, visible run-only artifact rewards from tracked reliquaries, hazard specialists, independently capped ambient roles, bounded threat escalation, nine authored encounter beats, and a six-attack, three-phase Limbo Warden encounter beginning at fourteen minutes. Content values are provisional.

The latest instrumented automated stress sample with 200 additional enemies, five active weapons, behavior enemies, balance telemetry, and Haunted's stable directional hover averaged 100.1 FPS in headless Chrome on the development machine.

## Known Issues

- The Penitent, Ashwalker, and enemy art remain single-frame concept art; Haunted has stable directional hover frames but no accepted walk cycle.
- Procedural audio is intentionally temporary and should be replaced with authored effects and music.
- New higher-density spawn targets, XP pacing, weapon values, and boss health still need repeated full-run playtesting.
- Artifact frequency, character profiles, and hazard pressure need repeated full-run playtesting.
- Standard-run survivability, the longer pre-evolution curve, and the completed cadence targets need repeated human playtesting before broad weapon power reductions.
- Threat health and damage scaling, elite pressure, and the rebuilt Warden's target fight duration need repeated completed-build playtesting.
- The Phaser engine bundle triggers Vite's large-chunk warning.
- Visual effect object pooling is not implemented yet; effects are intentionally modest.
- Profile each future directional sheet before expanding the animation approach to other characters.

## Next Recommended Task

Expand the next conditional upgrade family around movement, dashes, shields, and elite hunting, then continue the planned five-weapon batch individually after the offer pool remains consistently meaningful.
