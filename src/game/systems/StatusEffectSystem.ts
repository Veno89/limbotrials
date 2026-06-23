import Phaser from 'phaser';
import { STATUS_EFFECTS } from '../data/statusEffects';
import type { EnemyDefinition, StatusEffectId, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';
import {
  advanceStatusTicks,
  applyStatusEffect,
  dueStatusTicks,
  fullDurationStatusDamage,
  isStatusExpired,
  statusTickDamage,
  type ActiveStatusEffect,
  type StatusApplicationSource,
} from './statusEffectRules';

interface EnemyStatusEntry {
  status: ActiveStatusEffect;
  icon: Phaser.GameObjects.Image;
}

export interface ConsumedStatusEffect {
  damage: number;
  sourceWeaponId?: WeaponId;
}

export class StatusEffectSystem {
  private readonly enemyStatuses = new Map<
    Phaser.Physics.Arcade.Image,
    Map<StatusEffectId, EnemyStatusEntry>
  >();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly onStatusApplied: (id: StatusEffectId) => void = () => undefined,
  ) {}

  applyToEnemy(
    sprite: Phaser.Physics.Arcade.Image,
    id: StatusEffectId,
    source: StatusApplicationSource = {},
  ): void {
    const definition = STATUS_EFFECTS[id];
    const enemyDefinition = this.enemies.getDefinition(sprite);
    if (!sprite.active || !enemyDefinition) {
      return;
    }
    this.onStatusApplied(id);
    const statuses = this.getEnemyStatuses(sprite);
    const existing = statuses.get(id);
    const now = this.scene.time.now;
    const existingStatus = existing && !isStatusExpired(existing.status, now) ? existing.status : undefined;
    const status = applyStatusEffect(definition, now, existingStatus, source);
    if (existing) {
      existing.status = status;
      existing.icon.setDisplaySize(this.iconSize(status.stacks), this.iconSize(status.stacks)).setAlpha(0.95);
      return;
    }
    statuses.set(id, {
      status,
      icon: this.createIcon(id),
    });
  }

  consumeFromEnemy(
    sprite: Phaser.Physics.Arcade.Image,
    id: StatusEffectId,
  ): ConsumedStatusEffect | undefined {
    const statuses = this.enemyStatuses.get(sprite);
    const entry = statuses?.get(id);
    if (!statuses || !entry) {
      return undefined;
    }
    if (isStatusExpired(entry.status, this.scene.time.now)) {
      this.removeStatus(statuses, id);
      if (statuses.size <= 0) {
        this.enemyStatuses.delete(sprite);
      }
      return undefined;
    }
    const consumed: ConsumedStatusEffect = {
      damage: fullDurationStatusDamage(STATUS_EFFECTS[id], entry.status),
      ...(entry.status.sourceWeaponId ? { sourceWeaponId: entry.status.sourceWeaponId } : {}),
    };
    this.removeStatus(statuses, id);
    if (statuses.size <= 0) {
      this.enemyStatuses.delete(sprite);
    }
    return consumed;
  }

  update(time: number): void {
    for (const [sprite, statuses] of [...this.enemyStatuses]) {
      const definition = this.enemies.getDefinition(sprite);
      if (!sprite.active || !definition) {
        this.cleanupTarget(sprite);
        continue;
      }
      let iconIndex = 0;
      for (const [id, entry] of [...statuses]) {
        if (isStatusExpired(entry.status, time)) {
          this.removeStatus(statuses, id);
          continue;
        }
        const killed = this.tickStatus(sprite, definition, entry, time);
        if (killed) {
          this.cleanupTarget(sprite);
          break;
        }
        this.positionIcon(sprite, definition, entry, iconIndex);
        iconIndex += 1;
      }
      if (statuses.size <= 0) {
        this.enemyStatuses.delete(sprite);
      }
    }
  }

  private tickStatus(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    entry: EnemyStatusEntry,
    time: number,
  ): boolean {
    const statusDefinition = STATUS_EFFECTS[entry.status.id];
    const ticks = dueStatusTicks(statusDefinition, entry.status, time);
    if (ticks <= 0) {
      return false;
    }
    entry.status = advanceStatusTicks(statusDefinition, entry.status, ticks);
    for (let index = 0; index < ticks; index += 1) {
      if (!sprite.active || !this.enemies.getDefinition(sprite)) {
        return true;
      }
      const result = this.enemies.damage(sprite, statusTickDamage(entry.status), false);
      if (entry.status.sourceWeaponId) {
        this.run.weapons.recordHit(
          entry.status.sourceWeaponId,
          result.dealt,
          result.killed,
          false,
          Boolean(definition.boss),
        );
      }
      if (result.killed) {
        return true;
      }
    }
    return false;
  }

  private getEnemyStatuses(sprite: Phaser.Physics.Arcade.Image): Map<StatusEffectId, EnemyStatusEntry> {
    const existing = this.enemyStatuses.get(sprite);
    if (existing) {
      return existing;
    }
    const created = new Map<StatusEffectId, EnemyStatusEntry>();
    this.enemyStatuses.set(sprite, created);
    return created;
  }

  private createIcon(id: StatusEffectId): Phaser.GameObjects.Image {
    const definition = STATUS_EFFECTS[id];
    const icon = this.scene.add
      .image(0, 0, definition.iconTexture)
      .setDisplaySize(20, 20)
      .setDepth(43)
      .setAlpha(0.92);
    this.scene.tweens.add({
      targets: icon,
      alpha: 0.68,
      yoyo: true,
      repeat: -1,
      duration: 520,
      ease: 'Sine.InOut',
    });
    return icon;
  }

  private positionIcon(
    sprite: Phaser.Physics.Arcade.Image,
    definition: EnemyDefinition,
    entry: EnemyStatusEntry,
    index: number,
  ): void {
    const offset = (index - 0.5) * 22;
    entry.icon
      .setPosition(sprite.x + offset, sprite.y - definition.radius - 18)
      .setDisplaySize(this.iconSize(entry.status.stacks), this.iconSize(entry.status.stacks))
      .setTint(STATUS_EFFECTS[entry.status.id].color);
  }

  private iconSize(stacks: number): number {
    return 18 + Math.min(4, stacks) * 2;
  }

  private removeStatus(statuses: Map<StatusEffectId, EnemyStatusEntry>, id: StatusEffectId): void {
    const entry = statuses.get(id);
    if (entry) {
      entry.icon.destroy();
    }
    statuses.delete(id);
  }

  public cleanupTarget(sprite: Phaser.Physics.Arcade.Image): void {
    const statuses = this.enemyStatuses.get(sprite);
    if (!statuses) {
      return;
    }
    for (const entry of statuses.values()) {
      entry.icon.destroy();
    }
    this.enemyStatuses.delete(sprite);
  }
}
