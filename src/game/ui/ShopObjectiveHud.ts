import Phaser from 'phaser';
import { GAME_WIDTH } from '../constants';
import type { ShopSystem } from '../systems/ShopSystem';
import { formatChestObjective } from './chestObjectiveRules';

export class ShopObjectiveHud {
  private readonly root: Phaser.GameObjects.Container;
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, private readonly shop: ShopSystem) {
    this.text = scene.add
      .text(0, 0, '', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#e1a097',
        stroke: '#020405',
        strokeThickness: 4,
        align: 'right',
      })
      .setOrigin(1, 0.5);
    this.root = scene.add
      .container(GAME_WIDTH - 42, 168, [this.text])
      .setScrollFactor(0)
      .setDepth(190)
      .setVisible(false);
  }

  update(elapsedMs: number): void {
    const objective = this.shop.getObjective(elapsedMs);
    if (!objective) {
      this.root.setVisible(false);
      return;
    }
    this.text.setText(`BLOOD MARKET  ${formatChestObjective(objective.angle, objective.distance, objective.remainingMs)}`);
    this.root.setVisible(true);
  }
}
