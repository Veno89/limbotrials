import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import { ARTIFACTS } from '../data/artifacts';
import { CHARACTERS } from '../data/characters';
import { xpRequiredForNextLevel } from '../data/progression';
import { EVOLUTION_READY_LEVEL, MAX_WEAPON_LEVEL, WEAPON_CAP } from '../types/gameTypes';
import type {
  AppliedRewardResult,
  ArtifactDefinition,
  BalancePresetId,
  CharacterId,
  PlayerStats,
  PlayerDamageSourceId,
  RunSummary,
  SaveData,
  UpgradeDefinition,
  UpgradeId,
  WeaponId,
  WeaponModifier,
  WeaponUpgradeEffectId,
  WeaponRuntimeState,
  ArtifactId,
  ThreatSnapshot,
} from '../types/gameTypes';
import {
  applyStatModifiers,
  applyWeaponModifiers,
  BASE_PLAYER_STATS,
  clampPlayerStats,
} from '../utils/statModifiers';
import { BalanceTelemetry } from './BalanceTelemetry';
import { SPECIAL_EFFECT_HANDLERS } from './SpecialEffectHandlers';
import { calculateThreat } from './threatRules';
import { CurseSystem } from './CurseSystem';

export interface DamageResolution {
  fatal: boolean;
  dealt: number;
  absorbed: number;
}

export class RunState {
  readonly stats: PlayerStats;
  readonly weapons = new Set<WeaponId>();
  readonly weaponStates = new Map<WeaponId, WeaponRuntimeState>();
  readonly upgradeStacks = new Map<UpgradeId, number>();
  readonly artifacts = new Set<ArtifactId>();
  readonly balance: BalanceTelemetry;
  readonly characterId: CharacterId;
  readonly curse = new CurseSystem();
  health: number;
  shield = 0;
  level = 1;
  xp = 0;
  xpToNext = xpRequiredForNextLevel(1);
  kills = 0;
  souls = 0;
  elapsedMs = 0;
  rerolls: number;
  private weaponCap = WEAPON_CAP;
  private readonly globalWeaponModifiers: WeaponModifier[] = [];
  private readonly artifactDefinitions = new Map<ArtifactId, ArtifactDefinition>();

  constructor(
    save: SaveData,
    presetId: BalancePresetId = 'standard',
    characterId: CharacterId = save.selectedCharacter,
  ) {
    this.balance = new BalanceTelemetry(presetId);
    this.characterId = save.unlockedCharacters.includes(characterId) ? characterId : 'haunted';
    const character = CHARACTERS[this.characterId];
    this.stats = clampPlayerStats({ ...BASE_PLAYER_STATS, ...character.baseStatOverrides });
    applyStatModifiers(this.stats, [
      { stat: 'maxHealth', mode: 'add', value: save.metaLevels['vital-remnant'] * 10 },
      { stat: 'damage', mode: 'add', value: save.metaLevels['cruel-memory'] * 0.05 },
      { stat: 'soulGain', mode: 'add', value: save.metaLevels['hungry-echo'] * 0.12 },
    ]);
    this.health = this.stats.maxHealth;
    this.rerolls = 1 + save.metaLevels['fateful-thread'];
    this.addWeapon(character.starterWeapon);
  }

  addXp(amount: number): number {
    if (amount <= 0) {
      return 0;
    }
    this.xp += amount * this.stats.xpGain;
    let levelsGained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      levelsGained += 1;
      this.xpToNext = xpRequiredForNextLevel(this.level);
      this.balance.recordLevel(this.elapsedMs, this.level);
    }
    return levelsGained;
  }

  addSouls(amount: number): void {
    if (amount <= 0) {
      return;
    }
    const collected = Math.max(1, Math.round(amount * this.stats.soulGain));
    this.souls += collected;
    this.balance.recordSouls(collected, this.elapsedMs);
  }

  addWeapon(id: WeaponId): boolean {
    if (this.weapons.has(id) || this.weapons.size >= this.weaponCap) {
      return false;
    }
    const definition = WEAPONS[id];
    this.weapons.add(id);
    this.balance.recordWeaponEquipped(id, this.elapsedMs);
    this.weaponStates.set(id, {
      level: 1,
      stats: { ...definition.baseStats },
    });
    this.applyWeaponModifiers(id, this.weaponStates.get(id)!, this.globalWeaponModifiers);
    return true;
  }

  getWeaponState(id: WeaponId): WeaponRuntimeState {
    const state = this.weaponStates.get(id);
    if (!state) {
      throw new Error(`Weapon ${id} is not equipped.`);
    }
    return state;
  }

  getWeaponLevels(): Map<WeaponId, number> {
    return new Map([...this.weaponStates].map(([id, state]) => [id, state.level]));
  }

  getThreatSnapshot(): ThreatSnapshot {
    const weaponStates = [...this.weaponStates.values()];
    return calculateThreat({
      elapsedMs: this.elapsedMs,
      playerLevel: this.level,
      weaponCount: weaponStates.length,
      totalWeaponLevels: weaponStates.reduce((total, state) => total + state.level, 0),
      evolvedWeaponCount: weaponStates.filter((state) => state.level === MAX_WEAPON_LEVEL).length,
      threatPowerBonus: this.stats.threatPowerBonus + this.curse.snapshot().level / 8,
    });
  }

  applyUpgrade(id: UpgradeId): boolean {
    return this.applyUpgradeChoice(UPGRADES[id]).applied;
  }

  applyUpgradeChoice(definition: UpgradeDefinition): AppliedRewardResult {
    const applied = this.applyUpgradeDefinition(definition);
    return {
      applied,
      ...(applied ? { curse: this.applyCurseReward(definition.curse, definition.id) } : {}),
    };
  }

  private applyUpgradeDefinition(definition: UpgradeDefinition): boolean {
    if ((this.upgradeStacks.get(definition.id) ?? 0) >= definition.maxStacks) {
      return false;
    }
    const previousMaxHealth = this.stats.maxHealth;
    let applied = false;

    if (definition.category === 'weapon' && definition.unlockWeapon) {
      applied = this.addWeapon(definition.unlockWeapon);
      if (applied && definition.weaponModifiers) {
        const state = this.weaponStates.get(definition.unlockWeapon);
        if (state) {
          this.applyWeaponModifiers(definition.unlockWeapon, state, definition.weaponModifiers);
        }
      }
    } else if (definition.category === 'weapon-level' && definition.targetWeapon) {
      const state = this.weaponStates.get(definition.targetWeapon);
      if (state && state.level < EVOLUTION_READY_LEVEL) {
        this.advanceWeapon(definition.targetWeapon, state);
        this.applyWeaponModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        applied = true;
      }
    } else if (definition.category === 'weapon-upgrade' && definition.targetWeapon) {
      const state = this.weaponStates.get(definition.targetWeapon);
      if (state && (state.level < EVOLUTION_READY_LEVEL || state.level === MAX_WEAPON_LEVEL)) {
        this.applyWeaponModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        if (state.level < EVOLUTION_READY_LEVEL) {
          this.advanceWeapon(definition.targetWeapon, state);
        }
        applied = true;
      }
    } else if (definition.category === 'weapon-evolution' && definition.targetWeapon) {
      const state = this.weaponStates.get(definition.targetWeapon);
      if (state?.level === EVOLUTION_READY_LEVEL) {
        this.advanceWeapon(definition.targetWeapon, state);
        this.applyWeaponModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        applied = true;
      }
    } else if (definition.category === 'stat' || definition.category === 'curse') {
      applyStatModifiers(this.stats, definition.modifiers ?? []);
      applied = true;
    }

    if (!applied) {
      return false;
    }
    this.upgradeStacks.set(definition.id, (this.upgradeStacks.get(definition.id) ?? 0) + 1);
    if (this.stats.maxHealth > previousMaxHealth) {
      this.health = Math.min(this.stats.maxHealth, this.health + (this.stats.maxHealth - previousMaxHealth));
    }
    this.health = Math.min(this.health, this.stats.maxHealth);
    return true;
  }

  applyArtifact(id: ArtifactId): boolean {
    const definition = ARTIFACTS[id];
    return definition ? this.applyArtifactReward(definition).applied : false;
  }

  applyArtifactReward(definition: ArtifactDefinition): AppliedRewardResult {
    if (this.artifacts.has(definition.id)) {
      return { applied: false };
    }

    const previousMaxHealth = this.stats.maxHealth;
    this.artifacts.add(definition.id);
    this.artifactDefinitions.set(definition.id, definition);

    if (definition.modifiers) {
      applyStatModifiers(this.stats, definition.modifiers);
    }
    if (definition.weaponModifiers) {
      this.globalWeaponModifiers.push(...definition.weaponModifiers);
      for (const [weaponId, state] of this.weaponStates) {
        this.applyWeaponModifiers(weaponId, state, definition.weaponModifiers);
      }
    }
    if (definition.special) {
      SPECIAL_EFFECT_HANDLERS[definition.special](this);
    }

    if (this.stats.maxHealth > previousMaxHealth) {
      this.health = Math.min(this.stats.maxHealth, this.health + (this.stats.maxHealth - previousMaxHealth));
    }
    this.health = Math.min(this.health, this.stats.maxHealth);
    return {
      applied: true,
      curse: this.applyCurseReward(definition.curse, definition.id),
    };
  }

  hasArtifact(id: ArtifactId): boolean {
    return this.artifacts.has(id);
  }

  getArtifactDefinition(id: ArtifactId): ArtifactDefinition {
    return this.artifactDefinitions.get(id) ?? ARTIFACTS[id];
  }

  hasUpgrade(id: UpgradeId): boolean {
    return (this.upgradeStacks.get(id) ?? 0) > 0;
  }

  hasWeaponEffect(effect: WeaponUpgradeEffectId): boolean {
    for (const [id, stacks] of this.upgradeStacks) {
      if (stacks > 0 && UPGRADES[id].weaponEffect === effect) {
        return true;
      }
    }
    return false;
  }

  increaseWeaponCap(amount: number): void {
    this.weaponCap = Math.max(WEAPON_CAP, this.weaponCap + amount);
  }

  addGlobalWeaponPierce(amount: number): void {
    const modifier: WeaponModifier = { stat: 'pierce', mode: 'add', value: amount };
    this.globalWeaponModifiers.push(modifier);
    for (const [weaponId, state] of this.weaponStates) {
      this.applyWeaponModifiers(weaponId, state, [modifier]);
    }
  }

  getWeaponCap(): number {
    return this.weaponCap;
  }

  useReroll(): boolean {
    if (this.rerolls <= 0) {
      return false;
    }
    this.rerolls -= 1;
    return true;
  }

  claimSkipReward(): number {
    const reward = 6 + this.level * 2;
    this.addSouls(reward);
    return reward;
  }

  takeDamage(amount: number, source: PlayerDamageSourceId): DamageResolution {
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    const dealt = amount - absorbed;
    this.health -= dealt;
    this.balance.recordDamageTaken(source, dealt, absorbed, this.elapsedMs);
    return { fatal: this.health <= 0, dealt, absorbed };
  }

  heal(amount: number): number {
    const before = this.health;
    this.health = Math.min(this.stats.maxHealth, this.health + amount);
    const healed = this.health - before;
    this.balance.recordHealing(healed, this.elapsedMs);
    return healed;
  }

  recordWeaponHit(id: WeaponId, amount: number, killed: boolean, critical: boolean, boss: boolean): void {
    this.balance.recordWeaponHit(id, amount, killed, critical, boss, this.elapsedMs);
  }

  summary(victory: boolean): RunSummary {
    const balance = this.balance.report(this.elapsedMs);
    return {
      victory,
      elapsedMs: this.elapsedMs,
      kills: this.kills,
      souls: this.souls,
      level: this.level,
      characterId: this.characterId,
      artifacts: [...this.artifacts],
      cursedArtifacts: [...this.artifacts].filter((id) => Boolean(this.getArtifactDefinition(id).curse)),
      upgradeIds: [...this.upgradeStacks.keys()],
      curse: this.curse.snapshot(),
      newlyUnlockedCharacters: [],
      newlyUnlockedArtifactTiers: [],
      weaponResults: balance.weaponResults,
      balance,
    };
  }

  private applyWeaponModifiers(
    id: WeaponId,
    state: WeaponRuntimeState,
    modifiers: readonly WeaponModifier[],
  ): void {
    applyWeaponModifiers(state.stats, modifiers, WEAPONS[id].baseStats);
  }

  private advanceWeapon(id: WeaponId, state: WeaponRuntimeState): void {
    state.level = Math.min(MAX_WEAPON_LEVEL, state.level + 1);
    this.applyWeaponModifiers(id, state, WEAPONS[id].levelGrowth);
  }

  private applyCurseReward(reward: UpgradeDefinition['curse'], sourceId: string): AppliedRewardResult['curse'] {
    if (!reward) {
      return undefined;
    }
    const result = this.curse.gain(reward.curseGain, sourceId);
    if (result) {
      this.balance.recordTimeline(`curse:${sourceId}:+${result.amount}`, this.elapsedMs);
      for (const tier of result.crossedTiers) {
        this.balance.recordTimeline(`curse:tier:${tier.id}`, this.elapsedMs);
      }
    }
    return result;
  }
}
