export const WEAPON_CAP = 5;
export const MAX_WEAPON_LEVEL = 7;
export const EVOLUTION_READY_LEVEL = MAX_WEAPON_LEVEL - 1;

export type WeaponId =
  | 'bone-scythe'
  | 'soul-bolt'
  | 'hellfire-sigil'
  | 'grave-lance'
  | 'wailing-shards'
  | 'cinder-reliquary'
  | 'ashen-longbow'
  | 'bloodletter-axe'
  | 'dirge-staff';
export type WeaponBehavior =
  | 'scythe'
  | 'targeted-projectile'
  | 'fan-projectile'
  | 'returning-projectile'
  | 'chain-strike'
  | 'sigil'
  | 'radial-projectile'
  | 'pulse';
export type UpgradeCategory =
  | 'weapon'
  | 'weapon-level'
  | 'weapon-upgrade'
  | 'weapon-evolution'
  | 'stat'
  | 'curse';
export type UpgradeId =
  | 'unlock-soul-bolt'
  | 'unlock-hellfire-sigil'
  | 'unlock-grave-lance'
  | 'unlock-wailing-shards'
  | 'unlock-cinder-reliquary'
  | 'unlock-ashen-longbow'
  | 'unlock-bloodletter-axe'
  | 'unlock-dirge-staff'
  | 'level-bone-scythe'
  | 'level-soul-bolt'
  | 'level-hellfire-sigil'
  | 'level-grave-lance'
  | 'level-wailing-shards'
  | 'level-cinder-reliquary'
  | 'level-ashen-longbow'
  | 'level-bloodletter-axe'
  | 'level-dirge-staff'
  | 'evolve-bone-scythe'
  | 'evolve-soul-bolt'
  | 'evolve-hellfire-sigil'
  | 'evolve-grave-lance'
  | 'evolve-wailing-shards'
  | 'evolve-cinder-reliquary'
  | 'evolve-ashen-longbow'
  | 'evolve-bloodletter-axe'
  | 'evolve-dirge-staff'
  | 'bone-scythe-area'
  | 'bone-scythe-crit'
  | 'soul-bolt-projectiles'
  | 'soul-bolt-pierce'
  | 'soul-bolt-speed'
  | 'hellfire-area'
  | 'hellfire-haste'
  | 'grave-lance-pierce'
  | 'grave-lance-size'
  | 'wailing-shards-count'
  | 'wailing-shards-speed'
  | 'cinder-reliquary-area'
  | 'cinder-reliquary-haste'
  | 'ashen-longbow-volley'
  | 'ashen-longbow-pierce'
  | 'bloodletter-axe-size'
  | 'bloodletter-axe-haste'
  | 'bloodletter-axe-count'
  | 'dirge-staff-targets'
  | 'dirge-staff-haste'
  | 'bone-scythe-committed-reap'
  | 'wailing-shards-fractured-choir'
  | 'cinder-reliquary-funeral-furnace'
  | 'ashen-longbow-full-draw'
  | 'soul-bolt-splintering-memory'
  | 'hellfire-spreading-sentence'
  | 'dirge-staff-echoed-rites'
  | 'stat-vigor'
  | 'stat-movement'
  | 'stat-pickup'
  | 'stat-crit'
  | 'stat-crit-damage'
  | 'stat-dash'
  | 'stat-forbidden-tutelage'
  | 'stat-restless-footwork'
  | 'stat-fugitive-wake'
  | 'stat-bulwark-pyre'
  | 'stat-oathhunter-tithe'
  | 'curse-blood-price'
  | 'curse-fevered-soul'
  | 'curse-hollow-fortune'
  | 'curse-final-covenant'
  | 'curse-echo-mark';

export type EnemyId =
  | 'lost-soul'
  | 'bone-crawler'
  | 'hollow-knight'
  | 'wraith'
  | 'void-caster'
  | 'screamer'
  | 'flayed-wanderer'
  | 'lantern-ghost'
  | 'gravebound-archer'
  | 'veil-stalker'
  | 'condemned-brute'
  | 'sentinel-of-woe'
  | 'plague-crawler'
  | 'ember-imp'
  | 'grave-defiler'
  | 'condemned-husk'
  | 'sinbound-stalker'
  | 'player-echo'
  | 'limbo-warden';
export type EnemyBehavior =
  | 'pursuit'
  | 'wobble'
  | 'brute-charge'
  | 'void-caster'
  | 'screamer'
  | 'archer'
  | 'stalker'
  | 'trail-hazard'
  | 'bomb-thrower'
  | 'death-echo';
export type MetaUpgradeId = 'vital-remnant' | 'cruel-memory' | 'hungry-echo' | 'fateful-thread';
export type BossAttackId =
  | 'shockwave'
  | 'soul-prison'
  | 'grave-chain'
  | 'shattered-judgment'
  | 'cathedral-rupture'
  | 'condemned-star';
export type EnemyAbilityId =
  | 'void-orb'
  | 'scream'
  | 'grave-arrow'
  | 'plague-trail'
  | 'fire-flask'
  | 'echo-bolt'
  | 'echo-rupture'
  | 'echo-charge';
export type PlayerDamageSourceId = EnemyId | EnemyAbilityId | BossAttackId | 'blood-shrine';
export type PowerupId = 'mending-soul' | 'soul-vacuum' | 'grave-frenzy';
export type BalancePresetId =
  | 'standard'
  | 'scythe-evolution'
  | 'projectile-evolution'
  | 'curse-pressure'
  | 'boss-endgame'
  | 'new-weapon-lab'
  | 'crimson-orbit-lab'
  | 'weapon-identity-lab'
  | 'upgrade-effects-lab';
export type UpgradeOfferKind = 'standard' | 'curse';
export type CharacterId = 'haunted' | 'the-penitent' | 'ashwalker';
export type SpecialEffectId = 'extra-weapon-slot' | 'all-weapons-pierce';
export type ArtifactEffectId =
  | 'vital-shield'
  | 'winged-quicken'
  | 'magnet-tithe'
  | 'whetstone-cadence'
  | 'blood-vial-feast'
  | 'buckler-break'
  | 'hallowed-tithe'
  | 'vampiric-elite-heal'
  | 'soul-lantern-vacuum'
  | 'shadow-perfect-dodge'
  | 'lucky-powerup'
  | 'unstable-frenzy'
  | 'spiked-retaliation'
  | 'hourglass-quicken'
  | 'golden-windfall'
  | 'death-gaze-blink'
  | 'giants-last-stand'
  | 'wardens-prize'
  | 'soul-furnace-stoke'
  | 'ascended-choice';
export type TalentPathId =
  | 'haunted-reaper'
  | 'haunted-echo'
  | 'haunted-remnant'
  | 'penitent-burden'
  | 'penitent-atonement'
  | 'penitent-pilgrim'
  | 'ashwalker-ember'
  | 'ashwalker-cinderstep'
  | 'ashwalker-hunger';
export type TalentNodeSlug =
  | 'root'
  | 'left-1'
  | 'right-1'
  | 'notable-1'
  | 'middle'
  | 'choice-a'
  | 'choice-b'
  | 'notable-2'
  | 'deep-left'
  | 'deep-right'
  | 'capstone';
export type TalentNodeId = `${TalentPathId}-${TalentNodeSlug}`;
export type TalentNodeTier = 'minor' | 'notable' | 'choice' | 'capstone';
export type TalentEffectId =
  | 'extra-upgrade-choice'
  | 'extra-reroll'
  | 'extra-weapon-slot'
  | 'all-weapons-pierce'
  | 'starting-shield'
  | 'start-with-curse';
export type WeaponUpgradeEffectId =
  | 'soul-bolt-splintering-memory'
  | 'hellfire-spreading-sentence'
  | 'dirge-staff-echoed-rites';
export type ConditionalUpgradeEffectId =
  | 'restless-footwork'
  | 'fugitive-wake'
  | 'bulwark-pyre'
  | 'oathhunter-tithe'
  | 'echo-mark';

export type CurseTierId = 'unmarked' | 'touched' | 'marked' | 'condemned' | 'forsaken';
export type EnemyTag = 'cursed' | 'hunted' | 'debt' | 'echo';
export type BossCurseTag = 'curse-minions' | 'curse-aura';
export type CurseRewardPattern =
  | 'blood-price'
  | 'hunted'
  | 'greed-mark'
  | 'fragile-power'
  | 'overgrowth-of-sin'
  | 'reliquary-oath';

export interface UpgradeableStats {
  maxHealth: number;
  moveSpeed: number;
  damage: number;
  attackSpeed: number;
  pickupRadius: number;
  dashCooldown: number;
  critChance: number;
  critDamage: number;
  bossDamage: number;
  soulShardChance: number;
  shieldInterval: number;
  soulGain: number;
  xpGain: number;
  threatPowerBonus: number;
}

export interface PlayerStats extends UpgradeableStats {
  dashSpeed: number;
}

export interface CharacterUnlockCondition {
  type: 'default' | 'challenge' | 'milestone' | 'hidden';
  description: string;
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  title: string;
  flavorText: string;
  texture: string;
  starterWeapon: WeaponId;
  baseStatOverrides: Partial<PlayerStats>;
  unlockCondition: CharacterUnlockCondition;
}

export interface CharacterRunStats {
  runs: number;
  victories: number;
  bestSurvivalMs: number;
  kills: number;
}

export interface WeaponStats {
  damage: number;
  cooldownMs: number;
  range: number;
  projectileSpeed: number;
  projectileSize: number;
  projectileCount: number;
  pierce: number;
  area: number;
  targetCount: number;
  critChance: number;
  critDamage: number;
}

export interface WeaponRuntimeState {
  level: number;
  stats: WeaponStats;
}

export interface StatModifier {
  stat: keyof UpgradeableStats;
  mode: 'add' | 'multiply';
  value: number;
}

export interface WeaponModifier {
  stat: keyof WeaponStats;
  mode: 'add' | 'multiply';
  value: number;
}

export interface CurseTierDefinition {
  id: CurseTierId;
  minCurse: number;
  label: string;
  description: string;
  upgradeMutationChance: number;
  artifactMutationChance: number;
  enemyTagsUnlocked: readonly EnemyTag[];
  bossTagsUnlocked: readonly BossCurseTag[];
  eliteSpawnModifier: number;
}

export interface CurseRewardDefinition {
  curseGain: number;
  pattern: CurseRewardPattern;
  downside: string;
  warning?: string;
  requiredTier?: CurseTierId;
}

export interface CurseSnapshot {
  level: number;
  totalGained: number;
  tier: CurseTierId;
  tierLabel: string;
  thresholdsCrossed: CurseTierId[];
  enemyTagsUnlocked: EnemyTag[];
  bossTagsUnlocked: BossCurseTag[];
  canMutateUpgrades: boolean;
  canMutateArtifacts: boolean;
}

export interface CurseGainResult {
  amount: number;
  reason: string;
  previous: CurseSnapshot;
  current: CurseSnapshot;
  crossedTiers: CurseTierDefinition[];
}

export interface AppliedRewardResult {
  applied: boolean;
  curse?: CurseGainResult;
}

export interface UpgradeDefinition {
  id: UpgradeId;
  category: UpgradeCategory;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
  maxStacks: number;
  modifiers?: StatModifier[];
  weaponModifiers?: WeaponModifier[];
  weaponEffect?: WeaponUpgradeEffectId;
  conditionalEffect?: ConditionalUpgradeEffectId;
  requirements?: {
    shieldSource?: boolean;
    minCurse?: number;
  };
  targetWeapon?: WeaponId;
  unlockWeapon?: WeaponId;
  iconTexture: string;
  curse?: CurseRewardDefinition;
}

export type ArtifactId =
  | 'pendant-of-vigor'
  | 'winged-sandals'
  | 'magnet-stone'
  | 'sharpened-stone'
  | 'blood-vial'
  | 'reinforced-buckler'
  | 'hallowed-ash'
  | 'vampiric-fury'
  | 'soul-lantern'
  | 'shadow-cloak'
  | 'lucky-clover'
  | 'unstable-core'
  | 'spiked-collar'
  | 'cursed-hourglass'
  | 'golden-egg'
  | 'death-gaze'
  | 'giants-belt'
  | 'wardens-eye'
  | 'soul-furnace'
  | 'extra-pocket'
  | 'spectral-pass'
  | 'ascended-crown';

export type ArtifactRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type ArtifactPoolTier = 'base' | 'tier-2' | 'tier-3' | 'tier-4' | 'ng-plus';

export interface ArtifactDefinition {
  id: ArtifactId;
  name: string;
  description: string;
  rarity: ArtifactRarity;
  poolTier: ArtifactPoolTier;
  iconTexture: string;
  modifiers?: StatModifier[];
  weaponModifiers?: WeaponModifier[];
  special?: SpecialEffectId;
  effect?: ArtifactEffectId;
  curse?: CurseRewardDefinition;
}

export interface WeaponDefinition {
  id: WeaponId;
  behavior: WeaponBehavior;
  name: string;
  description: string;
  texture: string;
  iconTexture: string;
  baseStats: WeaponStats;
  levelGrowth: WeaponModifier[];
  evolution: {
    name: string;
    description: string;
  };
}

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  texture: string;
  behavior: EnemyBehavior;
  maxHealth: number;
  speed: number;
  contactDamage: number;
  xp: number;
  soulValue: number;
  displaySize: number;
  radius: number;
  elite?: boolean;
  boss?: boolean;
  spawnRequirements?: {
    minCurse?: number;
    requiredCurseTier?: CurseTierId;
    tags?: readonly EnemyTag[];
  };
}

export interface MetaUpgradeDefinition {
  id: MetaUpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  costs: number[];
}

export interface TalentPathDefinition {
  id: TalentPathId;
  characterId: CharacterId;
  name: string;
  description: string;
  color: number;
}

export interface TalentNodeDefinition {
  id: TalentNodeId;
  characterId: CharacterId;
  pathId: TalentPathId;
  tier: TalentNodeTier;
  name: string;
  description: string;
  maxRanks: number;
  pathPointsRequired: number;
  prerequisites: TalentNodeId[];
  choiceGroup?: string;
  modifiers?: StatModifier[];
  weaponModifiers?: WeaponModifier[];
  effect?: TalentEffectId;
  position: { row: number; column: number };
}

export interface CharacterTalentProgress {
  legacySouls: number;
  allocations: Partial<Record<TalentNodeId, number>>;
}

export interface SaveData {
  version: number;
  totalSouls: number;
  spentSouls: number;
  metaLevels: Record<MetaUpgradeId, number>;
  talentProgress: Record<CharacterId, CharacterTalentProgress>;
  bestRunTimeMs: number;
  highestBossDefeated: number;
  totalKills: number;
  totalRuns: number;
  totalDeaths: number;
  totalWardenKills: number;
  totalSoulsEarned: number;
  runsSurvivedTenMinutes: number;
  selectedCharacter: CharacterId;
  unlockedCharacters: CharacterId[];
  characterStats: Record<CharacterId, CharacterRunStats>;
  unlockedArtifactTiers: ArtifactPoolTier[];
  deathEcho?: DeathEchoSnapshot;
  settings: {
    screenShake: boolean;
    particles: boolean;
    masterVolume: number;
    musicVolume: number;
    effectsVolume: number;
  };
}

export interface DeathEchoSnapshot {
  classId: CharacterId;
  survivedSeconds: number;
  level: number;
  mainWeaponId: WeaponId;
  upgradeIds: UpgradeId[];
  artifactIds: ArtifactId[];
  curseLevel: number;
  curseTier: CurseTierId;
  causeOfDeath?: PlayerDamageSourceId;
  kills: number;
  soulsEarned: number;
}

export interface RunSummary {
  victory: boolean;
  elapsedMs: number;
  kills: number;
  souls: number;
  level: number;
  characterId: CharacterId;
  artifacts: ArtifactId[];
  cursedArtifacts: ArtifactId[];
  upgradeIds: UpgradeId[];
  curse: CurseSnapshot;
  deathEcho?: DeathEchoSnapshot;
  newlyUnlockedCharacters: CharacterId[];
  newlyUnlockedArtifactTiers: ArtifactPoolTier[];
  weaponResults: WeaponRunResult[];
  balance: BalanceReport;
}

export interface WeaponRunResult {
  id: WeaponId;
  damage: number;
  kills: number;
  hits: number;
  criticalHits: number;
  bossDamage: number;
  dps: number;
}

export interface IncomingDamageResult {
  source: PlayerDamageSourceId;
  attemptedHits: number;
  landedHits: number;
  avoidedHits: number;
  damage: number;
  absorbed: number;
}

export interface EnemyBalanceResult {
  id: EnemyId;
  spawned: number;
  killed: number;
  averageLifetimeMs: number;
}

export interface UpgradeOfferRecord {
  atMs: number;
  kind: UpgradeOfferKind;
  choices: UpgradeId[];
}

export interface UpgradeChoiceRecord {
  atMs: number;
  kind: UpgradeOfferKind | 'preset';
  id?: UpgradeId;
  outcome: 'selected' | 'rerolled' | 'skipped';
}

export type CursedRewardSourceKind = 'upgrade' | 'artifact';

export interface CursedRewardRecord {
  atMs: number;
  sourceKind: CursedRewardSourceKind;
  sourceId: UpgradeId | ArtifactId;
  baseId: UpgradeId | ArtifactId;
  generated: boolean;
  name: string;
  pattern: CurseRewardPattern;
  curseGain: number;
  downside: string;
  warning?: string;
  curseBefore: number;
  curseAfter: number;
  tierBefore: CurseTierId;
  tierAfter: CurseTierId;
  crossedTiers: CurseTierId[];
}

export interface BalanceTimelineEvent {
  atMs: number;
  id: string;
}

export interface ThreatSnapshot {
  tier: number;
  timeTier: number;
  powerTier: number;
  healthMultiplier: number;
  damageMultiplier: number;
}

export interface ThreatSample extends ThreatSnapshot {
  atMs: number;
}

export interface BalanceMinuteResult {
  minute: number;
  damageDealt: number;
  damageTaken: number;
  healing: number;
  kills: number;
  enemiesSpawned: number;
  levelsGained: number;
  soulsCollected: number;
  choicesMade: number;
  perfectDodges: number;
  peakEnemies: number;
  lowestHealthRatio: number;
}

export interface BalanceReport {
  presetId: BalancePresetId;
  measurementDurationMs: number;
  deathSource?: PlayerDamageSourceId;
  deathAtMs?: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  totalHealing: number;
  dashes: number;
  perfectDodges: number;
  rerolls: number;
  skips: number;
  shrineUses: number;
  weaponResults: WeaponRunResult[];
  incomingDamage: IncomingDamageResult[];
  enemyResults: EnemyBalanceResult[];
  upgradeOffers: UpgradeOfferRecord[];
  upgradeChoices: UpgradeChoiceRecord[];
  cursedRewards: CursedRewardRecord[];
  powerupsSpawned: Record<PowerupId, number>;
  powerupsCollected: Record<PowerupId, number>;
  threatSamples: ThreatSample[];
  timeline: BalanceTimelineEvent[];
  minutes: BalanceMinuteResult[];
}
