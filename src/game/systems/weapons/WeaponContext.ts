import Phaser from 'phaser';
import type { WeaponId, WeaponRuntimeState, EnemyDefinition } from '../../types/gameTypes';
import type { RunState } from '../RunState';
import type { JuiceSystem } from '../JuiceSystem';
import type { EnemySystem } from '../EnemySystem';
import type { BoneScytheTalentRuntimeSystem } from '../BoneScytheTalentRuntimeSystem';
import type { ScytheWakeSystem } from '../ScytheWakeSystem';
import type { ScytheProcessionSystem } from '../ScytheProcessionSystem';
import type { WeaponUpgradeEffectSystem } from '../WeaponUpgradeEffectSystem';
import type { WeaponEvolutionSystem } from '../WeaponEvolutionSystem';
import type { HazardZoneSystem } from '../HazardZoneSystem';
import type { SpatialEntity } from '../SpatialGrid';
import type { ScytheSweepProfile } from '../scytheRules';
import type { ImpactFragmentSystem } from '../ImpactFragmentSystem';

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
  readonly hazardZones: HazardZoneSystem;
  readonly impactFragments: ImpactFragmentSystem;
  readonly nearbyCache: SpatialEntity[];
  
  readonly scytheFacingAngle: number;

  createProjectile(id: WeaponId, texture: string, state: WeaponRuntimeState, angle: number, time: number, startX?: number, startY?: number): Phaser.Physics.Arcade.Image;
  createLobbedProjectile(id: WeaponId, state: WeaponRuntimeState, landingX: number, landingY: number, time: number): void;
  damageArea(x: number, y: number, radius: number, weaponId: WeaponId, damageScale?: number): void;
  afterAreaAttack(id: WeaponId, x: number, y: number, radius: number, scytheProfile?: ScytheSweepProfile): void;
  damageScytheSweep(x: number, y: number, radius: number, weaponId: WeaponId, damageScale: number, profile: ScytheSweepProfile): number;
  damageArc(x: number, y: number, radius: number, weaponId: WeaponId, facingAngle: number, sweepAngle: number): Set<Phaser.Physics.Arcade.Image>;
  damageEnemy(sprite: Phaser.Physics.Arcade.Image, definition: EnemyDefinition, weaponId: WeaponId, damageScale?: number): { killed: boolean };
  getProjectileRuntime(projectile: Phaser.Physics.Arcade.Image): any;
}
