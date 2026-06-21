import type { CurseEventId, CurseEventDefinition } from '../data/curseEvents';
import {
  getCurseSurgeEvent,
  getCurseSurgeIntervalMs,
  getInitialCurseSurgeDelayMs,
  getPendingCurseThresholdEvents,
  shouldScheduleCurseSurges,
} from '../data/curseEvents';
import type { CurseSnapshot } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';

export class CurseEventSystem {
  private readonly triggered = new Set<CurseEventId>();
  private nextSurgeAt = Number.POSITIVE_INFINITY;

  constructor(
    private readonly enemies: EnemySystem,
    private readonly getCurse: () => CurseSnapshot,
    private readonly onWarning: (text: string, color: string) => void,
    private readonly onTriggered: (id: CurseEventId, elapsedMs: number) => void,
  ) {}

  update(elapsedMs: number): void {
    const snapshot = this.getCurse();
    for (const event of getPendingCurseThresholdEvents(snapshot, this.triggered)) {
      this.triggered.add(event.id);
      this.trigger(event, elapsedMs);
    }

    if (shouldScheduleCurseSurges(snapshot) && !Number.isFinite(this.nextSurgeAt)) {
      this.nextSurgeAt = elapsedMs + getInitialCurseSurgeDelayMs();
    }
    if (elapsedMs >= this.nextSurgeAt) {
      this.trigger(getCurseSurgeEvent(snapshot), elapsedMs);
      this.nextSurgeAt = elapsedMs + getCurseSurgeIntervalMs(snapshot);
    }
  }

  private trigger(event: CurseEventDefinition, elapsedMs: number): void {
    this.onTriggered(event.id, elapsedMs);
    this.onWarning(event.warning, event.warningColor);
    for (const spawn of event.spawns) {
      for (let index = 0; index < spawn.count; index += 1) {
        if (spawn.formation === 'ring') {
          this.enemies.spawnAroundPlayerAtAngle(
            spawn.enemyId,
            elapsedMs,
            spawn.distance + (index % 2) * 22,
            (index / spawn.count) * Math.PI * 2,
          );
        } else {
          this.enemies.spawnAroundPlayer(spawn.enemyId, elapsedMs, spawn.distance + (index % 4) * 26);
        }
      }
    }
  }
}
