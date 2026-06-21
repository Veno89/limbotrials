import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';
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
  private readonly dashBar: Phaser.GameObjects.Rectangle;
  private readonly actionBar: WeaponActionBar;
  private readonly statsPanel: StatsPanel;
  private readonly artifactBar: ArtifactBar;
  private readonly chestObjective?: ChestObjectiveHud;

  constructor(
    scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
    private readonly movement: PlayerMovementSystem,
    private readonly weapons: WeaponSystem,
    chests?: ChestSystem,
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
    fixed(scene.add.rectangle(640, 692, 720, 14, 0x050809, 0.9).setStrokeStyle(1, COLORS.border));
    this.xpBar = fixed(scene.add.rectangle(281, 692, 716, 10, COLORS.soul).setOrigin(0, 0.5));
    fixed(scene.add.rectangle(190, 58, 300, 8, 0x050809, 0.9).setStrokeStyle(1, COLORS.border));
    this.dashBar = fixed(scene.add.rectangle(42, 58, 296, 5, COLORS.pale).setOrigin(0, 0.5));

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
      scene.add.rectangle(640, 360, 1280, 720, 0x8f1018, 0).setBlendMode(Phaser.BlendModes.MULTIPLY),
    );
    this.actionBar = new WeaponActionBar(scene, run, weapons);
    this.statsPanel = new StatsPanel(scene, run);
    this.artifactBar = new ArtifactBar(scene, run);
    this.chestObjective = chests ? new ChestObjectiveHud(scene, chests) : undefined;
  }

  update(time: number): void {
    this.healthBar.displayWidth = 296 * Phaser.Math.Clamp(this.run.health / this.run.stats.maxHealth, 0, 1);
    this.xpBar.displayWidth = 716 * Phaser.Math.Clamp(this.run.xp / this.run.xpToNext, 0, 1);
    this.dashBar.displayWidth = 296 * this.movement.dashCooldownRatio(time);
    this.actionBar.update(time);
    this.statsPanel.update(time);
    this.artifactBar.update();
    this.chestObjective?.update(this.run.elapsedMs);
    this.statsText.setText(
      `HP ${Math.ceil(this.run.health)} / ${Math.round(this.run.stats.maxHealth)}   LVL ${this.run.level}   SOULS ${this.run.souls}`,
    );
    this.timerText.setText(formatTime(this.run.elapsedMs));
    const status = this.weapons.getActiveSynergies();
    const curse = this.run.curse.snapshot();
    const curseVisual = curseVisualFor(curse);
    this.curseText.setColor(curseVisual.textColor);
    this.curseText.setText(`CURSE ${curse.level}  ${curse.tierLabel.toUpperCase()}`);
    this.curseBar.setFillStyle(curseVisual.color, curse.level > 0 ? 0.95 : 0.45);
    this.curseBar.displayWidth = 296 * curseTierProgress(curse.level);
    this.relicsText.setText(
      `UPGRADES ${this.totalRelics()}${
        status.length > 0 ? `\n${status.join('\n')}` : ''
      }`,
    );
    const healthRatio = this.run.health / this.run.stats.maxHealth;
    this.lowHealthVignette.setAlpha(healthRatio < 0.3 ? 0.2 + Math.sin(time * 0.008) * 0.08 : 0);

    const boss = this.enemies.getBossHealth();
    this.bossGroup.setVisible(Boolean(boss));
    if (boss) {
      this.bossBar.displayWidth = 596 * Phaser.Math.Clamp(boss.current / boss.max, 0, 1);
    }
  }

  private totalRelics(): number {
    let total = 0;
    for (const count of this.run.upgradeStacks.values()) {
      total += count;
    }
    return total;
  }
}
