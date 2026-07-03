import { FEATURE_FLAGS } from '../config/featureFlags';
import { getCurseTier, enemyAllowedByCurse } from '../data/curse';
import { ENEMIES } from '../data/enemies';
import { getSessionSpawnCount, getWaveTier, selectEnemyFromPool, shouldSpawnBoss } from '../data/waves';
import type { CurseSnapshot, EnemyId, EdictId } from '../types/gameTypes';
import type { EnemySystem } from './EnemySystem';

const NEW_ENEMY_IDS = new Set<EnemyId>(['plague-crawler', 'ember-imp', 'grave-defiler']);

export class EnemySpawnSystem {
  private readonly nextSessionSpawnAt = new Map<string, number>();
  private nextEliteAt = 240000;
  private bossSpawned = false;

  private determineEnemyTier(elapsedMs: number): number {
    const minutes = elapsedMs / 60000;
    const random = Math.random();
    
    if (minutes >= 10) {
      if (random < 0.2) return 3;
      if (random < 0.7) return 2;
      return 1;
    } else if (minutes >= 5) {
      if (random < 0.2) return 2;
      return 1;
    }
    
    return 1;
  }

  constructor(
    private readonly enemies: EnemySystem,
    private readonly onEliteWarning: () => void,
    private readonly onBossWarning: () => void,
    private readonly getCurse: () => CurseSnapshot,
    private readonly getEdicts: () => readonly EdictId[] = () => [],
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
      const enabledPool = (FEATURE_FLAGS.newEnemies
        ? session.enemyPool
        : session.enemyPool.filter((id) => !NEW_ENEMY_IDS.has(id)))
        .filter((id) => enemyAllowedByCurse(ENEMIES[id], this.getCurse()));
      if (enabledPool.length === 0) {
        continue;
      }
      for (let index = 0; index < spawnCount; index += 1) {
        const id = selectEnemyFromPool(enabledPool);
        const enemyTier = this.determineEnemyTier(elapsedMs);
        this.enemies.spawnAroundPlayer(id, elapsedMs, session.distance + (index % 4) * 30, enemyTier);
      }
    }

    if (tier.eliteEveryMs && tier.elitePool && elapsedMs >= this.nextEliteAt) {
      const curseTier = getCurseTier(this.getCurse().level);
      const hollowHostMultiplier = this.getEdicts().includes('hollow-host') ? 1.6 : 1;
      this.nextEliteAt = elapsedMs + tier.eliteEveryMs / (curseTier.eliteSpawnModifier * hollowHostMultiplier);
      this.onEliteWarning();
      const elitePool = tier.elitePool.filter((id) => enemyAllowedByCurse(ENEMIES[id], this.getCurse()));
      if (elitePool.length > 0) {
        this.enemies.spawnAroundPlayer(selectEnemyFromPool(elitePool), elapsedMs, 700);
      }
    }

    if (shouldSpawnBoss(elapsedMs, this.bossSpawned)) {
      this.bossSpawned = true;
      this.onBossWarning();
      this.enemies.spawnAroundPlayer('limbo-warden', elapsedMs, 760);
    }
  }
}
