import Phaser from 'phaser';
import { COLORS, GAME_WIDTH } from '../constants';
import type { EnemySystem } from '../systems/EnemySystem';
import type { RunState } from '../systems/RunState';
import { formatTime } from './uiHelpers';

export class BalanceDebugOverlay {
  private readonly panel: Phaser.GameObjects.Rectangle;
  private readonly text: Phaser.GameObjects.Text;
  private visible = false;
  private nextRefreshAt = 0;

  constructor(
    scene: Phaser.Scene,
    private readonly run: RunState,
    private readonly enemies: EnemySystem,
  ) {
    this.panel = scene.add
      .rectangle(GAME_WIDTH - 12, 118, 330, 240, COLORS.panel, 0.92)
      .setOrigin(1, 0)
      .setStrokeStyle(2, COLORS.gold)
      .setScrollFactor(0)
      .setDepth(250)
      .setVisible(false);
    this.text = scene.add
      .text(GAME_WIDTH - 325, 134, '', {
        fontFamily: 'Consolas, monospace',
        fontSize: '12px',
        color: '#d9edf4',
        lineSpacing: 5,
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
        `PRESET   ${report.presetId.toUpperCase()}`,
        `SAMPLE   ${formatTime(report.measurementDurationMs)}`,
        `CLOCK    ${formatTime(this.run.elapsedMs)}`,
        `ENEMIES  ${this.enemies.count()}  PEAK ${currentMinute?.peakEnemies ?? 0}`,
        `HP       ${Math.ceil(this.run.health)}/${Math.round(this.run.stats.maxHealth)}`,
        `LEVEL    ${this.run.level}  KILLS ${this.run.kills}`,
        `THREAT   ${threat.tier}  TIME ${threat.timeTier}  POWER ${threat.powerTier}`,
        `SCALING  HP x${threat.healthMultiplier.toFixed(2)}  DMG x${threat.damageMultiplier.toFixed(2)}`,
        `DEALT    ${report.totalDamageDealt}`,
        `TAKEN    ${report.totalDamageTaken}  HEAL ${report.totalHealing}`,
        `DODGES   ${report.perfectDodges}  DASHES ${report.dashes}`,
        topWeapon
          ? `TOP      ${topWeapon.id.toUpperCase()} ${topWeapon.dps} DPS`
          : 'TOP      NO DAMAGE YET',
      ].join('\n'),
    );
  }
}
