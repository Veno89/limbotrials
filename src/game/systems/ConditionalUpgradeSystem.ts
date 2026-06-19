import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { EnemyDefinition } from '../types/gameTypes';
import type { JuiceSystem } from './JuiceSystem';
import type { RunState } from './RunState';
import type { EnemyDeath } from './EnemySystem';
import {
  conditionalDamageMultiplier,
  echoMarkSoulReward,
  FUGITIVE_WAKE_DURATION_MS,
  OATHHUNTER_ELITE_SOULS,
} from './conditionalUpgradeRules';

export class ConditionalUpgradeSystem {
  private fugitiveWakeUntil = 0;

  constructor(
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
  ) {}

  onDash(time: number): void {
    if (!this.run.hasConditionalEffect('fugitive-wake')) {
      return;
    }
    this.fugitiveWakeUntil = time + FUGITIVE_WAKE_DURATION_MS;
    this.run.balance.recordTimeline('conditional:fugitive-wake', this.run.elapsedMs);
    this.juice.ring(this.player.x, this.player.y, 76, COLORS.pale, 220);
  }

  damageMultiplier(target: EnemyDefinition, time: number): number {
    return conditionalDamageMultiplier({
      effects: new Set(this.run.getConditionalEffects()),
      moving: this.isMoving(),
      fugitiveWakeActive: time < this.fugitiveWakeUntil,
      shielded: this.run.shield > 0,
      target,
    });
  }

  onEnemyDeath(death: EnemyDeath): void {
    let bonusSouls = 0;
    if (this.run.hasConditionalEffect('oathhunter-tithe') && death.definition.elite && !death.definition.boss) {
      bonusSouls += OATHHUNTER_ELITE_SOULS;
    }
    if (this.run.hasConditionalEffect('echo-mark')) {
      bonusSouls += echoMarkSoulReward(death.definition);
    }
    if (bonusSouls <= 0) {
      return;
    }
    this.run.addSouls(bonusSouls);
    this.run.balance.recordTimeline(`conditional:souls:${death.definition.id}:+${bonusSouls}`, this.run.elapsedMs);
    if (bonusSouls >= OATHHUNTER_ELITE_SOULS) {
      this.juice.warning(`HUNT REWARDED: +${bonusSouls} SOULS`, '#d7bd82');
    }
  }

  private isMoving(): boolean {
    const body = this.player.body as Phaser.Physics.Arcade.Body | null;
    return Boolean(body && body.velocity.lengthSq() > 1);
  }
}
