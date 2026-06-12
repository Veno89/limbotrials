import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../constants';
import {
  BALANCE_PRESETS,
  getPresetReplenishCount,
  type BalancePresetDefinition,
} from '../data/balancePresets';
import type { BalancePresetId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';

export function applyBalancePreset(
  id: Exclude<BalancePresetId, 'standard'>,
  run: RunState,
  enemies: EnemySystem,
  player: Phaser.Physics.Arcade.Image,
): void {
  const preset = BALANCE_PRESETS[id];
  run.elapsedMs = preset.elapsedMs;
  run.balance.setMeasurementStart(run.elapsedMs);
  for (const weapon of preset.weapons) {
    run.addWeapon(weapon);
  }
  for (const upgrade of preset.upgrades) {
    if (run.applyUpgrade(upgrade)) {
      run.balance.recordChoice('preset', 'selected', run.elapsedMs, upgrade);
    }
  }
  for (const group of preset.spawns) {
    for (let index = 0; index < group.count; index += 1) {
      const angle = (index / group.count) * Math.PI * 2;
      const radius = group.radius + (index % 3) * 28;
      enemies.spawn(
        group.enemyId,
        Phaser.Math.Clamp(player.x + Math.cos(angle) * radius, 60, ARENA_WIDTH - 60),
        Phaser.Math.Clamp(player.y + Math.sin(angle) * radius, 60, ARENA_HEIGHT - 60),
        run.elapsedMs,
      );
    }
  }
  run.balance.recordTimeline(`preset:${id}`, run.elapsedMs);
}

export class BalancePresetSpawnSystem {
  private nextReplenishAt: number;
  private readonly preset: BalancePresetDefinition;

  constructor(
    id: Exclude<BalancePresetId, 'standard'>,
    private readonly enemies: EnemySystem,
  ) {
    this.preset = BALANCE_PRESETS[id];
    this.nextReplenishAt = this.preset.elapsedMs + this.preset.replenishEveryMs;
  }

  update(elapsedMs: number): void {
    if (elapsedMs < this.nextReplenishAt) {
      return;
    }
    this.nextReplenishAt = elapsedMs + this.preset.replenishEveryMs;
    for (const group of this.preset.spawns) {
      if (!group.maintainCount) {
        continue;
      }
      const spawnCount = getPresetReplenishCount(
        group.maintainCount,
        group.batchSize ?? 1,
        this.enemies.count(group.enemyId),
      );
      for (let index = 0; index < spawnCount; index += 1) {
        this.enemies.spawnAroundPlayer(group.enemyId, elapsedMs, group.radius + (index % 3) * 24);
      }
    }
  }
}
