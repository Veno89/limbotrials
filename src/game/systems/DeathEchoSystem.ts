import type { DeathEchoSnapshot } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';
import type { RunState } from './RunState';
import {
  createDeathEchoProfile,
  createDeathEchoSpawnPlan,
  type DeathEchoProfile,
} from './deathEchoRules';

export class DeathEchoSystem {
  private spawned = false;
  private readonly profileValue?: DeathEchoProfile;

  constructor(
    private readonly enemies: EnemySystem,
    private readonly run: RunState,
    private readonly snapshot: DeathEchoSnapshot | undefined,
    private readonly onWarning: (text: string, color: string) => void,
    private readonly onTriggered: (id: string, elapsedMs: number) => void,
  ) {
    this.profileValue = snapshot ? createDeathEchoProfile(snapshot) : undefined;
  }

  update(elapsedMs: number): void {
    if (this.spawned || !this.snapshot) {
      return;
    }
    const plan = createDeathEchoSpawnPlan(this.snapshot, this.run.curse.snapshot());
    if (!plan || elapsedMs < plan.spawnAtMs) {
      return;
    }
    this.spawned = true;
    this.onTriggered('death-echo:spawned', elapsedMs);
    this.onWarning(plan.warning, '#b88ce1');
    this.enemies.spawnAroundPlayer('player-echo', elapsedMs, plan.distance);
  }

  profile(): DeathEchoProfile | undefined {
    return this.profileValue;
  }
}
