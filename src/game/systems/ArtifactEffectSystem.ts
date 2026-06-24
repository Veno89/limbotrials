import type { ArtifactEffectId, PowerupId } from '../types/gameTypes';
import type { RunState } from './RunState';
import type { DamageResolution } from './run/ResourceManager';
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
  private marketHeartReadyAt = 0;
  private mercySealReadyAt = 0;
  private thornscriptReadyAt = 0;
  private crownAshKillsClean = 0;
  private splinterExpiresAt = 0;
  private pilgrimDashExpiresAt = 0;
  private crownDamnationReadyAt = 0;

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
      this.run.resources.addSouls(80);
      this.record('artifact:golden-windfall');
      this.juice.warning('GOLDEN EGG: +80 SOULS', '#d7bd82');
    }
    if (effect === 'ascended-choice') {
      this.run.upgrades.addChoiceBonus(1);
      this.record('artifact:ascended-choice');
      this.juice.warning('ASCENDED CROWN: CHOICES WIDEN', '#d7bd82');
    }
    if (effect === 'red-testament-embrace') {
      this.grantShield(40, 'RED TESTAMENT');
    }
    if (effect === 'unlit-halo-tradeoff') {
      this.run.stats.applyModifiers([
        { stat: 'maxHealth', mode: 'multiply', value: 0 },
        { stat: 'damage', mode: 'multiply', value: 2.0 },
        { stat: 'moveSpeed', mode: 'multiply', value: 1.5 },
      ]);
      this.run.resources.health = 1;
      this.record('artifact:unlit-halo-tradeoff');
      this.juice.warning('UNLIT HALO: PERFECT FRAILTY', '#d9edf4');
    }
  }

  onDash(): void {
    if (this.run.artifacts.hasEffect('winged-quicken')) {
      this.quicken(220, 'artifact:winged-quicken');
    }
    if (this.run.artifacts.hasEffect('hourglass-quicken')) {
      this.quicken(320, 'artifact:hourglass-quicken');
    }
    if (this.run.artifacts.hasEffect('pilgrim-dash-boost')) {
      this.pilgrimDashExpiresAt = this.run.elapsedMs + 2000;
      this.record('artifact:pilgrim-dash-boost');
    }
    if (this.run.artifacts.hasEffect('mirror-quicken')) {
      this.quicken(400, 'artifact:mirror-quicken');
    }
  }

  onPerfectDodge(): void {
    if (!this.run.artifacts.hasEffect('shadow-perfect-dodge')) {
      return;
    }
    this.quicken(300, 'artifact:shadow-perfect-dodge');
    this.grantShield(10, 'SHADOW CLOAK');
  }

  onPickupCollected(_xp: number, souls: number): void {
    if (this.run.artifacts.hasEffect('magnet-tithe') && this.tick('magnet-tithe', 5)) {
      this.run.resources.addSouls(3);
      this.record('artifact:magnet-tithe:+3');
    }
    if (this.run.artifacts.hasEffect('soul-lantern-vacuum') && !this.vacuuming && this.tick('soul-lantern-vacuum', 12)) {
      this.vacuuming = true;
      this.callbacks.collectAllPickups();
      this.vacuuming = false;
      this.record('artifact:soul-lantern-vacuum');
      this.juice.warning('SOUL LANTERN: REMNANTS GATHER', '#69d9ff');
    }
    if (this.run.artifacts.hasEffect('soul-furnace-stoke')) {
      const total = this.add('soul-furnace-stoke', souls);
      if (total >= 35) {
        this.counters.set('soul-furnace-stoke', total - 35);
        this.quicken(700, 'artifact:soul-furnace-stoke');
        this.juice.warning('SOUL FURNACE STOKED', '#f07b35');
      }
    }
    if (this.run.artifacts.hasEffect('prayer-bead-heal') && this.tick('prayer-bead-heal', 8)) {
      this.heal(5, 'artifact:prayer-bead-heal');
    }
  }

  onEnemyDeath(death: EnemyDeath): void {
    if (this.run.artifacts.hasEffect('red-ledger-tithe')) {
      if (death.definition.elite || death.definition.boss) {
        this.heal(death.definition.boss ? 30 : 18, 'artifact:red-ledger-elite');
      } else if (this.tick('red-ledger-tithe', 16)) {
        this.heal(7, 'artifact:red-ledger-tithe');
      }
    }
    if (this.run.artifacts.hasEffect('whetstone-cadence') && this.tick('whetstone-cadence', 18)) {
      this.quicken(450, 'artifact:whetstone-cadence');
    }
    if (this.run.artifacts.hasEffect('blood-vial-feast')) {
      if (death.definition.elite || death.definition.boss) {
        this.heal(12, 'artifact:blood-vial-elite');
      } else if (this.tick('blood-vial-feast', 10)) {
        this.heal(4, 'artifact:blood-vial-feast');
      }
    }
    if (this.run.artifacts.hasEffect('hallowed-tithe') && (death.definition.elite || death.definition.boss)) {
      const souls = death.definition.boss ? 40 : 18;
      this.run.resources.addSouls(souls);
      this.record(`artifact:hallowed-tithe:+${souls}`);
    }
    if (this.run.artifacts.hasEffect('vampiric-elite-heal') && (death.definition.elite || death.definition.boss)) {
      this.heal(death.definition.boss ? 30 : 18, 'artifact:vampiric-elite-heal');
    }
    if (this.run.artifacts.hasEffect('lucky-powerup') && this.tick('lucky-powerup', 45)) {
      this.callbacks.spawnPowerup(death.x, death.y);
      this.record('artifact:lucky-powerup');
    }
    if (this.run.artifacts.hasEffect('unstable-frenzy') && this.tick('unstable-frenzy', 35)) {
      this.callbacks.grantPowerup('grave-frenzy');
      this.record('artifact:unstable-frenzy');
    }
    if (this.run.artifacts.hasEffect('death-gaze-blink') && this.tick('death-gaze-blink', 25)) {
      this.quicken(800, 'artifact:death-gaze-blink');
      this.juice.warning('DEATH GAZE BLINKS', '#d9edf4');
    }
    if (this.run.artifacts.hasEffect('wardens-prize') && (death.definition.elite || death.definition.boss)) {
      const souls = death.definition.boss ? 80 : 20;
      this.run.resources.addSouls(souls);
      this.record(`artifact:wardens-prize:+${souls}`);
    }

    // ─── Expansion artifact kill effects ───

    if (this.run.artifacts.hasEffect('bandage-regen') && this.tick('bandage-regen', 20)) {
      this.heal(8, 'artifact:bandage-regen');
    }
    if (this.run.artifacts.hasEffect('nail-whetstone') && this.tick('nail-whetstone', 22)) {
      this.quicken(280, 'artifact:nail-whetstone');
    }
    if (this.run.artifacts.hasEffect('grave-soil-souls') && this.tick('grave-soil-souls', 14)) {
      this.run.resources.addSouls(5);
      this.record('artifact:grave-soil-souls:+5');
    }
    if (this.run.artifacts.hasEffect('candle-pulse') && this.tick('candle-pulse', 30)) {
      this.callbacks.grantPowerup('grave-frenzy');
      this.record('artifact:candle-pulse');
    }
    if (this.run.artifacts.hasEffect('lent-temperance') && this.tick('lent-temperance', 18)) {
      this.quicken(350, 'artifact:lent-temperance');
    }
    if (this.run.artifacts.hasEffect('crowbone-bounty') && (death.definition.elite || death.definition.boss)) {
      this.run.resources.addSouls(15);
      this.record('artifact:crowbone-bounty:+15');
    }
    if (this.run.artifacts.hasEffect('rosary-quicken') && this.tick('rosary-quicken', 25)) {
      this.quicken(320, 'artifact:rosary-quicken');
    }
    if (this.run.artifacts.hasEffect('hollow-coin-greed') && (death.definition.elite || death.definition.boss)) {
      this.run.resources.addSouls(10);
      this.record('artifact:hollow-coin-greed:+10');
    }
    if (this.run.artifacts.hasEffect('blood-tithe-feast') && (death.definition.elite || death.definition.boss)) {
      this.heal(death.definition.boss ? 40 : 20, 'artifact:blood-tithe-feast');
      this.quicken(500, 'artifact:blood-tithe-feast-quicken');
    }
    if (this.run.artifacts.hasEffect('bell-clapper-shockwave') && this.tick('bell-clapper-shockwave', 12)) {
      this.quicken(400, 'artifact:bell-clapper-shockwave');
      this.juice.warning('FUNERAL BELL TOLLS', '#cbdde5');
    }
    if (this.run.artifacts.hasEffect('reliquary-key-bounty') && (death.definition.elite || death.definition.boss)) {
      const souls = death.definition.boss ? 50 : 25;
      this.run.resources.addSouls(souls);
      this.record(`artifact:reliquary-key-bounty:+${souls}`);
    }
    if (this.run.artifacts.hasEffect('crown-ash-fury')) {
      this.crownAshKillsClean += 1;
      if (this.crownAshKillsClean >= 15) {
        this.crownAshKillsClean = 0;
        this.quicken(900, 'artifact:crown-ash-fury');
        this.juice.warning('CROWN OF ASH BLAZES', '#f07b35');
      }
    }
    if (this.run.artifacts.hasEffect('halo-flies-frenzy') && this.tick('halo-flies-frenzy', 8)) {
      this.callbacks.grantPowerup('grave-frenzy');
      this.record('artifact:halo-flies-frenzy');
      this.juice.warning('HALO OF FLIES SWARMS', '#9d72ff');
    }

    // ─── NG+ artifact kill effects ───

    if (this.run.artifacts.hasEffect('crown-second-damnation') && (death.definition.elite || death.definition.boss)) {
      this.run.resources.addSouls(death.definition.boss ? 60 : 25);
      this.record('artifact:crown-second-damnation');
    }
  }

  onPlayerDamaged(result: DamageResolution): void {
    if (
      this.run.artifacts.hasEffect('market-heart-ward') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.marketHeartReadyAt
    ) {
      this.marketHeartReadyAt = this.run.elapsedMs + 8000;
      this.grantShield(18, 'MARKET HEART');
    }
    if (this.run.artifacts.hasEffect('buckler-break') && result.absorbed > 0 && this.run.resources.shield <= 0) {
      this.quicken(650, 'artifact:buckler-break');
      this.juice.warning('BUCKLER BREAK: WEAPONS QUICKEN', '#d9edf4');
    }
    if (this.run.artifacts.hasEffect('spiked-retaliation') && result.dealt > 0) {
      this.quicken(450, 'artifact:spiked-retaliation');
    }
    if (
      this.run.artifacts.hasEffect('giants-last-stand') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.giantsLastStandReadyAt
    ) {
      this.giantsLastStandReadyAt = this.run.elapsedMs + 6000;
      this.grantShield(12, "GIANT'S LAST STAND");
    }

    // ─── Expansion artifact damage-reaction effects ───

    if (
      this.run.artifacts.hasEffect('mercy-seal-ward') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.mercySealReadyAt
    ) {
      this.mercySealReadyAt = this.run.elapsedMs + 6000;
      this.grantShield(12, 'WAX SEAL OF MERCY');
    }
    if (this.run.artifacts.hasEffect('splinter-empower') && result.dealt > 0) {
      this.splinterExpiresAt = this.run.elapsedMs + 4000;
      this.record('artifact:splinter-empower');
    }
    if (
      this.run.artifacts.hasEffect('thornscript-ward') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.thornscriptReadyAt
    ) {
      this.thornscriptReadyAt = this.run.elapsedMs + 5000;
      this.quicken(350, 'artifact:thornscript-ward');
      this.grantShield(10, 'THORNSCRIPT');
    }
    if (this.run.artifacts.hasEffect('crown-ash-fury') && result.dealt > 0) {
      this.crownAshKillsClean = 0;
    }

    // ─── NG+ artifact damage-reaction effects ───

    if (
      this.run.artifacts.hasEffect('crown-second-damnation') &&
      result.dealt > 0 &&
      this.run.elapsedMs >= this.crownDamnationReadyAt
    ) {
      this.crownDamnationReadyAt = this.run.elapsedMs + 10000;
      this.quicken(600, 'artifact:crown-second-damnation');
      this.juice.warning('SECOND DAMNATION STIRS', '#9d72ff');
    }
    if (this.run.artifacts.hasEffect('martyrs-ledger-payback') && result.dealt > 0) {
      const stacks = Math.min((this.counters.get('martyrs-ledger') ?? 0) + 1, 50);
      this.counters.set('martyrs-ledger', stacks);
      this.record(`artifact:martyrs-ledger:${stacks}%`);
    }
  }

  /** New hook: query-based damage multiplier for timed artifact buffs. */
  getArtifactDamageMultiplier(): number {
    let multiplier = 1;
    if (this.run.artifacts.hasEffect('pilgrim-dash-boost') && this.run.elapsedMs < this.pilgrimDashExpiresAt) {
      multiplier *= 1.08;
    }
    if (this.run.artifacts.hasEffect('splinter-empower') && this.run.elapsedMs < this.splinterExpiresAt) {
      multiplier *= 1.12;
    }
    if (this.run.artifacts.hasEffect('martyrs-ledger-payback')) {
      const stacks = this.counters.get('martyrs-ledger') ?? 0;
      multiplier *= 1 + stacks * 0.01;
    }
    return multiplier;
  }

  /** New hook: called when the player levels up. */
  onLevelUp(newLevel: number): void {
    if (this.run.artifacts.hasEffect('black-reliquary-odds') && newLevel % 5 === 0) {
      this.quicken(600, 'artifact:black-reliquary-odds');
      this.juice.warning('BLACK RELIQUARY STIRS', '#9d72ff');
    }
    if (this.run.artifacts.hasEffect('bell-hollow-host-pulse') && newLevel % 3 === 0) {
      this.quicken(400, 'artifact:bell-hollow-host-pulse');
      this.juice.warning('HOLLOW HOST TOLLS', '#d9edf4');
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
    const healed = this.run.resources.heal(amount);
    if (healed > 0) {
      this.record(`${id}:+${Math.round(healed)}`);
    }
  }

  private grantShield(amount: number, label: string): void {
    this.run.resources.shield = Math.max(this.run.resources.shield, amount);
    const position = this.callbacks.playerPosition();
    this.juice.ring(position.x, position.y, 82, 0xcbdde5, 360);
    this.record(`artifact:shield:+${amount}`);
    this.juice.warning(`${label}: +${amount} SHIELD`, '#d9edf4');
  }

  private record(id: string): void {
    this.run.balance.recordTimeline(id, this.run.elapsedMs);
  }
}
