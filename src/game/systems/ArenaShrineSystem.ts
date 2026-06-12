import Phaser from 'phaser';
import { COLORS } from '../constants';
import type { JuiceSystem } from './JuiceSystem';

export class ArenaShrineSystem {
  private readonly shrine: Phaser.GameObjects.Image;
  private readonly prompt: Phaser.GameObjects.Text;
  private readonly interactKey: Phaser.Input.Keyboard.Key;
  private active = true;

  constructor(
    scene: Phaser.Scene,
    private readonly player: Phaser.Physics.Arcade.Image,
    private readonly juice: JuiceSystem,
    private readonly canActivate: () => boolean,
    private readonly onActivate: () => void,
  ) {
    const keyboard = scene.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard input is required.');
    }
    this.interactKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.shrine = scene.add
      .image(420, 1600, 'prop-altar')
      .setDisplaySize(180, 180)
      .setDepth(9)
      .setTint(COLORS.void);
    scene.tweens.add({
      targets: this.shrine,
      alpha: 0.62,
      yoyo: true,
      repeat: -1,
      duration: 900,
      ease: 'Sine.InOut',
    });
    this.prompt = scene.add
      .text(420, 1490, 'E: OFFER 20 HP FOR POWER', {
        fontFamily: 'Cinzel, serif',
        fontSize: '14px',
        color: '#d9c7ef',
        stroke: '#020405',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(45)
      .setVisible(false);
  }

  update(): void {
    if (!this.active) {
      return;
    }
    const near = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shrine.x, this.shrine.y) < 130;
    this.prompt.setVisible(near);
    if (!near || !Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      return;
    }
    if (!this.canActivate()) {
      this.juice.warning('THE SHRINE REFUSES A FRAIL SOUL', '#c96d72');
      return;
    }
    this.active = false;
    this.prompt.setVisible(false);
    this.shrine.clearTint().setAlpha(0.28);
    this.juice.ring(this.shrine.x, this.shrine.y, 150, COLORS.void, 480);
    this.onActivate();
  }
}
