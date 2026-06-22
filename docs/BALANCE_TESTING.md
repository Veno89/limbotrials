# Balance Testing

## Purpose

The balance system turns play sessions into comparable evidence. It records outcomes without changing combat rules and keeps the latest completed report in a separate local-storage entry.

## Recorded Data

- Per-weapon damage, active-time DPS, hits, critical hits, kills, and boss damage
- Incoming attempted, landed, avoided, absorbed, and actual damage by exact source
- Enemy spawns, kills, and average lifetime
- Upgrade offers, selections, rerolls, skips, curses, and preset-applied upgrades
- Dashes, perfect dodges, healing, shrine use, powerup spawns, and powerup collections
- Authored events, boss attacks, elite/boss kill times, level-up times, and death source
- Threat tier transitions with time threat, power threat, and active health/damage multipliers
- One-minute buckets for damage, pressure, health lows, spawns, kills, levels, souls, and choices

## Standard Playtest Protocol

1. Begin a normal trial and play without development shortcuts.
2. Record the build goal before the run.
3. Finish or abandon the run normally.
4. Open **Balance Report** on the result screen.
5. Review all four tabs and copy the JSON when comparing multiple runs.
6. Change one balance variable at a time before repeating the test.

Completed uploaded run summaries are retained in Supabase for comparison. The old
local **Last Balance Report** menu screen has been retired.

## Standard Run Targets

- Warden entrance: `14:00`
- Frequent progression is intentional; roughly `35-50` meaningful decisions before the Warden is acceptable if late offers remain engaging and threat escalation keeps pace
- Ambient population targets: approximately `32` early, rising to a maximum ambient cap of `160`
- Opening fodder should coexist with stronger replacements from `4:00-10:00`, then disappear from ambient pools
- Specialist ceilings: no more than `7` ambient Void Casters or `4` ambient Screamers
- Approximate progression checkpoints: level `5` by `1:00`, level `10` by `3:00`, level `15` by `7:00`, and level `20+` before the Warden
- Weapon-targeted choices should visibly advance that weapon; level-six weapons should present an evolution option on the next standard offer
- Random powerups begin after `1:00` and cannot spawn more often than every `1:30`; elite powerups remain guaranteed
- Ground soul-remnant objects: maximum `90`; excess rewards consolidate into existing remnants
- Active reliquaries: maximum `2`; first spawn `25-35` seconds; later interval `65-85` seconds; lifetime `60` seconds
- Active enemy ground hazards: maximum `30`
- Active threat tier: maximum `10`; time is the minimum tier and player progression may only push it upward

These are comparison targets, not guaranteed outcomes. Record deviations across multiple builds before changing values.

## Development Tools

- `F1`: Scythe Evolution Lab
- `F2`: Projectile Evolution Lab
- `F3`: Curse Pressure Lab
- `F4`: Warden Endgame Lab
- `F5`: Restart as a standard run
- `F6`: New Enemy and Weapon Lab
- `F7`: Crimson Orbit Lab
- `F8`: Toggle live balance telemetry
- `F9`: Weapon Identity Lab
- `F10`: Upgrade Effects Lab
- `H`: Spawn a reliquary immediately
- `Y`: Open the nearest reliquary immediately
- `G`: Grant a shield immediately
- `U`: Grant Grave Frenzy immediately
- `O`: End the current run and open results quickly
- `` ` `` or `F12`: Open local Dev Mode. The Weapons tab adds a selected weapon, advances individual levels or directly to level six, applies its evolution, and exposes its focused upgrades; Advanced, Artifacts, and Spawns retain exact content tools.

Preset scenarios use fixed builds, run clocks, enemy groups, and spawn positions. Their authored enemy groups continuously replenish toward fixed target populations so damage output can be measured under sustained pressure. Ambient waves and authored run events are disabled during presets, and preset rewards never affect permanent save progression.

The Dev Mode overlay is Vite-dev-only. Its preferences are stored in browser
localStorage, while optional scratch preset files matching `dev-mode*.local.json`
are ignored by git.

## Report Tabs

- **Overview:** run totals, incoming damage sources, powerups, and enemy survival
- **Weapons:** direct comparison of weapon output and boss contribution
- **Pressure:** one-minute pacing buckets and health-pressure lows
- **Choices:** upgrade decision history and important run timeline events

## Initial Review Targets

- Do not reduce weapon power until standard-run survival data shows the baseline is reliably achievable; first lift clear underperformers and compare again.
- No single weapon should dominate comparable builds without a clear opportunity cost once the survival baseline is healthy.
- Evolutions should create a visible power spike without trivializing the Warden.
- Incoming damage should come from readable threats rather than mostly contact overlap.
- Late-run enemy lifetime should remain short enough to avoid health-sponge pressure.
- Late-run reports should show the new roster replacing Lost Souls and Bone Crawlers, plus both elite types across repeated runs.
- Curse benefits should noticeably alter output while their drawback remains relevant.
- The player should reach meaningful choices throughout the run rather than front-loading the entire build.

## Expansion Test Protocols

### Artifacts And Chests

1. Record chest spawn and expiry times for five full runs.
2. Confirm no more than two chests coexist and no duplicate artifact appears in one run.
3. Confirm the direction/distance/countdown tracker leads to every spawned reliquary and the first spawn is noticed.
4. Confirm the labeled artifact row and every acquired-artifact tooltip remain usable during combat.
5. Walk into reliquaries under low and high pressure; confirm the soul-lock burst, curved reward travel, and receipt are visible without obscuring threats or interrupting movement.
6. Compare common, uncommon, rare, and legendary frequency across at least 100 rolls.
7. Verify locked artifact tiers never appear before their milestones.
8. Compare artifact-heavy damage and survival against a no-chest reference run.

### Characters

1. Complete comparable standard runs with Haunted, The Penitent, and Ashwalker.
2. Compare time survived, incoming damage, movement safety, and weapon contribution.
3. Verify starter weapons and base stat differences immediately after spawn.
4. Verify Penitent and Ashwalker unlock progress and post-run notices.

### Hazard Readability

1. Test Plague Crawler, Ember Imp, and Grave Defiler in mixed late-run pressure.
2. Confirm every damaging ground zone has a red danger rim and remains dodgeable.
3. Confirm enemy projectiles remain distinguishable from player projectiles at high density.
4. Confirm elite charge telegraphs are red and the elite traverses the complete marked route.

### Player Status Feedback

1. Verify any positive shield value shows a ring and exact absorption value, then disappears when depleted.
2. Verify Grave Frenzy announces its bonuses and shows a draining bar beneath the player for its full duration.
3. Verify Mending Soul and Soul Vacuum announce the concrete effect received on collection.
4. Confirm reliquaries remain compact throughout their pulse animation.
5. Confirm reliquaries have no persistent circle beneath them.
6. Confirm reliquaries have no floating world label and their compact compass line has no background window.

### Haunted Directional Hover

1. Move Haunted continuously in all four cardinal directions.
2. Confirm each direction uses the correct stable front, back, left, or right frame.
3. Confirm the complete sword remains readable and does not appear to pass through or behind the character.
4. Confirm the hover reads as intentional and does not resemble a limp or broken walk cycle.
5. Review the `haunted-hover-right` and `haunted-hover-back` smoke captures.
6. Confirm the character remains centered over pickups, shield visuals, attacks, and incoming hits.
7. Confirm damage tint, dash movement, collision, and weapon origins still use the unchanged gameplay body.

### Adaptive Threat And Warden Rebuild

1. Compare runs that reach the same clock time at meaningfully different player levels and weapon progression.
2. Confirm time establishes the minimum threat and stronger builds can only push threat upward within documented bounds.
3. Confirm threat changes are recorded in telemetry and do not repeatedly mutate enemies already alive.
4. Confirm fast progression still feels rewarding: strong builds clear efficiently, but positioning and dodging remain relevant.
5. Confirm the Warden survives approximately `75-150` seconds against representative completed standard builds.
6. Confirm each successful Warden fight exposes several distinct attacks and requires active movement.
7. Confirm large area attacks and shattering fragments have readable telegraphs, safe routes, and player-distinct colors.
8. Confirm normal enemies plus boss attacks remain demanding without becoming visually unreadable.
9. Use the Warden Endgame Lab and inspect `warden-rebuild.png` to verify a real boss attack frame was captured rather than a menu or result screen.

### Weapon Cadence And Upgrade Identity

1. Compare damage, active-time DPS, boss contribution, and subjective readability for every weapon.
2. Confirm slower weapons feel materially more powerful per cast than faster weapons.
3. Confirm Dirge Staff remains strong per cast after its cooldown increases.
4. Confirm evolved Bloodletter Axe uses a bounded Crimson Orbit and does not obscure incoming danger.
5. Confirm projectile-count and area upgrades appear only for weapons that meaningfully support them.
6. Confirm late-run offers contain behavior changes and tradeoffs rather than mostly generic stats.
7. Confirm XP-gain upgrades clearly communicate and trigger faster bounded threat escalation.
8. Confirm unused focused upgrades pause at level six, return after evolution, and apply without advancing beyond level seven.

For Crimson Orbit, inspect `crimson-orbit.png` and `crimson-orbit-stats.png`.
Confirm all five fully invested axes remain visible against the arena floor, orbit
close enough to require positional play, repeatedly record Bloodletter hits, and
preserve incoming enemy and Warden telegraphs. The F7 preset now evolves Bloodletter
before applying both projectile-count stacks, proving focused specialization works
after evolution. In the New Enemy and Weapon Lab, confirm Headsman's Procession
launches multiple returning axes in a controlled fan.

For the first cadence pass, confirm Soul Bolt reads as frequent low-impact fire
while Hellfire Sigil, Grave Lance, and Dirge Staff have clearly visible downtime
and noticeably stronger individual actions. Compare total output only after their
different target profiles and opportunity costs are visible in play.

For the completed existing-weapon pass, use F9 and inspect
`weapon-identity-lab.png`, `weapon-identity-stats.png`, and the
`weapon-identity-0.png` through `weapon-identity-6.png` sequence. Confirm Bone
Scythe's committed sweep, the dense but smaller Fractured Choir burst, Cinder
Reliquary's large six-second Funeral Furnace pulse, and Ashen Longbow's fixed
three-arrow Full Draw remain visually distinct under mixed pressure.

For the authored upgrade-effects pass, use F10 and inspect
`upgrade-effects-lab.png`, `upgrade-effects-threat.png`,
`upgrade-effects-stats.png`, and the `upgrade-effects-0.png` through
`upgrade-effects-5.png` sequence. Confirm Soul Bolt lashes no more than two nearby
unhit targets, Hellfire creates two readable delayed side blasts, Dirge echoes are
smaller and delayed, and Forbidden Tutelage shows `XP GAIN x1.44` plus
`THREAT POWER +14`. The live overlay should show power threat above the preset's
time threat.

Automated reports expose patterns, but final tuning still requires repeated human play sessions.
