import Phaser from 'phaser';

export type ImpactFragmentPreset = 'meteor' | 'ice' | 'bone';

export interface ImpactFragmentConfig {
  x: number;
  y: number;

  textureKey?: string;
  frame?: string | number;

  count?: number;

  minSpeed?: number;
  maxSpeed?: number;

  minScale?: number;
  maxScale?: number;

  minLifetimeMs?: number;
  maxLifetimeMs?: number;

  tint?: number;
  tintVariants?: number[];

  alphaStart?: number;
  alphaEnd?: number;

  scaleEnd?: number;

  rotationSpeedMin?: number;
  rotationSpeedMax?: number;

  drag?: number;

  spreadAngleRad?: number;
  directionRad?: number;

  depth?: number;

  preset?: ImpactFragmentPreset;
}

export class ImpactFragmentSystem {
  private readonly fragments: Phaser.GameObjects.Group;
  private readonly generatedTextures = new Set<string>();

  constructor(private readonly scene: Phaser.Scene) {
    this.fragments = scene.add.group({
      classType: Phaser.GameObjects.Image,
      maxSize: 300,
      runChildUpdate: false,
    });
    this.ensureProceduralTextures();
  }

  private ensureProceduralTextures(): void {
    if (!this.scene.textures.exists('fragment-triangle')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.beginPath();
      g.moveTo(8, 0);
      g.lineTo(16, 16);
      g.lineTo(0, 16);
      g.closePath();
      g.fillPath();
      g.generateTexture('fragment-triangle', 16, 16);
      g.destroy();
      this.generatedTextures.add('fragment-triangle');
    }

    if (!this.scene.textures.exists('fragment-square')) {
      const g = this.scene.make.graphics({ x: 0, y: 0 });
      g.fillStyle(0xffffff, 1);
      g.fillRect(0, 0, 12, 12);
      g.generateTexture('fragment-square', 12, 12);
      g.destroy();
      this.generatedTextures.add('fragment-square');
    }
  }

  public spawn(config: ImpactFragmentConfig): void {
    const activeConfig = this.applyPreset(config);
    const count = activeConfig.count ?? 8;
    const isDirectional = activeConfig.directionRad !== undefined;
    const spread = activeConfig.spreadAngleRad ?? (Math.PI * 2);
    const baseDirection = activeConfig.directionRad ?? 0;

    for (let i = 0; i < count; i++) {
      const fragment = this.fragments.get(activeConfig.x, activeConfig.y) as Phaser.GameObjects.Image | null;
      if (!fragment) {
        break; // Max capacity reached
      }

      // We need physics to easily apply velocity and drag
      if (!fragment.body) {
        this.scene.physics.add.existing(fragment);
      }
      const body = fragment.body as Phaser.Physics.Arcade.Body;
      body.setEnable(true);

      const texture = activeConfig.textureKey ?? (Math.random() > 0.5 ? 'fragment-triangle' : 'fragment-square');
      fragment.setTexture(texture);
      if (activeConfig.frame !== undefined) {
        fragment.setFrame(activeConfig.frame);
      }

      const minScale = activeConfig.minScale ?? 0.5;
      const maxScale = activeConfig.maxScale ?? 1.2;
      const scale = Phaser.Math.FloatBetween(minScale, maxScale);
      fragment.setScale(scale);

      const alphaStart = activeConfig.alphaStart ?? 1;
      fragment.setAlpha(alphaStart);

      const depth = activeConfig.depth ?? 25;
      fragment.setDepth(depth);
      fragment.setActive(true).setVisible(true);

      let tint = activeConfig.tint ?? 0xffffff;
      if (activeConfig.tintVariants && activeConfig.tintVariants.length > 0) {
        tint = activeConfig.tintVariants[Phaser.Math.Between(0, activeConfig.tintVariants.length - 1)]!;
      }
      fragment.setTint(tint);

      const angleOffset = isDirectional 
        ? Phaser.Math.FloatBetween(-spread / 2, spread / 2)
        : Phaser.Math.FloatBetween(0, Math.PI * 2);
      
      const moveAngle = baseDirection + angleOffset;
      const minSpeed = activeConfig.minSpeed ?? 50;
      const maxSpeed = activeConfig.maxSpeed ?? 200;
      const speed = Phaser.Math.FloatBetween(minSpeed, maxSpeed);

      body.setVelocity(Math.cos(moveAngle) * speed, Math.sin(moveAngle) * speed);
      body.setDrag(activeConfig.drag ?? 200);

      const rotMin = activeConfig.rotationSpeedMin ?? -0.1;
      const rotMax = activeConfig.rotationSpeedMax ?? 0.1;
      const rotationSpeed = Phaser.Math.FloatBetween(rotMin, rotMax);

      const minLife = activeConfig.minLifetimeMs ?? 300;
      const maxLife = activeConfig.maxLifetimeMs ?? 600;
      const lifetime = Phaser.Math.Between(minLife, maxLife);

      // We'll manage rotation via a scene update if we want, or a custom tween property.
      // Easiest is a tween for rotation, scale, and alpha.
      const targetRotation = fragment.rotation + (rotationSpeed * lifetime);

      const tweenTargets: any = {
        targets: fragment,
        alpha: activeConfig.alphaEnd ?? 0,
        rotation: targetRotation,
        duration: lifetime,
        ease: 'Cubic.Out',
        onComplete: () => {
          this.killFragment(fragment);
        },
      };

      if (activeConfig.scaleEnd !== undefined) {
        tweenTargets.scaleX = activeConfig.scaleEnd;
        tweenTargets.scaleY = activeConfig.scaleEnd;
      }

      this.scene.tweens.add(tweenTargets);
    }
  }

  private applyPreset(config: ImpactFragmentConfig): ImpactFragmentConfig {
    if (!config.preset) {
      return config;
    }

    switch (config.preset) {
      case 'meteor':
        return {
          ...config,
          count: config.count ?? Phaser.Math.Between(16, 24),
          textureKey: config.textureKey ?? (Math.random() > 0.4 ? 'fragment-triangle' : 'fragment-square'),
          tintVariants: [0xd94545, 0xd7bd82, 0xff8c00, 0x4a4a4a, 0x222222], // fiery and rock colors
          minSpeed: 100,
          maxSpeed: 350,
          drag: 300,
          minScale: 0.4,
          maxScale: 1.5,
          scaleEnd: 0.1,
          minLifetimeMs: 400,
          maxLifetimeMs: 900,
          rotationSpeedMin: -3,
          rotationSpeedMax: 3,
          alphaEnd: 0,
        };
      case 'ice':
        return {
          ...config,
          count: config.count ?? Phaser.Math.Between(12, 18),
          textureKey: config.textureKey ?? 'fragment-triangle',
          tintVariants: [0x00ffff, 0x88ffff, 0xffffff, 0x33ccff],
          minSpeed: 150,
          maxSpeed: 400,
          drag: 400,
          minScale: 0.3,
          maxScale: 1.0,
          scaleEnd: 0,
          minLifetimeMs: 300,
          maxLifetimeMs: 600,
          rotationSpeedMin: -2,
          rotationSpeedMax: 2,
        };
      case 'bone':
        return {
          ...config,
          count: config.count ?? Phaser.Math.Between(8, 14),
          textureKey: config.textureKey ?? 'fragment-square',
          tintVariants: [0xdddddd, 0xbbbbbb, 0xffffff, 0xe0d6c8],
          minSpeed: 50,
          maxSpeed: 200,
          drag: 150,
          minScale: 0.5,
          maxScale: 1.2,
          scaleEnd: undefined, // Doesn't shrink, just fades
          minLifetimeMs: 500,
          maxLifetimeMs: 1000,
          rotationSpeedMin: -1.5,
          rotationSpeedMax: 1.5,
          alphaEnd: 0,
        };
      default:
        return config;
    }
  }

  private killFragment(fragment: Phaser.GameObjects.Image): void {
    if (fragment.active) {
      if (fragment.body) {
        const body = fragment.body as Phaser.Physics.Arcade.Body;
        body.setEnable(false);
      }
      fragment.setActive(false).setVisible(false);
      this.fragments.killAndHide(fragment);
    }
  }

  public update(_time: number): void {
    // We don't strictly need a manual update loop since tweens and physics bodies
    // handle the movement, rotation, and fading.
  }

  public destroy(): void {
    if (!this.fragments || !this.fragments.scene) return;
    
    // Kill any active tweens on our fragments
    const children = this.fragments.getChildren();
    if (children) {
      children.forEach((child) => {
        this.scene.tweens.killTweensOf(child);
      });
    }
    this.fragments.destroy(true);
  }
}
