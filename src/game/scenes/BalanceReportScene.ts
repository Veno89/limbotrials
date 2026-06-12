import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from '../constants';
import { ENEMIES } from '../data/enemies';
import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import type { PlayerDamageSourceId, RunSummary } from '../types/gameTypes';
import { addButton, addTitle, formatTime } from '../ui/uiHelpers';

type ReportTab = 'overview' | 'weapons' | 'pressure' | 'choices';

interface BalanceReportSceneData {
  summary: RunSummary;
  returnScene: string;
  tab?: ReportTab;
}

const TABS: readonly ReportTab[] = ['overview', 'weapons', 'pressure', 'choices'];

export class BalanceReportScene extends Phaser.Scene {
  private reportData!: BalanceReportSceneData;

  constructor() {
    super('BalanceReportScene');
  }

  init(data: BalanceReportSceneData): void {
    this.reportData = data;
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x030708, 1).setOrigin(0);
    this.add
      .image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'menu-background')
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setAlpha(0.12);
    addTitle(this, GAME_WIDTH / 2, 48, 'BALANCE REPORT', 34);
    this.add
      .text(
        GAME_WIDTH / 2,
        78,
        `${this.reportData.summary.balance.presetId.toUpperCase()}   /   SAMPLE ${formatTime(
          this.reportData.summary.balance.measurementDurationMs,
        )}   /   CLOCK ${formatTime(this.reportData.summary.elapsedMs)}   /   ${
          this.reportData.summary.victory ? 'VICTORY' : 'DEFEAT'
        }`,
        {
          fontFamily: 'Cinzel, serif',
          fontSize: '13px',
          color: '#91aab5',
        },
      )
      .setOrigin(0.5);

    const active = this.reportData.tab ?? 'overview';
    TABS.forEach((tab, index) => {
      addButton(
        this,
        235 + index * 270,
        125,
        tab.toUpperCase(),
        () => this.scene.restart({ ...this.reportData, tab }),
        235,
      ).setAlpha(tab === active ? 1 : 0.62);
    });
    if (active === 'weapons') {
      this.renderWeapons();
    } else if (active === 'pressure') {
      this.renderPressure();
    } else if (active === 'choices') {
      this.renderChoices();
    } else {
      this.renderOverview();
    }

    addButton(this, 370, GAME_HEIGHT - 38, 'BACK', () => {
      this.scene.stop();
      this.scene.resume(this.reportData.returnScene);
    }, 260);
    addButton(this, 640, GAME_HEIGHT - 38, 'COPY JSON', () => this.copyReport(), 260);
    addButton(this, 910, GAME_HEIGHT - 38, 'RETRY RUN', () => {
      this.scene.stop(this.reportData.returnScene);
      this.scene.start('GameScene', { balancePresetId: this.reportData.summary.balance.presetId });
    }, 260);
  }

  private renderOverview(): void {
    const report = this.reportData.summary.balance;
    this.panel(25, 165, 375, 470, 'RUN TOTALS');
    this.text(
      48,
      210,
      [
        `DAMAGE DEALT        ${report.totalDamageDealt}`,
        `DAMAGE TAKEN        ${report.totalDamageTaken}`,
        `HEALING             ${report.totalHealing}`,
        `KILLS               ${this.reportData.summary.kills}`,
        `LEVEL               ${this.reportData.summary.level}`,
        `SOULS               ${this.reportData.summary.souls}`,
        '',
        `DASHES              ${report.dashes}`,
        `PERFECT DODGES      ${report.perfectDodges}`,
        `REROLLS             ${report.rerolls}`,
        `SKIPS               ${report.skips}`,
        `SHRINE USES         ${report.shrineUses}`,
        `MAX THREAT TIER     ${report.threatSamples.at(-1)?.tier ?? 0}`,
        `DEATH SOURCE        ${report.deathSource?.toUpperCase() ?? 'NONE'}`,
        '',
        `POWERUPS COLLECTED`,
        `MENDING SOUL        ${report.powerupsCollected['mending-soul']}`,
        `SOUL VACUUM         ${report.powerupsCollected['soul-vacuum']}`,
        `GRAVE FRENZY        ${report.powerupsCollected['grave-frenzy']}`,
      ].join('\n'),
    );

    this.panel(420, 165, 405, 470, 'INCOMING DAMAGE');
    const incoming =
      report.incomingDamage.length > 0
        ? report.incomingDamage
            .slice(0, 10)
            .map(
              (result) =>
                `${this.sourceLabel(result.source).padEnd(21)} ${String(result.damage).padStart(5)}  ` +
                `${result.landedHits}/${result.attemptedHits} HITS  ${result.avoidedHits} DODGED`,
            )
            .join('\n')
        : 'NO DAMAGE SOURCES RECORDED';
    this.text(443, 210, incoming, 12);

    this.panel(845, 165, 410, 470, 'ENEMY PRESSURE');
    const enemies =
      report.enemyResults.length > 0
        ? report.enemyResults
            .slice(0, 12)
            .map(
              (result) =>
                `${ENEMIES[result.id].name.toUpperCase().padEnd(19)} ${result.killed}/${result.spawned}  ` +
                `${(result.averageLifetimeMs / 1000).toFixed(1)}s`,
            )
            .join('\n')
        : 'NO ENEMIES RECORDED';
    this.text(868, 210, `KILLED/SPAWNED   AVG LIFE\n\n${enemies}`, 12);
  }

  private renderWeapons(): void {
    this.panel(45, 165, 1190, 470, 'WEAPON PERFORMANCE');
    this.text(80, 205, 'WEAPON                     DAMAGE    DPS    HITS   CRITS   KILLS   BOSS DAMAGE', 13);
    const rows = this.reportData.summary.balance.weaponResults.map((result) => {
      const critRate = result.hits > 0 ? `${Math.round((result.criticalHits / result.hits) * 100)}%` : '0%';
      return `${WEAPONS[result.id].name.toUpperCase().padEnd(26)} ${String(result.damage).padStart(7)}  ${String(
        result.dps,
      ).padStart(6)}  ${String(result.hits).padStart(5)}  ${critRate.padStart(6)}  ${String(result.kills).padStart(
        6,
      )}  ${String(result.bossDamage).padStart(11)}`;
    });
    this.text(80, 245, rows.join('\n\n') || 'NO WEAPON DATA RECORDED', 14);
  }

  private renderPressure(): void {
    this.panel(45, 165, 1190, 470, 'ONE-MINUTE PRESSURE BUCKETS');
    this.text(
      70,
      205,
      'MINUTE   DEALT   TAKEN   HEAL   KILLS   SPAWNS   PEAK ENEMIES   LOWEST HP   LEVELS   SOULS   CHOICES   DODGES',
      12,
    );
    const rows = this.reportData.summary.balance.minutes.map(
      (minute) =>
        `${String(minute.minute + 1).padStart(4)}  ${String(Math.round(minute.damageDealt)).padStart(7)}  ${String(
          Math.round(minute.damageTaken),
        ).padStart(6)}  ${String(Math.round(minute.healing)).padStart(5)}  ${String(minute.kills).padStart(
          6,
        )}  ${String(minute.enemiesSpawned).padStart(7)}  ${String(minute.peakEnemies).padStart(12)}  ${String(
          `${Math.round(minute.lowestHealthRatio * 100)}%`,
        ).padStart(9)}  ${String(minute.levelsGained).padStart(7)}  ${String(minute.soulsCollected).padStart(
          6,
        )}  ${String(minute.choicesMade).padStart(8)}  ${String(minute.perfectDodges).padStart(7)}`,
    );
    this.text(70, 245, rows.join('\n\n'), 12);
  }

  private renderChoices(): void {
    this.panel(30, 165, 600, 470, 'UPGRADE DECISIONS');
    const report = this.reportData.summary.balance;
    const choices = report.upgradeChoices
      .slice(-16)
      .map((choice) => {
        const label = choice.id ? UPGRADES[choice.id].name.toUpperCase() : choice.outcome.toUpperCase();
        return `${formatTime(choice.atMs)}  ${choice.kind.toUpperCase().padEnd(8)}  ${label}`;
      })
      .join('\n');
    this.text(
      55,
      205,
      `OFFERS ${report.upgradeOffers.length}   REROLLS ${report.rerolls}   SKIPS ${report.skips}\n\n${
        choices || 'NO UPGRADE DECISIONS RECORDED'
      }`,
      12,
    );

    this.panel(650, 165, 600, 470, 'RUN TIMELINE');
    const timeline = report.timeline
      .slice(-18)
      .map((event) => `${formatTime(event.atMs)}  ${event.id.toUpperCase()}`)
      .join('\n');
    this.text(675, 205, timeline || 'NO TIMELINE EVENTS RECORDED', 12);
  }

  private panel(x: number, y: number, width: number, height: number, title: string): void {
    this.add
      .rectangle(x, y, width, height, COLORS.panel, 0.94)
      .setOrigin(0)
      .setStrokeStyle(2, COLORS.border);
    this.add
      .text(x + 20, y + 18, title, {
        fontFamily: 'Cinzel, serif',
        fontSize: '16px',
        color: '#d9edf4',
      })
      .setOrigin(0);
  }

  private text(x: number, y: number, value: string, size = 13): void {
    this.add.text(x, y, value, {
      fontFamily: 'Consolas, monospace',
      fontSize: `${size}px`,
      color: '#b8cbd3',
      lineSpacing: 8,
    });
  }

  private sourceLabel(source: PlayerDamageSourceId): string {
    return source in ENEMIES ? ENEMIES[source as keyof typeof ENEMIES].name.toUpperCase() : source.toUpperCase();
  }

  private copyReport(): void {
    void navigator.clipboard?.writeText(JSON.stringify(this.reportData.summary.balance, null, 2));
    this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 78, 'BALANCE JSON COPIED', {
        fontFamily: 'Cinzel, serif',
        fontSize: '13px',
        color: '#69d9ff',
      })
      .setOrigin(0.5);
  }
}
