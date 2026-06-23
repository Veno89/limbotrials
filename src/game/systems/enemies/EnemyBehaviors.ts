import Phaser from 'phaser';
import { COLORS } from '../../constants';
import type { EnemyDefinition } from '../../types/gameTypes';
import type { EnemyAbilityContext, EnemyMovementDirective, AbilityRuntime } from './EnemyAbilityContext';
import { calculateBruteCharge } from '../../systems/enemyAbilityRules';
import { scaleThreatDamage } from '../../systems/threatRules';
import type { DeathEchoAbility, DeathEchoProfile } from '../../systems/deathEchoRules';

export interface EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective;
}

class BruteChargeBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    const charge = calculateBruteCharge(definition.speed);
    if (runtime.mode === 'pursuit' && time >= runtime.nextAbilityAt && distance < 650) {
      runtime.mode = 'windup';
      runtime.modeEndsAt = time + 650;
      runtime.targetAngle = pursuitAngle;
      runtime.nextAbilityAt = time + 5200;
      this.createChargeTelegraph(context, sprite, runtime.targetAngle, charge.distance);
    } else if (runtime.mode === 'windup' && time >= runtime.modeEndsAt) {
      runtime.mode = 'charge';
      runtime.modeEndsAt = time + charge.durationMs;
      context.juice.ring(sprite.x, sprite.y, 72, COLORS.enemyTelegraph, 180);
    } else if (runtime.mode === 'charge' && time >= runtime.modeEndsAt) {
      runtime.mode = 'recovery';
      runtime.modeEndsAt = time + 650;
    } else if (runtime.mode === 'recovery' && time >= runtime.modeEndsAt) {
      runtime.mode = 'pursuit';
    }

    if (runtime.mode === 'windup') {
      return { angle: runtime.targetAngle, speedMultiplier: 0 };
    }
    if (runtime.mode === 'charge') {
      return { angle: runtime.targetAngle, speedMultiplier: charge.speedMultiplier };
    }
    if (runtime.mode === 'recovery') {
      return { angle: pursuitAngle, speedMultiplier: 0.25 };
    }
    return { angle: pursuitAngle, speedMultiplier: 1 };
  }

  private createChargeTelegraph(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, angle: number, distance: number): void {
    const line = context.scene.add
      .rectangle(sprite.x, sprite.y, distance, 66, COLORS.enemyTelegraph, 0.12)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(17)
      .setStrokeStyle(2, COLORS.enemyTelegraph, 0.8);
    context.scene.tweens.add({
      targets: line,
      alpha: 0.42,
      yoyo: true,
      repeat: 2,
      duration: 105,
      onComplete: () => line.destroy(),
    });
  }
}

class VoidCasterBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 720) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(2800, 3500);
      this.telegraphVoidOrb(context, sprite, runtime.damageMultiplier);
    }
    if (distance < 260) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.9 };
    }
    if (distance > 430) {
      return { angle: pursuitAngle, speedMultiplier: 0.78 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.72 };
  }

  private telegraphVoidOrb(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    context.juice.ring(sprite.x, sprite.y, 58, COLORS.enemyTelegraph, 430);
    context.scene.time.delayedCall(420, () => {
      if (!sprite.active) {
        return;
      }
      const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, context.player.x, context.player.y);
      const projectile = context.projectiles.get(sprite.x, sprite.y, 'projectile-void') as Phaser.Physics.Arcade.Image;
      projectile.setActive(true).setVisible(true).setDisplaySize(34, 34).setDepth(28).setTint(COLORS.enemyProjectile).setBlendMode(Phaser.BlendModes.ADD);
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(angle) * 250, Math.sin(angle) * 250);
      context.projectileRuntime.set(projectile, {
        expiresAt: context.scene.time.now + 3200,
        damage: scaleThreatDamage(13, damageMultiplier),
        source: 'void-orb',
      });
    });
  }
}

class ScreamerBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 520) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(4700, 5600);
      this.telegraphScream(context, sprite, runtime.damageMultiplier);
    }
    return { angle: pursuitAngle, speedMultiplier: distance < 245 ? 0.45 : 0.82 };
  }

  private telegraphScream(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const x = sprite.x;
    const y = sprite.y;
    const radius = 225;
    context.juice.ring(x, y, radius, COLORS.enemyTelegraph, 900);
    context.scene.time.delayedCall(880, () => {
      if (!sprite.active) {
        return;
      }
      context.juice.ring(x, y, radius, COLORS.enemyProjectileGlow, 180);
      context.juice.heavyImpact();
      if (Phaser.Math.Distance.Between(x, y, context.player.x, context.player.y) < radius) {
        context.onPlayerHit(scaleThreatDamage(17, damageMultiplier), 'scream');
      }
    });
  }
}

class ArcherBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 780) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(2400, 3100);
      this.telegraphGraveArrow(context, sprite, runtime.damageMultiplier);
    }
    if (distance < 330) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.92 };
    }
    if (distance > 560) {
      return { angle: pursuitAngle, speedMultiplier: 0.72 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.58 };
  }

  private telegraphGraveArrow(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const angle = Phaser.Math.Angle.Between(sprite.x, sprite.y, context.player.x, context.player.y);
    const line = context.scene.add
      .rectangle(sprite.x, sprite.y, 620, 18, COLORS.enemyProjectile, 0.1)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(17)
      .setStrokeStyle(1, COLORS.enemyProjectile, 0.7);
    context.scene.tweens.add({
      targets: line,
      alpha: 0.38,
      yoyo: true,
      repeat: 2,
      duration: 90,
      onComplete: () => line.destroy(),
    });
    context.scene.time.delayedCall(420, () => {
      if (!sprite.active) {
        return;
      }
      const shotAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, context.player.x, context.player.y);
      const projectile = context.projectiles.get(
        sprite.x,
        sprite.y,
        'projectile-laser',
      ) as Phaser.Physics.Arcade.Image;
      projectile
        .setActive(true)
        .setVisible(true)
        .setDisplaySize(42, 16)
        .setDepth(28)
        .setRotation(shotAngle)
        .setTint(COLORS.enemyProjectile)
        .setBlendMode(Phaser.BlendModes.ADD);
      const body = projectile.body as Phaser.Physics.Arcade.Body;
      body.setVelocity(Math.cos(shotAngle) * 420, Math.sin(shotAngle) * 420);
      context.projectileRuntime.set(projectile, {
        expiresAt: context.scene.time.now + 2600,
        damage: scaleThreatDamage(12, damageMultiplier),
        source: 'grave-arrow',
      });
    });
  }
}

class StalkerBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (runtime.mode === 'pursuit' && time >= runtime.nextAbilityAt && distance < 520) {
      runtime.mode = 'windup';
      runtime.modeEndsAt = time + 320;
      runtime.targetAngle = pursuitAngle;
      runtime.nextAbilityAt = time + Phaser.Math.Between(3000, 3800);
      context.juice.ring(sprite.x, sprite.y, 48, COLORS.void, 300);
    } else if (runtime.mode === 'windup' && time >= runtime.modeEndsAt) {
      runtime.mode = 'charge';
      runtime.modeEndsAt = time + 460;
    } else if (runtime.mode === 'charge' && time >= runtime.modeEndsAt) {
      runtime.mode = 'recovery';
      runtime.modeEndsAt = time + 420;
    } else if (runtime.mode === 'recovery' && time >= runtime.modeEndsAt) {
      runtime.mode = 'pursuit';
    }

    if (runtime.mode === 'windup') {
      return { angle: runtime.targetAngle, speedMultiplier: 0.1 };
    }
    if (runtime.mode === 'charge') {
      return { angle: runtime.targetAngle, speedMultiplier: 4.8 };
    }
    if (runtime.mode === 'recovery') {
      return { angle: pursuitAngle, speedMultiplier: 0.45 };
    }
    return { angle: pursuitAngle, speedMultiplier: distance > 230 ? 1.22 : 0.75 };
  }
}

class TrailHazardBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt) {
      const isDefiler = definition.id === 'grave-defiler';
      const radius = isDefiler ? 48 : 32;
      const duration = isDefiler ? 4500 : 3000;
      const damage = isDefiler ? 12 : 8;

      runtime.nextAbilityAt = time + 600;
      context.createGroundHazard(
        sprite.x,
        sprite.y,
        radius,
        duration,
        scaleThreatDamage(damage, runtime.damageMultiplier),
        'plague-trail',
      );
    }
    return { angle: pursuitAngle, speedMultiplier: 1.0 };
  }
}

class BombThrowerBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    if (time >= runtime.nextAbilityAt && distance < 680) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(3200, 4000);
      this.telegraphFireFlask(context, sprite, runtime.damageMultiplier);
    }
    if (distance < 300) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.95 };
    }
    if (distance > 500) {
      return { angle: pursuitAngle, speedMultiplier: 0.75 };
    }
    return { angle: pursuitAngle + runtime.strafeDirection * Math.PI * 0.5, speedMultiplier: 0.6 };
  }

  private telegraphFireFlask(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, damageMultiplier: number): void {
    const targetX = context.player.x;
    const targetY = context.player.y;
    const delay = 1200;
    const radius = 64;

    const telegraph = context.scene.add.circle(targetX, targetY, radius, COLORS.enemyTelegraph, 0.08)
      .setStrokeStyle(1.5, COLORS.enemyTelegraph, 0.7)
      .setDepth(15);

    context.scene.tweens.add({
      targets: telegraph,
      alpha: 0.22,
      yoyo: true,
      repeat: -1,
      duration: 200,
    });

    const flask = context.scene.physics.add.image(sprite.x, sprite.y, 'projectile-void');
    flask.setActive(true).setVisible(true).setDisplaySize(20, 20)
      .setTint(COLORS.hellfire)
      .setDepth(28);

    const travelTime = delay;
    const vx = (targetX - sprite.x) / (travelTime / 1000);
    const vy = (targetY - sprite.y) / (travelTime / 1000);
    const body = flask.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(vx, vy);

    context.scene.tweens.add({
      targets: flask,
      angle: 360,
      duration: travelTime,
    });

    context.scene.time.delayedCall(delay, () => {
      telegraph.destroy();
      flask.destroy();

      context.juice.ring(targetX, targetY, radius, COLORS.hellfire, 240);

      if (Phaser.Math.Distance.Between(targetX, targetY, context.player.x, context.player.y) < radius) {
        context.onPlayerHit(scaleThreatDamage(16, damageMultiplier), 'fire-flask');
      }

      context.createGroundHazard(
        targetX,
        targetY,
        radius,
        3000,
        scaleThreatDamage(7, damageMultiplier),
        'fire-flask',
      );
    });
  }
}

class DeathEchoBehavior implements EnemyBehavior {
  movementFor(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    _definition: EnemyDefinition,
    time: number,
    pursuitAngle: number,
    distance: number,
  ): EnemyMovementDirective {
    const profile = context.getDeathEchoProfile();
    if (!profile) {
      return { angle: pursuitAngle, speedMultiplier: 0.72 };
    }
    if (runtime.mode === 'windup' && time >= runtime.modeEndsAt) {
      runtime.mode = 'charge';
      runtime.modeEndsAt = time + 560;
      context.juice.ring(sprite.x, sprite.y, 70, COLORS.void, 180);
    } else if (runtime.mode === 'charge' && time >= runtime.modeEndsAt) {
      runtime.mode = 'recovery';
      runtime.modeEndsAt = time + 620;
    } else if (runtime.mode === 'recovery' && time >= runtime.modeEndsAt) {
      runtime.mode = 'pursuit';
    }

    if (runtime.mode === 'pursuit' && time >= runtime.nextAbilityAt && distance < 760) {
      runtime.nextAbilityAt = time + Phaser.Math.Between(3100, 4300);
      const ability = profile.abilities[runtime.specialIndex % profile.abilities.length] ?? 'bolt';
      runtime.specialIndex += 1;
      this.triggerEchoAbility(context, sprite, runtime, profile, ability, pursuitAngle);
    }

    if (runtime.mode === 'windup') {
      return { angle: runtime.targetAngle, speedMultiplier: 0.05 };
    }
    if (runtime.mode === 'charge') {
      return { angle: runtime.targetAngle, speedMultiplier: 4.1 };
    }
    if (runtime.mode === 'recovery') {
      return { angle: pursuitAngle, speedMultiplier: 0.35 };
    }
    if (distance < 220) {
      return { angle: pursuitAngle + Math.PI, speedMultiplier: 0.62 };
    }
    return { angle: pursuitAngle, speedMultiplier: 0.84 };
  }

  private triggerEchoAbility(
    context: EnemyAbilityContext,
    sprite: Phaser.Physics.Arcade.Image,
    runtime: AbilityRuntime,
    profile: DeathEchoProfile,
    ability: DeathEchoAbility,
    pursuitAngle: number,
  ): void {
    if (ability === 'rupture') {
      this.telegraphEchoRupture(context, profile);
    } else if (ability === 'charge') {
      runtime.mode = 'windup';
      runtime.modeEndsAt = context.scene.time.now + 620;
      runtime.targetAngle = pursuitAngle;
      this.createChargeTelegraph(context, sprite, pursuitAngle, 420);
    } else if (ability === 'aura') {
      this.telegraphEchoAura(context, sprite, profile);
    } else {
      this.telegraphEchoBolt(context, sprite, profile);
    }
  }

  private createChargeTelegraph(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, angle: number, distance: number): void {
    const line = context.scene.add
      .rectangle(sprite.x, sprite.y, distance, 66, COLORS.enemyTelegraph, 0.12)
      .setOrigin(0, 0.5)
      .setRotation(angle)
      .setDepth(17)
      .setStrokeStyle(2, COLORS.enemyTelegraph, 0.8);
    context.scene.tweens.add({
      targets: line,
      alpha: 0.42,
      yoyo: true,
      repeat: 2,
      duration: 105,
      onComplete: () => line.destroy(),
    });
  }

  private telegraphEchoBolt(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, profile: DeathEchoProfile): void {
    context.juice.ring(sprite.x, sprite.y, 58, COLORS.void, 520);
    context.scene.time.delayedCall(500, () => {
      if (!sprite.active) {
        return;
      }
      const baseAngle = Phaser.Math.Angle.Between(sprite.x, sprite.y, context.player.x, context.player.y);
      const count = Math.max(1, Math.min(3, profile.projectileCount));
      for (let index = 0; index < count; index += 1) {
        const offset = (index - (count - 1) / 2) * 0.18;
        const projectile = context.projectiles.get(sprite.x, sprite.y, 'projectile-void') as Phaser.Physics.Arcade.Image;
        projectile.setActive(true).setVisible(true).setDisplaySize(32, 32).setDepth(28).setTint(COLORS.void).setBlendMode(Phaser.BlendModes.ADD);
        const angle = baseAngle + offset;
        const body = projectile.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(Math.cos(angle) * 230, Math.sin(angle) * 230);
        context.projectileRuntime.set(projectile, {
          expiresAt: context.scene.time.now + 3300,
          damage: profile.damage,
          source: 'echo-bolt',
        });
      }
    });
  }

  private telegraphEchoRupture(context: EnemyAbilityContext, profile: DeathEchoProfile): void {
    const x = context.player.x;
    const y = context.player.y;
    const radius = 82;
    const telegraph = context.scene.add
      .circle(x, y, radius, COLORS.void, 0.08)
      .setStrokeStyle(2, COLORS.void, 0.82)
      .setDepth(17);
    context.scene.tweens.add({
      targets: telegraph,
      alpha: 0.28,
      scaleX: 1.12,
      scaleY: 1.12,
      yoyo: true,
      repeat: 3,
      duration: 150,
    });
    context.scene.time.delayedCall(900, () => {
      telegraph.destroy();
      context.juice.ring(x, y, radius, COLORS.void, 260);
      if (Phaser.Math.Distance.Between(x, y, context.player.x, context.player.y) < radius) {
        context.onPlayerHit(profile.damage + 2, 'echo-rupture');
      }
    });
  }

  private telegraphEchoAura(context: EnemyAbilityContext, sprite: Phaser.Physics.Arcade.Image, profile: DeathEchoProfile): void {
    const x = sprite.x;
    const y = sprite.y;
    context.createGroundHazard(x, y, 96, 2600, Math.max(3, Math.round(profile.damage * 0.4)), 'echo-rupture');
    context.juice.ring(x, y, 96, COLORS.void, 360);
  }
}

export const ENEMY_BEHAVIORS: Record<string, EnemyBehavior> = {
  'brute-charge': new BruteChargeBehavior(),
  'void-caster': new VoidCasterBehavior(),
  'screamer': new ScreamerBehavior(),
  'archer': new ArcherBehavior(),
  'stalker': new StalkerBehavior(),
  'trail-hazard': new TrailHazardBehavior(),
  'bomb-thrower': new BombThrowerBehavior(),
  'death-echo': new DeathEchoBehavior(),
};
