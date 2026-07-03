import type { WeaponId, WeaponRuntimeState } from '../../types/gameTypes';
import type { WeaponContext } from './WeaponContext';
import { WEAPONS } from '../../data/weapons';
import { COLORS } from '../../constants';
import Phaser from 'phaser';
import { getBloodletterThrowAngles } from '../../systems/weaponRules';
import { audio } from '../AudioSystem';
import type { ScytheSweepProfile } from '../../systems/scytheRules';

export interface WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void;
}

class TargetedProjectilesBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const definition = WEAPONS[id];
    const excluded = new Set<Phaser.Physics.Arcade.Image>();
    audio.play(id === 'grave-lance' ? 'scythe' : 'soul-bolt');

    for (let targetIndex = 0; targetIndex < Math.floor(state.stats.targetCount); targetIndex += 1) {
      const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range, excluded);
      if (!target) {
        return;
      }
      excluded.add(target);
      const baseAngle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
      for (let index = 0; index < Math.floor(state.stats.projectileCount); index += 1) {
        const offset = (index - (state.stats.projectileCount - 1) / 2) * 0.14;
        context.createProjectile(id, definition.texture, state, baseAngle + offset, time);
      }
    }
  }
}

class RadialProjectilesBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    audio.play('soul-bolt');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    const rotationOffset = Phaser.Math.FloatBetween(0, Math.PI * 2);
    for (let index = 0; index < count; index += 1) {
      context.createProjectile(id, WEAPONS[id].texture, state, rotationOffset + (index / count) * Math.PI * 2, time);
    }
    context.juice.ring(context.player.x, context.player.y, 54, COLORS.void, 240);
  }
}

class FanProjectilesBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('soul-bolt');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    const baseAngle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
    const spread = Math.min(0.78, 0.16 * (count - 1));
    for (let index = 0; index < count; index += 1) {
      const ratio = count === 1 ? 0.5 : index / (count - 1);
      context.createProjectile(id, WEAPONS[id].texture, state, baseAngle - spread / 2 + ratio * spread, time);
    }
    context.juice.ring(context.player.x, context.player.y, 46, COLORS.gold, 180);
  }
}

class ReturningProjectileBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('scythe');
    const baseAngle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
    for (const angle of getBloodletterThrowAngles(baseAngle, state.stats.projectileCount)) {
      context.createProjectile(id, WEAPONS[id].texture, state, angle, time);
    }
  }
}

class PoisonFlaskBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) {
      return;
    }
    audio.play('hellfire');
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    for (let index = 0; index < count; index += 1) {
      const scatterAngle = count === 1 ? 0 : (index / count) * Math.PI * 2;
      const scatter = count === 1 ? 0 : 42;
      context.createLobbedProjectile(
        id,
        state,
        target.x + Math.cos(scatterAngle) * scatter,
        target.y + Math.sin(scatterAngle) * scatter,
        time,
      );
    }
    context.juice.ring(context.player.x, context.player.y, 46, 0x51d96b, 190);
  }
}

class ChainStrikeBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    const excluded = new Set<Phaser.Physics.Arcade.Image>();
    const count = Math.max(1, Math.floor(state.stats.targetCount));
    let struck = false;
    for (let index = 0; index < count; index += 1) {
      const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range, excluded);
      if (!target) {
        break;
      }
      const definition = context.enemies.getDefinition(target);
      if (!definition) {
        continue;
      }
      struck = true;
      excluded.add(target);
      context.juice.ring(target.x, target.y, 44, COLORS.soul, 180);
      context.damageArea(target.x, target.y, 0, id); // Just damage the target for now using damageArea with radius 0, wait, it's better to implement damageEnemy directly if needed. But weapon system handles this.
      context.afterAreaAttack(id, target.x, target.y, state.stats.area);
    }
    if (struck) {
      audio.play('soul-bolt');
      context.juice.ring(context.player.x, context.player.y, 58, COLORS.void, 220);
    }
  }
}

class PulseBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    audio.play('hellfire');
    const radius = state.stats.area;
    const x = context.player.x;
    const y = context.player.y;
    context.juice.ring(x, y, radius, COLORS.hellfire, 520);
    context.scene.time.delayedCall(260, () => {
      context.damageArea(x, y, radius, id);
      context.afterAreaAttack(id, x, y, radius);
    });
  }
}

class HellfireBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) {
      return;
    }
    const x = target.x;
    const y = target.y;
    const radius = state.stats.area;
    const sigil = context.scene.add
      .image(x, y, WEAPONS[id].texture)
      .setDisplaySize(radius * 0.78, radius * 0.78)
      .setAlpha(0.35)
      .setTint(COLORS.hellfire)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(18);
    context.scene.tweens.add({
      targets: sigil,
      scaleX: sigil.scaleX * 1.35,
      scaleY: sigil.scaleY * 1.35,
      alpha: 0.72,
      duration: 620,
      ease: 'Sine.In',
    });
    context.juice.ring(x, y, radius * 0.82, COLORS.hellfire, 650);
    context.scene.time.delayedCall(620, () => {
      sigil.destroy();
      audio.play('hellfire');
      context.juice.ring(x, y, radius, COLORS.hellfire, 260);
      context.juice.heavyImpact();
      context.damageArea(x, y, radius, id);
      context.afterAreaAttack(id, x, y, radius);
    });
  }
}

class BoneScytheBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    const radius = state.stats.area;
    const talents = context.run.boneScythe.getProfile();
    const profile: ScytheSweepProfile = {
      facingAngle: context.scytheFacingAngle,
      fullCircle: talents.fullCircle,
    };
    audio.play('scythe');
    context.juice.ring(context.player.x, context.player.y, 42, COLORS.blood, 220);
    const sweep = context.scene.add
      .container(context.player.x, context.player.y)
      .setDepth(32)
      .setAlpha(0.95)
      .setRotation(profile.facingAngle - Math.PI / 2);
    const bladeOffsets = profile.fullCircle ? [0, Math.PI] : [0, -0.16, -0.32];
    bladeOffsets.forEach((angle, index) => {
      const blade = context.scene.add
        .image(Math.cos(angle) * radius * 0.68, Math.sin(angle) * radius * 0.68, WEAPONS[id].texture)
        .setDisplaySize(index === 0 || profile.fullCircle ? 96 : 82, index === 0 || profile.fullCircle ? 96 : 82)
        .setRotation(angle + Math.PI / 2)
        .setAlpha(index === 0 || profile.fullCircle ? 1 : 0.24 / index);
      sweep.add(blade);
    });
    context.scene.tweens.add({
      targets: sweep,
      rotation: sweep.rotation + (profile.fullCircle ? Math.PI * 2 : Math.PI),
      alpha: 0,
      duration: profile.fullCircle ? 430 : 320,
      ease: 'Cubic.Out',
      onComplete: () => sweep.destroy(),
    });
    const hitCount = context.damageScytheSweep(context.player.x, context.player.y, radius, id, 1, profile);
    const reapOutcome = context.scytheTalents.recordReap(hitCount, talents);
    if (reapOutcome.graveProcessionTriggered) {
      context.scytheProcessions.spawn(
        context.player.x,
        context.player.y,
        profile.facingAngle,
        radius,
        id,
        0.75,
      );
    }
    context.upgradeEffects.afterBoneScytheAttack(id, context.player.x, context.player.y, radius, profile);
    context.scytheWakes.spawn(
      context.player.x,
      context.player.y,
      radius,
      id,
      talents.wakeDamageScale,
      profile,
    );
    context.afterAreaAttack(id, context.player.x, context.player.y, radius, profile);
  }
}

class ChainArcBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    const radius = state.stats.range;
    const target = context.enemies.findNearest(context.player.x, context.player.y, radius);
    if (!target) {
      return;
    }

    audio.play('scythe'); // spectral chain sound
    const facingAngle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
    const sweepAngle = state.stats.area * (Math.PI / 180);

    const sweep = context.scene.add
      .container(context.player.x, context.player.y)
      .setDepth(32)
      .setAlpha(0.95)
      .setRotation(facingAngle - sweepAngle / 2);
    
    // Draw an arc or a sweep image
    const arcVisual = context.scene.add.graphics();
    arcVisual.lineStyle(6, COLORS.soul, 0.8);
    arcVisual.beginPath();
    arcVisual.arc(0, 0, radius * 0.8, -sweepAngle / 2, sweepAngle / 2);
    arcVisual.strokePath();

    sweep.add(arcVisual);

    context.scene.tweens.add({
      targets: sweep,
      rotation: facingAngle + sweepAngle / 2,
      alpha: 0,
      duration: 250,
      ease: 'Cubic.Out',
      onComplete: () => sweep.destroy(),
    });

    const struck = context.damageArc(context.player.x, context.player.y, radius, id, facingAngle, sweepAngle);
    if (struck.size > 0) {
      // Create visual impacts
      for (const enemy of struck) {
        context.juice.ring(enemy.x, enemy.y, 24, COLORS.soul, 150);
      }
      // Handle upgrade effects
      context.upgradeEffects.afterSpectralChainsAttack(id, struck, (s, d, w, ds) => context.damageEnemy(s, d, w, ds));
    }
  }
}

class GravecleaverBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState): void {
    const performStrike = (range: number, sweepAngleDeg: number, isFollowUp: boolean) => {
      audio.play('scythe');
      
      const currentTarget = context.enemies.findNearest(context.player.x, context.player.y, range);
      const targetAngle = currentTarget 
        ? Phaser.Math.Angle.Between(context.player.x, context.player.y, currentTarget.x, currentTarget.y)
        : context.scytheFacingAngle;

      const sweepAngle = sweepAngleDeg * (Math.PI / 180);
      const sweep = context.scene.add
        .container(context.player.x, context.player.y)
        .setDepth(32)
        .setAlpha(0.95)
        .setRotation(targetAngle - sweepAngle / 2);

      const blade = context.scene.add
        .image(range * 0.5, 0, WEAPONS[id].texture)
        .setDisplaySize(range * 0.9, range * 0.9)
        .setRotation(Math.PI / 4)
        .setTint(isFollowUp ? COLORS.blood : 0xffffff);

      if (isFollowUp) {
        blade.setFlipY(true);
      }

      sweep.add(blade);

      context.scene.tweens.add({
        targets: sweep,
        rotation: targetAngle + sweepAngle / 2,
        alpha: 0,
        duration: 180,
        ease: 'Cubic.Out',
        onComplete: () => sweep.destroy(),
      });

      context.damageArc(context.player.x, context.player.y, range, id, targetAngle, sweepAngle);
      context.juice.ring(context.player.x, context.player.y, range * 0.5, isFollowUp ? COLORS.blood : COLORS.void, 150);
    };

    performStrike(state.stats.range, state.stats.area, false);

    if (state.level >= 7) {
      context.scene.time.delayedCall(200, () => {
        performStrike(state.stats.range * 1.3, state.stats.area * 1.5, true);
      });
    }
  }
}

class BurstFireBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, _time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) {
      return;
    }
    const count = Math.max(1, Math.floor(state.stats.projectileCount));
    // E.g. fire `count` times with a delay
    for (let index = 0; index < count; index += 1) {
      context.scene.time.delayedCall(index * 120, () => {
        if (!context.player.active || !context.run.weapons.equipped.has(id)) return;
        const currentTarget = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
        if (!currentTarget) return;
        
        // Add recoil juice here if needed, audio
        audio.play('soul-bolt');
        const angle = Phaser.Math.Angle.Between(context.player.x, context.player.y, currentTarget.x, currentTarget.y);
        context.createProjectile(id, WEAPONS[id].texture, state, angle, context.scene.time.now);
      });
    }
  }
}

class DeployableTrapBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, _time: number): void {
    // Drop trap at player location
    context.hazardZones.spawn(
      context.player.x,
      context.player.y,
      id,
      {
        radius: state.stats.area,
        durationMs: 8000 + (state.level * 1000), // simplistic scaling
        tickIntervalMs: 500,
        damageScale: 1,
        color: 0x51d96b, // trap color
        strokeColor: 0x4a90e2,
        texture: WEAPONS[id].texture,
        statusEffect: {
          id: 'bleed',
          damagePerTick: 3,
        },
        proximityTrigger: true,
      }
    );
  }
}

class MeteorHammerBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, _time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) return;
    
    // Frontal slam
    const angle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
    context.damageArc(context.player.x, context.player.y, state.stats.range, id, angle, Math.PI / 2);
    
    // Meteor patch at target location
    const meteorX = target.x;
    const meteorY = target.y;
    
    // Spawn falling meteor visual
    const fallHeight = 600;
    const visualMeteor = context.scene.add.image(meteorX, meteorY - fallHeight, 'projectile-meteor')
      .setDepth(60)
      .setDisplaySize(state.stats.area, state.stats.area);

    context.scene.tweens.add({
      targets: visualMeteor,
      y: meteorY,
      duration: 600,
      ease: 'Quad.In',
    });

    context.juice.ring(meteorX, meteorY, state.stats.area, COLORS.hellfire, 600);
    context.scene.time.delayedCall(600, () => {
      if (!context.player.active) {
        visualMeteor.destroy();
        return;
      }
      visualMeteor.destroy();
      // Meteor lands
      context.juice.heavyImpact();
      context.impactFragments.spawn({ x: meteorX, y: meteorY, preset: 'meteor' });
      context.damageArea(meteorX, meteorY, state.stats.area, id);
      context.hazardZones.spawn(meteorX, meteorY, id, {
        radius: state.stats.area,
        durationMs: 4000,
        tickIntervalMs: 500,
        damageScale: 0.5,
        color: COLORS.hellfire,
        strokeColor: 0xd94545,
        statusEffect: {
          id: 'burn',
          damagePerTick: 4,
        },
        visualPreset: 'burning-ground',
      });
    });
  }
}

class FrozenOrbBehavior implements WeaponBehavior {
  fire(context: WeaponContext, id: WeaponId, state: WeaponRuntimeState, time: number): void {
    const target = context.enemies.findNearest(context.player.x, context.player.y, state.stats.range);
    if (!target) return;

    audio.play('soul-bolt'); // Maybe distinct audio later
    const angle = Phaser.Math.Angle.Between(context.player.x, context.player.y, target.x, target.y);
    const projectile = context.createProjectile(id, WEAPONS[id].texture, state, angle, time);

    // Initialize orbiting icicles
    const numIcicles = 3;
    const icicles = [];
    for (let i = 0; i < numIcicles; i++) {
      const icicle = context.scene.physics.add.image(projectile.x, projectile.y, 'projectile-orb')
        .setDisplaySize(state.stats.projectileSize * 0.4, state.stats.projectileSize * 0.4)
        .setTint(0x00ffff) // Ice blue
        .setDepth(15);
      const body = icicle.body as Phaser.Physics.Arcade.Body;
      body.setCircle(icicle.displayWidth * 0.5);
      icicles.push({ sprite: icicle, angleOffset: (Math.PI * 2 / numIcicles) * i });
    }
    
    // We attach icicles and angle to projectile via runtime data or just scene update
    const runtime = context.getProjectileRuntime(projectile);
    if (runtime) {
      runtime.data = {
        icicles,
        orbitRadius: state.stats.projectileSize * 1.5,
        rotationSpeed: 0.05,
        currentRotation: 0,
        hitReadyAt: new Map<Phaser.Physics.Arcade.Image, number>(),
      };
    }
  }
}

export const WEAPON_BEHAVIORS: Record<string, WeaponBehavior> = {
  'scythe': new BoneScytheBehavior(),
  'sigil': new HellfireBehavior(),
  'fan-projectile': new FanProjectilesBehavior(),
  'returning-projectile': new ReturningProjectileBehavior(),
  'chain-strike': new ChainStrikeBehavior(),
  'radial-projectile': new RadialProjectilesBehavior(),
  'lobbed-projectile': new PoisonFlaskBehavior(),
  'pulse': new PulseBehavior(),
  'targeted-projectile': new TargetedProjectilesBehavior(),
  'chain-arc': new ChainArcBehavior(),
  'gravecleaver-slash': new GravecleaverBehavior(),
  'burst-fire': new BurstFireBehavior(),
  'deployable-trap': new DeployableTrapBehavior(),
  'meteor-strike': new MeteorHammerBehavior(),
  'frozen-orb': new FrozenOrbBehavior(),
};
