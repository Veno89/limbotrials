import { CHARACTERS } from '../data/characters';
import type {
  BalancePresetId,
  CharacterId,
  SaveData,
  ThreatSnapshot,
  RunSummary,
  UpgradeDefinition,
  AppliedRewardResult,
  UpgradeId,
  ArtifactId
} from '../types/gameTypes';
import { BalanceTelemetry } from './BalanceTelemetry';
import { CurseSystem } from './CurseSystem';
import { getAllocatedTalentNodes } from './TalentTreeSystem';
import { TALENT_EFFECT_HANDLERS } from './TalentEffectHandlers';
import { calculateThreat } from './threatRules';
import { ResourceManager } from './run/ResourceManager';
import { WeaponStateManager } from './run/WeaponStateManager';
import { UpgradeManager } from './run/UpgradeManager';
import { ArtifactManager } from './run/ArtifactManager';
import { BoneScytheTalentManager } from './run/BoneScytheTalentManager';
import { StatManager } from './run/StatManager';
import { MAX_WEAPON_LEVEL } from '../types/gameTypes';

export interface CurseRewardSource {
  kind: 'upgrade' | 'artifact';
  id: UpgradeId | ArtifactId;
  baseId: UpgradeId | ArtifactId;
  name: string;
  generated: boolean;
}

export class RunState {
  public readonly stats: StatManager;
  public readonly resources: ResourceManager;
  public readonly weapons: WeaponStateManager;
  public readonly upgrades: UpgradeManager;
  public readonly artifacts: ArtifactManager;
  public readonly boneScythe: BoneScytheTalentManager;
  public readonly balance: BalanceTelemetry;
  public readonly curse: CurseSystem;
  public readonly characterId: CharacterId;
  public elapsedMs = 0;
  public kills = 0;

  constructor(
    save: SaveData,
    presetId: BalancePresetId = 'standard',
    characterId: CharacterId = save.selectedCharacter,
  ) {
    this.balance = new BalanceTelemetry(presetId);
    this.characterId = save.unlockedCharacters.includes(characterId) ? characterId : 'haunted';
    this.curse = new CurseSystem();

    this.stats = new StatManager(this.characterId);
    this.resources = new ResourceManager(this, this.stats.current.maxHealth);
    this.weapons = new WeaponStateManager(this);
    this.upgrades = new UpgradeManager(this);
    this.artifacts = new ArtifactManager(this);
    this.boneScythe = new BoneScytheTalentManager();

    this.applyTalentProgress(save);
    this.resources.health = this.stats.current.maxHealth;
    this.weapons.add(CHARACTERS[this.characterId].starterWeapon);
  }

  getThreatSnapshot(): ThreatSnapshot {
    const weaponStates = [...this.weapons.states.values()];
    return calculateThreat({
      elapsedMs: this.elapsedMs,
      playerLevel: this.resources.level,
      weaponCount: weaponStates.length,
      totalWeaponLevels: weaponStates.reduce((total, state) => total + state.level, 0),
      evolvedWeaponCount: weaponStates.filter((state) => state.level === MAX_WEAPON_LEVEL).length,
      threatPowerBonus: this.stats.current.threatPowerBonus + this.curse.snapshot().level / 8,
    });
  }

  summary(victory: boolean): RunSummary {
    const balance = this.balance.report(this.elapsedMs);
    return {
      victory,
      elapsedMs: this.elapsedMs,
      kills: this.kills,
      souls: this.resources.souls,
      level: this.resources.level,
      characterId: this.characterId,
      artifacts: [...this.artifacts.collected],
      cursedArtifacts: [...this.artifacts.collected].filter((id) => Boolean(this.artifacts.getDefinition(id).curse)),
      upgradeIds: [...this.upgrades.stacks.keys()],
      curse: this.curse.snapshot(),
      newlyUnlockedCharacters: [],
      newlyUnlockedArtifactTiers: [],
      weaponResults: balance.weaponResults,
      balance,
    };
  }

  applyCurseReward(
    reward: UpgradeDefinition['curse'],
    source: CurseRewardSource,
  ): AppliedRewardResult['curse'] {
    if (!reward) {
      return undefined;
    }
    const result = this.curse.gain(reward.curseGain, source.id);
    if (result) {
      this.balance.recordTimeline(`curse:${source.id}:+${result.amount}`, this.elapsedMs);
      this.balance.recordCursedReward({
        atMs: this.elapsedMs,
        sourceKind: source.kind,
        sourceId: source.id,
        baseId: source.baseId,
        generated: source.generated,
        name: source.name,
        pattern: reward.pattern,
        curseGain: result.amount,
        downside: reward.downside,
        ...(reward.warning ? { warning: reward.warning } : {}),
        curseBefore: result.previous.level,
        curseAfter: result.current.level,
        tierBefore: result.previous.tier,
        tierAfter: result.current.tier,
        crossedTiers: result.crossedTiers.map((tier) => tier.id),
      });
      for (const tier of result.crossedTiers) {
        this.balance.recordTimeline(`curse:tier:${tier.id}`, this.elapsedMs);
      }
    }
    return result;
  }

  addStartingCurse(amount: number, reason: string): void {
    const result = this.curse.gain(amount, reason);
    if (!result) return;
    this.balance.recordTimeline(`talent:curse:+${result.amount}`, this.elapsedMs);
    for (const tier of result.crossedTiers) {
      this.balance.recordTimeline(`curse:tier:${tier.id}`, this.elapsedMs);
    }
  }

  private applyTalentProgress(save: SaveData): void {
    const nodes = getAllocatedTalentNodes(save, this.characterId);
    for (const { node, ranks } of nodes) {
      for (let rank = 0; rank < ranks; rank += 1) {
        if (node.modifiers) {
          this.stats.applyModifiers(node.modifiers);
        }
        if (node.weaponModifiers) {
          if (node.targetWeapon) {
            const modifiers = this.weapons.targetedTalentModifiers.get(node.targetWeapon) ?? [];
            modifiers.push(...node.weaponModifiers);
            this.weapons.targetedTalentModifiers.set(node.targetWeapon, modifiers);
          } else {
            this.weapons.globalModifiers.push(...node.weaponModifiers);
          }
        }
      }
      if (node.effect) {
        TALENT_EFFECT_HANDLERS[node.effect](this, ranks);
      }
    }
  }
}
