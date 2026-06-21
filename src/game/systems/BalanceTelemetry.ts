import type {
  BalanceMinuteResult,
  BalancePresetId,
  BalanceReport,
  CursedRewardRecord,
  EnemyBalanceResult,
  EnemyId,
  IncomingDamageResult,
  PlayerDamageSourceId,
  PowerupId,
  UpgradeId,
  UpgradeOfferKind,
  WeaponId,
  WeaponRunResult,
  ThreatSnapshot,
} from '../types/gameTypes';

interface WeaponAccumulator {
  damage: number;
  kills: number;
  hits: number;
  criticalHits: number;
  bossDamage: number;
  equippedAtMs: number;
}

interface IncomingAccumulator {
  attemptedHits: number;
  landedHits: number;
  avoidedHits: number;
  damage: number;
  absorbed: number;
}

interface EnemyAccumulator {
  spawned: number;
  killed: number;
  totalLifetimeMs: number;
}

const powerupCounts = (): Record<PowerupId, number> => ({
  'mending-soul': 0,
  'soul-vacuum': 0,
  'grave-frenzy': 0,
});

export class BalanceTelemetry {
  private readonly weapons = new Map<WeaponId, WeaponAccumulator>();
  private readonly incoming = new Map<PlayerDamageSourceId, IncomingAccumulator>();
  private readonly enemies = new Map<EnemyId, EnemyAccumulator>();
  private readonly minuteBuckets = new Map<number, BalanceMinuteResult>();
  private readonly offers: BalanceReport['upgradeOffers'] = [];
  private readonly choices: BalanceReport['upgradeChoices'] = [];
  private readonly cursedRewards: BalanceReport['cursedRewards'] = [];
  private readonly timeline: BalanceReport['timeline'] = [];
  private readonly threatSamples: BalanceReport['threatSamples'] = [];
  private readonly spawnedPowerups = powerupCounts();
  private readonly collectedPowerups = powerupCounts();
  private totalHealing = 0;
  private dashes = 0;
  private perfectDodges = 0;
  private rerolls = 0;
  private skips = 0;
  private shrineUses = 0;
  private measurementStartMs = 0;
  private deathSource?: PlayerDamageSourceId;
  private deathAtMs?: number;

  constructor(readonly presetId: BalancePresetId = 'standard') {}

  setMeasurementStart(atMs: number): void {
    this.measurementStartMs = atMs;
  }

  recordWeaponEquipped(id: WeaponId, atMs: number): void {
    this.getWeapon(id, atMs);
  }

  recordWeaponHit(
    id: WeaponId,
    amount: number,
    killed: boolean,
    critical: boolean,
    boss: boolean,
    atMs: number,
  ): void {
    const result = this.getWeapon(id, atMs);
    result.damage += amount;
    result.hits += 1;
    result.kills += Number(killed);
    result.criticalHits += Number(critical);
    result.bossDamage += boss ? amount : 0;
    const minute = this.getMinute(atMs);
    minute.damageDealt += amount;
    minute.kills += Number(killed);
  }

  recordDamageAttempt(source: PlayerDamageSourceId, avoided: boolean, atMs: number): void {
    const result = this.getIncoming(source);
    result.attemptedHits += 1;
    if (avoided) {
      result.avoidedHits += 1;
      this.perfectDodges += 1;
      this.getMinute(atMs).perfectDodges += 1;
    }
  }

  recordDamageTaken(source: PlayerDamageSourceId, damage: number, absorbed: number, atMs: number): void {
    const result = this.getIncoming(source);
    result.landedHits += 1;
    result.damage += damage;
    result.absorbed += absorbed;
    this.getMinute(atMs).damageTaken += damage;
  }

  recordEnemySpawn(id: EnemyId, atMs: number): void {
    this.getEnemy(id).spawned += 1;
    this.getMinute(atMs).enemiesSpawned += 1;
  }

  recordEnemyDeath(id: EnemyId, lifetimeMs: number): void {
    const result = this.getEnemy(id);
    result.killed += 1;
    result.totalLifetimeMs += lifetimeMs;
  }

  recordHealing(amount: number, atMs: number): void {
    this.totalHealing += amount;
    this.getMinute(atMs).healing += amount;
  }

  recordDash(): void {
    this.dashes += 1;
  }

  recordLevel(atMs: number, level: number): void {
    this.getMinute(atMs).levelsGained += 1;
    this.recordTimeline(`level:${level}`, atMs);
  }

  recordSouls(amount: number, atMs: number): void {
    this.getMinute(atMs).soulsCollected += amount;
  }

  recordOffer(kind: UpgradeOfferKind, choices: readonly UpgradeId[], atMs: number): void {
    this.offers.push({ atMs, kind, choices: [...choices] });
  }

  recordChoice(
    kind: UpgradeOfferKind | 'preset',
    outcome: 'selected' | 'rerolled' | 'skipped',
    atMs: number,
    id?: UpgradeId,
  ): void {
    this.choices.push({ atMs, kind, outcome, id });
    if (outcome === 'rerolled') {
      this.rerolls += 1;
    } else if (outcome === 'skipped') {
      this.skips += 1;
    } else if (kind !== 'preset') {
      this.getMinute(atMs).choicesMade += 1;
    }
  }

  recordCursedReward(record: CursedRewardRecord): void {
    this.cursedRewards.push(record);
  }

  recordPowerupSpawn(id: PowerupId): void {
    this.spawnedPowerups[id] += 1;
  }

  recordPowerupCollected(id: PowerupId, atMs: number): void {
    this.collectedPowerups[id] += 1;
    this.recordTimeline(`powerup:${id}`, atMs);
  }

  recordShrineUse(atMs: number): void {
    this.shrineUses += 1;
    this.recordTimeline('shrine:blood-offering', atMs);
  }

  recordDeath(source: PlayerDamageSourceId, atMs: number): void {
    this.deathSource = source;
    this.deathAtMs = atMs;
    this.recordTimeline(`death:${source}`, atMs);
  }

  recordTimeline(id: string, atMs: number): void {
    this.timeline.push({ id, atMs });
  }

  recordThreat(threat: ThreatSnapshot, atMs: number): void {
    if (this.threatSamples.at(-1)?.tier === threat.tier) {
      return;
    }
    this.threatSamples.push({ atMs, ...threat });
    this.recordTimeline(`threat:tier-${threat.tier}`, atMs);
  }

  samplePressure(atMs: number, activeEnemies: number, health: number, maxHealth: number): void {
    const minute = this.getMinute(atMs);
    minute.peakEnemies = Math.max(minute.peakEnemies, activeEnemies);
    minute.lowestHealthRatio = Math.min(minute.lowestHealthRatio, maxHealth > 0 ? health / maxHealth : 0);
  }

  report(elapsedMs: number): BalanceReport {
    const measurementDurationMs = Math.max(0, elapsedMs - this.measurementStartMs);
    const weaponResults: WeaponRunResult[] = [...this.weapons]
      .map(([id, result]) => {
        const activeSeconds = Math.max(
          1,
          (elapsedMs - Math.max(this.measurementStartMs, result.equippedAtMs)) / 1000,
        );
        return {
          id,
          damage: Math.round(result.damage),
          kills: result.kills,
          hits: result.hits,
          criticalHits: result.criticalHits,
          bossDamage: Math.round(result.bossDamage),
          dps: Math.round((result.damage / activeSeconds) * 10) / 10,
        };
      })
      .sort((left, right) => right.damage - left.damage);
    const incomingDamage: IncomingDamageResult[] = [...this.incoming]
      .map(([source, result]) => ({ source, ...result, damage: Math.round(result.damage) }))
      .sort((left, right) => right.damage - left.damage);
    const enemyResults: EnemyBalanceResult[] = [...this.enemies]
      .map(([id, result]) => ({
        id,
        spawned: result.spawned,
        killed: result.killed,
        averageLifetimeMs: result.killed > 0 ? Math.round(result.totalLifetimeMs / result.killed) : 0,
      }))
      .sort((left, right) => right.spawned - left.spawned);
    const minuteCount = Math.max(1, Math.ceil(measurementDurationMs / 60000));
    const minutes = Array.from(
      { length: minuteCount },
      (_, index) => this.getMinute(this.measurementStartMs + index * 60000),
    );
    return {
      presetId: this.presetId,
      measurementDurationMs,
      deathSource: this.deathSource,
      deathAtMs: this.deathAtMs,
      totalDamageDealt: weaponResults.reduce((sum, result) => sum + result.damage, 0),
      totalDamageTaken: incomingDamage.reduce((sum, result) => sum + result.damage, 0),
      totalHealing: Math.round(this.totalHealing),
      dashes: this.dashes,
      perfectDodges: this.perfectDodges,
      rerolls: this.rerolls,
      skips: this.skips,
      shrineUses: this.shrineUses,
      weaponResults,
      incomingDamage,
      enemyResults,
      upgradeOffers: [...this.offers],
      upgradeChoices: [...this.choices],
      cursedRewards: [...this.cursedRewards],
      powerupsSpawned: { ...this.spawnedPowerups },
      powerupsCollected: { ...this.collectedPowerups },
      threatSamples: [...this.threatSamples],
      timeline: [...this.timeline].sort((left, right) => left.atMs - right.atMs),
      minutes,
    };
  }

  private getWeapon(id: WeaponId, atMs = this.measurementStartMs): WeaponAccumulator {
    const existing = this.weapons.get(id);
    if (existing) {
      return existing;
    }
    const created = { damage: 0, kills: 0, hits: 0, criticalHits: 0, bossDamage: 0, equippedAtMs: atMs };
    this.weapons.set(id, created);
    return created;
  }

  private getIncoming(source: PlayerDamageSourceId): IncomingAccumulator {
    const existing = this.incoming.get(source);
    if (existing) {
      return existing;
    }
    const created = { attemptedHits: 0, landedHits: 0, avoidedHits: 0, damage: 0, absorbed: 0 };
    this.incoming.set(source, created);
    return created;
  }

  private getEnemy(id: EnemyId): EnemyAccumulator {
    const existing = this.enemies.get(id);
    if (existing) {
      return existing;
    }
    const created = { spawned: 0, killed: 0, totalLifetimeMs: 0 };
    this.enemies.set(id, created);
    return created;
  }

  private getMinute(atMs: number): BalanceMinuteResult {
    const minute = Math.floor(Math.max(0, atMs - this.measurementStartMs) / 60000);
    const existing = this.minuteBuckets.get(minute);
    if (existing) {
      return existing;
    }
    const created: BalanceMinuteResult = {
      minute,
      damageDealt: 0,
      damageTaken: 0,
      healing: 0,
      kills: 0,
      enemiesSpawned: 0,
      levelsGained: 0,
      soulsCollected: 0,
      choicesMade: 0,
      perfectDodges: 0,
      peakEnemies: 0,
      lowestHealthRatio: 1,
    };
    this.minuteBuckets.set(minute, created);
    return created;
  }
}
