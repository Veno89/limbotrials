import { ARTIFACTS } from '../data/artifacts';
import { ENEMIES } from '../data/enemies';
import { POWERUPS } from '../data/powerups';
import { STATUS_EFFECTS } from '../data/statusEffects';
import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import type {
  ArtifactId,
  EnemyId,
  JournalEntryCollection,
  JournalDiscoveryKind,
  JournalDiscoveryState,
  PowerupId,
  RunSummary,
  SaveData,
  StatusEffectId,
  WeaponId,
} from '../types/gameTypes';

const VALID_DISCOVERY_IDS: Record<JournalDiscoveryKind, ReadonlySet<string>> = {
  weapons: new Set(Object.keys(WEAPONS)),
  evolutions: new Set(Object.keys(WEAPONS)),
  artifacts: new Set(Object.keys(ARTIFACTS)),
  enemies: new Set(Object.values(ENEMIES).filter((enemy) => !enemy.boss).map((enemy) => enemy.id)),
  bosses: new Set(Object.values(ENEMIES).filter((enemy) => enemy.boss).map((enemy) => enemy.id)),
  buffs: new Set(Object.keys(POWERUPS)),
  debuffs: new Set(Object.keys(STATUS_EFFECTS)),
};

export function createDefaultJournalDiscovery(): JournalDiscoveryState {
  return {
    weapons: ['bone-scythe'],
    evolutions: [],
    artifacts: [],
    enemies: [],
    bosses: [],
    buffs: [],
    debuffs: [],
    seen: {
      weapons: ['bone-scythe'],
      evolutions: [],
      artifacts: [],
      enemies: [],
      bosses: [],
      buffs: [],
      debuffs: [],
    },
  };
}

export function sanitizeJournalDiscovery(input: unknown): JournalDiscoveryState {
  const defaults = createDefaultJournalDiscovery();
  if (!input || typeof input !== 'object') {
    return defaults;
  }
  const record = input as Partial<Record<JournalDiscoveryKind, unknown>>;
  const discoveries: JournalEntryCollection = {
    weapons: sanitizeList(record.weapons, VALID_DISCOVERY_IDS.weapons, defaults.weapons) as WeaponId[],
    evolutions: sanitizeList(record.evolutions, VALID_DISCOVERY_IDS.evolutions) as WeaponId[],
    artifacts: sanitizeList(record.artifacts, VALID_DISCOVERY_IDS.artifacts) as ArtifactId[],
    enemies: sanitizeList(record.enemies, VALID_DISCOVERY_IDS.enemies) as EnemyId[],
    bosses: sanitizeList(record.bosses, VALID_DISCOVERY_IDS.bosses) as EnemyId[],
    buffs: sanitizeList(record.buffs, VALID_DISCOVERY_IDS.buffs) as PowerupId[],
    debuffs: sanitizeList(record.debuffs, VALID_DISCOVERY_IDS.debuffs) as StatusEffectId[],
  };
  const seenRecord = 'seen' in input && input.seen && typeof input.seen === 'object'
    ? input.seen as Partial<Record<JournalDiscoveryKind, unknown>>
    : {};
  const seen = sanitizeCollection(seenRecord, defaults.seen);
  for (const kind of Object.keys(VALID_DISCOVERY_IDS) as JournalDiscoveryKind[]) {
    const discovered = new Set(discoveries[kind] as string[]);
    (seen[kind] as string[]) = (seen[kind] as string[]).filter((id) => discovered.has(id));
  }
  return { ...discoveries, seen };
}

export function discoverJournalEntry(save: SaveData, kind: JournalDiscoveryKind, id: string): boolean {
  if (!VALID_DISCOVERY_IDS[kind].has(id)) {
    return false;
  }
  save.journal = sanitizeJournalDiscovery(save.journal);
  const list = save.journal[kind] as string[];
  if (list.includes(id)) {
    return false;
  }
  list.push(id);
  return true;
}

export function discoverEnemyJournalEntry(save: SaveData, id: EnemyId): boolean {
  return ENEMIES[id].boss
    ? discoverJournalEntry(save, 'bosses', id)
    : discoverJournalEntry(save, 'enemies', id);
}

export function isJournalEntryDiscovered(
  save: SaveData,
  kind: JournalDiscoveryKind,
  id: string,
): boolean {
  const journal = sanitizeJournalDiscovery(save.journal);
  return (journal[kind] as string[]).includes(id);
}

export function unseenJournalCount(save: SaveData, kind?: JournalDiscoveryKind): number {
  const journal = sanitizeJournalDiscovery(save.journal);
  const countFor = (category: JournalDiscoveryKind): number => {
    const seen = new Set(journal.seen[category] as string[]);
    return (journal[category] as string[]).filter((id) => !seen.has(id)).length;
  };
  return kind
    ? countFor(kind)
    : (Object.keys(VALID_DISCOVERY_IDS) as JournalDiscoveryKind[]).reduce(
        (total, category) => total + countFor(category),
        0,
      );
}

export function markJournalCategorySeen(save: SaveData, kind: JournalDiscoveryKind): boolean {
  save.journal = sanitizeJournalDiscovery(save.journal);
  const discovered = [...(save.journal[kind] as string[])];
  const seen = save.journal.seen[kind] as string[];
  if (seen.length === discovered.length && seen.every((id, index) => id === discovered[index])) {
    return false;
  }
  (save.journal.seen[kind] as string[]) = discovered;
  return true;
}

export function discoverFromRunSummary(save: SaveData, summary: RunSummary): void {
  for (const result of summary.weaponResults) {
    discoverJournalEntry(save, 'weapons', result.id);
  }
  for (const id of summary.artifacts) {
    discoverJournalEntry(save, 'artifacts', id);
  }
  for (const id of summary.upgradeIds) {
    const upgrade = UPGRADES[id];
    if (upgrade.unlockWeapon) {
      discoverJournalEntry(save, 'weapons', upgrade.unlockWeapon);
    }
    if (upgrade.category === 'weapon-evolution' && upgrade.targetWeapon) {
      discoverJournalEntry(save, 'evolutions', upgrade.targetWeapon);
    }
  }
  for (const result of summary.balance.enemyResults) {
    if (result.spawned > 0 || result.killed > 0) {
      discoverEnemyJournalEntry(save, result.id);
    }
  }
  for (const [id, collected] of Object.entries(summary.balance.powerupsCollected) as Array<[PowerupId, number]>) {
    if (collected > 0) {
      discoverJournalEntry(save, 'buffs', id);
    }
  }
}

function sanitizeList(input: unknown, validIds: ReadonlySet<string>, defaults: string[] = []): string[] {
  const values = Array.isArray(input) ? input : [];
  const unique = new Set(defaults.filter((id) => validIds.has(id)));
  for (const value of values) {
    if (typeof value === 'string' && validIds.has(value)) {
      unique.add(value);
    }
  }
  return [...unique];
}

function sanitizeCollection(
  input: Partial<Record<JournalDiscoveryKind, unknown>>,
  defaults: JournalEntryCollection,
): JournalEntryCollection {
  return {
    weapons: sanitizeList(input.weapons, VALID_DISCOVERY_IDS.weapons, defaults.weapons) as WeaponId[],
    evolutions: sanitizeList(input.evolutions, VALID_DISCOVERY_IDS.evolutions, defaults.evolutions) as WeaponId[],
    artifacts: sanitizeList(input.artifacts, VALID_DISCOVERY_IDS.artifacts, defaults.artifacts) as ArtifactId[],
    enemies: sanitizeList(input.enemies, VALID_DISCOVERY_IDS.enemies, defaults.enemies) as EnemyId[],
    bosses: sanitizeList(input.bosses, VALID_DISCOVERY_IDS.bosses, defaults.bosses) as EnemyId[],
    buffs: sanitizeList(input.buffs, VALID_DISCOVERY_IDS.buffs, defaults.buffs) as PowerupId[],
    debuffs: sanitizeList(input.debuffs, VALID_DISCOVERY_IDS.debuffs, defaults.debuffs) as StatusEffectId[],
  };
}
