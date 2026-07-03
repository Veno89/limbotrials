import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';
import type { EnemySystem } from '../systems/EnemySystem';
import type { RunState } from '../systems/RunState';
import { formatTime } from './uiHelpers';

export class BalanceDebugOverlay {
  private readonly panel: Phaser.GameObjects.Container;
  private readonly text: Phaser.GameObjects.Text;
  private visible = false;
  private nextRefreshAt = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
  ) {
    const panelWidth = 380;
    const panelHeight = 310;
    const borderSize = 2;
    const background = scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x050809, 0.94).setOrigin(0);
    const top = scene.add.rectangle(0, 0, panelWidth, borderSize, COLORS.gold).setOrigin(0);
    const bottom = scene.add.rectangle(0, panelHeight - borderSize, panelWidth, borderSize, COLORS.gold).setOrigin(0);
    const left = scene.add.rectangle(0, 0, borderSize, panelHeight, COLORS.gold).setOrigin(0);
    const right = scene.add.rectangle(panelWidth - borderSize, 0, borderSize, panelHeight, COLORS.gold).setOrigin(0);
    this.panel = scene.add
      .container(GAME_WIDTH - 24 - panelWidth, 118, [background, top, bottom, left, right])
      .setScrollFactor(0)
      .setDepth(250)
      .setVisible(false);
    this.text = scene.add
      .text(GAME_WIDTH - 380, 134, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '13px',
        color: '#dce8ed',
        lineSpacing: 6,
      })
      .setScrollFactor(0)
      .setDepth(251)
      .setVisible(false);
  }

  toggle(): void {
    this.visible = !this.visible;
    this.panel.setVisible(this.visible);
    this.text.setVisible(this.visible);
    this.nextRefreshAt = 0;
  }

  update(time: number): void {
    if (!this.visible || time < this.nextRefreshAt) {
      return;
    }
    this.nextRefreshAt = time + 250;
    const report = this.run.balance.report(this.run.elapsedMs);
    const topWeapon = report.weaponResults[0];
    const currentMinute = report.minutes.at(-1);
    const threat = this.run.getThreatSnapshot();
    this.text.setText(
      [
        `BALANCE LIVE  [F8 TO HIDE]`,
        ``,
        `PRESET   ${report.presetId.toUpperCase()}`,
        `SAMPLE   ${formatTime(report.measurementDurationMs)}`,
        `CLOCK    ${formatTime(this.run.elapsedMs)}`,
        ``,
        `ENEMIES  ${String(this.enemies.count()).padEnd(6)} PEAK ${currentMinute?.peakEnemies ?? 0}`,
        `HP       ${Math.ceil(this.run.resources.health)}/${Math.round(this.run.stats.current.maxHealth)}`,
        `LEVEL    ${String(this.run.resources.level).padEnd(6)} KILLS ${this.run.kills}`,
        ``,
        `THREAT   ${String(threat.tier).padEnd(6)} TIME ${threat.timeTier}   PWR ${threat.powerTier}`,
        `SCALING  HP x${threat.healthMultiplier.toFixed(2)} DMG x${threat.damageMultiplier.toFixed(2)}`,
        ``,
        `DEALT    ${String(report.totalDamageDealt).padEnd(6)} TAKEN ${report.totalDamageTaken}`,
        `HEAL     ${String(report.totalHealing).padEnd(6)} DODGES ${report.perfectDodges}`,
        ``,
        topWeapon
          ? `TOP DMG  ${topWeapon.id.toUpperCase()} (${topWeapon.dps} DPS)`
          : 'TOP DMG  NONE YET',
      ].join('\n'),
    );
  }
}
