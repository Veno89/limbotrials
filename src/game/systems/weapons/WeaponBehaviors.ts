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
      angle: 140,
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
};
