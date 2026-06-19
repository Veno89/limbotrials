import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH, COLORS } from '../constants';
import { EnemySpawnSystem } from '../systems/EnemySpawnSystem';
import { EnemySystem, type EnemyDeath } from '../systems/EnemySystem';
import { JuiceSystem } from '../systems/JuiceSystem';
import { PickupSystem } from '../systems/PickupSystem';
import { PlayerMovementSystem } from '../systems/PlayerMovementSystem';
import { RunState } from '../systems/RunState';
import { RunEventSystem } from '../systems/RunEventSystem';
import { UpgradeOfferSystem } from '../systems/UpgradeOfferSystem';
import { loadSave, recordRunResult, writeSave } from '../systems/SaveSystem';
import { ChestSystem } from '../systems/ChestSystem';
import { getAvailableArtifacts, rollArtifact } from '../data/artifacts';
import { WeaponSystem } from '../systems/WeaponSystem';
import { HudSystem } from '../ui/HudSystem';
import type {
  AppliedRewardResult,
  BalancePresetId,
  CharacterId,
  CurseGainResult,
  PlayerDamageSourceId,
  UpgradeDefinition,
} from '../types/gameTypes';
import { audio } from '../systems/AudioSystem';
import { BossAttackSystem } from '../systems/BossAttackSystem';
import { PowerupSystem } from '../systems/PowerupSystem';
import { ArenaShrineSystem } from '../systems/ArenaShrineSystem';
import { WEAPONS } from '../data/weapons';
import { applyBalancePreset, BalancePresetSpawnSystem } from '../systems/BalancePresetSystem';
import { BALANCE_PRESETS } from '../data/balancePresets';
import { writeLastRunSummary } from '../systems/BalanceReportStore';
import { DebugControlsSystem } from '../systems/DebugControlsSystem';
import { CHARACTERS } from '../data/characters';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { PlayerStatusVisualSystem } from '../ui/PlayerStatusVisualSystem';
import { LootRevealSystem } from '../ui/LootRevealSystem';
import { PlayerVisualSystem } from '../systems/PlayerVisualSystem';
import { mutateArtifactReward } from '../systems/CursedRewardMutationSystem';
import { DeathEchoSystem } from '../systems/DeathEchoSystem';
import { ConditionalUpgradeSystem } from '../systems/ConditionalUpgradeSystem';

interface GameSceneData {
  balancePresetId?: BalancePresetId;
  characterId?: CharacterId;
}

export class GameScene extends Phaser.Scene {
  private run!: RunState;
  private player!: Phaser.Physics.Arcade.Image;
  private movement!: PlayerMovementSystem;
  private enemies!: EnemySystem;
  private spawner!: EnemySpawnSystem;
  private runEvents!: RunEventSystem;
  private offers!: UpgradeOfferSystem;
  private bossAttacks!: BossAttackSystem;
  private shrine!: ArenaShrineSystem;
  private pickups!: PickupSystem;
  private powerups!: PowerupSystem;
  private weapons!: WeaponSystem;
  private hud!: HudSystem;
  private juice!: JuiceSystem;
  private ended = false;
  private invulnerableUntil = 0;
  private nextShieldAt = Number.POSITIVE_INFINITY;
  private nextBalanceSampleAt = 0;
  private balancePresetId: BalancePresetId = 'standard';
  private presetSpawner?: BalancePresetSpawnSystem;
  private debugControls?: DebugControlsSystem;
  private chests?: ChestSystem;
  private playerStatusVisuals!: PlayerStatusVisualSystem;
  private lootReveal!: LootRevealSystem;
  private playerVisuals!: PlayerVisualSystem;
  private deathEcho?: DeathEchoSystem;
  private conditionalUpgrades!: ConditionalUpgradeSystem;
  private characterId?: CharacterId;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.balancePresetId = data.balancePresetId ?? 'standard';
    this.characterId = data.characterId;
  }

  create(): void {
    this.ended = false;
    this.presetSpawner = undefined;
    this.chests = undefined;
    this.deathEcho = undefined;
    this.invulnerableUntil = 0;
    this.nextShieldAt = Number.POSITIVE_INFINITY;
    this.nextBalanceSampleAt = 0;
    const save = loadSave();
    audio.configure(save.settings);
    audio.startAmbience();
    this.events.on(Phaser.Scenes.Events.RESUME, () => audio.startAmbience());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => audio.stopAmbience());
    this.run = new RunState(save, this.balancePresetId, this.characterId ?? save.selectedCharacter);
    this.createArena();
    this.physics.world.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.player = this.physics.add.image(
      ARENA_WIDTH / 2,
      ARENA_HEIGHT / 2,
      CHARACTERS[this.run.characterId].texture,
    );
    this.player.setDisplaySize(74, 74).setDepth(35).setCollideWorldBounds(true);
    this.playerVisuals = new PlayerVisualSystem(this, this.player, this.run.characterId);
    this.cameras.main.setBounds(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);

    this.juice = new JuiceSystem(this, save.settings.screenShake, save.settings.particles);
    this.lootReveal = new LootRevealSystem(this, this.player, this.juice);
    this.enemies = new EnemySystem(
      this,
      this.player,
      this.juice,
      (damage, source) => this.hitPlayer(damage, source),
      (id, elapsedMs) => this.run.balance.recordEnemySpawn(id, elapsedMs),
      (death) => this.handleEnemyDeath(death),
      (attack, x, y, phase) => {
        this.run.balance.recordTimeline(`boss:${attack}:phase-${phase}`, this.run.elapsedMs);
        this.bossAttacks.trigger(attack, x, y, phase);
      },
      (phase) => {
        this.run.balance.recordTimeline(`boss:phase-${phase}`, this.run.elapsedMs);
        this.juice.warning(
          phase === 2 ? 'THE WARDEN SHATTERS ITS CHAINS' : 'THE WARDEN UNLEASHES OBLIVION',
          phase === 2 ? '#d7bd82' : '#d94545',
        );
      },
      () => this.run.getThreatSnapshot(),
      () => this.deathEcho?.profile(),
    );
    this.conditionalUpgrades = new ConditionalUpgradeSystem(this.player, this.run, this.juice);
    this.movement = new PlayerMovementSystem(this, this.player, this.run.stats, () => {
      this.run.balance.recordDash();
      audio.play('dash');
      this.juice.ring(this.player.x, this.player.y, 58, COLORS.soul, 180);
      this.conditionalUpgrades.onDash(this.time.now);
    });
    this.pickups = new PickupSystem(this, this.player, this.run.stats, (xp, souls) =>
      this.collectPickup(xp, souls),
    );
    this.powerups = new PowerupSystem(this, this.player, this.run, this.pickups, this.juice);
    this.weapons = new WeaponSystem(
      this,
      this.player,
      this.enemies,
      this.run,
      this.juice,
      this.powerups,
      this.conditionalUpgrades,
    );
    this.bossAttacks = new BossAttackSystem(
      this,
      this.player,
      this.enemies,
      this.juice,
      (damage, source) => this.hitPlayer(damage, source),
      () => this.run.elapsedMs,
      () => this.run.curse.snapshot(),
    );
    this.spawner = new EnemySpawnSystem(
      this.enemies,
      () => this.juice.warning('AN ELITE SOUL APPROACHES', '#d98a63'),
      () => {
        audio.play('boss');
        this.run.balance.recordTimeline('boss:spawned', this.run.elapsedMs);
        this.juice.warning('THE LIMBO WARDEN HAS COME', '#d7bd82');
      },
      () => this.run.curse.snapshot(),
    );
    this.offers = new UpgradeOfferSystem(
      this,
      this.run,
      (choice, result) => this.handleUpgradeApplied(choice, result),
      (souls) => this.juice.warning(`POWER REFUSED: +${souls} SOULS`, '#69d9ff'),
    );
    this.runEvents = new RunEventSystem(
      this.enemies,
      (text, color) => this.juice.warning(text, color),
      (reward) => this.offers.request(reward),
      (id, elapsedMs) => this.run.balance.recordTimeline(`event:${id}`, elapsedMs),
    );
    this.shrine = new ArenaShrineSystem(
      this,
      this.player,
      this.juice,
      () => this.run.health > 25,
      () => {
        this.run.balance.recordShrineUse(this.run.elapsedMs);
        this.run.balance.recordDamageAttempt('blood-shrine', false, this.run.elapsedMs);
        this.run.takeDamage(20, 'blood-shrine');
        this.juice.warning('THE SHRINE ACCEPTS YOUR BLOOD', '#b687ed');
        this.offers.request('standard');
      },
    );
    if (this.balancePresetId !== 'standard') {
      applyBalancePreset(this.balancePresetId, this.run, this.enemies, this.player);
      this.presetSpawner = new BalancePresetSpawnSystem(this.balancePresetId, this.enemies);
      this.juice.warning(BALANCE_PRESETS[this.balancePresetId].name, '#d7bd82');
    }
    if (this.balancePresetId === 'standard' && FEATURE_FLAGS.artifacts && FEATURE_FLAGS.chests) {
      this.chests = new ChestSystem(this, this.player, this.juice, (x, y) => {
        const artifact = rollArtifact(getAvailableArtifacts(save), [...this.run.artifacts]);
        const reward = artifact ? mutateArtifactReward(artifact, this.run.curse.snapshot()) : null;
        const result = reward ? this.run.applyArtifactReward(reward) : { applied: false };
        if (reward && result.applied) {
          this.run.balance.recordTimeline(`artifact:${reward.id}`, this.run.elapsedMs);
          this.handleCurseGain(result.curse, reward.curse?.warning);
          audio.play('level-up');
          this.lootReveal.reveal(x, y, {
            texture: reward.iconTexture,
            label: reward.curse ? `${reward.name}  Curse +${reward.curse.curseGain}` : reward.name,
            color: reward.curse ? COLORS.blood : COLORS.gold,
          });
          return;
        }
        this.run.addSouls(20);
        this.lootReveal.reveal(x, y, {
          texture: 'soul',
          label: '+20 Souls',
          color: COLORS.soul,
        });
      }, {
        onSpawn: () => {
          this.run.balance.recordTimeline('chest:spawned', this.run.elapsedMs);
          this.juice.warning('A RELIQUARY EMERGES NEARBY', '#d7bd82');
        },
        onOpen: () => this.run.balance.recordTimeline('chest:opened', this.run.elapsedMs),
        onExpire: () => this.run.balance.recordTimeline('chest:expired', this.run.elapsedMs),
      });
    }
    this.hud = new HudSystem(
      this,
      this.run,
      this.enemies,
      this.movement,
      this.weapons,
      this.chests,
    );
    if (this.balancePresetId === 'standard') {
      this.deathEcho = new DeathEchoSystem(
        this.enemies,
        this.run,
        save.deathEcho,
        (text, color) => this.juice.warning(text, color),
        (id, elapsedMs) => this.run.balance.recordTimeline(id, elapsedMs),
      );
    }
    this.playerStatusVisuals = new PlayerStatusVisualSystem(this, this.player, this.run, this.powerups);
    if (this.balancePresetId === 'standard') {
      this.juice.warning('SURVIVE THE LIMBO TRIAL');
      this.time.delayedCall(1800, () => this.juice.warning('MOVE WITH WASD OR ARROW KEYS'));
      this.time.delayedCall(4300, () => this.juice.warning('PRESS SPACE TO DASH THROUGH DANGER'));
    }

    this.input.keyboard?.on('keydown-ESC', () => this.pauseRun());
    if (import.meta.env.DEV) {
      this.debugControls = new DebugControlsSystem(
        this,
        this.run,
        this.enemies,
        this.offers,
        this.chests,
        this.powerups,
        () => this.grantShield(),
        () => this.endRun(false),
      );
    }
  }

  update(time: number, delta: number): void {
    if (this.ended) {
      return;
    }
    this.run.elapsedMs += delta;
    this.movement.update(time);
    this.playerVisuals.update(time);
    if (this.balancePresetId === 'standard') {
      this.spawner.update(this.run.elapsedMs);
      this.runEvents.update(this.run.elapsedMs);
      this.deathEcho?.update(this.run.elapsedMs);
    } else {
      this.presetSpawner?.update(this.run.elapsedMs);
    }
    this.enemies.update(time, this.run.elapsedMs);
    this.weapons.update(time);
    this.pickups.update();
    this.powerups.update();
    this.shrine.update();
    this.chests?.update(this.run.elapsedMs);
    this.updateShield(this.run.elapsedMs);
    this.playerStatusVisuals.update(time);
    this.hud.update(time);
    this.debugControls?.update(time);
    if (this.run.elapsedMs >= this.nextBalanceSampleAt) {
      this.nextBalanceSampleAt = this.run.elapsedMs + 1000;
      this.run.balance.samplePressure(
        this.run.elapsedMs,
        this.enemies.count(),
        this.run.health,
        this.run.stats.maxHealth,
      );
      this.run.balance.recordThreat(this.run.getThreatSnapshot(), this.run.elapsedMs);
    }
  }

  abandonRun(): void {
    this.endRun(false);
  }

  private createArena(): void {
    this.add
      .tileSprite(0, 0, ARENA_WIDTH, ARENA_HEIGHT, 'arena-floor')
      .setOrigin(0)
      .setTileScale(0.5)
      .setTint(0x60717a)
      .setDepth(0);
    this.add
      .rectangle(ARENA_WIDTH / 2, ARENA_HEIGHT / 2, ARENA_WIDTH - 34, ARENA_HEIGHT - 34, 0x000000, 0)
      .setStrokeStyle(34, 0x11191d, 1)
      .setDepth(10);
    const props: Array<[number, number, string, number]> = [
      [280, 300, 'prop-cage', 155],
      [2180, 330, 'prop-skeleton', 135],
      [2130, 1580, 'prop-brazier', 145],
      [1280, 250, 'prop-lantern', 110],
      [1250, 1700, 'prop-rubble', 170],
    ];
    for (const [x, y, texture, size] of props) {
      this.add.image(x, y, texture).setDisplaySize(size, size).setAlpha(0.48).setDepth(8);
    }
    for (let index = 0; index < 24; index += 1) {
      this.add
        .circle(
          Phaser.Math.Between(100, ARENA_WIDTH - 100),
          Phaser.Math.Between(100, ARENA_HEIGHT - 100),
          Phaser.Math.Between(60, 150),
          0x9bb8c5,
          Phaser.Math.FloatBetween(0.012, 0.035),
        )
        .setDepth(6);
    }
  }

  private hitPlayer(damage: number, source: PlayerDamageSourceId): void {
    const time = this.time.now;
    const perfectDodge = this.movement.claimPerfectDodge(time);
    this.run.balance.recordDamageAttempt(source, perfectDodge, this.run.elapsedMs);
    if (perfectDodge) {
      this.weapons.reduceCooldowns(450);
      this.juice.ring(this.player.x, this.player.y, 92, COLORS.pale, 260);
      this.juice.warning('PERFECT DODGE: WEAPONS QUICKEN', '#d9edf4');
      return;
    }
    if (time < this.invulnerableUntil || this.ended) {
      return;
    }
    this.invulnerableUntil = time + 460;
    this.playerVisuals.setTint(COLORS.blood);
    this.time.delayedCall(130, () => {
      if (this.player.active) {
        this.playerVisuals.clearTint();
      }
    });
    this.juice.playerDamage();
    audio.play('hurt');
    if (this.run.takeDamage(damage, source).fatal) {
      this.run.balance.recordDeath(source, this.run.elapsedMs);
      this.endRun(false);
    }
  }

  private handleEnemyDeath(death: EnemyDeath): void {
    this.run.kills += 1;
    this.run.balance.recordEnemyDeath(death.definition.id, death.lifetimeMs);
    this.conditionalUpgrades.onEnemyDeath(death);
    if (death.definition.elite || death.definition.boss) {
      this.run.balance.recordTimeline(`kill:${death.definition.id}`, this.run.elapsedMs);
    }
    const bonusSoul = Math.random() < this.run.stats.soulShardChance ? 1 : 0;
    this.pickups.spawn(death.x, death.y, death.definition.xp, death.definition.soulValue + bonusSoul);
    this.powerups.trySpawn(death.x, death.y, Boolean(death.definition.elite));
    if (death.definition.elite && !death.definition.boss) {
      this.juice.warning('ELITE SOUL YIELDS POWER', '#d98a63');
      this.time.delayedCall(650, () => this.offers.request('standard'));
    }
    if (death.definition.boss) {
      this.time.delayedCall(700, () => this.endRun(true));
    }
  }

  private collectPickup(xp: number, souls: number): void {
    audio.play('pickup');
    this.run.addSouls(souls);
    const levelsGained = this.run.addXp(xp);
    for (let index = 0; index < levelsGained; index += 1) {
      audio.play('level-up');
      this.offers.request('standard');
    }
  }

  private pauseRun(): void {
    if (!this.scene.isActive() || this.scene.isPaused()) {
      return;
    }
    this.scene.pause();
    this.scene.launch('PauseScene', { onAbandon: () => this.abandonRun() });
  }

  private handleUpgradeApplied(upgrade: UpgradeDefinition, result: AppliedRewardResult): void {
    this.handleCurseGain(result.curse, upgrade.curse?.warning);
    if (upgrade.category === 'weapon-evolution' && upgrade.targetWeapon) {
      this.juice.warning(`${WEAPONS[upgrade.targetWeapon].evolution.name.toUpperCase()} AWAKENS`, '#d7bd82');
      return;
    }
    if (upgrade.category === 'weapon') {
      const synergies = this.weapons.getActiveSynergies();
      if (synergies.length > 0) {
        this.juice.warning(`SYNERGY AWAKENS: ${synergies.at(-1)}`, '#69d9ff');
        return;
      }
    }
    if (result.curse) {
      return;
    }
    this.juice.warning('POWER TAKES ROOT', '#a892db');
  }

  private handleCurseGain(result: CurseGainResult | undefined, warning?: string): void {
    if (!result) {
      return;
    }
    const crossed = result.crossedTiers.at(-1);
    if (crossed) {
      this.juice.warning(`${crossed.label.toUpperCase()}: ${crossed.description}`, '#d26468');
      return;
    }
    this.juice.warning(warning ?? `CURSE +${result.amount}`, '#d26468');
  }

  private updateShield(elapsedMs: number): void {
    if (this.run.stats.shieldInterval <= 0) {
      return;
    }
    if (!Number.isFinite(this.nextShieldAt)) {
      this.nextShieldAt = elapsedMs + this.run.stats.shieldInterval;
    }
    if (elapsedMs >= this.nextShieldAt) {
      this.nextShieldAt = elapsedMs + this.run.stats.shieldInterval;
      this.grantShield();
    }
  }

  private grantShield(): void {
    this.run.shield = 20;
    audio.play('shield');
    this.juice.ring(this.player.x, this.player.y, 80, COLORS.pale, 500);
  }

  private endRun(victory: boolean): void {
    if (this.ended) {
      return;
    }
    this.ended = true;
    const summary = this.run.summary(victory);
    if (this.balancePresetId === 'standard') {
      const recorded = recordRunResult(loadSave(), summary);
      summary.newlyUnlockedCharacters = recorded.newlyUnlockedCharacters;
      summary.newlyUnlockedArtifactTiers = recorded.newlyUnlockedArtifactTiers;
      if (!victory) {
        summary.deathEcho = recorded.save.deathEcho;
      }
      if (victory) {
        audio.play('victory');
      }
      writeSave(recorded.save);
    }
    writeLastRunSummary(summary);
    this.scene.stop('UpgradeScene');
    this.scene.stop('PauseScene');
    this.scene.start(victory ? 'VictoryScene' : 'GameOverScene', summary);
  }
}
