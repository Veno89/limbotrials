import Phaser from 'phaser';
import { COLORS } from '../constants';
import { audio } from '../systems/AudioSystem';

export interface ButtonPresentation {
  height?: number;
  fontSize?: number;
}

export function addTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size = 48,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, {
      fontFamily: 'Cinzel, serif',
      fontSize: `${size}px`,
      color: '#e4edf1',
      stroke: '#020405',
      strokeThickness: 6,
      align: 'center',
    })
    .setOrigin(0.5);
}

export function addButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  width = 280,
  badgeText?: string,
  presentation: ButtonPresentation = {},
): Phaser.GameObjects.Container {
  const height = presentation.height ?? 54;
  const fontSize = presentation.fontSize ?? 19;
  const background = scene.add
    .rectangle(0, 0, width, height, COLORS.panel, 0.96)
    .setStrokeStyle(2, COLORS.border);
  const text = scene.add
    .text(0, 0, label, {
      fontFamily: 'Cinzel, serif',
      fontSize: `${fontSize}px`,
      color: '#dce8ed',
    })
    .setOrigin(0.5);
  const children: Phaser.GameObjects.GameObject[] = [background, text];
  if (badgeText) {
    const badgeX = width / 2 - 8;
    const badgeY = -height / 2 + 6;
    const badge = scene.add
      .circle(badgeX, badgeY, 11, COLORS.gold, 1)
      .setStrokeStyle(2, 0xf0d8a0);
    const badgeLabel = scene.add
      .text(badgeX, badgeY, badgeText, {
        fontFamily: 'Inter, sans-serif',
        fontSize: badgeText.length > 2 ? '9px' : '11px',
        fontStyle: 'bold',
        color: '#071014',
      })
      .setOrigin(0.5);
    children.push(badge, badgeLabel);
  }
  const container = scene.add.container(x, y, children);
  background.setInteractive({ useHandCursor: true });
  background.on('pointerover', () => {
    background.setFillStyle(COLORS.panelLight);
    background.setStrokeStyle(2, COLORS.soul);
  });
  background.on('pointerout', () => {
    background.setFillStyle(COLORS.panel);
    background.setStrokeStyle(2, COLORS.border);
  });
  background.on('pointerdown', () => {
    audio.play('button');
    onClick();
  });
  return container;
}

export function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}
