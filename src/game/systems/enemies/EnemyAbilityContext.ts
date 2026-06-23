import Phaser from 'phaser';
import type { EnemyAbilityId } from '../../types/gameTypes';
import type { JuiceSystem } from '../JuiceSystem';
import type { DeathEchoProfile } from '../deathEchoRules';

export interface AbilityRuntime {
  nextAbilityAt: number;
  mode: 'pursuit' | 'windup' | 'charge' | 'recovery';
  modeEndsAt: number;
  targetAngle: number;
  strafeDirection: number;
  damageMultiplier: number;
  specialIndex: number;
}

export interface EnemyProjectileRuntime {
  expiresAt: number;
  damage: number;
  source: EnemyAbilityId;
}

export interface GroundHazard {
  circle: Phaser.GameObjects.GameObject;
  x: number;
  y: number;
  radius: number;
  damage: number;
  expiresAt: number;
  source: EnemyAbilityId;
}

export interface EnemyMovementDirective {
  angle: number;
  speedMultiplier: number;
}

export interface EnemyAbilityContext {
  readonly scene: Phaser.Scene;
  readonly player: Phaser.Physics.Arcade.Image;
  readonly juice: JuiceSystem;
  readonly projectiles: Phaser.Physics.Arcade.Group;
  readonly projectileRuntime: Map<Phaser.Physics.Arcade.Image, EnemyProjectileRuntime>;
  readonly groundHazards: Set<GroundHazard>;

  onPlayerHit(damage: number, source: EnemyAbilityId): void;
  getDeathEchoProfile(): DeathEchoProfile | undefined;
  createGroundHazard(x: number, y: number, radius: number, duration: number, damage: number, source: EnemyAbilityId): void;
}
