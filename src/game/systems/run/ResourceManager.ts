import type { RunState } from '../RunState';
import { xpRequiredForNextLevel } from '../../data/progression';
import type { PlayerDamageSourceId } from '../../types/gameTypes';

export interface DamageResolution {
  fatal: boolean;
  dealt: number;
  absorbed: number;
}

export class ResourceManager {
  health: number;
  shield = 0;
  level = 1;
  xp = 0;
  xpToNext = xpRequiredForNextLevel(1);
  kills = 0;
  souls = 0;
  rerolls = 1;

  constructor(private readonly run: RunState, initialMaxHealth: number) {
    this.health = initialMaxHealth;
  }

  addXp(amount: number): number {
    if (amount <= 0) return 0;
    this.xp += amount * this.run.stats.current.xpGain;
    let levelsGained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      levelsGained += 1;
      this.xpToNext = xpRequiredForNextLevel(this.level);
      this.run.balance.recordLevel(this.run.elapsedMs, this.level);
    }
    return levelsGained;
  }

  addSouls(amount: number): void {
    if (amount <= 0) return;
    const collected = Math.max(1, Math.round(amount * this.run.stats.current.soulGain));
    this.souls += collected;
    this.run.balance.recordSouls(collected, this.run.elapsedMs);
  }

  spendBlood(amount: number): boolean {
    const cost = Math.max(0, Math.round(amount));
    if (cost <= 0 || this.health - cost < 1) return false;
    this.health -= cost;
    this.run.balance.recordTimeline(`shop:blood:-${cost}`, this.run.elapsedMs);
    return true;
  }

  takeDamage(amount: number, source: PlayerDamageSourceId): DamageResolution {
    const absorbed = Math.min(this.shield, amount);
    this.shield -= absorbed;
    const dealt = amount - absorbed;
    this.health -= dealt;
    this.run.balance.recordDamageTaken(source, dealt, absorbed, this.run.elapsedMs);
    return { fatal: this.health <= 0, dealt, absorbed };
  }

  heal(amount: number): number {
    const maxHealth = this.run.stats.current.maxHealth;
    const before = this.health;
    this.health = Math.min(maxHealth, this.health + amount);
    const healed = this.health - before;
    this.run.balance.recordHealing(healed, this.run.elapsedMs);
    return healed;
  }

  addRerolls(amount: number): void {
    this.rerolls += Math.max(0, amount);
  }

  useReroll(): boolean {
    if (this.rerolls <= 0) return false;
    this.rerolls -= 1;
    return true;
  }

  claimSkipReward(): number {
    const reward = 6 + this.level * 2;
    this.addSouls(reward);
    return reward;
  }

  addStartingShield(amount: number): void {
    this.shield += Math.max(0, amount);
  }

  syncMaxHealth(previousMaxHealth: number): void {
    const maxHealth = this.run.stats.current.maxHealth;
    if (maxHealth > previousMaxHealth) {
      this.health = Math.min(maxHealth, this.health + (maxHealth - previousMaxHealth));
    }
    this.health = Math.min(this.health, maxHealth);
  }
}
