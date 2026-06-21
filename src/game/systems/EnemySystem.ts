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
} from '../types/gameTypes';
import type { JuiceSystem } from './JuiceSystem';
import { EnemyAbilitySystem } from './EnemyAbilitySystem';
import { EnemySeparationSystem, type SeparationTarget } from './EnemySeparationSystem';
import { enemyThreatScaling, scaleThreatDamage } from './threatRules';
import { selectBossAttack } from './bossAttackRules';
import type { DeathEchoProfile } from './deathEchoRules';
import { cursePressureForEnemy } from './cursePressureRules';

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
  private readonly enemies = new Map<Phaser.Physics.Arcade.Image, EnemyRuntime>();
  private readonly abilities: EnemyAbilitySystem;
  private readonly separation = new EnemySeparationSystem();
  private readonly separationTargets: SeparationTarget[] = [];
  private bossSprite?: Phaser.Physics.Arcade.Image;
  private updateIndex = 0;
  private elapsedMs = 0;

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
  ) {
    this.group = scene.physics.add.group();
    this.abilities = new EnemyAbilitySystem(scene, player, juice, onPlayerHit, getDeathEchoProfile);
  }

  spawn(id: EnemyId, x: number, y: number, elapsedMs: number): Phaser.Physics.Arcade.Image {
    const baseDefinition = ENEMIES[id];
    const echoProfile = id === 'player-echo' ? this.getDeathEchoProfile() : undefined;
    const definition = echoProfile
      ? {
          ...baseDefinition,
          maxHealth: echoProfile.maxHealth,
          speed: Math.round(baseDefinition.speed * echoProfile.speedMultiplier),
          contactDamage: echoProfile.contactDamage,
        }
      : baseDefinition;
    const scaling = enemyThreatScaling(this.getThreat(), Boolean(definition.boss));
    const cursePressure = cursePressureForEnemy(definition, this.getCurse());
    const pressuredDefinition: EnemyDefinition = {
      ...definition,
      speed: Math.round(definition.speed * cursePressure.speedMultiplier),
    };
    const maxHealth = Math.round(
      pressuredDefinition.maxHealth * scaling.healthMultiplier * cursePressure.healthMultiplier,
    );
    const sprite = this.group.create(x, y, definition.texture) as Phaser.Physics.Arcade.Image;
    sprite
      .setDisplaySize(pressuredDefinition.displaySize, pressuredDefinition.displaySize)
      .setDepth(20)
      .setCollideWorldBounds(true);
    sprite.setAlpha((definition.id === 'wraith' || definition.id === 'lantern-ghost' ? 0.82 : 1) * cursePressure.alphaMultiplier);
    if (cursePressure.tint) {
      sprite.setTint(cursePressure.tint);
    }
    const body = sprite.body as Phaser.Physics.Arcade.Body;
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
      damageMultiplier: scaling.damageMultiplier * cursePressure.damageMultiplier,
      lastBossPhase: 1,
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
    for (const [sprite, runtime] of this.enemies) {
      if (!sprite.active) {
        this.abilities.unregister(sprite);
        this.enemies.delete(sprite);
        continue;
      }
      const pursuitAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      const wobble = runtime.definition.behavior === 'wobble' ? Math.sin(time * 0.004 + runtime.wobbleSeed) * 0.6 : 0;
      const bossPhase = runtime.definition.boss ? this.bossPhase(runtime) : 1;
      if (runtime.definition.boss && bossPhase > runtime.lastBossPhase) {
        runtime.lastBossPhase = bossPhase;
        runtime.nextSpecialAt = Math.max(runtime.nextSpecialAt, time + 1800);
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
        runtime.definition.speed * movement.speedMultiplier * (1 + (bossPhase - 1) * 0.16);
      const body = sprite.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(
        Math.cos(movement.angle) * speed,
        Math.sin(movement.angle) * speed,
      );
      sprite.setFlipX(body.velocity.x < 0);
      sprite.setRotation(Math.sin(time * 0.003 + runtime.wobbleSeed) * 0.018);
      this.separationTargets.push({ sprite, radius: runtime.definition.radius });

      if (distance < runtime.definition.radius + 24 && time >= runtime.contactReadyAt) {
        runtime.contactReadyAt = time + 700;
        this.onPlayerHit(
          scaleThreatDamage(runtime.definition.contactDamage, runtime.damageMultiplier),
          runtime.definition.id,
        );
      }

      if (runtime.definition.boss && time >= runtime.nextSpecialAt) {
        const attack = selectBossAttack(runtime.specialIndex, bossPhase);
        runtime.specialIndex += 1;
        runtime.nextSpecialAt = time + 6200 - bossPhase * 650;
        this.onBossSpecial(attack, sprite.x, sprite.y, bossPhase);
      }
    }
    if (this.updateIndex % 3 === 0) {
      this.separation.apply(this.separationTargets);
    }
    this.abilities.updateProjectiles(time);
  }

  damage(sprite: Phaser.Physics.Arcade.Image, amount: number, critical: boolean): EnemyDamageResult {
    const runtime = this.enemies.get(sprite);
    if (!runtime || !sprite.active) {
      return { killed: false, dealt: 0 };
    }
    const dealt = Math.min(runtime.health, amount);
    runtime.health -= amount;
    this.juice.damageNumber(sprite.x, sprite.y - runtime.definition.radius, amount, critical);
    this.juice.enemyHit(sprite);
    if (runtime.health > 0) {
      return { killed: false, dealt };
    }
    this.enemies.delete(sprite);
    this.abilities.unregister(sprite);
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
    sprite.destroy();
    return { killed: true, dealt };
  }

  findNearest(
    x: number,
    y: number,
    range: number,
    excluded: ReadonlySet<Phaser.Physics.Arcade.Image> = new Set(),
  ): Phaser.Physics.Arcade.Image | undefined {
    let nearest: Phaser.Physics.Arcade.Image | undefined;
    let nearestDistance = range;
    for (const sprite of this.enemies.keys()) {
      if (!sprite.active || excluded.has(sprite)) {
        continue;
      }
      const distance = Phaser.Math.Distance.Between(x, y, sprite.x, sprite.y);
      if (distance < nearestDistance) {
        nearest = sprite;
        nearestDistance = distance;
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

  spawnAroundPlayer(id: EnemyId, elapsedMs: number, distance = 620): void {
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    this.spawnAroundPlayerAtAngle(id, elapsedMs, distance, angle);
  }

  spawnAroundPlayerAtAngle(id: EnemyId, elapsedMs: number, distance: number, angle: number): void {
    const x = Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, 60, ARENA_WIDTH - 60);
    const y = Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, 60, ARENA_HEIGHT - 60);
    this.spawn(id, x, y, elapsedMs);
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
