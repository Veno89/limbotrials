import Phaser from 'phaser';

type PresentableSprite = Phaser.GameObjects.Image | Phaser.GameObjects.Sprite;

export interface PresentationColorOptions {
  color?: number;
  alpha?: number;
}

export interface TimedPresentationOptions {
  durationMs?: number;
  ease?: string;
}

interface FollowedObject {
  target: PresentableSprite;
  object: Phaser.GameObjects.GameObject &
    Phaser.GameObjects.Components.Transform &
    Phaser.GameObjects.Components.Visible;
  offsetX: number;
  offsetY: number;
  copyRotation: boolean;
}

/**
 * Small, opt-in presentation helpers for gameplay sprites and the content lab.
 * The system owns only companions/tweens it creates and tears them down with its
 * scene. Callers remain responsible for deciding which entities use each effect.
 */
export class SpritePresentationSystem {
  private readonly ownedObjects = new Set<Phaser.GameObjects.GameObject>();
  private readonly ownedTweens = new Set<Phaser.Tweens.Tween>();
  private readonly timers = new Set<Phaser.Time.TimerEvent>();
  private readonly followers = new Set<FollowedObject>();

  constructor(private readonly scene: Phaser.Scene) {
    scene.events.on(Phaser.Scenes.Events.UPDATE, this.syncFollowers, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  get liveObjectCount(): number {
    this.pruneDestroyedObjects();
    return this.ownedObjects.size + this.ownedTweens.size + this.timers.size;
  }

  flashHit(
    target: PresentableSprite,
    { color = 0xffffff, durationMs = 85 }: PresentationColorOptions & TimedPresentationOptions = {},
  ): void {
    const wasTinted = target.isTinted;
    const previousTint = [target.tintTopLeft, target.tintTopRight, target.tintBottomLeft, target.tintBottomRight] as const;
    const previousTintMode = target.tintMode;
    target.setTint(color).setTintMode(Phaser.TintModes.FILL);
    this.addTimer(durationMs, () => {
      if (!target.active) {
        return;
      }
      if (wasTinted) {
        target.setTint(...previousTint).setTintMode(previousTintMode);
      } else {
        target.clearTint().setTintMode(previousTintMode);
      }
    });
  }

  setTint(target: PresentableSprite, color?: number): void {
    if (color === undefined) {
      target.clearTint();
      return;
    }
    target.setTint(color);
  }

  setMirrored(target: PresentableSprite, mirrored: boolean): void {
    target.setFlipX(mirrored);
  }

  addOutline(
    target: PresentableSprite,
    { color = 0xd8f6ff, alpha = 0.7, thickness = 4 }: PresentationColorOptions & { thickness?: number } = {},
  ): Phaser.GameObjects.Image {
    const outline = this.scene.add
      .image(target.x, target.y, target.texture.key, target.frame.name)
      .setOrigin(target.originX, target.originY)
      .setDisplaySize(target.displayWidth + thickness * 2, target.displayHeight + thickness * 2)
      .setTint(color)
      .setTintMode(Phaser.TintModes.FILL)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(target.depth - 1);
    this.follow(target, outline, 0, 0, true);
    return this.own(outline);
  }

  addShadow(
    target: PresentableSprite,
    { color = 0x000000, alpha = 0.42, offsetY = 14 }: PresentationColorOptions & { offsetY?: number } = {},
  ): Phaser.GameObjects.Ellipse {
    const shadow = this.scene.add
      .ellipse(target.x, target.y + offsetY, target.displayWidth * 0.72, Math.max(8, target.displayHeight * 0.16), color, alpha)
      .setDepth(target.depth - 2);
    this.follow(target, shadow, 0, offsetY, false);
    return this.own(shadow);
  }

  addGlowPulse(
    target: PresentableSprite,
    {
      color = 0x70ddff,
      alpha = 0.48,
      durationMs = 520,
      scale = 1.16,
    }: PresentationColorOptions & TimedPresentationOptions & { scale?: number } = {},
  ): Phaser.GameObjects.Image {
    const glow = this.scene.add
      .image(target.x, target.y, target.texture.key, target.frame.name)
      .setOrigin(target.originX, target.originY)
      .setDisplaySize(target.displayWidth * scale, target.displayHeight * scale)
      .setTint(color)
      .setTintMode(Phaser.TintModes.FILL)
      .setAlpha(alpha)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(target.depth - 1);
    this.follow(target, glow, 0, 0, true);
    this.trackTween(
      this.scene.tweens.add({
        targets: glow,
        alpha: Math.max(0.08, alpha * 0.3),
        scaleX: glow.scaleX * 1.08,
        scaleY: glow.scaleY * 1.08,
        duration: durationMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );
    return this.own(glow);
  }

  addStatusOverlay(
    target: PresentableSprite,
    { color = 0x9cff71, alpha = 0.75 }: PresentationColorOptions = {},
  ): Phaser.GameObjects.Arc {
    const radius = Math.max(target.displayWidth, target.displayHeight) * 0.58;
    const ring = this.scene.add
      .circle(target.x, target.y, radius, color, 0)
      .setStrokeStyle(3, color, alpha)
      .setDepth(target.depth + 1);
    this.follow(target, ring, 0, 0, false);
    this.trackTween(
      this.scene.tweens.add({
        targets: ring,
        alpha: 0.25,
        duration: 440,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );
    return this.own(ring);
  }

  playRecoil(
    target: PresentableSprite,
    direction: Phaser.Math.Vector2 = new Phaser.Math.Vector2(1, 0),
    { distance = 10, durationMs = 70 }: TimedPresentationOptions & { distance?: number } = {},
  ): Phaser.Tweens.Tween {
    const normalized = direction.clone().normalize();
    return this.trackTween(
      this.scene.tweens.add({
        targets: target,
        x: target.x - normalized.x * distance,
        y: target.y - normalized.y * distance,
        duration: durationMs,
        yoyo: true,
        ease: 'Quad.Out',
      }),
    );
  }

  playSquashStretch(
    target: PresentableSprite,
    { amount = 0.12, durationMs = 90 }: TimedPresentationOptions & { amount?: number } = {},
  ): Phaser.Tweens.Tween {
    return this.trackTween(
      this.scene.tweens.add({
        targets: target,
        scaleX: target.scaleX * (1 + amount),
        scaleY: target.scaleY * (1 - amount),
        duration: durationMs,
        yoyo: true,
        ease: 'Sine.InOut',
      }),
    );
  }

  playHover(
    target: PresentableSprite,
    { distance = 6, durationMs = 700 }: TimedPresentationOptions & { distance?: number } = {},
  ): Phaser.Tweens.Tween {
    return this.trackTween(
      this.scene.tweens.add({
        targets: target,
        y: target.y - distance,
        duration: durationMs,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.InOut',
      }),
    );
  }

  playSpawn(
    target: PresentableSprite,
    { durationMs = 180, ease = 'Back.Out' }: TimedPresentationOptions = {},
  ): Phaser.Tweens.Tween {
    const finalScaleX = target.scaleX;
    const finalScaleY = target.scaleY;
    target.setAlpha(0).setScale(finalScaleX * 0.72, finalScaleY * 0.72);
    return this.trackTween(
      this.scene.tweens.add({
        targets: target,
        alpha: 1,
        scaleX: finalScaleX,
        scaleY: finalScaleY,
        duration: durationMs,
        ease,
      }),
    );
  }

  playDeath(
    target: PresentableSprite,
    { durationMs = 260, ease = 'Quad.In' }: TimedPresentationOptions = {},
  ): Phaser.Tweens.Tween {
    return this.trackTween(
      this.scene.tweens.add({
        targets: target,
        alpha: 0,
        angle: target.angle + 10,
        scaleX: target.scaleX * 0.72,
        scaleY: target.scaleY * 0.72,
        duration: durationMs,
        ease,
      }),
    );
  }

  emitTrail(
    target: PresentableSprite,
    { color = 0x74dfff, alpha = 0.34, durationMs = 220 }: PresentationColorOptions & TimedPresentationOptions = {},
  ): Phaser.GameObjects.Image {
    const ghost = this.scene.add
      .image(target.x, target.y, target.texture.key, target.frame.name)
      .setOrigin(target.originX, target.originY)
      .setDisplaySize(target.displayWidth, target.displayHeight)
      .setRotation(target.rotation)
      .setFlip(target.flipX, target.flipY)
      .setTint(color)
      .setAlpha(alpha)
      .setDepth(target.depth - 1);
    this.own(ghost);
    this.trackTween(
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        scaleX: ghost.scaleX * 0.84,
        scaleY: ghost.scaleY * 0.84,
        duration: durationMs,
        onComplete: () => this.releaseObject(ghost),
      }),
    );
    return ghost;
  }

  attachImpact(
    x: number,
    y: number,
    { color = 0xffffff, alpha = 0.9, durationMs = 180 }: PresentationColorOptions & TimedPresentationOptions = {},
  ): Phaser.GameObjects.Arc {
    const impact = this.scene.add.circle(x, y, 7, color, alpha).setDepth(520);
    this.own(impact);
    this.trackTween(
      this.scene.tweens.add({
        targets: impact,
        radius: 28,
        alpha: 0,
        duration: durationMs,
        ease: 'Quad.Out',
        onComplete: () => this.releaseObject(impact),
      }),
    );
    return impact;
  }

  clear(): void {
    for (const tween of this.ownedTweens) {
      tween.stop();
      tween.destroy();
    }
    this.ownedTweens.clear();
    for (const timer of this.timers) {
      timer.remove(false);
    }
    this.timers.clear();
    for (const object of this.ownedObjects) {
      object.destroy();
    }
    this.ownedObjects.clear();
    this.followers.clear();
  }

  destroy(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.syncFollowers, this);
    this.clear();
  }

  private own<T extends Phaser.GameObjects.GameObject>(object: T): T {
    this.ownedObjects.add(object);
    object.once(Phaser.GameObjects.Events.DESTROY, () => {
      this.ownedObjects.delete(object);
      for (const follower of this.followers) {
        if (follower.object === (object as unknown as FollowedObject['object'])) {
          this.followers.delete(follower);
        }
      }
    });
    return object;
  }

  private follow(
    target: PresentableSprite,
    object: FollowedObject['object'],
    offsetX: number,
    offsetY: number,
    copyRotation: boolean,
  ): void {
    this.followers.add({ target, object, offsetX, offsetY, copyRotation });
  }

  private syncFollowers(): void {
    for (const follower of this.followers) {
      if (!follower.target.active || !follower.object.active) {
        this.followers.delete(follower);
        continue;
      }
      follower.object.setPosition(follower.target.x + follower.offsetX, follower.target.y + follower.offsetY);
      follower.object.setVisible(follower.target.visible);
      if (follower.copyRotation) {
        follower.object.setRotation(follower.target.rotation);
      }
    }
  }

  private trackTween(tween: Phaser.Tweens.Tween): Phaser.Tweens.Tween {
    this.ownedTweens.add(tween);
    tween.once(Phaser.Tweens.Events.TWEEN_COMPLETE, () => this.ownedTweens.delete(tween));
    tween.once(Phaser.Tweens.Events.TWEEN_STOP, () => this.ownedTweens.delete(tween));
    return tween;
  }

  private addTimer(delay: number, callback: () => void): Phaser.Time.TimerEvent {
    const timer = this.scene.time.delayedCall(delay, () => {
      this.timers.delete(timer);
      callback();
    });
    this.timers.add(timer);
    return timer;
  }

  private releaseObject(object: Phaser.GameObjects.GameObject): void {
    this.ownedObjects.delete(object);
    object.destroy();
  }

  private pruneDestroyedObjects(): void {
    for (const object of this.ownedObjects) {
      if (!object.active) {
        this.ownedObjects.delete(object);
      }
    }
  }
}
