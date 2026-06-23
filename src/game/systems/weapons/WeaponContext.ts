import Phaser from 'phaser';
import type { WeaponId, WeaponRuntimeState } from '../../types/gameTypes';
import type { RunState } from '../RunState';
import type { JuiceSystem } from '../JuiceSystem';
import type { EnemySystem } from '../EnemySystem';
import type { BoneScytheTalentRuntimeSystem } from '../BoneScytheTalentRuntimeSystem';
import type { ScytheWakeSystem } from '../ScytheWakeSystem';
import type { ScytheProcessionSystem } from '../ScytheProcessionSystem';
import type { WeaponUpgradeEffectSystem } from '../WeaponUpgradeEffectSystem';
import type { WeaponEvolutionSystem } from '../WeaponEvolutionSystem';
import type { AcidPoolSystem } from '../AcidPoolSystem';
import type { SpatialEntity } from '../SpatialGrid';
import type { ScytheSweepProfile } from '../scytheRules';

export interface WeaponContext {
  readonly scene: Phaser.Scene;
  readonly run: RunState;
  readonly juice: JuiceSystem;
  readonly player: Phaser.Physics.Arcade.Image;
  readonly enemies: EnemySystem;
  readonly projectiles: Phaser.Physics.Arcade.Group;
  readonly scytheTalents: BoneScytheTalentRuntimeSystem;
  readonly scytheWakes: ScytheWakeSystem;
  readonly scytheProcessions: ScytheProcessionSystem;
  readonly upgradeEffects: WeaponUpgradeEffectSystem;
  readonly evolutions: WeaponEvolutionSystem;
  readonly acidPools: AcidPoolSystem;
  readonly nearbyCache: SpatialEntity[];
  
  readonly scytheFacingAngle: number;

  createProjectile(id: WeaponId, texture: string, state: WeaponRuntimeState, angle: number, time: number): void;
  createLobbedProjectile(id: WeaponId, state: WeaponRuntimeState, landingX: number, landingY: number, time: number): void;
  damageArea(x: number, y: number, radius: number, weaponId: WeaponId, damageScale?: number): void;
  afterAreaAttack(id: WeaponId, x: number, y: number, radius: number, scytheProfile?: ScytheSweepProfile): void;
  damageScytheSweep(x: number, y: number, radius: number, weaponId: WeaponId, damageScale: number, profile: ScytheSweepProfile): number;
  damageArc(x: number, y: number, radius: number, weaponId: WeaponId, facingAngle: number, sweepAngle: number): Set<Phaser.Physics.Arcade.Image>;
  damageEnemy(sprite: Phaser.Physics.Arcade.Image, definition: any, weaponId: WeaponId, damageScale?: number): { killed: boolean };
}
