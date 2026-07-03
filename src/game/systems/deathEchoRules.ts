import type {
  CharacterId,
  CurseSnapshot,
  DeathEchoSnapshot,
  PlayerDamageSourceId,
  RunSummary,
  WeaponId,
} from '../types/gameTypes';
import { getCurseTierById } from '../data/curse';

export type DeathEchoAbility = 'bolt' | 'rupture' | 'charge' | 'aura';

export interface DeathEchoProfile {
  label: string;
  maxHealth: number;
  contactDamage: number;
  speedMultiplier: number;
  abilities: readonly DeathEchoAbility[];
  projectileCount: number;
  damage: number;
}

export interface DeathEchoSpawnPlan {
  spawnAtMs: number;
  warning: string;
  distance: number;
}

const VALID_CLASS_IDS = new Set<CharacterId>(['haunted', 'the-penitent', 'ashwalker']);
const VALID_WEAPON_IDS = new Set<WeaponId>([
  'bone-scythe',
  'soul-bolt',
  'hellfire-sigil',
  'grave-lance',
  'wailing-shards',
  'cinder-reliquary',
  'ashen-longbow',
  'bloodletter-axe',
  'dirge-staff',
  'poison-flask',
  'sanguine-needle',
]);
const VALID_DAMAGE_SOURCES = new Set<PlayerDamageSourceId>([
  'lost-soul',
  'grave-crawler',
  'hollow-knight',
  'wraith',
  'void-caster',
  'screamer',
  'flayed-wanderer',
  'lantern-ghost',
  'gravebound-archer',
  'veil-stalker',
  'condemned-brute',
  'sentinel-of-woe',
  'plague-crawler',
  'ember-imp',
  'grave-defiler',
  'condemned-husk',
  'sinbound-stalker',
  'player-echo',
  'limbo-warden',
  'void-orb',
  'scream',
  'grave-arrow',
  'plague-trail',
  'fire-flask',
  'echo-bolt',
  'echo-rupture',
  'echo-charge',
  'shockwave',
  'soul-prison',
  'grave-chain',
  'shattered-judgment',
  'cathedral-rupture',
  'condemned-star',
  'blood-shrine',
]);

export function createDeathEchoSnapshot(summary: RunSummary): DeathEchoSnapshot | undefined {
  if (summary.victory) {
    return undefined;
  }
  return {
    classId: summary.characterId,
    survivedSeconds: Math.round(summary.elapsedMs / 1000),
    level: summary.level,
    mainWeaponId: summary.weaponResults[0]?.id ?? 'bone-scythe',
    upgradeIds: summary.upgradeIds.slice(0, 32),
    artifactIds: summary.artifacts.slice(0, 16),
    curseLevel: summary.curse.level,
    curseTier: summary.curse.tier,
    causeOfDeath: summary.balance.deathSource,
    kills: summary.kills,
    soulsEarned: summary.souls,
  };
}

export function parseDeathEchoSnapshot(value: unknown): DeathEchoSnapshot | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Partial<DeathEchoSnapshot>;
  if (
    !VALID_CLASS_IDS.has(record.classId as CharacterId) ||
    typeof record.survivedSeconds !== 'number' ||
    typeof record.level !== 'number' ||
    !VALID_WEAPON_IDS.has(record.mainWeaponId as WeaponId) ||
    typeof record.curseLevel !== 'number' ||
    typeof record.curseTier !== 'string' ||
    typeof record.kills !== 'number' ||
    typeof record.soulsEarned !== 'number'
  ) {
    return undefined;
  }
  return {
    classId: record.classId as CharacterId,
    survivedSeconds: Math.max(0, Math.min(1800, Math.round(record.survivedSeconds))),
    level: Math.max(1, Math.min(1000, Math.round(record.level))),
    mainWeaponId: record.mainWeaponId as WeaponId,
    upgradeIds: Array.isArray(record.upgradeIds) ? record.upgradeIds.slice(0, 32) : [],
    artifactIds: Array.isArray(record.artifactIds) ? record.artifactIds.slice(0, 16) : [],
    curseLevel: Math.max(0, Math.min(999, Math.round(record.curseLevel))),
    curseTier: getCurseTierById(record.curseTier as DeathEchoSnapshot['curseTier']).id,
    ...(VALID_DAMAGE_SOURCES.has(record.causeOfDeath as PlayerDamageSourceId)
      ? { causeOfDeath: record.causeOfDeath as PlayerDamageSourceId }
      : {}),
    kills: Math.max(0, Math.min(100000, Math.round(record.kills))),
    soulsEarned: Math.max(0, Math.min(100000000, Math.round(record.soulsEarned))),
  };
}

export function createDeathEchoProfile(snapshot: DeathEchoSnapshot): DeathEchoProfile {
  const abilitySet = new Set<DeathEchoAbility>(abilitiesForWeapon(snapshot.mainWeaponId));
  if (snapshot.curseLevel >= 50) {
    abilitySet.add('aura');
  }
  if (snapshot.artifactIds.length >= 4 || snapshot.upgradeIds.some((id) => id.includes('dash'))) {
    abilitySet.add('charge');
  }
  const abilities = [...abilitySet].slice(0, 3);
  return {
    label: `${snapshot.classId.replaceAll('-', ' ')} echo`,
    maxHealth: Math.round(
      Math.min(9000, 720 + snapshot.survivedSeconds * 4.5 + snapshot.level * 95 + snapshot.curseLevel * 26),
    ),
    contactDamage: Math.round(Math.min(24, 8 + snapshot.level * 0.28 + snapshot.curseLevel * 0.05)),
    speedMultiplier: snapshot.curseLevel >= 75 ? 0.92 : 0.78,
    abilities,
    projectileCount: Math.min(3, 1 + Math.floor(snapshot.upgradeIds.length / 8) + (snapshot.curseLevel >= 75 ? 1 : 0)),
    damage: Math.round(Math.min(26, 8 + snapshot.level * 0.35 + snapshot.curseLevel * 0.08)),
  };
}

export function createDeathEchoSpawnPlan(
  snapshot: DeathEchoSnapshot | undefined,
  currentCurse: CurseSnapshot,
): DeathEchoSpawnPlan | undefined {
  if (!snapshot) {
    return undefined;
  }
  const cursePressure = snapshot.curseLevel * 4200 + currentCurse.level * 2500;
  const spawnAtMs = Math.max(180000, Math.min(720000, 660000 - cursePressure));
  return {
    spawnAtMs,
    warning: currentCurse.level >= 25 ? 'A PREVIOUS FAILURE HAS RETURNED' : 'YOUR ECHO STIRS IN THE DISTANCE',
    distance: currentCurse.level >= 50 ? 620 : 760,
  };
}

function abilitiesForWeapon(weapon: WeaponId): DeathEchoAbility[] {
  switch (weapon) {
    case 'hellfire-sigil':
    case 'cinder-reliquary':
    case 'poison-flask':
      return ['rupture', 'bolt'];
    case 'bloodletter-axe':
    case 'bone-scythe':
      return ['charge', 'rupture'];
    case 'dirge-staff':
      return ['rupture', 'bolt'];
    default:
      return ['bolt', 'charge'];
  }
}
