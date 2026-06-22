# Design

## Vision

Everlasting Oblivion: Limbo Trial is a compact grimdark arena roguelite. The commercial goal is a readable, replayable fifteen-minute trial rather than a sprawling dungeon crawler.

## Core Loop

1. Choose an unlocked condemned soul and begin a trial.
2. Move and dash while weapons attack automatically.
3. Kill Limbo's condemned and collect their soul remnants.
4. Level up and choose one of three upgrades, sometimes accepting a cursed variant for stronger power and higher risk.
5. Survive authored encounter beats, mixed enemy behaviors, and elite arrivals.
6. Defeat the Limbo Warden or die.
7. Feed earned souls into that character's legacy level and spend the resulting talent points.

## Run Pacing

- **0:00-3:00:** establish the build and introduce the fodder horde.
- **3:00-7:00:** add bruisers, specialist enemies, the first elite, and the first curse.
- **7:00-11:00:** specialize the build against denser mixed pressure and authored formations.
- **11:00-14:00:** complete evolutions while surviving the grave march and final procession.
- **14:00+:** the Limbo Warden enters; the trial ends only when the chosen soul or the Warden falls.

Fast progression is intentional. Limbo responds to unusually rapid player power growth through bounded threat escalation rather than broadly reducing XP or upgrade frequency. Time establishes the minimum threat; player level and weapon progression can accelerate enemy health, damage, elite pressure, and encounter intensity above that minimum.

## Combat

Movement and positioning are the player's primary actions. Haunted begins with Bone Scythe, other characters may define their own starter weapon, and each run can equip up to five weapons:

- **Soul Bolt:** frequent ranged projectiles toward nearby targets.
- **Bone Scythe:** dependable moderate-cadence circular close-range coverage.
- **Hellfire Sigil:** delayed area damage near an enemy.
- **Grave Lance:** slow, high-damage line projectile with strong penetration.
- **Wailing Shards:** dense medium-cadence radial projectile coverage using handmade shard art.
- **Cinder Reliquary:** very slow, large expanding positional pulse.
- **Ashen Longbow:** deliberate fixed-count directional volley with impact-burst evolution.
- **Bloodletter Axe:** one or more piercing thrown executioner axes that return until they evolve into Crimson Orbit, replacing throws with three to five axes that continuously circle Haunted and repeatedly reap nearby enemies.
- **Dirge Staff:** instant multi-target judgments with area-burst evolution.
- **Poison Flask:** slow lobbed venom bottles that deal impact damage, leave acid pools, and evolve into longer-lived pools that poison enemies inside them.

The cadence identity pass makes Soul Bolt the frequent low-impact option; Bone
Scythe and Wailing Shards provide dependable nearby coverage; and Hellfire Sigil,
Grave Lance, Poison Flask, Dirge Staff, Cinder Reliquary, and Ashen Longbow have longer downtime
with materially stronger individual actions or ground-control payoff. Ashen Longbow keeps a fixed base
volley through ordinary levels so additional arrows remain a meaningful choice.
Bloodletter Axe always completes its full outbound range before returning until
Crimson Orbit replaces the throw. Headsman's Procession adds returning axes before
evolution and orbiting axes afterward, while all orbit axes share a bounded
per-enemy reap cooldown.

Dash is a short repositioning burst. Contact during its brief active window is avoided, and one perfect dodge per dash hastens all weapon cooldowns. Contact damage otherwise has a short recovery window so overlapping enemies do not remove health every frame.

Every weapon-targeted level choice advances that weapon by one level and applies its authored baseline growth. Focused weapon upgrades do the same through level five, stop appearing while the weapon waits for its explicit level-six evolution, then return after evolution as level-seven specializations that apply their remaining effects without creating invalid extra levels. The longer pre-evolution curve gives each weapon more time to scale before its capstone while evolved specialization keeps late-run offers relevant. Specific weapon pairs also activate visible loadout synergies.

## Enemies

- **Lost Soul:** baseline pressure.
- **Bone Crawler:** low-health pursuit threat.
- **Wraith:** wobbling movement makes projectile paths less predictable.
- **Hollow Knight:** slow, durable blocker.
- **Void Caster:** maintains range and fires telegraphed void orbs.
- **Screamer:** creates a large telegraphed danger zone.
- **Flayed Wanderer:** tougher late-run pursuit fodder that replaces Lost Souls.
- **Lantern Ghost:** durable spectral pressure with unpredictable wobbling movement.
- **Gravebound Archer:** keeps distance, strafes, and fires telegraphed grave arrows.
- **Veil Stalker:** winds up a fast short-range lunge.
- **Plague Crawler:** early hazard enemy that leaves small damaging pools.
- **Ember Imp:** mid-run ranged threat that throws a clearly marked fire flask.
- **Grave Defiler:** durable late-run hazard enemy with larger lingering pools.
- **Condemned Brute:** large elite that winds up a committed charge.
- **Sentinel of Woe:** late-run elite that replaces most Brute arrivals with a heavier charge threat.
- **The Limbo Warden:** 120,000-health boss that pursues, summons Lost Souls, and rotates through six telegraphed attacks.

The Warden accelerates as its health falls and rotates between shockwaves, marked soul-prison blasts, a long grave-chain strike, Shattered Judgment's radial lanes, Cathedral Rupture's moving safe route, and Condemned Star's tracked impact and shatter. Later phases arrive from health loss or time alive, add attacks, shorten recovery, and provide a brief readable transition window. High damage output should shorten the fight without allowing a completed build to skip nearly the entire attack set.

Ambient pressure uses independent fodder, bruiser, caster, and screamer spawn sessions. Each role replenishes toward its own population target under a shared safety cap, preventing specialist enemies from accidentally replacing the horde. Stronger enemies first coexist with the opening roster from four to ten minutes; Lost Souls and Bone Crawlers then leave ambient pools entirely. Timed rings, marches, varied elites, and processions temporarily exceed ambient composition targets.

## Progression

Progression choices are separated into six explicit categories:

- **Weapons:** add a weapon to the loadout, up to five. These are heavily weighted during early levels.
- **Weapon Levels:** increase a weapon's level and apply its authored growth curve.
- **Weapon Upgrades:** focused modifiers such as projectile count, penetration, speed, size, area, or weapon-specific critical chance; they advance pre-evolution weapons by one level and further specialize evolved weapons without raising them beyond level seven.
- **Weapon Evolutions:** guaranteed offer candidates for level-six weapons that advance them to level seven and awaken their capstone behavior.
- **Stats:** restrained character-wide bonuses such as health, movement speed, pickup radius, general critical chance, and critical damage.
- **Curses:** a separate timed-event pool of powerful bonuses with meaningful drawbacks.

Normal offers may be rerolled or skipped for souls. Elite kills grant bonus power choices, rare battlefield powerups create short-term goals, and a one-use blood shrine trades health for power. Immediate powerups announce their result on collection; timed powerups show their effect and a draining duration bar beneath the player.

Frequent choices should increasingly change weapon behavior or create explicit tradeoffs rather than repeatedly offering generic stats. Valid examples include projectile count, meaningful area growth, splitting, echoes, orbiting, stronger attacks with longer cooldowns, and increased XP gain that also accelerates bounded threat escalation.

The first conditional upgrade batch adds run-state choices around active play:
moving can improve damage, dashing can open a short damage window, shields can be
converted into offense, elite hunting can trade fodder damage for elite/boss
pressure and soul rewards, and cursed Echo-marking can turn Death Echoes and
curse-gated enemies into prey. These bonuses are intentionally explicit and
bounded; they should reward playstyle without becoming mandatory.

The first completed tradeoff family gives Bone Scythe, Wailing Shards, Cinder
Reliquary, and Ashen Longbow one rare one-stack identity choice. These choices
increase impact or projectile density while visibly extending downtime; they use
the normal typed weapon-modifier path and still advance the selected weapon.

The second authored family gives Soul Bolt an impact splinter, Hellfire Sigil two
delayed side blasts, and Dirge Staff a delayed judgment echo. Forbidden Tutelage
grants increased XP while adding explicit threat power, so faster progression
immediately accepts additional bounded enemy scaling rather than hiding the cost.
Any remaining focused choices continue appearing after their target weapon evolves,
allowing late builds to complete these identities instead of collapsing into generic
stat offers.

The first status-effect foundation adds data-defined bleeding and poison profiles,
small debuff icons above affected enemies, and source-attributed damage-over-time
ticks. Crimson Harvest makes Bone Scythe sweeps inflict a short stacking bleed,
while evolved Poison Flask acid pools apply poison. Wailing Shards only uses its
new shard art and does not carry bleed by default.

Permanent progression is now character-specific. Each character has three exclusive-ish
talent paths; souls earned by playing that character fill a legacy track that grants
talent points. Players can nearly fill one path, reach a capstone with spare points
for a second path, or split power broadly while missing the deepest identities. Small
nodes use normal stat or weapon modifiers, while major nodes use typed run-start
effects such as extra upgrade choices, extra rerolls, starting shields, weapon slots,
pierce, or starting with curse.

### Curse, Cursed Rewards, And Echoes

Curse is a run-level pressure meter. Safe rewards keep the baseline run stable,
while cursed rewards add stronger or more unusual power at the cost of curse gain
and an explicit downside. Cursed choices must show their curse gain before
selection, and they should tempt the player rather than replacing ordinary
progression.

Curse tiers are data-defined:

- **Unmarked:** no curse pressure.
- **Touched:** cursed upgrade variants can begin appearing.
- **Marked:** curse-gated enemies can enter eligible spawn pools.
- **Condemned:** artifacts may mutate and the Warden can answer with cursed minions.
- **Forsaken:** cursed rewards and curse pressure become more frequent and severe.

Cursed reward patterns should be build-shaping. Good examples are blood-price
offense, hunted XP or damage, greed-mark soul gain, fragile power, and overgrowth
of projectiles or area. Plain minor-stat trades should be avoided unless they
support a clearer identity.

When the player dies, Limbo saves a compact Death Echo snapshot of the failed
build: character, survival time, level, main weapon, upgrades, artifacts, kills,
souls, and curse. A later run can spawn a generated Echo that translates that build
into capped enemy-safe abilities such as slow volleys, delayed ruptures, charges,
or a small cursed aura. The Echo should read as a corrupted memory of the previous
build, not as a full player clone.

### Characters

- **Haunted:** balanced default using Bone Scythe.
- **The Penitent:** slower, tougher, and stronger; unlocked by surviving ten minutes in three trials.
- **Ashwalker:** fragile and fast with Soul Bolt; unlocked by defeating the Warden or surviving a full trial.

Characters change base stats and the starter weapon. Character-exclusive weapon pools remain delayed.

### Artifacts And Chests

The first reliquary appears after 55-75 seconds; later reliquaries appear every 155-190 seconds. They spawn within a reachable ring around the player, remain for 75 seconds, show a direction/distance/countdown tracker, and open on contact. At most one may be active. Each valid reliquary grants one unowned artifact from the currently unlocked pool; an exhausted pool yields souls.

Reliquaries are cracked black-stone and iron chests sealed with cyan soul light and restrained gold accents. They have no floating world label; a compact compass, distance, and timer line preserves discoverability without a boxed objective window. Walking into one ruptures its soul-lock without pausing combat: the chest collapses, lock fragments burst outward, and the reward icon follows a curved cyan-gold soul trail into the player before showing a short receipt. The close-range path naturally loops around the player, giving contact opening its own visual identity.

Artifacts are run-only passive items. They drop less often than early prototype relics, but should be more build-shaping when claimed: most regular artifacts combine a stronger stat package with one typed runtime effect such as kill cadence, shield breaks, perfect-dodge rewards, powerup drops, or pickup loops. Cursed artifact variants carry the sharper double-edged risk. The labeled icons beneath the health HUD are artifacts, not temporary buffs, and expose name, rarity, and effect tooltips. Their modifiers use the shared stat rules and hard caps. Artifact pool tiers unlock from total kills and Warden victories.

## Combat Readability

- Player attacks use blue, pale purple, white, and gold.
- Enemy projectiles and telegraph rims use red or crimson.
- Enemy explosions use red-orange impact language.
- Ground hazards retain thematic fill colors but always carry a red danger rim.
- Safe pickups use blue, green, or gold.
- Harmful status icons are compact and sit near affected sprites; bleed uses blood-red drops, poison uses green bottle language.
- Active ground hazards are capped so visual pressure cannot grow without bound.

Normal enemies primarily fund run XP, while permanent souls are concentrated on specialists, elites, bosses, and occasional bonus drops. XP requirements follow a scaled square curve. Ground soul remnants consolidate after 90 objects so dense waves do not create unbounded pickup objects. Random powerups cannot appear before one minute and have a ninety-second cooldown; elite powerups remain guaranteed.

## Visual Direction

Most of the current build uses supplied high-resolution concept sprites as scaled single-frame gameplay art. Haunted uses stable direction-specific frames with a restrained spectral hover; rejected generated walk cycles are kept out of gameplay when repeated limb poses create a limp or inconsistent weapon occlusion. The presentation follows the unchanged gameplay body. Pale blue soul light contrasts with warm elite/boss warnings and hellfire. Gothic display typography is paired with restrained readable body copy.

Gameplay uses the default camera zoom so fixed HUD elements remain inside the screen bounds. Screen shake is restrained and throttled, and only one centered warning banner is shown at a time.

Active shields render as a pale ring around the player with their remaining absorption value. Reliquaries remain compact, have no persistent circle, and use a restrained relative-scale pulse so their source-art dimensions cannot create oversized pulses.

Procedural tones currently provide temporary combat and interface feedback. They are hooks for later authored sound effects, not the intended final soundtrack.
