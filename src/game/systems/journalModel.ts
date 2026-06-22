import { ARTIFACTS } from '../data/artifacts';
import { ENEMIES } from '../data/enemies';
import { POWERUPS } from '../data/powerups';
import { STATUS_EFFECTS } from '../data/statusEffects';
import { WEAPONS } from '../data/weapons';
import type { JournalDiscoveryKind, SaveData } from '../types/gameTypes';
import { isJournalEntryDiscovered } from './JournalDiscoverySystem';

export interface JournalCategoryDefinition {
  id: JournalDiscoveryKind;
  label: string;
  emptyHint: string;
}

export interface JournalEntryView {
  id: string;
  category: JournalDiscoveryKind;
  title: string;
  subtitle: string;
  description: string;
  texture: string;
  discovered: boolean;
  details: string[];
}

export const JOURNAL_CATEGORIES: readonly JournalCategoryDefinition[] = [
  { id: 'weapons', label: 'Weapons', emptyHint: 'Claim weapons during level-up choices to identify them.' },
  { id: 'evolutions', label: 'Evolutions', emptyHint: 'Evolve weapons to record their awakened forms.' },
  { id: 'artifacts', label: 'Artifacts', emptyHint: 'Open reliquaries to identify artifacts.' },
  { id: 'enemies', label: 'Enemies', emptyHint: 'Encounter enemies in the trial to identify them.' },
  { id: 'bosses', label: 'Bosses', emptyHint: 'Face bosses to carve them into the record.' },
  { id: 'buffs', label: 'Buffs', emptyHint: 'Collect temporary boons to identify them.' },
  { id: 'debuffs', label: 'Debuffs', emptyHint: 'Inflict or suffer status effects to identify them.' },
];

export function buildJournalEntries(save: SaveData, category: JournalDiscoveryKind): JournalEntryView[] {
  if (category === 'weapons') {
    return Object.values(WEAPONS).map((weapon) => {
      const discovered = isJournalEntryDiscovered(save, 'weapons', weapon.id);
      const evolutionDiscovered = isJournalEntryDiscovered(save, 'evolutions', weapon.id);
      return {
        id: weapon.id,
        category,
        title: discovered ? weapon.name : '???',
        subtitle: discovered ? weapon.behavior.replaceAll('-', ' ').toUpperCase() : 'UNKNOWN WEAPON',
        description: discovered ? weapon.description : 'This weapon has not yet been claimed in a trial.',
        texture: weapon.iconTexture,
        discovered,
        details: discovered
          ? [
              `Damage ${weapon.baseStats.damage} / Cooldown ${(weapon.baseStats.cooldownMs / 1000).toFixed(1)}s`,
              `Range ${weapon.baseStats.range} / Area ${weapon.baseStats.area}`,
              evolutionDiscovered
                ? `Evolution: ${weapon.evolution.name} - ${weapon.evolution.description}`
                : 'Evolution: ???',
            ]
          : [weapon.id === 'sanguine-needle'
              ? 'Find this weapon in the wandering Blood Market.'
              : 'Find this weapon through a level-up choice or starter loadout.'],
      };
    });
  }
  if (category === 'evolutions') {
    return Object.values(WEAPONS).map((weapon) => {
      const discovered = isJournalEntryDiscovered(save, 'evolutions', weapon.id);
      return {
        id: weapon.id,
        category,
        title: discovered ? weapon.evolution.name : '???',
        subtitle: discovered ? `${weapon.name.toUpperCase()} EVOLUTION` : 'UNKNOWN EVOLUTION',
        description: discovered
          ? weapon.evolution.description
          : 'Awaken this weapon at level seven to reveal its evolution.',
        texture: weapon.iconTexture,
        discovered,
        details: discovered ? [`Base weapon: ${weapon.name}`] : ['Reach the explicit evolution choice in a run.'],
      };
    });
  }
  if (category === 'artifacts') {
    return Object.values(ARTIFACTS).map((artifact) => {
      const discovered = isJournalEntryDiscovered(save, 'artifacts', artifact.id);
      return {
        id: artifact.id,
        category,
        title: discovered ? artifact.name : '???',
        subtitle: discovered ? `${artifact.rarity.toUpperCase()} / ${artifact.poolTier.toUpperCase()}` : 'UNKNOWN ARTIFACT',
        description: discovered ? artifact.description : 'This artifact has not yet been claimed.',
        texture: artifact.iconTexture,
        discovered,
        details: discovered
          ? [
              artifact.effect ? `Runtime effect: ${artifact.effect.replaceAll('-', ' ')}` : 'Runtime effect: none',
              artifact.special ? `Special rule: ${artifact.special.replaceAll('-', ' ')}` : 'Special rule: none',
            ]
          : [artifact.source === 'shop'
              ? 'Purchase this artifact from the wandering Blood Market.'
              : 'Open reliquaries during standard runs to identify artifacts.'],
      };
    });
  }
  if (category === 'enemies' || category === 'bosses') {
    return Object.values(ENEMIES)
      .filter((enemy) => (category === 'bosses' ? enemy.boss : !enemy.boss))
      .map((enemy) => {
        const discovered = isJournalEntryDiscovered(save, category, enemy.id);
        return {
          id: enemy.id,
          category,
          title: discovered ? enemy.name : '???',
          subtitle: discovered ? enemy.behavior.replaceAll('-', ' ').toUpperCase() : 'UNKNOWN SOUL',
          description: discovered
            ? enemy.spawnRequirements
              ? 'A gated threat that appears only when Limbo has reason to answer you.'
              : 'A known hostile soul recorded from the trial.'
            : 'Encounter this foe in a trial to identify it.',
          texture: enemy.texture,
          discovered,
          details: discovered
            ? [
                `HP ${enemy.maxHealth} / Damage ${enemy.contactDamage} / Speed ${enemy.speed}`,
                `XP ${enemy.xp} / Souls ${enemy.soulValue}`,
                enemy.elite ? 'Type: Elite' : enemy.boss ? 'Type: Boss' : 'Type: Regular',
              ]
            : ['Survive long enough, raise curse, or face the Warden to reveal this entry.'],
        };
      });
  }
  if (category === 'buffs') {
    return Object.values(POWERUPS).map((powerup) => {
      const discovered = isJournalEntryDiscovered(save, 'buffs', powerup.id);
      return {
        id: powerup.id,
        category,
        title: discovered ? powerup.name : '???',
        subtitle: discovered ? (powerup.durationMs ? 'TEMPORARY BUFF' : 'IMMEDIATE BOON') : 'UNKNOWN BOON',
        description: discovered ? powerup.pickupMessage : 'Collect this boon during a run to identify it.',
        texture: powerup.texture,
        discovered,
        details: discovered
          ? [powerup.durationMs ? `Duration ${(powerup.durationMs / 1000).toFixed(0)}s` : 'Instant effect']
          : ['Temporary powerups and immediate boons are recorded when collected.'],
      };
    });
  }
  return Object.values(STATUS_EFFECTS).map((status) => {
    const discovered = isJournalEntryDiscovered(save, 'debuffs', status.id);
    return {
      id: status.id,
      category,
      title: discovered ? status.name : '???',
      subtitle: discovered ? 'STATUS EFFECT' : 'UNKNOWN STATUS',
      description: discovered ? status.description : 'Apply or suffer this status effect to identify it.',
      texture: status.iconTexture,
      discovered,
      details: discovered
        ? [
            `Duration ${(status.durationMs / 1000).toFixed(1)}s / Tick ${(status.tickIntervalMs / 1000).toFixed(1)}s`,
            `Base tick ${status.baseDamagePerTick} / Max stacks ${status.maxStacks}`,
          ]
        : ['Status icons are recorded when the effect appears in combat.'],
    };
  });
}

export function journalDiscoveryCount(save: SaveData, category: JournalDiscoveryKind): { known: number; total: number } {
  const entries = buildJournalEntries(save, category);
  return {
    known: entries.filter((entry) => entry.discovered).length,
    total: entries.length,
  };
}
