import type { ArtifactEffectId, PowerupId } from '../types/gameTypes';
import type { DamageResolution, RunState } from './RunState';
import type { EnemyDeath } from './EnemySystem';
import type { JuiceSystem } from './JuiceSystem';

interface ArtifactEffectCallbacks {
  reduceWeaponCooldowns: (milliseconds: number) => void;
  collectAllPickups: () => void;
  grantPowerup: (id: PowerupId) => void;
  spawnPowerup: (x: number, y: number) => void;
  playerPosition: () => { x: number; y: number };
}

export class ArtifactEffectSystem {
  private readonly counters = new Map<string, number>();
  private vacuuming = false;
  private giantsLastStandReadyAt = 0;

  constructor(
    private readonly run: RunState,
    private readonly juice: Pick<JuiceSystem, 'warning' | 'ring'>,
    private readonly callbacks: ArtifactEffectCallbacks,
  ) {}

  onArtifactGained(effect: ArtifactEffectId | undefined): void {
    if (effect === 'vital-shield') {
      this.grantShield(35, 'PENDANT WARD');
    }
    if (effect === 'golden-windfall') {
      this.run.addSouls(80);
      this.record('artifact:golden-windfall');
      this.juice.warning('GOLDEN EGG: +80 SOULS', '#d7bd82');
    }
    if (effect === 'ascended-choice') {
      this.run.addUpgradeChoiceBonus(1);
      this.record('artifact:ascended-choice');
      this.juice.warning('ASCENDED CROWN: CHOICES WIDEN', '#d7bd82');
    }
  }

  onDash(): void {
    if (this.run.hasArtifactEffect('winged-quicken')) {
      this.quicken(220, 'artifact:winged-quicken');
    }
    if (this.run.hasArtifactEffect('hourglass-quicken')) {
      this.quicken(320, 'artifact:hourglass-quicken');
    }
  }

  onPerfectDodge(): void {
    if (!this.run.hasArtifactEffect('shadow-perfect-dodge')) {
      return;
    }
    this.quicken(300, 'artifact:shadow-perfect-dodge');
    this.grantShield(10, 'SHADOW CLOAK');
  }

  onPickupCollected(_xp: number, souls: number): void {
    if (this.run.hasArtifactEffect('magnet-tithe') && this.tick('magnet-tithe', 5)) {
      this.run.addSouls(3);
      this.record('artifact:magnet-tithe:+3');
    }
    if (this.run.hasArtifactEffect('soul-lantern-vacuum') && !this.vacuuming && this.tick('soul-lantern-vacuum', 12)) {
      this.vacuuming = true;
      this.callbacks.collectAllPickups();
      this.vacuuming = false;
      this.record('artifact:soul-lantern-vacuum');
      this.juice.warning('SOUL LANTERN: REMNANTS GATHER', '#69d9ff');
    }
    if (this.run.hasArtifactEffect('soul-furnace-stoke')) {
      const total = this.add('soul-furnace-stoke', souls);
      if (total >= 35) {
        this.counters.set('soul-furnace-stoke', total - 35);
        this.quicken(700, 'artifact:soul-furnace-stoke');
        this.juice.warning('SOUL FURNACE STOKED', '#f07b35');
      }
    }
  }

  onEnemyDeath(death: EnemyDeath): void {
    if (this.run.hasArtifactEffect('whetstone-cadence') && this.tick('whetstone-cadence', 18)) {
      this.quicken(450, 'artifact:whetstone-cadence');
    }
    if (this.run.hasArtifactEffect('blood-vial-feast')) {
      if (death.definition.elite || death.definition.boss) {
        this.heal(12, 'artifact:blood-vial-elite');
      } else if (this.tick('blood-vial-feast', 10)) {
        this.heal(4, 'artifact:blood-vial-feast');
      }
    }
    if (this.run.hasArtifactEffect('hallowed-tithe') && (death.definition.elite || death.definition.boss)) {
      const souls = death.definition.boss ? 40 : 18;
      this.run.addSouls(souls);
      this.record(`artifact:hallowed-tithe:+${souls}`);
    }
    if (this.run.hasArtifactEffect('vampiric-elite-heal') && (death.definition.elite || death.definition.boss)) {
      this.heal(death.definition.boss ? 30 : 18, 'artifact:vampiric-elite-heal');
    }
    if (this.run.hasArtifactEffect('lucky-powerup') && this.tick('lucky-powerup', 45)) {
      this.callbacks.spawnPowerup(death.x, death.y);
      this.record('artifact:lucky-powerup');
    }
    if (this.run.hasArtifactEffect('unstable-frenzy') && this.tick('unstable-frenzy', 35)) {
      this.callbacks.grantPowerup('grave-frenzy');
      this.record('artifact:unstable-frenzy');
    }
    if (this.run.hasArtifactEffect('death-gaze-blink') && this.tick('death-gaze-blink', 25)) {
      this.quicken(800, 'artifact:death-gaze-blink');
      this.juice.warning('DEATH GAZE BLINKS', '#d9edf4');
    }
    if (this.run.hasArtifactEffect('wardens-prize') && (death.definition.elite || death.definition.boss)) {
      const souls = death.definition.boss ? 80 : 20;
      this.run.addSouls(souls);
      this.record(`artifact:wardens-prize:+${souls}`);
    }
  }

  onPlayerDamaged(result: DamageResolution): void {
    if (this.run.hasArtifactEffect('buckler-break') && result.absorbed > 0 && this.run.shield <= 0) {
      this.quicken(650, 'artifact:buckler-break');
      this.juice.warning('BUCKLER BREAK: WEAPONS QUICKEN', '#d9edf4');
    }
    if (this.run.hasArtifactEffect('spiked-retaliation') && result.dealt > 0) {
      this.quicken(450, 'artifact:spiked-retaliation');
    }
    if (
      this.run.hasArtifactEffect('giants-last-stand') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.giantsLastStandReadyAt
    ) {
      this.giantsLastStandReadyAt = this.run.elapsedMs + 6000;
      this.grantShield(12, "GIANT'S LAST STAND");
    }
  }

  private tick(key: string, threshold: number): boolean {
    const next = this.add(key, 1);
    if (next < threshold) {
      return false;
    }
    this.counters.set(key, next - threshold);
    return true;
  }

  private add(key: string, amount: number): number {
    const next = (this.counters.get(key) ?? 0) + amount;
    this.counters.set(key, next);
    return next;
  }

  private quicken(milliseconds: number, id: string): void {
    this.callbacks.reduceWeaponCooldowns(milliseconds);
    this.record(id);
  }

  private heal(amount: number, id: string): void {
    const healed = this.run.heal(amount);
    if (healed > 0) {
      this.record(`${id}:+${Math.round(healed)}`);
    }
  }

  private grantShield(amount: number, label: string): void {
    this.run.shield = Math.max(this.run.shield, amount);
    const position = this.callbacks.playerPosition();
    this.juice.ring(position.x, position.y, 82, 0xcbdde5, 360);
    this.record(`artifact:shield:+${amount}`);
    this.juice.warning(`${label}: +${amount} SHIELD`, '#d9edf4');
  }

  private record(id: string): void {
    this.run.balance.recordTimeline(id, this.run.elapsedMs);
  }
}
