import { getPendingRunEvents, type RunEventId } from '../data/runEvents';
import type { EnemySystem } from './EnemySystem';

export class RunEventSystem {
  private readonly triggered = new Set<RunEventId>();

  constructor(
    private readonly enemies: EnemySystem,
    private readonly onWarning: (text: string, color: string) => void,
    private readonly onReward: (reward: 'curse') => void,
    private readonly onTriggered: (id: RunEventId, elapsedMs: number) => void,
  ) {}

  update(elapsedMs: number): void {
    for (const event of getPendingRunEvents(elapsedMs, this.triggered)) {
      this.triggered.add(event.id);
      this.onTriggered(event.id, elapsedMs);
      this.onWarning(event.warning, event.warningColor);
      for (const spawn of event.spawns) {
        for (let index = 0; index < spawn.count; index += 1) {
          if (spawn.formation === 'ring') {
            this.enemies.spawnAroundPlayerAtAngle(
              spawn.enemyId,
              elapsedMs,
              spawn.distance + (index % 2) * 24,
              (index / spawn.count) * Math.PI * 2,
            );
          } else {
            this.enemies.spawnAroundPlayer(spawn.enemyId, elapsedMs, spawn.distance + (index % 4) * 24);
          }
        }
      }
      if (event.reward) {
        this.onReward(event.reward);
      }
    }
  }
}
