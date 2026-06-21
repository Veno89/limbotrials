# Next Combat Expansion

## Purpose

This document records the combat direction agreed after the first completed standard run.

The successful run proved that the fifteen-minute structure is beatable and that fast progression can be fun. The next pass should preserve that momentum instead of slowing level gain merely to keep enemy numbers relevant.

The intended response to a powerful build is:

> Let the player become powerful, then make Limbo escalate quickly enough to demand that power.

This is the active implementation direction for combat scaling, the Warden, upgrade choices, weapon tuning, and the next weapon batch. It complements `ADDITIONS.md`; it does not replace the longer expansion roadmap.

## Evidence From The First Victory

- The player reached level `36` and made `49` upgrade choices.
- All five equipped weapons evolved before the Warden.
- The Warden died in approximately `10.9` seconds with `12,000` health.
- Ashen Longbow and Dirge Staff dealt approximately `65%` of total run damage.
- Bloodletter Axe dealt only approximately `7%` of total damage, but its current evolution felt visually and mechanically overwhelming.
- The late build was powerful enough that enemy pressure stopped meaningfully testing it.
- Reliquary timing used the scene clock rather than active run time and must be corrected before broader scaling work.

These results are from one run and do not justify indiscriminate weapon nerfs. They do justify structural changes where the behavior is already clearly undesirable.

## Locked Direction

### Preserve Fast Progression

- Do not solve late-run power by broadly reducing XP or removing upgrade choices.
- Fast leveling should remain a source of momentum and excitement.
- Add compelling choices so frequent levels remain interesting.
- When the player levels unusually quickly, enemy threat should escalate more quickly within explicit bounds.

### Escalate Threat, Not Just Population

Enemy pressure should use a hybrid threat model:

1. Run time establishes the minimum expected threat.
2. Player power can push threat above that minimum.
3. Threat changes enemy health, damage, elite pressure, and encounter intensity.
4. Threat never reduces because the player is struggling.
5. Threat scaling is bounded and visible enough to feel fair.

This is not hidden rubber-banding. A strong build should still feel strong and clear enemies quickly; escalation exists to keep positioning and dodging relevant.

### Make The Warden A Real Boss Fight

- Increase base Warden health from `12,000` to roughly `120,000` as the first test target.
- Target a successful standard-run boss duration of approximately `75-150` seconds.
- Ensure the fight exposes several attack patterns before victory.
- Require active movement and dodging rather than allowing damage output alone to end the encounter immediately.
- Preserve clear telegraphs and safe routes. More danger must not mean unreadable visual noise.

### Make Upgrades Change Play

Generic stat increases remain useful as fallback choices, but should not dominate late-run offers.

More choices should alter weapons or create strategic tradeoffs:

- additional projectile count where the behavior supports it
- larger or repeated area effects where area is meaningful
- penetration, chains, ricochets, orbiting, returning, splitting, and lingering zones
- stronger attacks with longer cooldowns
- faster attacks with reduced per-hit power
- XP gain that also accelerates bounded threat escalation
- conditional damage, defense, or utility tied to movement, dashes, shields, health, or elite kills

Every upgrade must accurately describe a mechanic that is implemented and visible.

## Phase A: Timing And Scaling Foundation

**Implementation status:** Foundation complete. Run-bound scheduling now uses active
run time, and a bounded threat rules module applies spawn-time health and damage
scaling while reporting tier transitions to balance telemetry. Elite frequency and
encounter-intensity modifiers remain future tuning work.

### Active Run Clock

Unify run-bound systems around `RunState.elapsedMs`.

Immediate audit targets:

- reliquary spawn and expiry
- random powerup timing
- shield refresh timing
- encounter events
- elite and boss timing
- any cooldown or duration intended to pause during upgrade and pause scenes

Presentation animations may continue using the scene clock. Gameplay progression must use the active run clock.

### Threat Director

Add a focused threat-scaling rules module rather than placing adaptive logic inside `GameScene` or `EnemySystem`.

Suggested responsibilities:

- calculate a bounded player-power score
- calculate the current threat tier from time and power
- expose spawn-time enemy health and damage multipliers
- expose elite-frequency and encounter-intensity modifiers
- report threat changes to balance telemetry

Suggested first inputs:

- elapsed run time
- player level
- equipped weapon count
- total weapon levels
- evolved weapon count

Do not initially score raw DPS, artifacts, or exact upgrade combinations. Those inputs would make the system harder to understand and easier to exploit.

Suggested first model:

```text
minimumThreat = time-based threat tier
powerThreat = bounded score from level and weapon progression
activeThreat = max(minimumThreat, powerThreat)
```

Enemy multipliers should be applied when enemies spawn. Avoid repeatedly mutating existing enemies whenever the player levels.

### XP Accelerator Upgrade

Add an explicit risk/reward XP upgrade family.

Example:

```text
Forbidden Tutelage
+20% XP gain.
Your power contributes more strongly to Limbo's threat escalation.
```

This lets players choose faster progression while clearly accepting a faster difficulty curve.

**Implementation status:** Forbidden Tutelage implemented. Each of its two possible
stacks grants `+20%` XP and adds `+7` explicit threat power score. XP gain and
threat power are visible in the live stats panel, and the bonus contributes through
the same bounded threat calculation as normal player progression.

## Phase B: Warden Rebuild

**Implementation status:** Core rebuild complete and runtime-verified. The Warden now
has `120,000` base health, phase transition breathing room, phase-aware non-repeating
attack selection, and six implemented attacks. Representative completed-build runs
are still required to tune the target fight duration. Warden's Procession remains a
planned seventh pattern.

### Baseline

- First health target: `120,000`
- Preserve health-based phases.
- Add phase transition feedback and a short readable transition window.
- Prevent the Warden from repeating the same attack excessively.
- Ensure every standard victory sees at least several distinct attacks.

### Attack Set

Retain and retune the existing attacks:

- **Shockwave:** expanding ring with a readable dodge window.
- **Soul Prison:** marked zones that punish remaining stationary.
- **Grave Chain:** long directional strike that demands lateral movement.

Add active-dodge attacks:

- **Shattered Judgment:** the Warden marks a large impact area, detonates it, then launches shattering fragments outward in multiple readable lanes. The initial blast and fragments are separate dodge problems.
- **Cathedral Rupture:** several large overlapping area telegraphs appear in sequence, leaving a moving safe route rather than covering the arena randomly.
- **Condemned Star:** a slow, large projectile tracks the player briefly, locks its direction, then explodes into radial shards on impact.
- **Warden's Procession:** the Warden crosses the arena in a telegraphed charge while delayed eruptions follow its path.

Implementation rule:

> New boss attacks should reuse focused projectile, telegraph, and hazard helpers where appropriate, but boss sequencing remains owned by `BossAttackSystem`.

Avoid one enormous generic attack framework.

### Boss Validation

- Warden survives long enough to expose multiple phases.
- Every major attack has a readable telegraph, impact, and recovery.
- Attacks remain dodgeable while normal enemies are present.
- The player cannot safely remain stationary for most of the fight.
- Shards and large areas remain visually distinct from player attacks.
- Boss health is tuned from repeated completed builds, not one fixed DPS assumption.

## Phase C: Existing Weapon Identity Pass

The goal is not equal damage totals. Each weapon should earn its place through a distinct cadence, target profile, or utility.

**Implementation status:** Existing-weapon cadence pass complete and runtime-verified.
Soul Bolt owns frequent low-impact fire; Hellfire, Grave Lance, Dirge Staff, Cinder
Reliquary, and Ashen Longbow have increasingly deliberate high-impact casts; Bone
Scythe provides dependable close coverage; Wailing Shards provides dense radial
safety; and Crimson Orbit owns repeated close-range positional damage. Repeated
standard-run comparison remains required for final numerical tuning.

Latest full-run data showed Cinder Reliquary reaching roughly `80%` of total damage
through stacked pulse area, Funeral Furnace, evolution aftershock, and cursed global
damage. The first containment pass reduced Cinder's base footprint, level area
growth, focused area upgrade, Funeral Furnace multiplier, and aftershock radius and
damage. Generated cursed variants now grant Cinder less direct damage and no extra
generic area while pushing more threat debt instead.

### Bloodletter Axe

**Implementation status:** Crimson Orbit strengthened after the latest standard-run
feedback. The unevolved weapon retains its outward-and-returning throw and now
supports multiple fanned returning axes through Headsman's Procession. Evolution
replaces throws with three baseline continuous axes and converts the same projectile
count investment into as many as five wider-orbiting axes. Count, radius, size,
rotation speed, and per-enemy reap cadence remain bounded; extra axes improve
coverage without multiplying the shared per-enemy hit rate.

Current issue:

- The returning evolved axe feels visually overwhelming and does not create the desired evolved identity.

Direction:

- Replace the current evolution with **Crimson Orbit**.
- On evolution, one or more executioner axes circle the player and repeatedly damage enemies they pass through.
- Orbit radius, rotation speed, hit cooldown, and axe count must be bounded.
- The orbit should create close-range positional play without obscuring incoming danger.

The unevolved axe remains a slower, heavy outward-and-returning projectile.
Projectile-count choices add additional returning axes before evolution and
additional orbiting axes afterward. Retaining the full thrown attack alongside
Crimson Orbit is deliberately deferred until the stronger three-to-five-axe orbit
has been tested; the latest run showed strong Bloodletter active-time DPS, so the
clear problem was capstone feel and coverage rather than baseline output.

### Dirge Staff

**Implementation status:** First cadence target applied at `55` base damage,
`3,000ms` cooldown, two base targets, and a slightly larger execution burst.

Direction:

- Keep its strong instant multi-target judgment identity.
- Increase its base cooldown so each cast feels deliberate and powerful.
- Preserve strong per-cast damage rather than turning it into another rapid weapon.
- Upgrades may increase target count, reduce cooldown, create delayed echoes, or enlarge execution bursts.

### Initial Cadence Targets For Other Weapons

- **Bone Scythe:** dependable close-range rhythm at `46` base damage, `1,500ms` cooldown, and `150` area.
- **Soul Bolt:** frequent low-impact seeking fire; first target applied at `18` damage and `500ms` cooldown.
- **Hellfire Sigil:** slower high-impact area denial; first target applied at `72` damage, `3,000ms` cooldown, and `148` area.
- **Grave Lance:** very slow, very powerful line attack; first target applied at `105` damage, `2,800ms` cooldown, and four penetration.
- **Wailing Shards:** medium-cadence radial safety tool at `20` base damage, `1,500ms` cooldown, and six base shards.
- **Cinder Reliquary:** very slow positional pulse at `58` base damage, `4,200ms` cooldown, and `230` area after containment tuning.
- **Ashen Longbow:** deliberate fixed three-arrow lane volley at `36` base damage and `1,900ms` cooldown; ordinary levels improve power and speed without granting free arrows.

Every weapon should have:

- an intended cadence
- a target profile
- a weakness
- upgrade axes that reinforce its identity
- an evolution that changes behavior rather than only increasing numbers

## Phase D: Upgrade Choice Expansion

**Implementation status:** Cadence tradeoffs are runtime-verified. The next focused
family is implemented with typed authored effects: Soul Bolt gains Splintering
Memory, Hellfire gains Spreading Sentence, and Dirge Staff gains Echoed Rites.
Forbidden Tutelage adds the first explicit XP/threat tradeoff. The first
conditional upgrade batch now covers moving damage, dash-window damage, shielded
offense, elite hunting, and cursed Echo/curse-gated prey. These effects use small
focused runtime systems and pure bounded rules rather than a generic scripting
language. The F10 lab is runtime-verified. Remaining focused weapon upgrades now
return after evolution as level-seven specializations, closing the first late-run
offer-quality gap. Broader offer weighting and value tuning remain open.

### Offer Quality

Upgrade offers should prioritize:

1. meaningful weapon behavior choices
2. weapon levels and evolutions
3. conditional or risk/reward character upgrades
4. generic stats as fallback choices

When a weapon cannot use an upgrade, that upgrade must not appear.

Focused weapon upgrades pause at level six so evolution remains explicit, then
return after evolution when stacks remain. They apply their modifiers or authored
effects without advancing beyond level seven, and their cards identify them as
evolved specializations rather than claiming an invalid level increase.

### New Upgrade Families

- **Projectile Count:** only for projectile, volley, or shard behaviors that support it.
- **Area:** only for attacks with a meaningful explosion, sweep, pulse, or zone.
- **Cadence Tradeoff:** increased damage and area in exchange for longer cooldown, or faster cooldown in exchange for reduced per-hit power.
- **Splitting And Shattering:** projectiles divide or create secondary fragments.
- **Echoes:** attacks repeat after a delay at reduced power.
- **Orbit And Return:** modifies traversal and repeated-hit behavior.
- **Elite Hunter:** stronger against elites and bosses, weaker against fodder or slower elsewhere.
- **Momentum:** bonuses after moving or dashing without being hit.
- **Shield Conversion:** trade shield strength or refresh timing for offensive effects.
- **Forbidden Knowledge:** increased XP gain paired with faster threat escalation.

Avoid adding a generic scripting language for upgrades. Use typed behavior flags and focused handlers only where normal stat and weapon modifiers are insufficient.

## Phase E: Five Additional Weapons

Add weapons after the existing cadence pass and upgrade-family foundation are stable. Each new weapon must ship with its own evolution, focused upgrades, telemetry, and readable visual language.

### 1. Spectral Chains

- **Base:** sweeps a chained arc toward nearby groups, damaging enemies along the curve.
- **Cadence:** medium.
- **Strength:** crowd control and clustered enemies.
- **Weakness:** poor against distant isolated targets.
- **Evolution - Procession Bindings:** chains jump between several enemies and briefly pull lesser enemies toward the final struck target.

### 2. Tombstone Hammer

- **Base:** slow ground slam that sends a short shockwave forward.
- **Cadence:** very slow.
- **Strength:** heavy impact, elites, and dense lanes.
- **Weakness:** downtime and directional commitment.
- **Evolution - Final Interment:** the impact raises delayed tombstone eruptions along the shockwave path.

### 3. Wraith Lantern

- **Base:** periodically releases a seeking wraith that persists briefly and attacks nearby enemies.
- **Cadence:** slow summon cycle.
- **Strength:** sustained pursuit and enemies outside immediate weapon range.
- **Weakness:** delayed damage and bounded summon count.
- **Evolution - Lantern Procession:** released wraiths orbit once before hunting targets, protecting the player during deployment.

### 4. Mourning Bell

- **Base:** emits a large, slow pulse that damages and briefly slows lesser enemies.
- **Cadence:** very slow.
- **Strength:** arena control and creating breathing room.
- **Weakness:** low direct single-target output.
- **Evolution - Thirteenth Toll:** every several casts releases a much larger toll that causes struck enemies to emit secondary echoes.

### 5. Ossuary Needles

- **Base:** fires a narrow burst of fast bone needles toward a target.
- **Cadence:** fast burst with a meaningful reload pause.
- **Strength:** focused single-target pressure and upgradeable projectile count.
- **Weakness:** narrow coverage without investment.
- **Evolution - Marrow Bloom:** needles lodged in enemies erupt into outward fragments after a short delay.

## Phase F: Artifact Identity And NG+

After the combat foundation is stable:

- replace generic artifact stat stacks with more build-defining effects
- create a unique thematic asset for every finalized artifact
- rebalance artifact tier unlock requirements around current kill counts
- implement NG+ Lite with optional Torments
- use NG+ and Torments to extend the threat system rather than duplicating combat logic
- begin NG+ with stronger enemies, a stronger Warden, improved rewards, and selectable Torments
- add further NG+ bosses only as complete distinct encounters with their own attack kits; do not simulate boss variety by repeatedly spawning the Warden

NG+ should increase challenge and rewards, but standard mode must first have a satisfying Warden fight and meaningful upgrade choices.

## Implementation Order

1. [Complete] Fix active-run timing inconsistencies.
2. [Complete] Add bounded threat-scaling rules and telemetry.
3. [Implemented; tuning ongoing] Rebuild and retune the Warden around a roughly `120,000` HP starting target.
4. [Complete] Replace Bloodletter Axe evolution with Crimson Orbit.
5. [Complete] Establish distinct cadence and power targets for all existing weapons.
6. [Implemented; tuning ongoing] Expand meaningful upgrade families and reduce generic-stat offer dominance.
7. [Implemented; tuning ongoing] Make high curse visibly and mechanically escalate through curse-specific enemy pressure, curse surge events, and player/HUD feedback.
8. Add the five new weapons one at a time with complete evolutions and tests.
9. Continue into build-defining artifacts and NG+ Lite with optional Torments.

## Success Criteria

- Fast progression remains exciting.
- A high-level build clears enemies efficiently but must still move and dodge.
- The Warden consistently survives long enough to present a real multi-pattern fight.
- Weapon strength comes from different identities, not identical cooldown-adjusted DPS.
- Late-run level choices remain interesting after several weapons evolve.
- New weapons add genuinely new play patterns.
- Adaptive threat remains bounded, testable, and understandable.
- No new god system owns progression, enemy spawning, boss behavior, weapons, and difficulty at once.
