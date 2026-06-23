import Phaser from 'phaser';
import { COLORS } from '../constants';
import { MAX_WEAPON_LEVEL } from '../types/gameTypes';
import type { EnemyDefinition, WeaponId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';
import type { RunState } from './RunState';

export type EvolutionDamageEnemy = (
  sprite: Phaser.Physics.Arcade.Image,
  definition: EnemyDefinition,
  weaponId: WeaponId,
  damageScale: number,
) => { killed: boolean };

export type EvolutionDamageArea = (
  x: number,
  y: number,
  radius: number,
  weaponId: WeaponId,
  damageScale: number,
) => void;

export type EvolutionAreaVisual = (x: number, y: number, radius: number, color: number) => void;

export class WeaponEvolutionSystem {
  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly juice: JuiceSystem,
  ) {}

  isEvolved(id: WeaponId): boolean {
    return this.run.weapons.getState(id).level >= MAX_WEAPON_LEVEL;
  }

  afterAreaAttack(
    id: WeaponId,
    x: number,
    y: number,
    radius: number,
    damageArea: EvolutionDamageArea,
    areaVisual?: EvolutionAreaVisual,
  ): void {
    if (!this.isEvolved(id)) {
      return;
    }
    if (id === 'bone-scythe') {
      this.delayedArea(id, x, y, radius * 0.9, 190, COLORS.soul, 0.82, damageArea, areaVisual);
    } else if (id === 'hellfire-sigil') {
      this.delayedArea(id, x, y, radius * 0.9, 360, COLORS.hellfire, 0.34, damageArea);
      this.delayedArea(id, x, y, radius * 0.9, 720, COLORS.hellfire, 0.34, damageArea);
    } else if (id === 'cinder-reliquary') {
      this.delayedArea(id, x, y, radius * 1.08, 440, COLORS.hellfire, 0.42, damageArea);
    } else if (id === 'dirge-staff') {
      this.delayedArea(id, x, y, radius, 90, COLORS.soul, 0.38, damageArea);
    }
  }

  afterProjectileImpact(
    id: WeaponId,
    impact: Phaser.Physics.Arcade.Image,
    killed: boolean,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
    damageEnemy: EvolutionDamageEnemy,
    damageArea: EvolutionDamageArea,
  ): void {
    if (!this.isEvolved(id)) {
      return;
    }
    if (id === 'soul-bolt') {
      this.chainToNearest(id, impact, 260, 0.56, alreadyHit, damageEnemy);
    } else if (id === 'grave-lance' && killed) {
      this.chainToNearest(id, impact, 380, 0.78, alreadyHit, damageEnemy);
    } else if (id === 'wailing-shards') {
      this.juice.ring(impact.x, impact.y, 58, COLORS.void, 180);
      damageArea(impact.x, impact.y, 58, id, 0.42);
    } else if (id === 'ashen-longbow') {
      this.juice.ring(impact.x, impact.y, 48, COLORS.gold, 160);
      damageArea(impact.x, impact.y, 48, id, 0.34);
    }
  }

  private chainToNearest(
    id: WeaponId,
    impact: Phaser.Physics.Arcade.Image,
    range: number,
    damageScale: number,
    alreadyHit: Set<Phaser.Physics.Arcade.Image>,
    damageEnemy: EvolutionDamageEnemy,
  ): void {
    const target = this.enemies.findNearest(impact.x, impact.y, range, alreadyHit);
    if (!target) {
      return;
    }
    alreadyHit.add(target);
    const definition = this.enemies.getDefinition(target);
    if (!definition) {
      return;
    }
    this.juice.ring(target.x, target.y, 42, COLORS.soul, 150);
    damageEnemy(target, definition, id, damageScale);
  }

  private delayedArea(
    id: WeaponId,
    x: number,
    y: number,
    radius: number,
    delay: number,
    color: number,
    damageScale: number,
    damageArea: EvolutionDamageArea,
    areaVisual?: EvolutionAreaVisual,
  ): void {
    this.scene.time.delayedCall(delay, () => {
      if (areaVisual) {
        areaVisual(x, y, radius, color);
      } else {
        this.juice.ring(x, y, radius, color, 220);
      }
      damageArea(x, y, radius, id, damageScale);
    });
  }
}
