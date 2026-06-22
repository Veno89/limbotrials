import type {
  CharacterId,
  StatModifier,
  TalentEffectId,
  TalentNodeDefinition,
  TalentNodeId,
  TalentNodeSlug,
  TalentNodeTier,
  TalentPathDefinition,
  TalentPathId,
  WeaponId,
  WeaponModifier,
} from '../types/gameTypes';

export const TALENT_MAX_POINTS = 32;
export const TALENT_POINT_THRESHOLDS: readonly number[] = Array.from(
  { length: TALENT_MAX_POINTS },
  (_, index) => Math.round(45 * (index + 1) + 5 * (index + 1) ** 2),
);

interface NodeSpec {
  slug: TalentNodeSlug;
  tier: TalentNodeTier;
  name: string;
  description: string;
  maxRanks: number;
  pathPointsRequired: number;
  prerequisites?: TalentNodeSlug[];
  choiceGroup?: string;
  modifiers?: StatModifier[];
  weaponModifiers?: WeaponModifier[];
  targetWeapon?: WeaponId;
  effect?: TalentEffectId;
  position: { row: number; column: number };
}

interface TalentPathSeed extends TalentPathDefinition {
  nodes: readonly NodeSpec[];
}

const talentPath = (
  id: TalentPathId,
  characterId: CharacterId,
  name: string,
  description: string,
  color: number,
  nodes: readonly NodeSpec[],
): TalentPathSeed => ({ id, characterId, name, description, color, nodes });

const stat = (stat: StatModifier['stat'], mode: StatModifier['mode'], value: number): StatModifier => ({
  stat,
  mode,
  value,
});

const weapon = (
  stat: WeaponModifier['stat'],
  mode: WeaponModifier['mode'],
  value: number,
): WeaponModifier => ({ stat, mode, value });

const idFor = (pathId: TalentPathId, slug: TalentNodeSlug): TalentNodeId => `${pathId}-${slug}` as TalentNodeId;

const defineNodes = (path: TalentPathSeed): TalentNodeDefinition[] =>
  path.nodes.map((node) => ({
    id: idFor(path.id, node.slug),
    characterId: path.characterId,
    pathId: path.id,
    tier: node.tier,
    name: node.name,
    description: node.description,
    maxRanks: node.maxRanks,
    pathPointsRequired: node.pathPointsRequired,
    prerequisites: (node.prerequisites ?? []).map((slug) => idFor(path.id, slug)),
    ...(node.choiceGroup ? { choiceGroup: `${path.id}:${node.choiceGroup}` } : {}),
    ...(node.modifiers ? { modifiers: node.modifiers } : {}),
    ...(node.weaponModifiers ? { weaponModifiers: node.weaponModifiers } : {}),
    ...(node.targetWeapon ? { targetWeapon: node.targetWeapon } : {}),
    ...(node.effect ? { effect: node.effect } : {}),
    position: node.position,
  }));

const root = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  weaponModifiers?: WeaponModifier[],
  targetWeapon?: WeaponId,
): NodeSpec => ({
  slug: 'root',
  tier: 'minor',
  name,
  description,
  maxRanks: 5,
  pathPointsRequired: 0,
  modifiers,
  ...(weaponModifiers ? { weaponModifiers } : {}),
  ...(targetWeapon ? { targetWeapon } : {}),
  position: { row: 0, column: 0 },
});

const leftOne = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug: 'left-1',
  tier: 'minor',
  name,
  description,
  maxRanks: 3,
  pathPointsRequired: 3,
  prerequisites: ['root'],
  modifiers,
  ...(effect ? { effect } : {}),
  position: { row: 1, column: -1 },
});

const rightOne = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  weaponModifiers?: WeaponModifier[],
  targetWeapon?: WeaponId,
): NodeSpec => ({
  slug: 'right-1',
  tier: 'minor',
  name,
  description,
  maxRanks: 3,
  pathPointsRequired: 3,
  prerequisites: ['root'],
  modifiers,
  ...(weaponModifiers ? { weaponModifiers } : {}),
  ...(targetWeapon ? { targetWeapon } : {}),
  position: { row: 1, column: 1 },
});

const notableOne = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug: 'notable-1',
  tier: 'notable',
  name,
  description,
  maxRanks: 1,
  pathPointsRequired: 6,
  prerequisites: ['left-1'],
  modifiers,
  ...(effect ? { effect } : {}),
  position: { row: 2, column: -1 },
});

const middle = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  weaponModifiers?: WeaponModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug: 'middle',
  tier: 'minor',
  name,
  description,
  maxRanks: 5,
  pathPointsRequired: 7,
  prerequisites: ['root'],
  modifiers,
  ...(weaponModifiers ? { weaponModifiers } : {}),
  ...(effect ? { effect } : {}),
  position: { row: 2, column: 1 },
});

const choice = (
  slug: 'choice-a' | 'choice-b',
  name: string,
  description: string,
  modifiers: StatModifier[],
  column: number,
  effect?: TalentEffectId,
  weaponModifiers?: WeaponModifier[],
  targetWeapon?: WeaponId,
): NodeSpec => ({
  slug,
  tier: 'choice',
  name,
  description,
  maxRanks: 1,
  pathPointsRequired: 12,
  prerequisites: ['middle'],
  choiceGroup: 'vow',
  modifiers,
  ...(effect ? { effect } : {}),
  ...(weaponModifiers ? { weaponModifiers } : {}),
  ...(targetWeapon ? { targetWeapon } : {}),
  position: { row: 3, column },
});

const notableTwo = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug: 'notable-2',
  tier: 'notable',
  name,
  description,
  maxRanks: 1,
  pathPointsRequired: 15,
  prerequisites: ['middle'],
  modifiers,
  ...(effect ? { effect } : {}),
  position: { row: 4, column: 0 },
});

const deep = (
  slug: 'deep-left' | 'deep-right',
  name: string,
  description: string,
  modifiers: StatModifier[],
  column: number,
  weaponModifiers?: WeaponModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug,
  tier: 'minor',
  name,
  description,
  maxRanks: 3,
  pathPointsRequired: 17,
  prerequisites: ['notable-2'],
  modifiers,
  ...(weaponModifiers ? { weaponModifiers } : {}),
  ...(effect ? { effect } : {}),
  position: { row: 5, column },
});

const capstone = (
  name: string,
  description: string,
  modifiers: StatModifier[],
  effect?: TalentEffectId,
): NodeSpec => ({
  slug: 'capstone',
  tier: 'capstone',
  name,
  description,
  maxRanks: 1,
  pathPointsRequired: 22,
  prerequisites: ['notable-2'],
  modifiers,
  ...(effect ? { effect } : {}),
  position: { row: 6, column: 0 },
});

const PATH_SEEDS: readonly TalentPathSeed[] = [
  talentPath('haunted-reaper', 'haunted', 'Reaper', 'Close-range execution and scythe pressure.', 0xd7bd82, [
    root(
      'Grave Grip',
      'Bone Scythe deals 4% more damage per rank.',
      [],
      [weapon('damage', 'multiply', 1.04)],
      'bone-scythe',
    ),
    leftOne(
      'Harvest Steps',
      'Successful Bone Scythe reaps have a 5% chance per rank to grant 5% movement speed per rank for 3 seconds.',
      [],
      'bone-scythe-harvest-steps',
    ),
    rightOne(
      'Cruel Edge',
      'Bone Scythe gains +2% critical chance and +12% critical damage per rank.',
      [],
      [weapon('critChance', 'add', 0.02), weapon('critDamage', 'add', 0.12)],
      'bone-scythe',
    ),
    notableOne(
      'First Reaping',
      'Bone Scythe deals 60% more damage to enemies at full health.',
      [],
      'bone-scythe-first-reaping',
    ),
    middle(
      'Crooked Reach',
      "Bone Scythe's outer half deals 6% more damage per rank and pulls surviving non-boss enemies inward.",
      [],
      undefined,
      'bone-scythe-crooked-reach',
    ),
    choice(
      'choice-a',
      'Grave Procession',
      'Every fifth Bone Scythe reap launches a forward spectral crescent.',
      [],
      -1,
      'bone-scythe-grave-procession',
    ),
    choice(
      'choice-b',
      'Butcher Rhythm',
      'Bone Scythe reaps 18% faster, but its sweep is 18% smaller.',
      [],
      1,
      undefined,
      [weapon('cooldownMs', 'multiply', 0.82), weapon('area', 'multiply', 0.82)],
      'bone-scythe',
    ),
    notableTwo(
      'Bone-Marked Prey',
      'Bone Scythe consumes Bleed to deal its full-duration damage immediately.',
      [],
      'bone-scythe-consume-bleed',
    ),
    deep(
      'deep-left',
      'Reaping Wake',
      'Bone Scythe leaves a spectral wake dealing 12% damage per rank.',
      [],
      -1,
      undefined,
      'bone-scythe-reaping-wake',
    ),
    deep(
      'deep-right',
      "Executioner's Due",
      'Bone Scythe deals 15% more damage per rank to enemies below 30% health.',
      [],
      1,
      undefined,
      'bone-scythe-executioner',
    ),
    capstone(
      'The Final Reaping',
      'Bone Scythe reaps in a full 360-degree circle instead of a forward 180-degree sweep.',
      [],
      'bone-scythe-full-circle',
    ),
  ]),
  talentPath('haunted-echo', 'haunted', 'Echo', 'Cursed memory, Death Echo pressure, and dangerous gain.', 0x9d72ff, [
    root('Whispered Debt', '+3% XP gain per rank.', [stat('xpGain', 'multiply', 1.03)]),
    leftOne('Haunting Pace', '+2% movement speed per rank.', [stat('moveSpeed', 'multiply', 1.02)]),
    rightOne('Black Tutelage', '+4% soul gain per rank.', [stat('soulGain', 'multiply', 1.04)]),
    notableOne('Echo Tithe', '+1 upgrade reroll each run.', [], 'extra-reroll'),
    middle('Hungry Shade', '+3% damage per rank. Limbo reads this as power.', [
      stat('damage', 'multiply', 1.03),
      stat('threatPowerBonus', 'add', 1),
    ]),
    choice('choice-a', 'Quiet Damnation', '+10% XP gain.', [stat('xpGain', 'multiply', 1.1)], -1),
    choice('choice-b', 'Loud Damnation', '+10% soul gain.', [stat('soulGain', 'multiply', 1.1)], 1),
    notableTwo('Memory Tear', '+10% attack speed.', [stat('attackSpeed', 'multiply', 1.1)]),
    deep('deep-left', 'Restless Echoes', '+3% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.03)], -1),
    deep('deep-right', 'Condemned Lessons', '+4% boss damage per rank.', [stat('bossDamage', 'multiply', 1.04)], 1),
    capstone('Begin Marked', 'Start each run with curse, but gain stronger souls and XP.', [
      stat('soulGain', 'multiply', 1.12),
      stat('xpGain', 'multiply', 1.08),
    ], 'start-with-curse'),
  ]),
  talentPath('haunted-remnant', 'haunted', 'Remnant', 'Survival, pickup comfort, and more choices.', 0x69d9ff, [
    root('Stubborn Remnant', '+6 maximum health per rank.', [stat('maxHealth', 'add', 6)]),
    leftOne('Gathered Breath', '+5% pickup radius per rank.', [stat('pickupRadius', 'multiply', 1.05)]),
    rightOne('Quickened Nerve', '-3% dash cooldown per rank.', [stat('dashCooldown', 'multiply', 0.97)]),
    notableOne('Old Reflex', '+1 upgrade reroll each run.', [], 'extra-reroll'),
    middle('Soul Thread', '+4% soul gain per rank.', [stat('soulGain', 'multiply', 1.04)]),
    choice('choice-a', 'Careful Hands', '+12% pickup radius.', [stat('pickupRadius', 'multiply', 1.12)], -1),
    choice('choice-b', 'Refused Ending', 'Begin each run with a 30-point shield.', [], 1, 'starting-shield'),
    notableTwo('Lingering Will', '+20 maximum health.', [stat('maxHealth', 'add', 20)]),
    deep('deep-left', 'Bitter Endurance', '+8 maximum health per rank.', [stat('maxHealth', 'add', 8)], -1),
    deep('deep-right', 'Memory Hunger', '+5% soul gain per rank.', [stat('soulGain', 'multiply', 1.05)], 1),
    capstone('One More Omen', 'Standard level-ups offer one additional choice.', [], 'extra-upgrade-choice'),
  ]),
  talentPath('penitent-burden', 'the-penitent', 'Burden', 'Health, shields, and slow impossible endurance.', 0x8edfff, [
    root('Iron Burden', '+8 maximum health per rank.', [stat('maxHealth', 'add', 8)]),
    leftOne('Weighted Step', '+2% damage per rank.', [stat('damage', 'multiply', 1.02)]),
    rightOne('Prayer Scars', '+3% soul gain per rank.', [stat('soulGain', 'multiply', 1.03)]),
    notableOne('Raised Buckler', 'Begin each run with a 30-point shield.', [], 'starting-shield'),
    middle('Sainted Mass', '+3% weapon area per rank.', [], [weapon('area', 'multiply', 1.03)]),
    choice('choice-a', 'Hold The Line', '+25 maximum health.', [stat('maxHealth', 'add', 25)], -1),
    choice('choice-b', 'March Anyway', '+8% movement speed.', [stat('moveSpeed', 'multiply', 1.08)], 1),
    notableTwo('Last Confession', '+12% boss damage.', [stat('bossDamage', 'multiply', 1.12)]),
    deep('deep-left', 'Stone Rib', '+10 maximum health per rank.', [stat('maxHealth', 'add', 10)], -1),
    deep('deep-right', 'Slow Judgment', '+4% damage per rank.', [stat('damage', 'multiply', 1.04)], 1),
    capstone('Unbroken Pilgrim', 'Gain +1 maximum weapon slot.', [], 'extra-weapon-slot'),
  ]),
  talentPath('penitent-atonement', 'the-penitent', 'Atonement', 'Punish elites, bosses, and every unpaid sin.', 0xd94545, [
    root('Vow of Teeth', '+3% boss damage per rank.', [stat('bossDamage', 'multiply', 1.03)]),
    leftOne('Cruel Penance', '+3% critical damage per rank.', [stat('critDamage', 'add', 0.03)]),
    rightOne('Judgment Sparks', '+2% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.02)]),
    notableOne('Second Sentence', '+8% critical chance.', [stat('critChance', 'add', 0.08)]),
    middle('Relentless Verdict', '+3% damage per rank.', [stat('damage', 'multiply', 1.03)]),
    choice('choice-a', 'Mercy Denied', '+15% boss damage.', [stat('bossDamage', 'multiply', 1.15)], -1),
    choice('choice-b', 'Mercy Twisted', '+12% critical damage and +5% crit chance.', [
      stat('critDamage', 'add', 0.12),
      stat('critChance', 'add', 0.05),
    ], 1),
    notableTwo('Trial By Ash', '+10% attack speed.', [stat('attackSpeed', 'multiply', 1.1)]),
    deep('deep-left', 'Burning Oath', '+4% boss damage per rank.', [stat('bossDamage', 'multiply', 1.04)], -1),
    deep('deep-right', 'Scourging Light', '+3% damage per rank.', [stat('damage', 'multiply', 1.03)], 1),
    capstone('Final Absolution', '+1 upgrade reroll and +10% boss damage.', [stat('bossDamage', 'multiply', 1.1)], 'extra-reroll'),
  ]),
  talentPath('penitent-pilgrim', 'the-penitent', 'Pilgrim', 'Steady progress, recovery room, and practical utility.', 0xc7a76a, [
    root('Long Road', '+3% movement speed per rank.', [stat('moveSpeed', 'multiply', 1.03)]),
    leftOne('Pilgrim Pockets', '+4% soul gain per rank.', [stat('soulGain', 'multiply', 1.04)]),
    rightOne('Soft Footfall', '-3% dash cooldown per rank.', [stat('dashCooldown', 'multiply', 0.97)]),
    notableOne('Relic Cart', '+1 maximum weapon slot.', [], 'extra-weapon-slot'),
    middle('Wide Pilgrimage', '+5% pickup radius per rank.', [stat('pickupRadius', 'multiply', 1.05)]),
    choice('choice-a', 'Patient Study', '+12% XP gain.', [stat('xpGain', 'multiply', 1.12)], -1),
    choice('choice-b', 'Careful Route', '+12% movement speed.', [stat('moveSpeed', 'multiply', 1.12)], 1),
    notableTwo('Spare Thread', '+1 upgrade reroll each run.', [], 'extra-reroll'),
    deep('deep-left', 'Dusty Lessons', '+4% XP gain per rank.', [stat('xpGain', 'multiply', 1.04)], -1),
    deep('deep-right', 'Honest Weight', '+8 maximum health per rank.', [stat('maxHealth', 'add', 8)], 1),
    capstone('The Long Way Down', 'Standard level-ups offer one additional choice.', [], 'extra-upgrade-choice'),
  ]),
  talentPath('ashwalker-ember', 'ashwalker', 'Ember', 'Fast burning offense and wider weapon pressure.', 0xf07b35, [
    root('Cinder Pulse', '+3% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.03)]),
    leftOne('Ash-Lit Blades', '+3% damage per rank.', [stat('damage', 'multiply', 1.03)]),
    rightOne('Flaring Reach', '+3% weapon area per rank.', [], [weapon('area', 'multiply', 1.03)]),
    notableOne('Ember Crown', '+10% critical chance.', [stat('critChance', 'add', 0.1)]),
    middle('Scorched Cadence', '+3% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.03)]),
    choice('choice-a', 'White Flame', '+15% damage.', [stat('damage', 'multiply', 1.15)], -1),
    choice('choice-b', 'Black Flame', '+15% weapon area.', [], 1, undefined, [weapon('area', 'multiply', 1.15)]),
    notableTwo('Cremation Rite', '+12% boss damage.', [stat('bossDamage', 'multiply', 1.12)]),
    deep('deep-left', 'Furnace Heart', '+4% damage per rank.', [stat('damage', 'multiply', 1.04)], -1),
    deep('deep-right', 'Rising Sparks', '+3% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.03)], 1),
    capstone('Ashen Arsenal', 'Gain +1 maximum weapon slot.', [], 'extra-weapon-slot'),
  ]),
  talentPath('ashwalker-cinderstep', 'ashwalker', 'Cinderstep', 'Dash cadence, speed, and evasive pressure.', 0xd7bd82, [
    root('Light Ash', '+3% movement speed per rank.', [stat('moveSpeed', 'multiply', 1.03)]),
    leftOne('Quick Cinders', '-3% dash cooldown per rank.', [stat('dashCooldown', 'multiply', 0.97)]),
    rightOne('Dancing Sparks', '+2% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.02)]),
    notableOne('Pocket Breath', '+1 upgrade reroll each run.', [], 'extra-reroll'),
    middle('Slipstream Ash', '+3% movement speed per rank.', [stat('moveSpeed', 'multiply', 1.03)]),
    choice('choice-a', 'Graceful Panic', '-10% dash cooldown.', [stat('dashCooldown', 'multiply', 0.9)], -1),
    choice('choice-b', 'Burning Trail', '+12% damage.', [stat('damage', 'multiply', 1.12)], 1),
    notableTwo('Hot Nerves', '+10% attack speed.', [stat('attackSpeed', 'multiply', 1.1)]),
    deep('deep-left', 'Fleeing Star', '+3% movement speed per rank.', [stat('moveSpeed', 'multiply', 1.03)], -1),
    deep('deep-right', 'Rapid Heart', '+3% attack speed per rank.', [stat('attackSpeed', 'multiply', 1.03)], 1),
    capstone('Read The Smoke', 'Standard level-ups offer one additional choice.', [], 'extra-upgrade-choice'),
  ]),
  talentPath('ashwalker-hunger', 'ashwalker', 'Ash Hunger', 'Souls, XP, and optional cursed acceleration.', 0x9d72ff, [
    root('Hungry Ash', '+4% soul gain per rank.', [stat('soulGain', 'multiply', 1.04)]),
    leftOne('Cinder Lessons', '+4% XP gain per rank.', [stat('xpGain', 'multiply', 1.04)]),
    rightOne('Scavenger Heat', '+5% pickup radius per rank.', [stat('pickupRadius', 'multiply', 1.05)]),
    notableOne('Stolen Moment', '+1 upgrade reroll each run.', [], 'extra-reroll'),
    middle('Fast Appetite', '+3% XP gain per rank. Limbo reads this as power.', [
      stat('xpGain', 'multiply', 1.03),
      stat('threatPowerBonus', 'add', 1),
    ]),
    choice('choice-a', 'Feed The Flame', '+15% soul gain.', [stat('soulGain', 'multiply', 1.15)], -1),
    choice('choice-b', 'Feed The Trial', '+15% XP gain.', [stat('xpGain', 'multiply', 1.15)], 1),
    notableTwo('Ashen Magnet', '+18% pickup radius.', [stat('pickupRadius', 'multiply', 1.18)]),
    deep('deep-left', 'Soul Draft', '+5% soul gain per rank.', [stat('soulGain', 'multiply', 1.05)], -1),
    deep('deep-right', 'Forbidden Appetite', '+4% XP gain per rank.', [stat('xpGain', 'multiply', 1.04)], 1),
    capstone('Start The Pyre Cursed', 'Start each run with curse, but gain stronger souls and XP.', [
      stat('soulGain', 'multiply', 1.12),
      stat('xpGain', 'multiply', 1.08),
    ], 'start-with-curse'),
  ]),
];

export const TALENT_PATHS: Record<TalentPathId, TalentPathDefinition> = Object.fromEntries(
  PATH_SEEDS.map((path) => [
    path.id,
    {
      id: path.id,
      characterId: path.characterId,
      name: path.name,
      description: path.description,
      color: path.color,
    },
  ]),
) as Record<TalentPathId, TalentPathDefinition>;

export const TALENT_NODES: Record<TalentNodeId, TalentNodeDefinition> = Object.fromEntries(
  PATH_SEEDS.flatMap(defineNodes).map((node) => [node.id, node]),
) as Record<TalentNodeId, TalentNodeDefinition>;

export const TALENT_NODE_ORDER: readonly TalentNodeId[] = PATH_SEEDS.flatMap((path) =>
  path.nodes.map((node) => idFor(path.id, node.slug)),
);

export const TALENT_PATH_ORDER: readonly TalentPathId[] = PATH_SEEDS.map((path) => path.id);

export function talentPointsForLegacySouls(legacySouls: number): number {
  const souls = Math.max(0, Math.floor(legacySouls));
  return TALENT_POINT_THRESHOLDS.filter((threshold) => souls >= threshold).length;
}

export function nextTalentPointThreshold(legacySouls: number): number | undefined {
  const souls = Math.max(0, Math.floor(legacySouls));
  return TALENT_POINT_THRESHOLDS.find((threshold) => threshold > souls);
}
