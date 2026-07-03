import Phaser from 'phaser';
import { applyUiCameraZoom } from '../config/cameraConfig';
import { GAME_WIDTH } from '../constants';
import type { ChestSystem } from '../systems/ChestSystem';
import type { EnemySystem } from '../systems/EnemySystem';
import type { JuiceSystem } from '../systems/JuiceSystem';
import type { PlayerMovementSystem } from '../systems/PlayerMovementSystem';
import type { RunState } from '../systems/RunState';
import type { ShopSystem } from '../systems/ShopSystem';
import type { WeaponSystem } from '../systems/WeaponSystem';
import { BalanceDebugOverlay } from '../ui/BalanceDebugOverlay';
import { HudSystem } from '../ui/HudSystem';

export interface GameHudSceneData {
  run: RunState;
  enemies: EnemySystem;
  movement: PlayerMovementSystem;
  weapons: WeaponSystem;
  chests?: ChestSystem;
  shop?: ShopSystem;
  juice: JuiceSystem;
}

export class GameHudScene extends Phaser.Scene {
  private dataRef!: GameHudSceneData;
  private hud?: HudSystem;
  private debugOverlay?: BalanceDebugOverlay;
  private warningLabel?: Phaser.GameObjects.Text;

  constructor() {
    super('GameHudScene');
  }

  init(data: GameHudSceneData): void {
    this.dataRef = data;
  }

  create(): void {
    applyUiCameraZoom(this.cameras.main);
    this.cameras.main.setScroll(0, 0);

    this.hud = new HudSystem(
      this,
      this.dataRef.run,
      this.dataRef.enemies,
      this.dataRef.movement,
      this.dataRef.weapons,
      this.dataRef.chests,
      this.dataRef.shop,
      {
        onOpenJournal: () => this.openJournal(),
      },
    );
    if (import.meta.env.DEV) {
      this.debugOverlay = new BalanceDebugOverlay(this, this.dataRef.run, this.dataRef.enemies);
    }
    this.dataRef.juice.setWarningSink((text, color) => this.showWarning(text, color));

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.dataRef.juice.setWarningSink(undefined);
      if (this.warningLabel) {
        this.tweens.killTweensOf(this.warningLabel);
      }
    });
  }

  update(time: number): void {
    this.hud?.update(time);
    this.debugOverlay?.update(time);
  }

  toggleDebugOverlay(): void {
    this.debugOverlay?.toggle();
  }

  private showWarning(text: string, color = '#b9dded'): void {
    if (!this.warningLabel) {
      this.warningLabel = this.add
        .text(GAME_WIDTH / 2, 170, '', {
          fontFamily: 'Cinzel, serif',
          fontSize: '34px',
          stroke: '#050708',
          strokeThickness: 8,
          align: 'center',
          wordWrap: { width: 1080 },
        })
        .setOrigin(0.5)
        .setDepth(200)
        .setAlpha(0);
    } else {
      this.tweens.killTweensOf(this.warningLabel);
    }

    this.warningLabel.setPosition(GAME_WIDTH / 2, 170);
    this.warningLabel.setText(text);
    this.warningLabel.setColor(color);

    this.tweens.add({
      targets: this.warningLabel,
      alpha: 1,
      yoyo: true,
      hold: 900,
      duration: 260,
    });
  }

  private openJournal(): void {
    if (this.scene.isActive('JournalScene')) {
      return;
    }
    this.scene.pause('GameScene');
    this.scene.launch('JournalScene', {
      resumeGame: () => {
        this.scene.resume('GameScene');
        this.scene.resume('GameHudScene');
      },
    });
    this.scene.bringToTop('JournalScene');
    this.scene.pause();
  }
}
