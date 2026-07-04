import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH, COLORS } from '../constants';
import { ENEMIES } from '../data/enemies';
import type {
  BossAttackId,
  CurseSnapshot,
  EnemyAbilityId,
  EnemyDefinition,
  EnemyId,
  ThreatSnapshot,
  EdictId,
} from '../types/gameTypes';
import type { JuiceSystem } from './JuiceSystem';
import { EnemyAbilitySystem } from './EnemyAbilitySystem';
import { EnemySeparationSystem } from './EnemySeparationSystem';
import { SpatialGrid, type SpatialEntity } from './SpatialGrid';
import { enemyThreatScaling, scaleThreatDamage } from './threatRules';
import { selectBossAttack } from './bossAttackRules';
import type { DeathEchoProfile } from './deathEchoRules';
import { cursePressureForEnemy } from './cursePressureRules';

const EMPTY_SPRITE_SET: ReadonlySet<Phaser.Physics.Arcade.Image> = new Set();

interface EnemyRuntime {
  definition: EnemyDefinition;
  health: number;
  maxHealth: number;
  contactReadyAt: number;
  wobbleSeed: number;
  nextSpecialAt: number;
  specialIndex: number;
  spawnedAtElapsedMs: number;
  damageMultiplier: number;
  lastBossPhase: number;
  entity: SpatialEntity;
  tier: number;
}

export interface EnemyDeath {
  x: number;
  y: number;
  definition: EnemyDefinition;
  lifetimeMs: number;
}

export interface EnemyDamageResult {
  killed: boolean;
  dealt: number;
}

export class EnemySystem {
  readonly group: Phaser.Physics.Arcade.Group;
  public readonly grid = new SpatialGrid();
  private readonly enemies = new Map<Phaser.Physics.Arcade.Image, EnemyRuntime>();
  private readonly abilities: EnemyAbilitySystem;
  private readonly separation = new EnemySeparationSystem();
  private readonly separationTargets: SpatialEntity[] = [];
  private bossSprite?: Phaser.Physics.Arcade.Image;
  private updateIndex = 0;
  private elapsedMs = 0;
  public onEnemyRemoved?: (sprite: Phaser.Physics.Arcade.Image) => void;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
    private readonly onPlayerHit: (damage: number, source: EnemyId | EnemyAbilityId) => void,
    private readonly onEnemySpawn: (id: EnemyId, elapsedMs: number) => void,
    private readonly onEnemyDeath: (death: EnemyDeath) => void,
    private readonly onBossSpecial: (attack: BossAttackId, x: number, y: number, phase: number) => void,
    private readonly onBossPhaseChange: (phase: number) => void,
    private readonly getThreat: () => ThreatSnapshot,
    private readonly getCurse: () => CurseSnapshot,
    private readonly getDeathEchoProfile: () => DeathEchoProfile | undefined = () => undefined,
    private readonly getEdicts: () => readonly EdictId[] = () => [],
    private readonly getSpeedMultiplier: (sprite: Phaser.Physics.Arcade.Image) => number = () => 1,
  ) {
    this.group = scene.physics.add.group();
    this.abilities = new EnemyAbilitySystem(scene, player, juice, onPlayerHit, getDeathEchoProfile);
  }

  spawn(id: EnemyId, x: number, y: number, elapsedMs: number, tier = 1): Phaser.Physics.Arcade.Image {
    const baseDefinition = ENEMIES[id];
    const echoProfile = id === 'player-echo' ? this.getDeathEchoProfile() : undefined;
    
    // Base tier multipliers
    const tierHealth = Math.pow(1.6, tier - 1);
    const tierDamage = Math.pow(1.3, tier - 1);
    const tierSpeed = Math.pow(1.05, tier - 1);
    const tierReward = tier;

    const definition = echoProfile
      ? {
          ...baseDefinition,
          maxHealth: echoProfile.maxHealth * tierHealth,
          speed: Math.round(baseDefinition.speed * echoProfile.speedMultiplier * tierSpeed),
          contactDamage: echoProfile.contactDamage * tierDamage,
          xp: Math.round(baseDefinition.xp * tierReward),
          soulValue: Math.round(baseDefinition.soulValue * tierReward),
        }
      : {
          ...baseDefinition,
          maxHealth: baseDefinition.maxHealth * tierHealth,
          speed: Math.round(baseDefinition.speed * tierSpeed),
          contactDamage: baseDefinition.contactDamage * tierDamage,
          xp: Math.round(baseDefinition.xp * tierReward),
          soulValue: Math.round(baseDefinition.soulValue * tierReward),
        };
    const scaling = enemyThreatScaling(this.getThreat(), Boolean(definition.boss));
    const cursePressure = cursePressureForEnemy(definition, this.getCurse());
    const edicts = this.getEdicts();
    const hasteSpeed = edicts.includes('haste') ? 1.15 : 1;
    const ruinHealth = definition.boss && edicts.includes('ruin') ? 1.2 : 1;
    const ruinDamage = definition.boss && edicts.includes('ruin') ? 1.1 : 1;

    const pressuredDefinition: EnemyDefinition = {
      ...definition,
      speed: Math.round(definition.speed * cursePressure.speedMultiplier * hasteSpeed),
    };
    const maxHealth = Math.round(
      pressuredDefinition.maxHealth * scaling.healthMultiplier * cursePressure.healthMultiplier * ruinHealth,
    );
    const sprite = this.group.get(x, y, definition.texture) as Phaser.Physics.Arcade.Image;
    sprite.setTexture(definition.texture);
    sprite.setActive(true).setVisible(true);
    sprite
      .setDisplaySize(pressuredDefinition.displaySize, pressuredDefinition.displaySize)
      .setDepth(20)
      .setCollideWorldBounds(true);
    const targetScaleX = sprite.scaleX;
    const targetScaleY = sprite.scaleY;
    sprite.setData('baseScaleX', targetScaleX);
    sprite.setData('baseScaleY', targetScaleY);
    sprite.setScale(0);
    this.scene.tweens.add({
      targets: sprite,
      scaleX: targetScaleX,
      scaleY: targetScaleY,
      duration: 350,
      ease: 'Back.Out',
    });
    sprite.setAlpha((definition.id === 'tormented-shade' || definition.id === 'lantern-ghost' ? 0.82 : 1) * cursePressure.alphaMultiplier);
    
    let baseTint = definition.tint ?? 0xffffff;
    if (tier === 2) baseTint = 0xbd93f9; // Purple
    if (tier >= 3) baseTint = 0xff5555; // Red
    
    if (cursePressure.tint) {
      sprite.setTint(cursePressure.tint);
    } else if (baseTint !== 0xffffff) {
      sprite.setTint(baseTint);
    } else {
      sprite.clearTint();
    }
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.checkCollision.none = true;
    body.setMaxVelocity(Math.max(pressuredDefinition.speed * 1.8, 520));
    this.enemies.set(sprite, {
      definition: pressuredDefinition,
      health: maxHealth,
      maxHealth,
      contactReadyAt: 0,
      wobbleSeed: Phaser.Math.FloatBetween(0, Math.PI * 2),
      nextSpecialAt: this.scene.time.now + 4200,
      specialIndex: 0,
      spawnedAtElapsedMs: elapsedMs,
      damageMultiplier: scaling.damageMultiplier * cursePressure.damageMultiplier * ruinDamage,
      lastBossPhase: 1,
      entity: { sprite, radius: pressuredDefinition.radius, definition: pressuredDefinition },
      tier,
    });
    this.onEnemySpawn(id, elapsedMs);
    this.abilities.register(sprite, pressuredDefinition, scaling.damageMultiplier * cursePressure.damageMultiplier);
    if (pressuredDefinition.boss) {
      this.bossSprite = sprite;
    }
    return sprite;
  }

  update(time: number, elapsedMs: number): void {
    this.elapsedMs = elapsedMs;
    this.updateIndex += 1;
    this.separationTargets.length = 0;
    this.grid.clear();
    for (const [sprite, runtime] of this.enemies) {
      if (!sprite.active) {
        this.abilities.unregister(sprite);
        this.enemies.delete(sprite);
        this.onEnemyRemoved?.(sprite);
        continue;
      }
      const pursuitAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const wobble = runtime.definition.behavior === 'wobble' ? Math.sin(time * 0.004 + runtime.wobbleSeed) * 0.6 : 0;
      const bossPhase = runtime.definition.boss ? this.bossPhase(runtime) : 1;
      const attackHaste = this.getEdicts().includes('haste') ? 0.9 : 1;
      if (runtime.definition.boss && bossPhase > runtime.lastBossPhase) {
        runtime.lastBossPhase = bossPhase;
        runtime.nextSpecialAt = Math.max(runtime.nextSpecialAt, time + 1800 * attackHaste);
        this.onBossPhaseChange(bossPhase);
      }
      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const movement = this.abilities.movementFor(
        sprite,
        runtime.definition,
        time,
        pursuitAngle + wobble,
        distance,
      );
      const speed =
        runtime.definition.speed * movement.speedMultiplier * this.getSpeedMultiplier(sprite) * (1 + (bossPhase - 1) * 0.16);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(movement.angle) * speed,
        Math.sin(movement.angle) * speed,
      );
      if (runtime.definition.facePlayerOffset !== undefined) {
        sprite.setFlipX(false);
        const targetAngle = pursuitAngle + runtime.definition.facePlayerOffset;
        sprite.rotation = Phaser.Math.Angle.RotateTo(sprite.rotation, targetAngle, 0.2);
      } else {
        sprite.setFlipX(body.velocity.x < 0);
        const targetRotation = (body.velocity.x / 400) * 0.22;
        const wobbleRotation = Math.sin(time * 0.003 + runtime.wobbleSeed) * 0.018;
        sprite.rotation = Phaser.Math.Linear(sprite.rotation, targetRotation + wobbleRotation, 0.2);
      }
      
      if (sprite.x < 0 || sprite.x > ARENA_WIDTH || sprite.y < 0 || sprite.y > ARENA_HEIGHT) {
        sprite.setPosition(
          Phaser.Math.Clamp(sprite.x, 30, ARENA_WIDTH - 30),
          Phaser.Math.Clamp(sprite.y, 30, ARENA_HEIGHT - 30)
        );
      }
      
      this.grid.insert(runtime.entity);
      this.separationTargets.push(runtime.entity);

      if (distance < runtime.definition.radius + 24 && time >= runtime.contactReadyAt) {
        runtime.contactReadyAt = time + 700 * attackHaste;
        this.onPlayerHit(
          scaleThreatDamage(runtime.definition.contactDamage, runtime.damageMultiplier),
          runtime.definition.id,
        );
      }

      if (runtime.definition.boss && time >= runtime.nextSpecialAt) {
        const attack = selectBossAttack(runtime.specialIndex, bossPhase);
        runtime.specialIndex += 1;
        runtime.nextSpecialAt = time + (6200 - bossPhase * 650) * attackHaste;
        this.onBossSpecial(attack, sprite.x, sprite.y, bossPhase);
      }
    }
    if (this.updateIndex % 3 === 0) {
      this.separation.apply(this.grid, this.separationTargets);
    }
    this.abilities.updateProjectiles(time);
  }

  damage(sprite: Phaser.Physics.Arcade.Image, amount: number, critical: boolean): EnemyDamageResult {
    const runtime = this.enemies.get(sprite);
    if (!runtime || !sprite.active) {
      return { killed: false, dealt: 0 };
    }
    const dealt = Math.min(runtime.health, amount);
    runtime.health = Math.max(0, runtime.health - amount);
    this.juice.damageNumber(sprite.x, sprite.y - runtime.definition.radius, amount, critical);
    this.juice.enemyHit(sprite);
    if (runtime.health > 0) {
      return { killed: false, dealt };
    }
    this.enemies.delete(sprite);
    this.abilities.unregister(sprite);
    this.onEnemyRemoved?.(sprite);
    if (sprite === this.bossSprite) {
      this.bossSprite = undefined;
    }
    this.juice.enemyDeath(sprite.x, sprite.y, runtime.definition.elite ? COLORS.hellfire : COLORS.soul);
    this.onEnemyDeath({
      x: sprite.x,
      y: sprite.y,
      definition: runtime.definition,
      lifetimeMs: Math.max(0, this.elapsedMs - runtime.spawnedAtElapsedMs),
    });
    this.group.killAndHide(sprite);
    return { killed: true, dealt };
  }

  findNearest(
    x: number,
    y: number,
    range: number,
    excluded: ReadonlySet<Phaser.Physics.Arcade.Image> = EMPTY_SPRITE_SET,
  ): Phaser.Physics.Arcade.Image | undefined {
    let nearest: Phaser.Physics.Arcade.Image | undefined;
    let nearestDistSq = range * range;
    const candidates = this.grid.getNearby(x, y, range);
    for (const entity of candidates) {
      if (!entity.sprite.active || excluded.has(entity.sprite)) {
        continue;
      }
      const distSq = Phaser.Math.Distance.Squared(x, y, entity.sprite.x, entity.sprite.y);
      if (distSq < nearestDistSq) {
        nearest = entity.sprite;
        nearestDistSq = distSq;
      }
    }
    return nearest;
  }

  forEach(callback: (sprite: Phaser.Physics.Arcade.Image, definition: EnemyDefinition) => void): void {
    for (const [sprite, runtime] of this.enemies) {
      if (sprite.active) {
        callback(sprite, runtime.definition);
      }
    }
  }

  getDefinition(sprite: Phaser.Physics.Arcade.Image): EnemyDefinition | undefined {
    return this.enemies.get(sprite)?.definition;
  }

  count(id?: EnemyId): number {
    if (!id) {
      return this.enemies.size;
    }
    let count = 0;
    for (const runtime of this.enemies.values()) {
      if (runtime.definition.id === id) {
        count += 1;
      }
    }
    return count;
  }

  countAny(ids: readonly EnemyId[]): number {
    const included = new Set(ids);
    let count = 0;
    for (const runtime of this.enemies.values()) {
      if (included.has(runtime.definition.id)) {
        count += 1;
      }
    }
    return count;
  }

  getBossHealth(): { current: number; max: number } | undefined {
    if (!this.bossSprite) {
      return undefined;
    }
    const runtime = this.enemies.get(this.bossSprite);
    return runtime ? { current: runtime.health, max: runtime.maxHealth } : undefined;
  }

  getHealth(sprite: Phaser.Physics.Arcade.Image): { current: number; max: number } | undefined {
    const runtime = this.enemies.get(sprite);
    return runtime ? { current: runtime.health, max: runtime.maxHealth } : undefined;
  }

  pullToward(
    sprite: Phaser.Physics.Arcade.Image,
    targetX: number,
    targetY: number,
    distance: number,
  ): void {
    if (distance <= 0 || !this.enemies.has(sprite)) {
      return;
    }
    const offsetX = targetX - sprite.x;
    const offsetY = targetY - sprite.y;
    const length = Math.hypot(offsetX, offsetY);
    if (length <= 1) {
      return;
    }
    const movement = Math.min(distance, length - 1);
    sprite.setPosition(
      Phaser.Math.Clamp(sprite.x + (offsetX / length) * movement, 40, ARENA_WIDTH - 40),
      Phaser.Math.Clamp(sprite.y + (offsetY / length) * movement, 40, ARENA_HEIGHT - 40),
    );
  }

  spawnAroundPlayer(id: EnemyId, elapsedMs: number, distance = 620, tier = 1): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.spawnAroundPlayerAtAngle(id, elapsedMs, distance, angle, tier);
  }

  spawnAroundPlayerAtAngle(id: EnemyId, elapsedMs: number, distance: number, angle: number, tier = 1): void {
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 60, ARENA_WIDTH - 60);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 60, ARENA_HEIGHT - 60);
    this.spawn(id, x, y, elapsedMs, tier);
  }

  spawnDevTargetDummy(elapsedMs: number): void {
    const baseDefinition = ENEMIES['limbo-knight'];
    const definition: EnemyDefinition = {
      ...baseDefinition,
      name: 'Target Dummy',
      maxHealth: 999999,
      speed: 0,
      contactDamage: 0,
      xp: 0,
      soulValue: 0,
      displaySize: 92,
      radius: 30,
    };
    const x = Phaser.Math.Clamp(this.player.x + 190, 60, ARENA_WIDTH - 60);
    const y = Phaser.Math.Clamp(this.player.y, 60, ARENA_HEIGHT - 60);
    const sprite = this.group.create(x, y, definition.texture) as Phaser.Physics.Arcade.Image;
    sprite
      .setDisplaySize(definition.displaySize, definition.displaySize)
      .setDepth(20)
      .setTint(0xd8c49b)
      .setCollideWorldBounds(true);
    const body = sprite.body as Phaser.Physics.Arcade.Body;
    body.setMaxVelocity(0);
    this.enemies.set(sprite, {
      definition,
      health: definition.maxHealth,
      maxHealth: definition.maxHealth,
      contactReadyAt: Number.POSITIVE_INFINITY,
      wobbleSeed: 0,
      nextSpecialAt: Number.POSITIVE_INFINITY,
      specialIndex: 0,
      spawnedAtElapsedMs: elapsedMs,
      damageMultiplier: 0,
      lastBossPhase: 1,
      entity: { sprite, radius: definition.radius, definition },
      tier: 1,
    });
  }

  private bossPhase(runtime: EnemyRuntime): number {
    const ratio = runtime.health / runtime.maxHealth;
    const timeAlive = this.elapsedMs - runtime.spawnedAtElapsedMs;
    if (ratio <= 0.35 || timeAlive >= 45000) {
      return 3;
    }
    return ratio <= 0.7 || timeAlive >= 25000 ? 2 : 1;
  }
}
