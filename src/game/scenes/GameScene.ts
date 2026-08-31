import Phaser from 'phaser';
import { markBrowserFlowScene } from './sceneDiagnostics';
import { ARENA_HEIGHT, ARENA_WIDTH, COLORS } from '../constants';
import { ARTIFACTS, getAvailableArtifacts, rollArtifact } from '../data/artifacts';
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
import { WeaponSystem } from '../systems/WeaponSystem';
import { CompanionSystem } from '../systems/CompanionSystem';
import { ImpactFragmentSystem } from '../systems/ImpactFragmentSystem';
import type {
  AppliedRewardResult,
  ArtifactId,
  BalancePresetId,
  CharacterId,
  CurseGainResult,
  EnemyId,
  EdictId,
  JournalDiscoveryKind,
  PlayerDamageSourceId,
  PowerupId,
  SaveData,
  UpgradeId,
  UpgradeDefinition,
  WeaponId,
} from '../types/gameTypes';
import { audio } from '../systems/AudioSystem';
import { BossAttackSystem } from '../systems/BossAttackSystem';
import { PowerupSystem } from '../systems/PowerupSystem';
import { ArenaShrineSystem } from '../systems/ArenaShrineSystem';
import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';
import { applyBalancePreset, BalancePresetSpawnSystem } from '../systems/BalancePresetSystem';
import { BALANCE_PRESETS } from '../data/balancePresets';
import { DebugControlsSystem } from '../systems/DebugControlsSystem';
import { CHARACTERS } from '../data/characters';
import { FEATURE_FLAGS } from '../config/featureFlags';
import { applyGameplayCameraZoom } from '../config/cameraConfig';
import { PlayerStatusVisualSystem } from '../ui/PlayerStatusVisualSystem';
import { LootRevealSystem } from '../ui/LootRevealSystem';
import { PlayerVisualSystem } from '../systems/PlayerVisualSystem';
import { mutateArtifactReward } from '../systems/CursedRewardMutationSystem';
import { DeathEchoSystem } from '../systems/DeathEchoSystem';
import { ConditionalUpgradeSystem } from '../systems/ConditionalUpgradeSystem';
import { CurseEventSystem } from '../systems/CurseEventSystem';
import { ArtifactEffectSystem } from '../systems/ArtifactEffectSystem';
import { StatusEffectSystem } from '../systems/StatusEffectSystem';
import {
  discoverEnemyJournalEntry,
  discoverJournalEntry as revealJournalEntry,
} from '../systems/JournalDiscoverySystem';
import { loadDevModeSettings, writeDevModeSettings } from '../systems/DevModeSettings';
import { ShopSystem } from '../systems/ShopSystem';
import { selectShopOffers, canAffordBlood } from '../systems/shopRules';
import type { ShopOfferDefinition } from '../data/shop';
import type { ShopPurchaseResult } from './ShopScene';
import { ArenaFloorSystem } from '../systems/ArenaFloorSystem';
import type { GameHudScene } from './GameHudScene';
import { VvfxSystem } from '../vfx/VvfxSystem';
import { GameplayEffectSystem } from '../vfx/GameplayEffectSystem';
import type { GameplayEffectRole } from '../vfx/GameplayEffectRegistry';
import { VISUAL_ASSETS } from '../data/assets';
import { resolveSpriteAssetAttachment } from '../assets/AssetResolver';

const DEV_TOOLS_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';

interface GameSceneData {
  balancePresetId?: BalancePresetId;
  characterId?: CharacterId;
  isNgPlus?: boolean;
  edicts?: EdictId[];
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
  private juice!: JuiceSystem;
  private ended = false;
  private invulnerableUntil = 0;
  private nextShieldAt = Number.POSITIVE_INFINITY;
  private nextBalanceSampleAt = 0;
  private balancePresetId: BalancePresetId = 'standard';
  private presetSpawner?: BalancePresetSpawnSystem;
  private debugControls?: DebugControlsSystem;
  private chests?: ChestSystem;
  private shop?: ShopSystem;
  private shopOffers?: ShopOfferDefinition[];
  private playerStatusVisuals!: PlayerStatusVisualSystem;
  private lootReveal!: LootRevealSystem;
  private playerVisuals!: PlayerVisualSystem;
  private deathEcho?: DeathEchoSystem;
  private conditionalUpgrades!: ConditionalUpgradeSystem;
  private artifactEffects!: ArtifactEffectSystem;
  private statuses!: StatusEffectSystem;
  private curseEvents?: CurseEventSystem;
  private characterId?: CharacterId;
  private isNgPlus = false;
  private edicts: EdictId[] = [];
  private discoverySave!: SaveData;
  private devInvincible = false;
  private companions!: CompanionSystem;
  private impactFragments!: ImpactFragmentSystem;
  private vfx!: VvfxSystem;
  private gameplayEffects!: GameplayEffectSystem;
  private debugGameSpeed = 1;
  private gameplayGuidesEnabled = false;
  private gameplayGuideGraphics?: Phaser.GameObjects.Graphics;
  private gameplayClockMs = 0;

  constructor() {
    super('GameScene');
  }

  init(data: GameSceneData): void {
    this.balancePresetId = data.balancePresetId ?? 'standard';
    this.characterId = data.characterId;
    this.isNgPlus = data.isNgPlus ?? false;
    this.edicts = data.edicts ?? [];
  }

  create(): void {
    markBrowserFlowScene(this, 'gameplay');
    this.ended = false;
    this.presetSpawner = undefined;
    this.chests = undefined;
    this.shop = undefined;
    this.shopOffers = undefined;
    this.deathEcho = undefined;
    this.curseEvents = undefined;
    this.invulnerableUntil = 0;
    this.devInvincible = DEV_TOOLS_ENABLED ? loadDevModeSettings().invincible : false;
    this.nextShieldAt = Number.POSITIVE_INFINITY;
    this.nextBalanceSampleAt = 0;
    this.debugGameSpeed = 1;
    this.gameplayGuidesEnabled = false;
    this.gameplayGuideGraphics = undefined;
    this.time.timeScale = 1;
    this.tweens.timeScale = 1;
    this.physics.world.timeScale = 1;
    this.anims.globalTimeScale = 1;
    this.gameplayClockMs = this.time.now;
    const save = loadSave();
    this.discoverySave = save;
    audio.configure(save.settings);
    audio.startAmbience();
    const resumeListener = () => audio.startAmbience();
    this.events.on(Phaser.Scenes.Events.RESUME, resumeListener);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.events.off(Phaser.Scenes.Events.RESUME, resumeListener);
      this.events.off('elite-summon', eliteSummonListener);
      audio.stopAmbience();
      this.impactFragments?.destroy();
    });
    
    const eliteSummonListener = (x: number, y: number) => {
      const pool: EnemyId[] = ['grave-crawler', 'lost-soul', 'tormented-shade'];
      const activeMinions = this.enemies.countAny(pool);
      if (activeMinions > 12) return; // Cap at 12 active minions globally

      const spawns = Math.min(4, 12 - activeMinions);
      for (let i = 0; i < spawns; i++) {
        const id = pool[Phaser.Math.Between(0, pool.length - 1)]!;
        const offsetX = Phaser.Math.Between(-80, 80);
        const offsetY = Phaser.Math.Between(-80, 80);
        this.enemies.spawn(id, x + offsetX, y + offsetY, this.run.elapsedMs);
      }
    };
    this.events.on('elite-summon', eliteSummonListener);
    this.run = new RunState(
      save,
      this.balancePresetId,
      this.characterId ?? save.selectedCharacter,
      this.isNgPlus,
      this.edicts
    );
    this.discoverJournalEntry('weapons', CHARACTERS[this.run.characterId].starterWeapon);
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
    applyGameplayCameraZoom(this.cameras.main);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);

    this.impactFragments = new ImpactFragmentSystem(this);
    this.juice = new JuiceSystem(this, save.settings.screenShake, save.settings.particles);
    this.vfx = new VvfxSystem(this);
    this.gameplayEffects = new GameplayEffectSystem(this, this.vfx);
    void this.vfx.preload();
    this.lootReveal = new LootRevealSystem(this, this.player, this.juice);
    this.enemies = new EnemySystem(
      this,
      this.player,
      this.juice,
      (damage, source) => this.hitPlayer(damage, source),
      (id, elapsedMs) => {
        this.run.balance.recordEnemySpawn(id, elapsedMs);
        this.discoverEnemy(id);
      },
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
      () => this.run.curse.snapshot(),
      () => this.deathEcho?.profile(),
      () => this.run.edicts,
      (sprite) => this.statuses?.getSpeedMultiplier(sprite) ?? 1,
    );
    this.conditionalUpgrades = new ConditionalUpgradeSystem(this.player, this.run, this.juice);
    this.statuses = new StatusEffectSystem(this, this.enemies, this.run, (id) =>
      this.discoverJournalEntry('debuffs', id),
    );
    this.enemies.onEnemyRemoved = (sprite) => this.statuses.cleanupTarget(sprite);
    this.movement = new PlayerMovementSystem(this, this.player, this.run.stats.current, () => {
      this.run.balance.recordDash();
      audio.play('dash');
      this.juice.ring(this.player.x, this.player.y, 58, COLORS.soul, 180);
      this.conditionalUpgrades.onDash(this.time.now);
      this.artifactEffects.onDash();
    }, () => this.weapons.getMoveSpeedMultiplier());
    this.pickups = new PickupSystem(this, this.player, this.run.stats.current, (xp, souls) =>
      this.collectPickup(xp, souls),
    );
    this.powerups = new PowerupSystem(this, this.player, this.run, this.pickups, this.juice, (id) =>
      this.discoverJournalEntry('buffs', id),
    );
    this.weapons = new WeaponSystem(
      this,
      this.player,
      this.enemies,
      this.run,
      this.juice,
      this.powerups,
      this.conditionalUpgrades,
      this.statuses,
      this.impactFragments,
      this.vfx,
      this.gameplayEffects,
      (sprite, name) => resolveSpriteAssetAttachment(VISUAL_ASSETS, sprite, name),
    );
    this.companions = new CompanionSystem(
      this,
      this.player,
      this.enemies,
      this.run,
      this.juice,
    );
    this.artifactEffects = new ArtifactEffectSystem(this.run, this.juice, {
      reduceWeaponCooldowns: (milliseconds) => this.weapons.reduceCooldowns(milliseconds),
      collectAllPickups: () => this.pickups.vacuumAll(),
      grantPowerup: (id) => this.powerups.grantNow(id),
      spawnPowerup: (x, y) => this.powerups.trySpawn(x, y, true),
      playerPosition: () => ({ x: this.player.x, y: this.player.y }),
    });
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
      () => this.run.edicts
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
    if (this.balancePresetId === 'standard') {
      this.curseEvents = new CurseEventSystem(
        this.enemies,
        () => this.run.curse.snapshot(),
        (text, color) => this.juice.warning(text, color),
        (id, elapsedMs) => this.run.balance.recordTimeline(`curse-event:${id}`, elapsedMs),
      );
    }
    this.shrine = new ArenaShrineSystem(
      this,
      this.player,
      this.juice,
      () => this.run.resources.health > 25,
      () => {
        this.run.balance.recordShrineUse(this.run.elapsedMs);
        this.run.balance.recordDamageAttempt('blood-shrine', false, this.run.elapsedMs);
        this.run.resources.takeDamage(20, 'blood-shrine');
        this.juice.warning('THE SHRINE ACCEPTS YOUR BLOOD', '#b687ed');
        this.offers.request('standard');
      },
    );
    if (this.balancePresetId !== 'standard') {
      applyBalancePreset(this.balancePresetId, this.run, this.enemies, this.player);
      this.presetSpawner = new BalancePresetSpawnSystem(this.balancePresetId, this.enemies);
    }
    if (this.balancePresetId === 'standard' && FEATURE_FLAGS.artifacts && FEATURE_FLAGS.chests) {
      this.chests = new ChestSystem(this, this.player, this.juice, (x, y) => {
        const artifact = rollArtifact(getAvailableArtifacts(save), [...this.run.artifacts.collected]);
        const reward = artifact ? mutateArtifactReward(artifact, this.run.curse.snapshot()) : null;
        const result = reward ? this.run.artifacts.applyReward(reward) : { applied: false };
        if (reward && result.applied) {
          this.discoverJournalEntry('artifacts', reward.id);
          this.run.balance.recordTimeline(`artifact:${reward.id}`, this.run.elapsedMs);
          this.artifactEffects.onArtifactGained(reward.effect);
          this.handleCurseGain(result.curse, reward.curse?.warning);
          audio.play('level-up');
          this.lootReveal.reveal(x, y, {
            texture: reward.iconTexture,
            label: reward.curse ? `${reward.name}  Curse +${reward.curse.curseGain}` : reward.name,
            color: reward.curse ? COLORS.blood : COLORS.gold,
          });
          return;
        }
        this.run.resources.addSouls(20);
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
    if (this.balancePresetId === 'standard' && FEATURE_FLAGS.shop) {
      this.shop = new ShopSystem(this, this.player, this.juice, {
        onSpawn: () => {
          this.shopOffers = undefined;
          this.run.balance.recordTimeline('shop:spawned', this.run.elapsedMs);
          this.juice.warning('THE BLOOD MARKET HAS OPENED NEARBY', '#d78276');
        },
        onOpen: () => this.openShop(),
        onExpire: () => {
          this.shopOffers = undefined;
          this.run.balance.recordTimeline('shop:expired', this.run.elapsedMs);
          this.juice.warning('THE BLOOD MARKET FADES', '#9d7772');
        },
      });
    }
    this.launchHudScene();
    if (this.balancePresetId !== 'standard') {
      this.juice.warning(BALANCE_PRESETS[this.balancePresetId].name, '#d7bd82');
    }
    if (this.balancePresetId === 'standard') {
      this.deathEcho = new DeathEchoSystem(
        this.enemies,
        this.run,
        save.deathEcho,
        (text, color) => this.juice.warning(text, color),
        (id, elapsedMs) => this.run.balance.recordTimeline(id, elapsedMs),
      );
    }
    this.playerStatusVisuals = new PlayerStatusVisualSystem(
      this,
      this.player,
      this.run,
      this.powerups,
      this.movement,
      () => this.weapons.getActiveTalentBuffs(),
    );
    if (this.balancePresetId === 'standard') {
      this.juice.warning('SURVIVE THE LIMBO TRIAL');
      this.time.delayedCall(1800, () => this.juice.warning('MOVE WITH WASD OR ARROW KEYS'));
      this.time.delayedCall(4300, () => this.juice.warning('PRESS SPACE TO DASH THROUGH DANGER'));
    }

    const pauseListener = () => this.pauseRun();
    this.input.keyboard?.on('keydown-ESC', pauseListener);
    
    let devListener: ((event: KeyboardEvent) => void) | undefined;
    if (DEV_TOOLS_ENABLED) {
      this.debugControls = new DebugControlsSystem(
        this,
        this.run,
        this.enemies,
        this.offers,
        this.chests,
        this.powerups,
        {
          grantShield: () => this.grantShield(),
          forceLoss: () => this.forceDebugOutcome(false),
          forceVictory: () => this.forceDebugOutcome(true),
          toggleTelemetry: () => this.toggleDebugOverlay(),
          resetEncounter: () => this.resetDebugEncounter(),
          setGameSpeed: (scale) => this.setDebugGameSpeed(scale),
          triggerNamedEffect: () => this.triggerDebugEffect('beam'),
          toggleGameplayGuides: () => this.toggleGameplayGuides(),
        },
      );
      devListener = (event: KeyboardEvent) => {
        if (
          event.code === 'F12' ||
          event.code === 'Backquote' ||
          event.code === 'IntlBackslash' ||
          event.key === '§' ||
          event.key === '½'
        ) {
          event.preventDefault();
          this.openDevMode();
        }
      };
      this.input.keyboard?.on('keydown', devListener);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.input.keyboard?.off('keydown-ESC', pauseListener);
      if (devListener) {
        this.input.keyboard?.off('keydown', devListener);
      }
      if (this.scene.isActive('GameHudScene') || this.scene.isPaused('GameHudScene')) {
        this.scene.stop('GameHudScene');
      }
      this.anims.globalTimeScale = 1;
      this.juice.destroy();
    });
  }

  update(time: number, delta: number): void {
    if (this.ended) {
      return;
    }
    const gameplayDelta = delta * this.debugGameSpeed;
    this.gameplayClockMs += gameplayDelta;
    this.time.now = this.gameplayClockMs;
    time = this.gameplayClockMs;
    this.run.elapsedMs += gameplayDelta;
    this.movement.update(time);
    this.playerVisuals.update(time);
    if (this.balancePresetId === 'standard') {
      this.spawner.update(this.run.elapsedMs);
      this.runEvents.update(this.run.elapsedMs);
      this.curseEvents?.update(this.run.elapsedMs);
      this.deathEcho?.update(this.run.elapsedMs);
    } else {
      this.presetSpawner?.update(this.run.elapsedMs);
    }
    this.companions.update(time);
    this.enemies.update(time, this.run.elapsedMs);
    this.weapons.update(time);
    this.statuses.update(time);
    this.pickups.update();
    this.powerups.update();
    this.shrine.update();
    this.chests?.update(this.run.elapsedMs);
    this.shop?.update(this.run.elapsedMs);
    this.updateShield(this.run.elapsedMs);
    this.playerStatusVisuals.update(time);
    this.debugControls?.update(time);
    this.drawGameplayGuides();
    if (this.run.elapsedMs >= this.nextBalanceSampleAt) {
      this.nextBalanceSampleAt = this.run.elapsedMs + 1000;
      this.run.balance.samplePressure(
        this.run.elapsedMs,
        this.enemies.count(),
        this.run.resources.health,
        this.run.stats.current.maxHealth,
      );
      this.run.balance.recordThreat(this.run.getThreatSnapshot(), this.run.elapsedMs);
    }
  }

  abandonRun(): void {
    this.endRun(false);
  }

  private launchHudScene(): void {
    if (this.scene.isActive('GameHudScene') || this.scene.isPaused('GameHudScene')) {
      this.scene.stop('GameHudScene');
    }
    this.scene.launch('GameHudScene', {
      run: this.run,
      enemies: this.enemies,
      movement: this.movement,
      weapons: this.weapons,
      chests: this.chests,
      shop: this.shop,
      juice: this.juice,
      getGameplayTime: () => this.gameplayClockMs,
    });
    this.scene.bringToTop('GameHudScene');
  }

  private pauseHudScene(): void {
    if (this.scene.isActive('GameHudScene')) {
      this.scene.pause('GameHudScene');
    }
  }

  private resumeHudScene(): void {
    if (this.scene.isPaused('GameHudScene')) {
      this.scene.resume('GameHudScene');
    }
  }

  private toggleDebugOverlay(): void {
    const hudScene = this.scene.get('GameHudScene') as GameHudScene | undefined;
    hudScene?.toggleDebugOverlay();
  }

  private createArena(): void {
    ArenaFloorSystem.create(this);
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
    if (this.devInvincible) {
      this.run.balance.recordDamageAttempt(source, false, this.run.elapsedMs);
      return;
    }
    const perfectDodge = this.movement.claimPerfectDodge(time);
    this.run.balance.recordDamageAttempt(source, perfectDodge, this.run.elapsedMs);
    if (perfectDodge) {
      this.weapons.reduceCooldowns(450);
      this.artifactEffects.onPerfectDodge();
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
    const result = this.run.resources.takeDamage(damage, source);
    this.artifactEffects.onPlayerDamaged(result);
    if (result.fatal) {
      this.run.balance.recordDeath(source, this.run.elapsedMs);
      this.endRun(false);
    }
  }

  private handleEnemyDeath(death: EnemyDeath): void {
    this.run.kills += 1;
    this.run.balance.recordEnemyDeath(death.definition.id, death.lifetimeMs);
    this.conditionalUpgrades.onEnemyDeath(death);
    this.artifactEffects.onEnemyDeath(death);
    if (death.definition.elite || death.definition.boss) {
      this.run.balance.recordTimeline(`kill:${death.definition.id}`, this.run.elapsedMs);
    }
    const bonusSoul = Math.random() < this.run.stats.current.soulShardChance ? 1 : 0;
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
    this.run.resources.addSouls(souls);
    const levelsGained = this.run.resources.addXp(xp);
    this.artifactEffects.onPickupCollected(xp, souls);
    for (let index = 0; index < levelsGained; index += 1) {
      audio.play('level-up');
      this.offers.request('standard');
    }
  }

  private discoverJournalEntry(kind: JournalDiscoveryKind, id: string): void {
    if (revealJournalEntry(this.discoverySave, kind, id)) {
      writeSave(this.discoverySave);
    }
  }

  private discoverEnemy(id: EnemyId): void {
    if (discoverEnemyJournalEntry(this.discoverySave, id)) {
      writeSave(this.discoverySave);
    }
  }

  private openDevMode(): void {
    if (!DEV_TOOLS_ENABLED || this.scene.isActive('DevModeScene')) {
      return;
    }
    this.pauseHudScene();
    this.scene.pause();
    this.scene.launch('DevModeScene', {
      run: this.run,
      getInvincible: () => this.devInvincible,
      setInvincible: (enabled: boolean) => {
        this.devInvincible = enabled;
        writeDevModeSettings({ invincible: enabled });
        this.juice.warning(
          enabled ? 'DEV MODE: INVINCIBLE' : 'DEV MODE: MORTAL',
          enabled ? '#d8c49b' : '#9fb8c2',
        );
      },
      weapons: (id: WeaponId) => {
        const applied = this.run.weapons.add(id);
        if (applied) {
          this.discoverJournalEntry('weapons', id);
        }
        return applied;
      },
      upgrades: (id: UpgradeId) => {
        const upgrade = UPGRADES[id];
        const result = this.run.upgrades.applyChoice(upgrade);
        if (result.applied) {
          this.handleUpgradeApplied(upgrade, result);
        }
        return result.applied;
      },
      applyArtifact: (id: ArtifactId) => {
        const artifact = ARTIFACTS[id];
        const result = this.run.artifacts.applyReward(artifact);
        if (result.applied) {
          this.discoverJournalEntry('artifacts', id);
          this.artifactEffects.onArtifactGained(artifact.effect);
          this.handleCurseGain(result.curse, artifact.curse?.warning);
        }
        return result.applied;
      },
      grantPowerup: (id: PowerupId) => this.powerups.grantNow(id),
      spawnEnemy: (id: EnemyId) => this.enemies.spawnAroundPlayer(id, this.run.elapsedMs, 420),
      spawnDummy: () => this.enemies.spawnDevTargetDummy(this.run.elapsedMs),
      spawnChest: () => this.chests?.spawnNow(this.run.elapsedMs),
      openShop: () => {
        this.scene.stop('DevModeScene');
        this.scene.resume();
        this.resumeHudScene();
        this.shop?.spawnNow(this.run.elapsedMs);
        this.openShop();
      },
      healFull: () => {
        this.run.resources.health = this.run.stats.current.maxHealth;
      },
      grantShield: () => this.grantShield(),
      getGameSpeed: () => this.debugGameSpeed,
      setGameSpeed: (scale: number) => this.setDebugGameSpeed(scale),
      getGameplayGuides: () => this.gameplayGuidesEnabled,
      toggleGameplayGuides: () => this.toggleGameplayGuides(),
      triggerEffect: (role: GameplayEffectRole) => this.triggerDebugEffect(role),
      resetEncounter: () => this.resetDebugEncounter(),
      forceOutcome: (victory: boolean) => this.forceDebugOutcome(victory),
      resumeGame: () => {
        this.scene.resume();
        this.resumeHudScene();
      },
    });
  }

  private setDebugGameSpeed(scale: number): void {
    const normalized = Phaser.Math.Clamp(scale, 0.25, 4);
    this.debugGameSpeed = normalized;
    this.time.timeScale = normalized;
    this.tweens.timeScale = normalized;
    this.physics.world.timeScale = 1 / normalized;
    this.anims.globalTimeScale = normalized;
    const hudScene = this.scene.get('GameHudScene');
    hudScene.time.timeScale = normalized;
    hudScene.tweens.timeScale = normalized;
    this.juice.warning(`DEV SPEED ${normalized}x`, '#69d9ff');
  }

  private resetDebugEncounter(): void {
    const restartData: GameSceneData = {
      balancePresetId: this.balancePresetId,
      characterId: this.run.characterId,
      isNgPlus: this.isNgPlus,
      edicts: [...this.edicts],
    };
    this.setDebugGameSpeed(1);
    this.scene.stop('DevModeScene');
    this.scene.restart(restartData);
  }

  private forceDebugOutcome(victory: boolean): void {
    this.setDebugGameSpeed(1);
    this.scene.stop('DevModeScene');
    if (this.scene.isPaused()) {
      this.scene.resume();
    }
    this.resumeHudScene();
    this.endRun(victory);
  }

  private triggerDebugEffect(role: GameplayEffectRole): void {
    const target = this.enemies.findNearest(this.player.x, this.player.y, 1_000);
    const fixedEnd = target
      ? undefined
      : { x: this.player.x + 240, y: this.player.y };
    const start = () =>
      resolveSpriteAssetAttachment(VISUAL_ASSETS, this.player, 'weapon-origin') ?? {
        x: this.player.x,
        y: this.player.y,
      };
    const end = () => {
      if (target?.active) {
        return (
          resolveSpriteAssetAttachment(VISUAL_ASSETS, target, 'chain-target') ?? {
            x: target.x,
            y: target.y,
          }
        );
      }
      return fixedEnd;
    };

    if (role === 'initialDischarge' || role === 'beam') {
      this.gameplayEffects.playBeam('tesla-chain', role, {
        start,
        end,
        seed: this.run.elapsedMs,
      });
    } else {
      this.gameplayEffects.playPoint('tesla-chain', role, {
        point: end,
        follow: Boolean(target),
        seed: this.run.elapsedMs,
      });
    }
    audio.play('soul-bolt');
    const point = end();
    if (point) {
      this.juice.ring(point.x, point.y, role === 'finalChain' ? 70 : 42, COLORS.soul, 220);
    }
    this.juice.warning(`TESLA: ${role.toUpperCase()}`, '#69d9ff');
  }

  private toggleGameplayGuides(): void {
    this.gameplayGuidesEnabled = !this.gameplayGuidesEnabled;
    if (!this.gameplayGuidesEnabled) {
      this.gameplayGuideGraphics?.clear().setVisible(false);
    }
    this.juice.warning(
      this.gameplayGuidesEnabled ? 'GAMEPLAY GUIDES ON' : 'GAMEPLAY GUIDES OFF',
      '#69d9ff',
    );
  }

  private drawGameplayGuides(): void {
    if (!this.gameplayGuidesEnabled) {
      return;
    }
    const graphics = this.gameplayGuideGraphics ??= this.add.graphics().setDepth(2_000);
    graphics.clear().setVisible(true);

    const playerBody = this.player.body;
    if (playerBody) {
      graphics.lineStyle(2, 0x7dff97, 0.95);
      graphics.strokeRect(playerBody.x, playerBody.y, playerBody.width, playerBody.height);
    }
    this.drawAttachmentGuides(graphics, this.player);

    this.enemies.forEach((sprite, definition) => {
      graphics.lineStyle(2, definition.boss ? 0xff5f6d : 0xffc857, 0.9);
      graphics.strokeCircle(sprite.x, sprite.y, definition.radius);
      this.drawAttachmentGuides(graphics, sprite);
    });
  }

  private drawAttachmentGuides(
    graphics: Phaser.GameObjects.Graphics,
    sprite: Phaser.GameObjects.Image,
  ): void {
    const attachments = [
      ['weapon-origin', 0x7dff97],
      ['chain-source', 0x69d9ff],
      ['chain-target', 0xff70cf],
    ] as const;
    for (const [name, color] of attachments) {
      const point = resolveSpriteAssetAttachment(VISUAL_ASSETS, sprite, name);
      if (!point) continue;
      graphics.fillStyle(color, 1).fillCircle(point.x, point.y, 4);
    }
  }

  private pauseRun(): void {
    if (!this.scene.isActive() || this.scene.isPaused()) {
      return;
    }
    this.pauseHudScene();
    this.scene.pause();
    this.scene.launch('PauseScene');
  }

  private openShop(): boolean {
    if (
      this.scene.isActive('ShopScene') ||
      this.scene.isActive('UpgradeScene') ||
      this.scene.isActive('PauseScene') ||
      this.scene.isActive('DevModeScene')
    ) {
      return false;
    }
    this.shopOffers ??= selectShopOffers({
      ownedArtifacts: this.run.artifacts.collected,
      equippedWeapons: this.run.weapons.equipped,
      weaponCount: this.run.weapons.equipped.size,
      weaponCap: this.run.weapons.cap,
    });
    this.run.balance.recordTimeline('shop:opened', this.run.elapsedMs);
    this.pauseHudScene();
    this.scene.pause();
    this.scene.launch('ShopScene', {
      offers: [...this.shopOffers],
      health: this.run.resources.health,
      maxHealth: this.run.stats.current.maxHealth,
      onPurchase: (offer: ShopOfferDefinition) => this.purchaseShopOffer(offer),
      onClose: () => {
        this.scene.resume();
        this.resumeHudScene();
      },
    });
    this.scene.bringToTop('ShopScene');
    return true;
  }

  private purchaseShopOffer(offer: ShopOfferDefinition): ShopPurchaseResult {
    if (!this.shopOffers?.some((candidate) => candidate.id === offer.id)) {
      return { success: false, health: this.run.resources.health, message: 'That item has already been sold.' };
    }
    if (!canAffordBlood(this.run.resources.health, offer.healthCost)) {
      return { success: false, health: this.run.resources.health, message: 'The merchant will not take your final drop.' };
    }

    let applied = false;
    if (offer.kind === 'weapon') {
      const upgrade = UPGRADES[offer.rewardId];
      const result = this.run.upgrades.applyChoice(upgrade);
      applied = result.applied;
      if (applied) {
        this.handleUpgradeApplied(upgrade, result);
      }
    } else {
      const artifact = ARTIFACTS[offer.rewardId];
      const result = this.run.artifacts.applyReward(artifact);
      applied = result.applied;
      if (applied) {
        this.discoverJournalEntry('artifacts', artifact.id);
        this.artifactEffects.onArtifactGained(artifact.effect);
      }
    }
    if (!applied) {
      return { success: false, health: this.run.resources.health, message: 'You cannot carry that bargain.' };
    }
    if (!this.run.resources.spendBlood(offer.healthCost)) {
      throw new Error(`Shop purchase ${offer.id} applied without a payable blood cost.`);
    }
    this.shopOffers = this.shopOffers.filter((candidate) => candidate.id !== offer.id);
    this.run.balance.recordTimeline(`shop:purchased:${offer.id}`, this.run.elapsedMs);
    audio.play('level-up');
    return {
      success: true,
      health: this.run.resources.health,
      message: `${offer.name} bought for ${offer.healthCost} HP.`,
    };
  }

  private handleUpgradeApplied(upgrade: UpgradeDefinition, result: AppliedRewardResult): void {
    this.handleCurseGain(result.curse, upgrade.curse?.warning);
    if (upgrade.category === 'weapon-evolution' && upgrade.targetWeapon) {
      this.discoverJournalEntry('evolutions', upgrade.targetWeapon);
      this.juice.warning(`${WEAPONS[upgrade.targetWeapon].evolution.name.toUpperCase()} AWAKENS`, '#d7bd82');
      return;
    }
    if (upgrade.category === 'weapon') {
      if (upgrade.unlockWeapon) {
        this.discoverJournalEntry('weapons', upgrade.unlockWeapon);
      }
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
    if (this.run.stats.current.shieldInterval <= 0) {
      return;
    }
    if (!Number.isFinite(this.nextShieldAt)) {
      this.nextShieldAt = elapsedMs + this.run.stats.current.shieldInterval;
    }
    if (elapsedMs >= this.nextShieldAt) {
      this.nextShieldAt = elapsedMs + this.run.stats.current.shieldInterval;
      this.grantShield();
    }
  }

  private grantShield(): void {
    this.run.resources.shield = 20;
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
      const recorded = recordRunResult(this.discoverySave, summary);
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
    this.scene.stop('UpgradeScene');
    this.scene.stop('PauseScene');
    this.scene.stop('ShopScene');
    this.scene.start(victory ? 'VictoryScene' : 'GameOverScene', summary);
  }
}
