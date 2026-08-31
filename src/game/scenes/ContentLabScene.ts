import Phaser from 'phaser';
import { VISUAL_ASSETS } from '../data/assets';
import type { VisualAssetDefinition } from '../assets/assetTypes';
import { COLORS, GAME_HEIGHT } from '../constants';
import { SpritePresentationSystem } from '../presentation/SpritePresentationSystem';
import type { GameplayEffectSequenceId } from '../types/gameTypes';
import {
  GAMEPLAY_EFFECT_SEQUENCES,
  type GameplayEffectRole,
} from '../vfx/GameplayEffectRegistry';
import {
  GameplayEffectSystem,
  type GameplayEffectHandle,
} from '../vfx/GameplayEffectSystem';
import { discoveredVvfxCatalog } from '../vfx/discoveredVvfxCatalog';
import { VvfxSystem, type VvfxManagedHandle } from '../vfx/VvfxSystem';

type LabCategory =
  | 'all-assets'
  | 'entities'
  | 'attacks'
  | 'projectiles'
  | 'impacts'
  | 'statuses'
  | 'animations'
  | 'vvfx';

type LabItem =
  | { kind: 'visual'; id: string; definition: VisualAssetDefinition }
  | { kind: 'vvfx'; id: string; supportsEndpoints: boolean }
  | {
      kind: 'semantic-effect';
      id: string;
      sequenceId: GameplayEffectSequenceId;
      role: GameplayEffectRole;
      placement: 'point' | 'beam';
    }
  | { kind: 'presentation-impact'; id: 'presentation:impact' };

interface ContentLabSceneData {
  resumeSceneKeys?: string[];
}

interface LabToggles {
  origin: boolean;
  attachments: boolean;
  bounds: boolean;
  collision: boolean;
  hitFlash: boolean;
  tint: boolean;
  outline: boolean;
  shadow: boolean;
  glow: boolean;
  status: boolean;
  hover: boolean;
}

const CATEGORIES: readonly LabCategory[] = [
  'all-assets',
  'entities',
  'attacks',
  'projectiles',
  'impacts',
  'statuses',
  'animations',
  'vvfx',
];
const LAB_SPEEDS = [0.25, 0.5, 1] as const;
const REPEAT_COUNTS = [1, 5, 20] as const;
const PALETTE = [0xffffff, 0x71dcff, 0xd59cff, 0xff8a65, 0x9dff91] as const;
const BACKGROUNDS = [
  { label: 'ABYSS', color: 0x060a0d },
  { label: 'NEUTRAL', color: 0x55595d },
  { label: 'LIGHT', color: 0xd9d8d2 },
  { label: 'CHECKER', color: 0x24282c },
] as const;
const LAB_KEY_CAPTURES = 'SPACE,UP,DOWN,LEFT,RIGHT,PAGEUP,PAGEDOWN,F11';
const PREVIEW_X = 1010;
const PREVIEW_Y = 505;
const PREVIEW_MAX_SIZE = 390;
const PREVIEW_VIEWPORT_X = 485;
const PREVIEW_VIEWPORT_Y = 18;
const PREVIEW_VIEWPORT_WIDTH = 930;
const PREVIEW_VIEWPORT_HEIGHT = GAME_HEIGHT - 36;

/** Vite-dev-only production preview scene. It is dynamically imported by gameLauncher. */
export class ContentLabScene extends Phaser.Scene {
  private resumeSceneKeys: string[] = [];
  private categoryIndex = 0;
  private selectionIndex = 0;
  private speedIndex = 2;
  private repeatIndex = 0;
  private backgroundIndex = 0;
  private paletteIndex = 1;
  private mirrored = false;
  private paused = false;
  private toggles: LabToggles = {
    origin: true,
    attachments: true,
    bounds: true,
    collision: true,
    hitFlash: false,
    tint: false,
    outline: false,
    shadow: false,
    glow: false,
    status: false,
    hover: false,
  };
  private preview?: Phaser.GameObjects.Sprite;
  private backgroundGraphics?: Phaser.GameObjects.Graphics;
  private guideGraphics?: Phaser.GameObjects.Graphics;
  private guideLabels: Phaser.GameObjects.Text[] = [];
  private itemText?: Phaser.GameObjects.Text;
  private metadataText?: Phaser.GameObjects.Text;
  private stateText?: Phaser.GameObjects.Text;
  private statusText?: Phaser.GameObjects.Text;
  private controlsText?: Phaser.GameObjects.Text;
  private anchorStart?: Phaser.GameObjects.Arc;
  private anchorEnd?: Phaser.GameObjects.Arc;
  private effectCamera?: Phaser.Cameras.Scene2D.Camera;
  private effectSelectionActive = false;
  private effectZoom = 1;
  private vvfx!: VvfxSystem;
  private gameplayEffects!: GameplayEffectSystem;
  private presentation!: SpritePresentationSystem;
  private currentVvfxHandle?: VvfxManagedHandle;
  private currentSemanticHandle?: GameplayEffectHandle;
  private nextAutoFlashAt = 0;
  private leakCheck?: Phaser.Time.TimerEvent;
  private readonly effectSpawnTimers = new Set<Phaser.Time.TimerEvent>();
  private keyboard?: Phaser.Input.Keyboard.KeyboardPlugin;
  private addedKeyboardCaptures: number[] = [];
  private leakStatus = 'idle';
  private previousGlobalAnimationTimeScale = 1;
  private anchorMotionElapsedMs = 0;
  private readonly controlledRuntimeHandles = new Map<
    VvfxManagedHandle,
    (() => void) | undefined
  >();
  private readonly controlledSemanticHandles = new Set<GameplayEffectHandle>();

  constructor() {
    super('ContentLabScene');
  }

  init(data: ContentLabSceneData = {}): void {
    this.resumeSceneKeys = [...(data.resumeSceneKeys ?? [])];
  }

  create(): void {
    document.body.dataset.contentLab = 'open';
    this.previousGlobalAnimationTimeScale = this.anims.globalTimeScale;
    this.cameras.main.setBackgroundColor('#05080a');
    this.backgroundGraphics = this.add.graphics().setDepth(-100);
    this.guideGraphics = this.add.graphics().setDepth(80);
    this.vvfx = new VvfxSystem(this);
    this.gameplayEffects = new GameplayEffectSystem(this, this.vvfx);
    this.presentation = new SpritePresentationSystem(this);
    this.createLayout();
    this.createAnchors();
    this.createEffectCamera();
    this.bindControls();
    this.applyTimeScale();
    this.renderBackground();
    this.renderCurrent();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      delete document.body.dataset.contentLab;
      this.leakCheck?.remove(false);
      this.cancelScheduledEffectSpawns();
      this.releaseKeyboardCaptures();
      this.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, this.handleEffectObjectAdded);
      this.cancelControlledRuntimeHandles();
      this.presentation.destroy();
      this.gameplayEffects.destroy();
      this.anims.globalTimeScale = this.previousGlobalAnimationTimeScale;
    });
  }

  update(_time: number, delta: number): void {
    const scaledDelta = this.paused
      ? 0
      : Math.max(0, delta) * (LAB_SPEEDS[this.speedIndex] ?? 1);
    if (scaledDelta > 0) {
      this.anchorMotionElapsedMs += scaledDelta;
    }
    this.updateAnchorMotion();
    this.syncControlledEffectAnchors();
    this.stepControlledRuntimeHandles(scaledDelta);
    if (
      this.toggles.hitFlash
      && this.preview?.active
      && this.anchorMotionElapsedMs >= this.nextAutoFlashAt
    ) {
      this.nextAutoFlashAt = this.anchorMotionElapsedMs + 520;
      this.presentation.flashHit(this.preview);
    }
    this.renderLiveState();
  }

  private createLayout(): void {
    this.add.rectangle(250, GAME_HEIGHT / 2, 470, GAME_HEIGHT - 36, 0x0b1115, 0.97)
      .setStrokeStyle(2, COLORS.border)
      .setDepth(90);
    this.add.rectangle(1660, GAME_HEIGHT / 2, 480, GAME_HEIGHT - 36, 0x0b1115, 0.97)
      .setStrokeStyle(2, COLORS.border)
      .setDepth(90);
    this.add.text(40, 36, 'LIMBO CONTENT LAB', {
      fontFamily: 'Cinzel, serif', fontSize: '28px', color: '#efd595',
    }).setDepth(100);
    this.add.text(40, 78, 'DEVELOPMENT-ONLY ASSET / EFFECT QUALIFICATION', {
      fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#8fa5ae',
    }).setDepth(100);

    this.itemText = this.add.text(40, 132, '', {
      fontFamily: 'Cinzel, serif', fontSize: '18px', color: '#dce8ed',
      wordWrap: { width: 410 },
    }).setDepth(100);
    this.metadataText = this.add.text(40, 224, '', {
      fontFamily: 'Consolas, monospace', fontSize: '13px', color: '#9db0b8',
      lineSpacing: 6, wordWrap: { width: 410 },
    }).setDepth(100);
    this.statusText = this.add.text(40, 910, '', {
      fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#8edfff',
      wordWrap: { width: 410 },
    }).setDepth(100);

    this.add.text(1440, 38, 'CONTROLS', {
      fontFamily: 'Cinzel, serif', fontSize: '21px', color: '#efd595',
    }).setDepth(100);
    this.controlsText = this.add.text(1440, 82, '', {
      fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#b7c7cd',
      lineSpacing: 5, wordWrap: { width: 430 },
    }).setDepth(100);
    this.stateText = this.add.text(1440, 755, '', {
      fontFamily: 'Consolas, monospace', fontSize: '12px', color: '#8edfff',
      lineSpacing: 5, wordWrap: { width: 430 },
    }).setDepth(100);

    // Keep category navigation above the site-shell return control, which sits
    // over the lower-left edge of the canvas in development builds.
    this.addButton(122, 850, 150, 'CATEGORY <', () => this.changeCategory(-1));
    this.addButton(290, 850, 150, 'CATEGORY >', () => this.changeCategory(1));
    this.addButton(1470, 1020, 125, 'PREVIOUS', () => this.changeSelection(-1));
    this.addButton(1610, 1020, 125, 'NEXT', () => this.changeSelection(1));
    this.addButton(1750, 1020, 125, 'CLOSE', () => this.close());
  }

  private createAnchors(): void {
    this.anchorStart = this.add.circle(PREVIEW_X - 205, PREVIEW_Y, 8, 0xdaf7ff, 0.92)
      .setStrokeStyle(2, 0x5bc9ff, 1)
      .setDepth(72);
    this.anchorEnd = this.add.circle(PREVIEW_X + 205, PREVIEW_Y, 8, 0xf2c6ff, 0.92)
      .setStrokeStyle(2, 0xb98cff, 1)
      .setDepth(72);
  }

  private createEffectCamera(): void {
    const camera = this.cameras.add(
      PREVIEW_VIEWPORT_X,
      PREVIEW_VIEWPORT_Y,
      PREVIEW_VIEWPORT_WIDTH,
      PREVIEW_VIEWPORT_HEIGHT,
    );
    camera.setName('content-lab-effect-preview');
    camera.setBackgroundColor(BACKGROUNDS[this.backgroundIndex]?.color ?? BACKGROUNDS[0].color);
    camera.setVisible(false);
    const previewObjects = new Set<Phaser.GameObjects.GameObject>([
      this.backgroundGraphics!,
      this.anchorStart!,
      this.anchorEnd!,
    ]);
    camera.ignore(this.children.list.filter((child) => !previewObjects.has(child)));
    this.effectCamera = camera;
    this.applyEffectCameraZoom();
    this.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, this.handleEffectObjectAdded);
  }

  private bindControls(): void {
    const keyboard = this.input.keyboard;
    this.keyboard = keyboard ?? undefined;
    if (keyboard) {
      const existingCaptures = new Set(keyboard.manager.captures);
      keyboard.addCapture(LAB_KEY_CAPTURES);
      this.addedKeyboardCaptures = keyboard.manager.captures.filter(
        (keyCode) => !existingCaptures.has(keyCode),
      );
    }
    keyboard?.on('keydown-ESC', () => this.close());
    keyboard?.on('keydown-COMMA', () => this.changeCategory(-1));
    keyboard?.on('keydown-PERIOD', () => this.changeCategory(1));
    keyboard?.on('keydown-PAGE_UP', () => this.changeSelection(-1));
    keyboard?.on('keydown-PAGE_DOWN', () => this.changeSelection(1));
    keyboard?.on('keydown-SPACE', () => this.togglePlayback());
    keyboard?.on('keydown-ENTER', () => this.restartPreview());
    keyboard?.on('keydown-LEFT', () => this.stepFrame(-1));
    keyboard?.on('keydown-RIGHT', () => this.stepFrame(1));
    keyboard?.on('keydown-Q', () => this.cycleSpeed());
    keyboard?.on('keydown-B', () => this.cycleBackground());
    keyboard?.on('keydown-M', () => this.toggleMirror());
    keyboard?.on('keydown-P', () => this.cyclePalette());
    keyboard?.on('keydown-E', () => this.spawnCurrentEffect(1));
    keyboard?.on('keydown-X', () => this.spawnCurrentEffect(REPEAT_COUNTS[this.repeatIndex] ?? 1));
    keyboard?.on('keydown-C', () => void this.copyCurrentId());
    keyboard?.on('keydown-O', () => this.toggle('origin'));
    keyboard?.on('keydown-A', () => this.toggle('attachments'));
    keyboard?.on('keydown-U', () => this.toggle('bounds'));
    keyboard?.on('keydown-K', () => this.toggle('collision'));
    keyboard?.on('keydown-ONE', () => this.toggle('hitFlash'));
    keyboard?.on('keydown-TWO', () => this.toggle('tint'));
    keyboard?.on('keydown-THREE', () => this.toggle('outline'));
    keyboard?.on('keydown-FOUR', () => this.toggle('shadow'));
    keyboard?.on('keydown-FIVE', () => this.toggle('glow'));
    keyboard?.on('keydown-SIX', () => this.toggle('status'));
    keyboard?.on('keydown-SEVEN', () => this.toggle('hover'));
    keyboard?.on('keydown-MINUS', () => this.adjustZoom(0.8));
    keyboard?.on('keydown-PLUS', () => this.adjustZoom(1.25));
    keyboard?.on('keydown-NUMPAD_ADD', () => this.adjustZoom(1.25));
    keyboard?.on('keydown-Z', () => this.withPreview((preview) => this.presentation.playRecoil(preview)));
    keyboard?.on('keydown-S', () => this.withPreview((preview) => this.presentation.playSquashStretch(preview)));
    keyboard?.on('keydown-D', () => this.withPreview((preview) => this.presentation.playDeath(preview)));
    keyboard?.on('keydown-R', () => this.cycleRepeatCount());
  }

  private renderCurrent(): void {
    this.setEffectPreviewActive(false);
    this.cancelCurrentEffect();
    this.presentation?.clear();
    this.preview?.destroy();
    this.preview = undefined;
    this.clearGuideLabels();
    this.guideGraphics?.clear();
    const item = this.currentItem();
    if (!item) {
      this.itemText?.setText(`${this.currentCategory().toUpperCase()}\nNO REGISTERED ITEMS`);
      this.metadataText?.setText('This category is intentionally empty in the current manifest.');
      this.renderControls();
      return;
    }

    this.itemText?.setText(`${this.currentCategory().toUpperCase()}\n${item.id}`);
    if (item.kind === 'visual') {
      this.renderVisual(item.definition);
    } else {
      this.renderEffectItem(item);
    }
    this.renderControls();
    this.renderGuides();
  }

  private renderVisual(definition: VisualAssetDefinition): void {
    const longestSide = Math.max(definition.frameWidth, definition.frameHeight);
    const fitScale = Math.min(1, PREVIEW_MAX_SIZE / Math.max(1, longestSide));
    this.preview = this.add.sprite(PREVIEW_X, PREVIEW_Y, definition.id)
      .setOrigin(definition.origin.x, definition.origin.y)
      .setScale(fitScale)
      .setDepth(30)
      .setFlipX(this.mirrored);
    this.preview.setData('labBaseScale', fitScale);
    if (definition.animation) {
      const animationKey = `content-lab:${definition.id}`;
      if (!this.anims.exists(animationKey)) {
        this.anims.create({
          key: animationKey,
          frames: this.anims.generateFrameNumbers(definition.id, {
            start: definition.animation.startFrame,
            end: definition.animation.endFrame,
          }),
          frameRate: definition.animation.framesPerSecond,
          repeat: definition.animation.loop ? -1 : 0,
        });
      }
      this.preview.play(animationKey);
      if (this.paused) this.preview.anims.pause();
    }
    this.applyVisualPresentation();
    this.metadataText?.setText(this.visualMetadata(definition));
  }

  private renderEffectItem(item: Exclude<LabItem, { kind: 'visual' }>): void {
    this.setEffectPreviewActive(true);
    this.metadataText?.setText(
      item.kind === 'vvfx'
        ? `kind: authored VVFX runtime\nplacement: ${item.supportsEndpoints ? 'source-to-target Beam' : 'world-space point'}\nsource: ${discoveredVvfxCatalog.effects.get(item.id)?.sourcePath ?? 'unknown'}\n\n[E] PLAY  [X] REPEAT / CLEANUP CHECK`
        : item.kind === 'semantic-effect'
          ? `kind: typed gameplay effect role\nsequence: ${item.sequenceId}\nrole: ${item.role}\nplacement: ${item.placement}\n\nWeapon/enemy code does not know the runtime file ID.`
          : 'kind: reusable code-driven impact attachment\nplacement: world-space point\n\nThis is a bounded Phaser primitive, not final artwork.',
    );
    this.spawnCurrentEffect(1);
  }

  private applyVisualPresentation(): void {
    const preview = this.preview;
    if (!preview) return;
    if (this.toggles.tint) this.presentation.setTint(preview, PALETTE[this.paletteIndex] ?? PALETTE[0]);
    if (this.toggles.outline) this.presentation.addOutline(preview);
    if (this.toggles.shadow) this.presentation.addShadow(preview);
    if (this.toggles.glow) this.presentation.addGlowPulse(preview);
    if (this.toggles.status) this.presentation.addStatusOverlay(preview);
    if (this.toggles.hover) this.presentation.playHover(preview);
  }

  private spawnCurrentEffect(count: number): void {
    const item = this.currentItem();
    if (!item || item.kind === 'visual') {
      this.setStatus('Select an impact or VVFX item to spawn effects.');
      return;
    }
    this.cancelCurrentEffect();
    const baseline = this.activeEffectCount();
    const boundedCount = Phaser.Math.Clamp(Math.floor(count), 1, 20);
    for (let index = 0; index < boundedCount; index += 1) {
      const timer = this.time.delayedCall(index * 70, () => {
        this.effectSpawnTimers.delete(timer);
        this.spawnEffectItem(item, index);
      });
      this.effectSpawnTimers.add(timer);
    }
    this.leakStatus = `checking ${boundedCount} spawn(s)`;
    this.leakCheck?.remove(false);
    this.leakCheck = this.time.delayedCall(5_000, () => {
      const remaining = this.activeEffectCount();
      const playback = this.currentPlaybackHandle();
      const controlledAllowance = playback && !playback.isDestroyed ? 1 : 0;
      const expected = baseline + controlledAllowance;
      const leaked = Math.max(0, remaining - expected);
      this.leakStatus = leaked > 0
        ? `possible leak: ${leaked} unexpected effect object(s) remain`
        : `cleanup passed: baseline + ${controlledAllowance} controlled preview`;
      this.setStatus(this.leakStatus);
    });
  }

  private spawnEffectItem(item: Exclude<LabItem, { kind: 'visual' }>, index: number): void {
    const verticalOffset = (index % 5 - 2) * 28;
    const start = () => this.anchorStart?.active
      ? { x: this.anchorStart.x, y: this.anchorStart.y + verticalOffset }
      : undefined;
    const end = () => this.anchorEnd?.active
      ? { x: this.anchorEnd.x, y: this.anchorEnd.y + verticalOffset }
      : undefined;
    if (item.kind === 'vvfx') {
      const handle = item.supportsEndpoints
        ? this.vvfx.spawnBetweenManaged(item.id, {
            start: start()!, end: end()!, baseDepth: 34, beamFit: 'crop', maxDurationMs: 3_200,
            retainAfterComplete: index === 0,
          })
        : this.vvfx.spawnAtManaged(item.id, {
            ...end()!, baseDepth: 34, retainAfterComplete: index === 0,
          });
      if (index === 0) this.currentVvfxHandle = handle;
      this.controlRuntimeHandle(handle, () => {
        const currentEnd = end();
        if (!currentEnd) return;
        if (item.supportsEndpoints) {
          const currentStart = start();
          if (!currentStart) return;
          handle.setEndpoints(
            currentStart.x,
            currentStart.y,
            currentEnd.x,
            currentEnd.y,
          );
        } else {
          handle.setPosition(currentEnd.x, currentEnd.y);
        }
      });
      return;
    }
    if (item.kind === 'semantic-effect') {
      const handle = item.placement === 'beam'
        ? this.gameplayEffects.playBeam(item.sequenceId, item.role, {
            start, end, seed: 8421 + index, retainAfterComplete: index === 0,
          })
        : this.gameplayEffects.playPoint(item.sequenceId, item.role, {
            point: end, follow: true, seed: 8421 + index, retainAfterComplete: index === 0,
          });
      if (index === 0) this.currentSemanticHandle = handle;
      this.controlledSemanticHandles.add(handle);
      if (handle.runtimeHandle) this.controlRuntimeHandle(handle.runtimeHandle);
      if (this.paused) {
        this.tweens.pauseAll();
      }
      return;
    }
    this.presentation.attachImpact(end()?.x ?? PREVIEW_X, end()?.y ?? PREVIEW_Y);
  }

  private renderGuides(): void {
    this.guideGraphics?.clear();
    this.clearGuideLabels();
    const item = this.currentItem();
    const preview = this.preview;
    if (!preview || item?.kind !== 'visual') return;
    const definition = item.definition;
    const left = preview.x - definition.origin.x * preview.displayWidth;
    const top = preview.y - definition.origin.y * preview.displayHeight;
    const graphics = this.guideGraphics!;
    if (this.toggles.bounds) {
      graphics.lineStyle(2, 0x79d9ff, 0.9).strokeRect(left, top, preview.displayWidth, preview.displayHeight);
    }
    if (this.toggles.origin) {
      graphics.lineStyle(2, 0xffdc78, 1);
      graphics.lineBetween(preview.x - 14, preview.y, preview.x + 14, preview.y);
      graphics.lineBetween(preview.x, preview.y - 14, preview.x, preview.y + 14);
      this.addGuideLabel(preview.x + 12, preview.y + 12, 'ORIGIN / PIVOT', '#ffdc78');
    }
    if (this.toggles.attachments) {
      for (const attachment of definition.attachments) {
        const normalizedX = this.mirrored ? 1 - attachment.x : attachment.x;
        const x = left + normalizedX * preview.displayWidth;
        const y = top + attachment.y * preview.displayHeight;
        graphics.fillStyle(0xa8ffce, 0.95).fillCircle(x, y, 4);
        this.addGuideLabel(x + 7, y - 6, attachment.name, '#a8ffce');
      }
    }
    if (this.toggles.collision && definition.collision) {
      graphics.lineStyle(3, 0xff6c72, 0.9);
      const scaleX = preview.displayWidth / definition.expectedWidth;
      const scaleY = preview.displayHeight / definition.expectedHeight;
      const collisionOffset = definition.collision.offset ?? { x: 0.5, y: 0.5 };
      const normalizedCollisionX = this.mirrored
        ? 1 - collisionOffset.x
        : collisionOffset.x;
      const collisionX = left + normalizedCollisionX * preview.displayWidth;
      const collisionY = top + collisionOffset.y * preview.displayHeight;
      if (definition.collision.shape === 'circle') {
        graphics.strokeCircle(
          collisionX,
          collisionY,
          definition.collision.radius * Math.min(scaleX, scaleY),
        );
      } else {
        graphics.strokeRect(
          collisionX - (definition.collision.width * scaleX) / 2,
          collisionY - (definition.collision.height * scaleY) / 2,
          definition.collision.width * scaleX,
          definition.collision.height * scaleY,
        );
      }
    }
  }

  private renderControls(): void {
    const on = (value: boolean) => value ? 'ON' : 'off';
    this.controlsText?.setText([
      '[,/.] category     [PgUp/PgDn] item',
      '[Space] play/pause [Enter] restart',
      '[Left/Right] frame step   [Q] slow motion',
      '[-/+] zoom         [B] background',
      '[O] origin/pivot   [A] attachments',
      '[U] bounds         [K] collision',
      `[1] hit flash ${on(this.toggles.hitFlash)}   [2] tint ${on(this.toggles.tint)}`,
      `[3] outline ${on(this.toggles.outline)}     [4] shadow ${on(this.toggles.shadow)}`,
      `[5] glow ${on(this.toggles.glow)}        [6] status ${on(this.toggles.status)}`,
      `[7] hover ${on(this.toggles.hover)}       [M] mirror ${on(this.mirrored)}`,
      '[P] palette        [Z] recoil',
      '[S] squash/stretch [D] death fade',
      '[E] spawn effect   [X] repeat / leak check',
      '[R] repeat count   [C] copy stable ID',
      '[Esc] close laboratory',
    ]);
  }

  private renderLiveState(): void {
    if (!this.stateText) return;
    const diagnostics = this.gameplayEffects.getDiagnostics();
    const animation = this.preview?.anims.currentAnim;
    const zoom = this.preview
      ? this.preview.scaleX.toFixed(2)
      : this.effectSelectionActive
        ? this.effectZoom.toFixed(2)
        : 'n/a';
    this.stateText.setText([
      `playback: ${this.paused ? 'PAUSED' : 'PLAYING'} at ${LAB_SPEEDS[this.speedIndex] ?? 1}x`,
      `zoom: ${zoom}  background: ${(BACKGROUNDS[this.backgroundIndex] ?? BACKGROUNDS[0]).label}`,
      `frame: ${animation ? this.preview?.anims.currentFrame?.index ?? 0 : 'static'}  configured FPS: ${this.currentFrameRate() ?? 'n/a'}`,
      `repeat batch: ${REPEAT_COUNTS[this.repeatIndex]}`,
      `scene objects: ${this.children.list.filter((child) => child.active).length}`,
      `VVFX pending/active/retained: ${diagnostics.pendingCount}/${diagnostics.activeCount}/${diagnostics.retainedCount}`,
      `semantic/fallback: ${diagnostics.semanticActiveCount}/${diagnostics.fallbackActiveCount}`,
      `presentation-owned: ${this.presentation.liveObjectCount}`,
      `cleanup: ${this.leakStatus}`,
    ]);
  }

  private renderBackground(): void {
    const background = BACKGROUNDS[this.backgroundIndex] ?? BACKGROUNDS[0];
    this.effectCamera?.setBackgroundColor(background.color);
    this.backgroundGraphics?.clear().fillStyle(background.color, 1).fillRect(
      PREVIEW_VIEWPORT_X,
      PREVIEW_VIEWPORT_Y,
      PREVIEW_VIEWPORT_WIDTH,
      PREVIEW_VIEWPORT_HEIGHT,
    );
    if (background.label === 'CHECKER') {
      for (let row = 0; row < 13; row += 1) {
        for (let column = 0; column < 12; column += 1) {
          this.backgroundGraphics?.fillStyle((row + column) % 2 === 0 ? 0x343a3f : 0x1c2024, 1)
            .fillRect(
              PREVIEW_VIEWPORT_X + column * 80,
              PREVIEW_VIEWPORT_Y + row * 80,
              80,
              80,
            );
        }
      }
    }
  }

  private visualMetadata(definition: VisualAssetDefinition): string {
    const animation = definition.animation
      ? `${definition.animation.startFrame}-${definition.animation.endFrame} @ ${definition.animation.framesPerSecond}fps / ${definition.animation.loop ? 'loop' : 'once'}`
      : 'single frame';
    const fallback = definition.source?.filePath
      ?? (definition.developmentFallback?.kind === 'asset'
        ? `alias -> ${definition.developmentFallback.assetId}`
        : `primitive:${definition.developmentFallback?.shape ?? 'none'}`);
    const runtimeDisplays = definition.runtimeDisplays.length > 0
      ? definition.runtimeDisplays.map(({ consumer, width, height, note }) =>
          `  ${consumer}: ${width}x${height}${note ? ` (${note})` : ''}`,
        ).join('\n')
      : '  none registered';
    return [
      `category: ${definition.category}`,
      `use: ${definition.intendedGameplayUse}`,
      `source/fallback: ${fallback}`,
      `sheet: ${definition.expectedWidth}x${definition.expectedHeight}`,
      `frame: ${definition.frameWidth}x${definition.frameHeight} x${definition.frameCount}`,
      `animation: ${animation}`,
      `origin: ${definition.origin.x}, ${definition.origin.y}`,
      `world scale hint: ${definition.worldScale}`,
      `runtime display contracts:\n${runtimeDisplays}`,
      `depth: ${definition.expectedDepth}`,
      `mirror: ${definition.mirroring}  tint: ${definition.tinting}`,
      `required: ${definition.required}  provenance: ${definition.provenance}`,
      `attachments: ${definition.attachments.map(({ name }) => name).join(', ') || 'none'}`,
      `production: ${definition.production?.targetFilePath ?? 'no replacement requested'}`,
    ].join('\n');
  }

  private itemsForCategory(category: LabCategory): LabItem[] {
    const visual = (predicate: (definition: VisualAssetDefinition) => boolean): LabItem[] =>
      VISUAL_ASSETS.filter(predicate).map((definition) => ({ kind: 'visual', id: definition.id, definition }));
    if (category === 'all-assets') return visual(() => true);
    if (category === 'entities') return visual(({ category: value }) => ['character', 'enemy', 'boss'].includes(value));
    if (category === 'attacks') {
      return [
        ...visual(({ category: value }) => value === 'weapon'),
        ...this.semanticItems().filter(({ role }) => !['impact', 'finalChain'].includes(role)),
      ];
    }
    if (category === 'projectiles') return visual(({ category: value }) => value === 'projectile');
    if (category === 'impacts') {
      return [
        ...this.semanticItems().filter(({ role }) => ['impact', 'finalChain'].includes(role)),
        { kind: 'presentation-impact', id: 'presentation:impact' },
      ];
    }
    if (category === 'statuses') return visual(({ category: value }) => value === 'status');
    if (category === 'animations') return visual(({ frameCount }) => frameCount > 1);
    return [...discoveredVvfxCatalog.effects.values()]
      .sort((left, right) => left.id.localeCompare(right.id))
      .map(({ id, supportsEndpoints }) => ({ kind: 'vvfx', id, supportsEndpoints }));
  }

  private semanticItems(): Array<Extract<LabItem, { kind: 'semantic-effect' }>> {
    return Object.values(GAMEPLAY_EFFECT_SEQUENCES).flatMap((sequence) =>
      (Object.entries(sequence.roles) as Array<[GameplayEffectRole, { placement: 'point' | 'beam' }]>).map(
        ([role, definition]) => ({
          kind: 'semantic-effect' as const,
          id: `${sequence.id}:${role}`,
          sequenceId: sequence.id,
          role,
          placement: definition.placement,
        }),
      ),
    );
  }

  private currentCategory(): LabCategory {
    return CATEGORIES[this.categoryIndex] ?? 'all-assets';
  }

  private currentItem(): LabItem | undefined {
    const items = this.itemsForCategory(this.currentCategory());
    if (items.length === 0) return undefined;
    this.selectionIndex = Phaser.Math.Wrap(this.selectionIndex, 0, items.length);
    return items[this.selectionIndex];
  }

  private changeCategory(delta: number): void {
    this.categoryIndex = Phaser.Math.Wrap(this.categoryIndex + delta, 0, CATEGORIES.length);
    this.selectionIndex = 0;
    this.renderCurrent();
  }

  private changeSelection(delta: number): void {
    const count = this.itemsForCategory(this.currentCategory()).length;
    if (count === 0) return;
    this.selectionIndex = Phaser.Math.Wrap(this.selectionIndex + delta, 0, count);
    this.renderCurrent();
  }

  private togglePlayback(): void {
    this.paused = !this.paused;
    if (this.paused) {
      this.preview?.anims.pause();
      this.tweens.pauseAll();
    } else {
      this.preview?.anims.resume();
      this.tweens.resumeAll();
    }
    // Authored runtimes listen to the Scene's unscaled update event. Keep
    // them paused there and advance them from this scene's scaled clock.
    for (const handle of this.controlledRuntimeHandles.keys()) handle.pause();
  }

  private restartPreview(): void {
    if (this.preview?.anims.currentAnim) {
      this.preview.anims.restart();
      if (this.paused) this.preview.anims.pause();
      return;
    }
    const playback = this.currentPlaybackHandle();
    if (playback) {
      this.anchorMotionElapsedMs = 0;
      this.updateAnchorMotion();
      this.syncControlledEffectAnchors();
      playback.restart().pause();
      return;
    }
    if (this.currentSemanticHandle) {
      this.currentSemanticHandle.cancel();
      this.currentSemanticHandle = undefined;
    }
    this.spawnCurrentEffect(1);
  }

  private stepFrame(direction: number): void {
    const preview = this.preview;
    const animation = preview?.anims.currentAnim;
    if (preview && animation) {
      this.paused = true;
      preview.anims.pause();
      const frames = animation.frames;
      const currentFrame = preview.anims.currentFrame;
      const currentIndex = Math.max(0, currentFrame ? frames.indexOf(currentFrame) : 0);
      preview.anims.setCurrentFrame(frames[Phaser.Math.Wrap(currentIndex + direction, 0, frames.length)]!);
      return;
    }
    this.paused = true;
    this.tweens.pauseAll();
    const playback = this.currentPlaybackHandle();
    const frameDuration = 1_000 / (this.currentFrameRate() ?? 12);
    if (direction < 0) {
      this.anchorMotionElapsedMs = 0;
      this.updateAnchorMotion();
      this.syncControlledEffectAnchors();
      playback?.restart().pause();
    } else {
      this.anchorMotionElapsedMs += frameDuration;
      this.updateAnchorMotion();
      this.syncControlledEffectAnchors();
      playback?.pause().step(frameDuration);
    }
  }

  private cycleSpeed(): void {
    this.speedIndex = (this.speedIndex + 1) % LAB_SPEEDS.length;
    this.applyTimeScale();
  }

  private applyTimeScale(): void {
    const speed = LAB_SPEEDS[this.speedIndex] ?? 1;
    this.time.timeScale = speed;
    this.tweens.timeScale = speed;
    this.anims.globalTimeScale = speed;
  }

  private cycleBackground(): void {
    this.backgroundIndex = (this.backgroundIndex + 1) % BACKGROUNDS.length;
    this.renderBackground();
  }

  private toggleMirror(): void {
    const item = this.currentItem();
    if (item?.kind === 'visual' && item.definition.mirroring === 'none') {
      this.setStatus('This manifest row forbids mirroring.');
      return;
    }
    this.mirrored = !this.mirrored;
    this.preview?.setFlipX(this.mirrored);
    this.renderGuides();
    this.renderControls();
  }

  private cyclePalette(): void {
    this.paletteIndex = (this.paletteIndex + 1) % PALETTE.length;
    this.toggles.tint = true;
    this.renderCurrent();
  }

  private toggle(key: keyof LabToggles): void {
    this.toggles[key] = !this.toggles[key];
    this.renderCurrent();
  }

  private adjustZoom(factor: number): void {
    const preview = this.preview;
    if (preview) {
      const base = Number(preview.getData('labBaseScale')) || 1;
      const next = Phaser.Math.Clamp(preview.scaleX * factor, base * 0.35, base * 3);
      preview.setScale(next);
      this.renderGuides();
      return;
    }
    if (!this.effectSelectionActive) return;
    this.effectZoom = Phaser.Math.Clamp(this.effectZoom * factor, 0.35, 3);
    this.applyEffectCameraZoom();
  }

  private cycleRepeatCount(): void {
    this.repeatIndex = (this.repeatIndex + 1) % REPEAT_COUNTS.length;
    this.setStatus(`Repeat batch set to ${REPEAT_COUNTS[this.repeatIndex]}.`);
  }

  private async copyCurrentId(): Promise<void> {
    const id = this.currentItem()?.id;
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      this.setStatus(`Copied: ${id}`);
    } catch {
      this.setStatus(`Clipboard unavailable. Stable ID: ${id}`);
    }
  }

  private currentFrameRate(): number | undefined {
    const item = this.currentItem();
    return item?.kind === 'visual' ? item.definition.animation?.framesPerSecond : undefined;
  }

  private updateAnchorMotion(): void {
    if (this.anchorEnd) {
      this.anchorEnd.y = PREVIEW_Y + Math.sin(this.anchorMotionElapsedMs * 0.0018) * 82;
    }
  }

  private controlRuntimeHandle(handle: VvfxManagedHandle, syncAnchor?: () => void): void {
    this.controlledRuntimeHandles.set(handle, syncAnchor);
    handle.pause();
    void handle.ready.then((ready) => {
      if (ready && !handle.isDestroyed && this.controlledRuntimeHandles.has(handle)) {
        syncAnchor?.();
        handle.pause();
      }
    });
  }

  private syncControlledEffectAnchors(): void {
    this.gameplayEffects.update();
    for (const handle of [...this.controlledSemanticHandles]) {
      if (!handle.active) this.controlledSemanticHandles.delete(handle);
    }
    for (const [handle, syncAnchor] of [...this.controlledRuntimeHandles]) {
      if (handle.isDestroyed) {
        this.controlledRuntimeHandles.delete(handle);
        continue;
      }
      syncAnchor?.();
    }
  }

  private stepControlledRuntimeHandles(deltaMs: number): void {
    if (deltaMs <= 0) return;
    for (const handle of [...this.controlledRuntimeHandles.keys()]) {
      if (handle.isDestroyed) {
        this.controlledRuntimeHandles.delete(handle);
        continue;
      }
      handle.pause().step(deltaMs);
    }
  }

  private cancelControlledRuntimeHandles(): void {
    for (const handle of this.controlledSemanticHandles) handle.cancel();
    this.controlledSemanticHandles.clear();
    for (const handle of this.controlledRuntimeHandles.keys()) handle.cancel();
    this.controlledRuntimeHandles.clear();
  }

  private setEffectPreviewActive(active: boolean): void {
    this.effectSelectionActive = active;
    this.effectCamera?.setVisible(active);
    if (active) this.applyEffectCameraZoom();
  }

  private applyEffectCameraZoom(): void {
    const camera = this.effectCamera;
    if (!camera) return;
    camera.setZoom(this.effectZoom);
    camera.setScroll(
      PREVIEW_X - (PREVIEW_X - PREVIEW_VIEWPORT_X) / this.effectZoom,
      PREVIEW_Y - (PREVIEW_Y - PREVIEW_VIEWPORT_Y) / this.effectZoom,
    );
  }

  private readonly handleEffectObjectAdded = (gameObject: Phaser.GameObjects.GameObject): void => {
    if (this.effectSelectionActive) this.cameras.main.ignore(gameObject);
  };

  private activeEffectCount(): number {
    const diagnostics = this.gameplayEffects.getDiagnostics();
    return diagnostics.totalCount + diagnostics.fallbackActiveCount + this.presentation.liveObjectCount;
  }

  private cancelCurrentEffect(): void {
    this.cancelScheduledEffectSpawns();
    this.leakCheck?.remove(false);
    this.leakCheck = undefined;
    this.currentVvfxHandle?.cancel();
    this.currentVvfxHandle = undefined;
    this.currentSemanticHandle?.cancel();
    this.currentSemanticHandle = undefined;
    this.cancelControlledRuntimeHandles();
  }

  private currentPlaybackHandle(): VvfxManagedHandle | undefined {
    return this.currentVvfxHandle ?? this.currentSemanticHandle?.runtimeHandle;
  }

  private cancelScheduledEffectSpawns(): void {
    for (const timer of this.effectSpawnTimers) {
      timer.remove(false);
    }
    this.effectSpawnTimers.clear();
  }

  private releaseKeyboardCaptures(): void {
    if (this.keyboard && this.addedKeyboardCaptures.length > 0) {
      this.keyboard.removeCapture(this.addedKeyboardCaptures);
    }
    this.addedKeyboardCaptures = [];
    this.keyboard = undefined;
  }

  private addGuideLabel(x: number, y: number, label: string, color: string): void {
    const text = this.add.text(x, y, label, {
      fontFamily: 'Consolas, monospace', fontSize: '10px', color,
    }).setDepth(82);
    this.guideLabels.push(text);
  }

  private clearGuideLabels(): void {
    for (const label of this.guideLabels) label.destroy();
    this.guideLabels = [];
  }

  private addButton(x: number, y: number, width: number, label: string, action: () => void): void {
    const background = this.add.rectangle(x, y, width, 38, 0x162129, 0.96)
      .setStrokeStyle(1, COLORS.border)
      .setDepth(100)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, label, {
      fontFamily: 'Cinzel, serif', fontSize: '11px', color: '#dce8ed',
    }).setOrigin(0.5).setDepth(101);
    background.on('pointerdown', action);
  }

  private withPreview(action: (preview: Phaser.GameObjects.Sprite) => unknown): void {
    if (!this.preview) {
      this.setStatus('Select a visual asset first.');
      return;
    }
    action(this.preview);
  }

  private setStatus(message: string): void {
    this.statusText?.setText(message.toUpperCase());
  }

  private close(): void {
    this.anims.globalTimeScale = this.previousGlobalAnimationTimeScale;
    this.cancelScheduledEffectSpawns();
    this.releaseKeyboardCaptures();
    this.scene.stop();
    for (const sceneKey of this.resumeSceneKeys) {
      if (this.scene.isPaused(sceneKey)) this.scene.resume(sceneKey);
    }
  }
}
