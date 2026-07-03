import Phaser from 'phaser';
import { COLORS, GAME_WIDTH, GAME_HEIGHT } from '../constants';
import type { RunState } from '../systems/RunState';
import { formatTime } from './uiHelpers';
import type { EnemySystem } from '../systems/EnemySystem';
import type { PlayerMovementSystem } from '../systems/PlayerMovementSystem';
import type { WeaponSystem } from '../systems/WeaponSystem';
import { WeaponActionBar } from './WeaponActionBar';
import { StatsPanel } from './StatsPanel';
import { ArtifactBar } from './ArtifactBar';
import type { ChestSystem } from '../systems/ChestSystem';
import { ChestObjectiveHud } from './ChestObjectiveHud';
import { curseTierProgress } from '../data/curse';
import { curseVisualFor } from './curseVisualRules';
import type { ShopSystem } from '../systems/ShopSystem';
import { ShopObjectiveHud } from './ShopObjectiveHud';

export interface HudSystemOptions {
  onOpenJournal?: () => void;
}

export class HudSystem {
  private readonly healthBar: Phaser.GameObjects.Rectangle;
  private readonly xpBar: Phaser.GameObjects.Rectangle;
  private readonly bossBar: Phaser.GameObjects.Rectangle;
  private readonly bossGroup: Phaser.GameObjects.Container;
  private readonly statsText: Phaser.GameObjects.Text;
  private readonly timerText: Phaser.GameObjects.Text;
  private readonly curseText: Phaser.GameObjects.Text;
  private readonly curseBar: Phaser.GameObjects.Rectangle;
  private readonly relicsText: Phaser.GameObjects.Text;
  private readonly lowHealthVignette: Phaser.GameObjects.Rectangle;
  private readonly actionBar: WeaponActionBar;
  private readonly statsPanel: StatsPanel;
  private readonly artifactBar: ArtifactBar;
  private readonly chestObjective?: ChestObjectiveHud;
  private readonly shopObjective?: ShopObjectiveHud;

  constructor(
    scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
    _movement: PlayerMovementSystem,
    private readonly weapons: WeaponSystem,
    chests?: ChestSystem,
    shop?: ShopSystem,
    private readonly options: HudSystemOptions = {},
  ) {
    type FixedGameObject = Phaser.GameObjects.GameObject &
      Phaser.GameObjects.Components.ScrollFactor &
      Phaser.GameObjects.Components.Depth;
    const fixed = <T extends FixedGameObject>(object: T): T => {
      object.setScrollFactor(0);
      object.setDepth(150);
      return object;
    };

    fixed(scene.add.rectangle(190, 30, 300, 22, 0x050809, 0.9).setStrokeStyle(2, COLORS.border));
    this.healthBar = fixed(scene.add.rectangle(42, 30, 296, 16, COLORS.blood).setOrigin(0, 0.5));
    fixed(scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 28, 720, 14, 0x050809, 0.9).setStrokeStyle(1, COLORS.border));
    this.xpBar = fixed(scene.add.rectangle(GAME_WIDTH / 2 - 359, GAME_HEIGHT - 28, 716, 10, COLORS.soul).setOrigin(0, 0.5));

    this.statsText = fixed(
      scene.add.text(42, 75, '', {
        fontFamily: 'Cinzel, serif',
        fontSize: '15px',
        color: '#dce8ed',
        stroke: '#050708',
        strokeThickness: 3,
      }),
    );
    this.timerText = fixed(
      scene.add
        .text(GAME_WIDTH / 2, 24, '', {
          fontFamily: 'Cinzel, serif',
          fontSize: '24px',
          color: '#e2edf1',
          stroke: '#050708',
          strokeThickness: 5,
        })
        .setOrigin(0.5),
    );
    this.curseText = fixed(
      scene.add
        .text(GAME_WIDTH - 42, 22, '', {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: '#dce8ed',
          align: 'right',
          stroke: '#050708',
          strokeThickness: 3,
        })
        .setOrigin(1, 0),
    );
    fixed(scene.add.rectangle(GAME_WIDTH - 190, 58, 300, 8, 0x050809, 0.9).setStrokeStyle(1, COLORS.border));
    this.curseBar = fixed(scene.add.rectangle(GAME_WIDTH - 338, 58, 296, 5, COLORS.blood).setOrigin(0, 0.5));
    this.relicsText = fixed(
      scene.add
        .text(GAME_WIDTH - 42, 72, '', {
          fontFamily: 'Cinzel, serif',
          fontSize: '15px',
          color: '#dce8ed',
          align: 'right',
          stroke: '#050708',
          strokeThickness: 3,
        })
        .setOrigin(1, 0),
    );

    const bossBack = scene.add.rectangle(0, 0, 600, 18, 0x050809, 0.95).setStrokeStyle(2, COLORS.gold);
    this.bossBar = scene.add.rectangle(-298, 0, 596, 12, COLORS.blood).setOrigin(0, 0.5);
    const bossLabel = scene.add
      .text(0, -24, 'THE LIMBO WARDEN', {
        fontFamily: 'Cinzel, serif',
        fontSize: '16px',
        color: '#d8c49b',
      })
      .setOrigin(0.5);
    this.bossGroup = scene.add
      .container(GAME_WIDTH / 2, 92, [bossBack, this.bossBar, bossLabel])
      .setScrollFactor(0)
      .setDepth(160)
      .setVisible(false);

    this.lowHealthVignette = fixed(
      scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x8f1018, 0).setBlendMode(Phaser.BlendModes.MULTIPLY),
    );
    this.actionBar = new WeaponActionBar(scene, run, weapons);
    this.statsPanel = new StatsPanel(scene, run);
    this.artifactBar = new ArtifactBar(scene, run);
    this.chestObjective = chests ? new ChestObjectiveHud(scene, chests) : undefined;
    this.shopObjective = shop ? new ShopObjectiveHud(scene, shop) : undefined;
    
    this.createMenuBar(scene);
  }

  private createMenuBar(scene: Phaser.Scene): void {
    const startX = GAME_WIDTH - 120;
    const startY = GAME_HEIGHT - 40;

    // Background panel
    const bg = scene.add.rectangle(startX, startY, 140, 56, 0x0a0c0e, 0.95);
    bg.setStrokeStyle(2, 0x3a4046);
    bg.setScrollFactor(0).setDepth(150);

    // Journal icon
    const journalBg = scene.add.rectangle(startX - 32, startY, 44, 44, 0x14181a, 1);
    journalBg.setStrokeStyle(1, 0x5a6066);
    journalBg.setScrollFactor(0).setDepth(151);
    const journalIcon = scene.add.image(startX - 32, startY, 'icon-journal');
    journalIcon.setDisplaySize(32, 32).setScrollFactor(0).setDepth(152);
    
    // Stats icon
    const statsBg = scene.add.rectangle(startX + 32, startY, 44, 44, 0x14181a, 1);
    statsBg.setStrokeStyle(1, 0x5a6066);
    statsBg.setScrollFactor(0).setDepth(151);
    const statsIcon = scene.add.image(startX + 32, startY, 'icon-stats');
    statsIcon.setDisplaySize(32, 32).setScrollFactor(0).setDepth(152);

    // Interactivity
    statsBg.setInteractive({ useHandCursor: true });
    statsBg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.statsPanel.toggle();
    });

    journalBg.setInteractive({ useHandCursor: true });
    journalBg.on('pointerdown', (_pointer: Phaser.Input.Pointer, _localX: number, _localY: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      if (this.options.onOpenJournal) {
        this.options.onOpenJournal();
        return;
      }
      scene.scene.pause();
      scene.scene.launch('JournalScene', {
        resumeGame: () => scene.scene.resume()
      });
      scene.scene.bringToTop('JournalScene');
    });
  }

  update(time: number): void {
    this.healthBar.displayWidth = 296 * Phaser.Math.Clamp(this.run.resources.health / this.run.stats.current.maxHealth, 0, 1);
    this.xpBar.displayWidth = 716 * Phaser.Math.Clamp(this.run.resources.xp / this.run.resources.xpToNext, 0, 1);
    this.actionBar.update(time);
    this.statsPanel.update(time);
    this.artifactBar.update();
    this.chestObjective?.update(this.run.elapsedMs);
    this.shopObjective?.update(this.run.elapsedMs);
    this.statsText.setText(
      `HP ${Math.ceil(this.run.resources.health)} / ${Math.round(this.run.stats.current.maxHealth)}   LVL ${this.run.resources.level}   SOULS ${this.run.resources.souls}`,
    );
    this.timerText.setText(formatTime(this.run.elapsedMs));
    const status = this.weapons.getActiveSynergies();
    const curse = this.run.curse.snapshot();
    const curseVisual = curseVisualFor(curse);
    this.curseText.setColor(curseVisual.textColor);
    this.curseText.setText(`CURSE ${curse.level}  ${curse.tierLabel.toUpperCase()}`);
    this.curseBar.setFillStyle(curseVisual.color, curse.level > 0 ? 0.95 : 0.45);
    this.curseBar.displayWidth = 296 * curseTierProgress(curse.level);
    this.relicsText.setText(status.length > 0 ? status.join('\n') : '');
    const healthRatio = this.run.resources.health / this.run.stats.current.maxHealth;
    this.lowHealthVignette.setAlpha(healthRatio < 0.3 ? 0.2 + Math.sin(time * 0.008) * 0.08 : 0);

    const boss = this.enemies.getBossHealth();
    this.bossGroup.setVisible(Boolean(boss));
    if (boss) {
      this.bossBar.displayWidth = 596 * Phaser.Math.Clamp(boss.current / boss.max, 0, 1);
    }
  }
}
