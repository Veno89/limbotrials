import { FEATURE_FLAGS } from '../config/featureFlags';
import { getSessionSpawnCount, getWaveTier, selectEnemyFromPool, shouldSpawnBoss } from '../data/waves';
import type { EnemyId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';

const NEW_ENEMY_IDS = new Set<EnemyId>(['plague-crawler', 'ember-imp', 'grave-defiler']);

export class EnemySpawnSystem {
  private readonly nextSessionSpawnAt = new Map<string, number>();
  private nextEliteAt = 240000;
  private bossSpawned = false;

  constructor(
    private readonly enemies: EnemySystem,
    private readonly onEliteWarning: () => void,
    private readonly onBossWarning: () => void,
  ) {}

  update(elapsedMs: number): void {
    const tier = getWaveTier(elapsedMs);
    for (const session of tier.sessions) {
      const nextSpawnAt = this.nextSessionSpawnAt.get(session.id) ?? 500;
      if (elapsedMs < nextSpawnAt) {
        continue;
      }
      this.nextSessionSpawnAt.set(session.id, elapsedMs + session.spawnEveryMs);
      const spawnCount = getSessionSpawnCount(
        session,
        this.enemies.countAny(session.enemyPool),
        this.enemies.count(),
        tier.globalPopulationCap,
      );
      const enabledPool = FEATURE_FLAGS.newEnemies
        ? session.enemyPool
        : session.enemyPool.filter((id) => !NEW_ENEMY_IDS.has(id));
      for (let index = 0; index < spawnCount; index += 1) {
        const id = selectEnemyFromPool(enabledPool);
        this.enemies.spawnAroundPlayer(id, elapsedMs, session.distance + (index % 4) * 30);
      }
    }

    if (tier.eliteEveryMs && tier.elitePool && elapsedMs >= this.nextEliteAt) {
      this.nextEliteAt = elapsedMs + tier.eliteEveryMs;
      this.onEliteWarning();
      this.enemies.spawnAroundPlayer(selectEnemyFromPool(tier.elitePool), elapsedMs, 700);
    }

    if (shouldSpawnBoss(elapsedMs, this.bossSpawned)) {
      this.bossSpawned = true;
      this.onBossWarning();
      this.enemies.spawnAroundPlayer('limbo-warden', elapsedMs, 760);
    }
  }
}
