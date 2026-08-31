import menuBackground from '../../../assets/sprites/backgrounds/realmainmenubackground.png?url';
import legacyBackground from '../../../assets/sprites/backgrounds/characterselectbackground.png?url';
import artifactCursedHourglass from '../../../assets/test/artifacts/cursed_hourglass.png?url';
import ashwalkerIdle1 from '../../../assets/test/characters/ashwalker.png?url';
import scytheChar from '../../../assets/test/characters/haunted.png?url';
import penitentIdle1 from '../../../assets/test/characters/thepenitent.png?url';
import enemyFlayedWanderer from '../../../assets/test/enemies/flayed_wanderer.png?url';
import enemyGhost from '../../../assets/test/enemies/ghost.png?url';
import enemyCrawler from '../../../assets/test/enemies/grave_crawler.png?url';
import enemyGraveboundArcher from '../../../assets/test/enemies/gravebound_archer.png?url';
import enemyLimboKnight from '../../../assets/test/enemies/limbo_knight.png?url';
import enemyLostSoul from '../../../assets/test/enemies/lost_soul.png?url';
import enemyPlagueCrawler from '../../../assets/test/enemies/plague_crawler.png?url';
import enemyScreamer from '../../../assets/test/enemies/screamer.png?url';
import enemyStalker from '../../../assets/test/enemies/stalker.png?url';
import enemyTormentedShade from '../../../assets/test/enemies/tormented_shade.png?url';
import enemyVoidCaster from '../../../assets/test/enemies/void_caster.png?url';
import enemyWretchedRunt from '../../../assets/test/enemies/wretched_runt.png?url';
import statusBleed from '../../../assets/test/misc/blood_drop.png?url';
import statusBurn from '../../../assets/test/misc/fire.png?url';
import statusSlow from '../../../assets/test/misc/freezing.png?url';
import iconJournal from '../../../assets/test/misc/journal.png?url';
import poisonOoze from '../../../assets/test/misc/ooze.png?url';
import statusPoison from '../../../assets/test/misc/poison.png?url';
import statusSkull from '../../../assets/test/misc/skull.png?url';
import iconStats from '../../../assets/test/misc/stats.png?url';
import pickupXp from '../../../assets/test/misc/xp.png?url';
import projectileCrossbowBolt from '../../../assets/test/projectiles/crossbow_bolt.png?url';
import arenaTile1 from '../../../assets/test/tiles/tile1.png?url';
import arenaTile2 from '../../../assets/test/tiles/tile2.png?url';
import arenaTile3 from '../../../assets/test/tiles/tile3.png?url';
import arenaTile4 from '../../../assets/test/tiles/tile4.png?url';
import arenaTile5 from '../../../assets/test/tiles/tile5.png?url';
import weaponAshenLongbow from '../../../assets/test/weapons/ashen_longbow.png?url';
import weaponBloodletterAxe from '../../../assets/test/weapons/bloodletter_axe.png?url';
import weaponBoneScythe from '../../../assets/test/weapons/bone_scythe.png?url';
import weaponCinderReliquary from '../../../assets/test/weapons/cinder_reliquary.png?url';
import weaponDirgeStaff from '../../../assets/test/weapons/dirge_staff.png?url';
import weaponGraveLance from '../../../assets/test/weapons/grave_lance.png?url';
import weaponHellfireSigil from '../../../assets/test/weapons/hellfire_sigil.png?url';
import weaponSanguineNeedle from '../../../assets/test/weapons/sanguine_needle.png?url';
import weaponSoulBolt from '../../../assets/test/weapons/soul_bolt.png?url';
import weaponSpectralChains from '../../../assets/test/weapons/spectral_chains.png?url';
import weaponGravetideRepeater from '../../../assets/test/weapons/gravetide_repeater.png?url';
import weaponWailingShards from '../../../assets/test/weapons/wailing_shard.png?url';
import weaponGravecleaver from '../../../assets/test/weapons/sword1.png?url';
import shopBuilding from '../../../assets/test/buildings/shop.png?url';
import { getFileAssetPreloads } from '../assets/AssetResolver';
import type {
  AssetAttachmentPoint,
  AssetCategory,
  AssetCollisionFootprint,
  AssetManifest,
  AssetPoint,
  AssetProductionSpec,
  AssetProvenance,
  AssetRuntimeDisplay,
  AudioAssetDefinition,
  AudioCue,
  FileAssetSource,
  PrimitiveAssetFallback,
  VisualAssetDefinition,
  VisualAssetFallback,
} from '../assets/assetTypes';

const CENTER: AssetPoint = { x: 0.5, y: 0.5 };
const ICON_ATTACHMENTS: readonly AssetAttachmentPoint[] = [{ name: 'center', ...CENTER }];
const ENTITY_ATTACHMENTS: readonly AssetAttachmentPoint[] = [
  { name: 'center', x: 0.5, y: 0.5 },
  { name: 'head', x: 0.5, y: 0.2 },
  { name: 'hand-left', x: 0.28, y: 0.48 },
  { name: 'hand-right', x: 0.72, y: 0.48 },
  { name: 'feet', x: 0.5, y: 0.92 },
  { name: 'hit-center', x: 0.5, y: 0.5 },
  { name: 'weapon-origin', x: 0.72, y: 0.48 },
  { name: 'chain-source', x: 0.58, y: 0.42 },
  { name: 'chain-target', x: 0.5, y: 0.42 },
];
const PROJECTILE_ATTACHMENTS: readonly AssetAttachmentPoint[] = [
  { name: 'center', x: 0.5, y: 0.5 },
  { name: 'tail', x: 0.1, y: 0.5 },
  { name: 'tip', x: 0.9, y: 0.5 },
  { name: 'weapon-origin', x: 0.1, y: 0.5 },
  { name: 'chain-source', x: 0.9, y: 0.5 },
  { name: 'chain-target', x: 0.5, y: 0.5 },
];
const ENVIRONMENT_ATTACHMENTS: readonly AssetAttachmentPoint[] = [
  { name: 'center', x: 0.5, y: 0.5 },
  { name: 'base', x: 0.5, y: 0.92 },
];

interface VisualAssetInput {
  id: string;
  category: AssetCategory;
  intendedGameplayUse: string;
  width: number;
  height: number;
  source?: { filePath: string; url: string };
  frameWidth?: number;
  frameHeight?: number;
  frameCount?: number;
  animation?: VisualAssetDefinition['animation'];
  origin?: AssetPoint;
  worldScale?: number;
  expectedDepth?: number;
  mirroring?: VisualAssetDefinition['mirroring'];
  tinting?: VisualAssetDefinition['tinting'];
  collision?: AssetCollisionFootprint;
  attachments?: readonly AssetAttachmentPoint[];
  requiredAttachments?: readonly string[];
  required: boolean;
  developmentFallback: VisualAssetFallback;
  provenance: AssetProvenance;
  production?: AssetProductionSpec;
}

function defaultDepth(category: AssetCategory): number {
  if (category === 'background') return -100;
  if (category === 'tile') return -30;
  if (category === 'environment' || category === 'building') return 8;
  if (category === 'character') return 35;
  if (category === 'enemy' || category === 'boss') return 20;
  if (category === 'weapon' || category === 'projectile') return 30;
  return 100;
}

function defaultAttachments(category: AssetCategory): readonly AssetAttachmentPoint[] {
  if (category === 'character' || category === 'enemy' || category === 'boss') return ENTITY_ATTACHMENTS;
  if (category === 'weapon' || category === 'projectile') return PROJECTILE_ATTACHMENTS;
  if (category === 'environment' || category === 'building') return ENVIRONMENT_ATTACHMENTS;
  return ICON_ATTACHMENTS;
}

function primitive(
  shape: PrimitiveAssetFallback['shape'],
  fillColor: number,
  strokeColor: number,
  label: string,
): PrimitiveAssetFallback {
  return { kind: 'primitive', shape, fillColor, strokeColor, label };
}

function createVisualAsset(input: VisualAssetInput): VisualAssetDefinition {
  const frameWidth = input.frameWidth ?? input.width;
  const frameHeight = input.frameHeight ?? input.height;
  return {
    id: input.id,
    source: input.source ? { kind: 'file', ...input.source } : undefined,
    category: input.category,
    intendedGameplayUse: input.intendedGameplayUse,
    expectedWidth: input.width,
    expectedHeight: input.height,
    frameWidth,
    frameHeight,
    frameCount: input.frameCount ?? 1,
    animation: input.animation,
    origin: input.origin ?? CENTER,
    worldScale: input.worldScale ?? 1,
    runtimeDisplays: [],
    expectedDepth: input.expectedDepth ?? defaultDepth(input.category),
    mirroring: input.mirroring
      ?? (['character', 'enemy', 'boss', 'weapon', 'projectile'].includes(input.category)
        ? 'horizontal'
        : 'none'),
    tinting: input.tinting ?? (input.category === 'background' ? 'none' : 'allowed'),
    collision: input.collision,
    attachments: input.attachments ?? defaultAttachments(input.category),
    requiredAttachments: input.requiredAttachments
      ?? (['character', 'enemy', 'boss'].includes(input.category)
        ? ['center', 'hit-center', 'weapon-origin', 'chain-source', 'chain-target']
        : ['center']),
    required: input.required,
    developmentFallback: input.developmentFallback,
    provenance: input.provenance,
    production: input.production,
  };
}

interface FileAssetOptions {
  worldScale?: number;
  collision?: AssetCollisionFootprint;
  provenance?: AssetProvenance;
  fallback?: PrimitiveAssetFallback;
  production?: AssetProductionSpec;
}

function fileAsset(
  id: string,
  url: string,
  filePath: string,
  category: AssetCategory,
  intendedGameplayUse: string,
  width: number,
  height: number,
  options: FileAssetOptions = {},
): VisualAssetDefinition {
  return createVisualAsset({
    id,
    source: { url, filePath },
    category,
    intendedGameplayUse,
    width,
    height,
    worldScale: options.worldScale,
    collision: options.collision,
    required: true,
    developmentFallback: options.fallback ?? primitive('diamond', 0x6b7280, 0xe5e7eb, id),
    provenance: options.provenance ?? 'owner-created',
    production: options.production
      ?? (filePath.startsWith('assets/test/')
        ? productionSpec(id, category, 800, 'presentation-polish')
        : undefined),
  });
}

function productionTargetFile(id: string, category: AssetCategory): string {
  if (id.startsWith('icon-weapon-')) return `assets/production/icons/weapons/${id.slice(12)}.png`;
  if (id.startsWith('icon-artifact-')) return `assets/production/icons/artifacts/${id.slice(14)}.png`;
  if (id.startsWith('icon-powerup-')) return `assets/production/icons/powerups/${id.slice(13)}.png`;
  if (category === 'character') return `assets/production/characters/${id}.png`;
  if (category === 'enemy' || category === 'boss') return `assets/production/enemies/${id}.png`;
  if (category === 'weapon') return `assets/production/weapons/${id}.png`;
  if (category === 'projectile') return `assets/production/projectiles/${id}.png`;
  if (category === 'environment') return `assets/production/environment/${id}.png`;
  if (category === 'building') return `assets/production/buildings/${id}.png`;
  if (category === 'pickup') return `assets/production/pickups/${id}.png`;
  if (category === 'tile') return `assets/production/tiles/${id}.png`;
  if (category === 'artifact') return `assets/production/icons/artifacts/${id}.png`;
  if (category === 'status') return `assets/production/icons/status/${id}.png`;
  if (category === 'background') return `assets/production/backgrounds/${id}.png`;
  return `assets/production/icons/ui/${id}.png`;
}

function productionSpec(
  id: string,
  category: AssetCategory,
  order: number,
  tierOverride?: AssetProductionSpec['tier'],
  canvasWidth = 128,
): AssetProductionSpec {
  const isSemanticIcon = id.startsWith('icon-weapon-')
    || id.startsWith('icon-artifact-')
    || id.startsWith('icon-powerup-');
  const isEntity = category === 'character' || category === 'enemy' || category === 'boss';
  const isAttack = category === 'weapon' || category === 'projectile';
  const tier = tierOverride
    ?? (!isSemanticIcon && (isEntity || isAttack) ? 'minimum-playable' : 'presentation-polish');
  const runtimePresentation = isSemanticIcon
    ? ['UI selection, rarity, disabled, tint, and optional glow states remain runtime concerns; they are not baked into this file.']
    : isEntity
    ? ['Already runtime-driven where gameplay invokes it: hit flash, curse/status tinting, and effect attachments. Optional outline, shadow, glow, recoil, hover, spawn, and death helpers exist but are not applied automatically.']
    : isAttack
      ? ['Effect-specific runtime code owns configured glow, trails, impacts, recoil, and VVFX attachments; inspect this ID in Content Lab because coverage is intentionally opt-in.']
      : ['Selection outlines, glow, and tint states are available as opt-in runtime presentation and are not baked into this file.'];
  const templateFilePath = isSemanticIcon
    ? 'assets/templates/icon-128x128-template.svg'
    : category === 'boss'
    ? 'assets/templates/boss-256x256-template.svg'
    : isEntity
      ? canvasWidth === 192
        ? 'assets/templates/entity-192x192-template.svg'
        : 'assets/templates/entity-128x128-template.svg'
      : category === 'projectile'
        ? 'assets/templates/projectile-128x64-template.svg'
        : 'assets/templates/icon-128x128-template.svg';
  return {
    tier,
    order,
    targetFilePath: productionTargetFile(id, category),
    transparency: category === 'background' ? 'opaque' : 'required',
    orientation: !isSemanticIcon && (isEntity || isAttack) ? 'right-facing' : 'not-directional',
    runtimePresentation,
    templateFilePath,
  };
}

function placeholderAsset(
  id: string,
  category: AssetCategory,
  intendedGameplayUse: string,
  fallback: PrimitiveAssetFallback,
  options: {
    width?: number;
    height?: number;
    worldScale?: number;
    collision?: AssetCollisionFootprint;
    productionOrder?: number;
    productionTier?: AssetProductionSpec['tier'];
    /** Add an explicit imported file here when the owner delivers this production task. */
    source?: { filePath: string; url: string };
    provenance?: AssetProvenance;
    required?: boolean;
  } = {},
): VisualAssetDefinition {
  return createVisualAsset({
    id,
    source: options.source,
    category,
    intendedGameplayUse,
    width: options.width ?? 128,
    height: options.height ?? 128,
    worldScale: options.worldScale,
    collision: options.collision,
    required: options.required ?? Boolean(options.source),
    developmentFallback: fallback,
    provenance: options.provenance ?? (options.source ? 'owner-created' : 'procedural-placeholder'),
    production: productionSpec(
      id,
      category,
      options.productionOrder ?? 100,
      options.productionTier,
      options.width ?? 128,
    ),
  });
}

function aliasAsset(
  id: string,
  category: AssetCategory,
  intendedGameplayUse: string,
  fallbackAssetId: string,
  order = 100,
): VisualAssetDefinition {
  return createVisualAsset({
    id,
    category,
    intendedGameplayUse,
    width: 128,
    height: 128,
    required: false,
    developmentFallback: { kind: 'asset', assetId: fallbackAssetId },
    provenance: 'procedural-placeholder',
    production: productionSpec(id, category, order),
  });
}

const FILE_ASSETS: readonly VisualAssetDefinition[] = [
  fileAsset('menu-background', menuBackground, 'assets/sprites/backgrounds/realmainmenubackground.png', 'background', 'Main menu backdrop', 1536, 1024, { provenance: 'owner-supplied-legacy' }),
  fileAsset('legacy-background', legacyBackground, 'assets/sprites/backgrounds/characterselectbackground.png', 'background', 'Character-select backdrop', 1024, 1024, { provenance: 'owner-supplied-legacy' }),
  fileAsset('player-haunted', scytheChar, 'assets/test/characters/haunted.png', 'character', 'Haunted player body', 128, 200, { worldScale: 0.58, collision: { shape: 'circle', radius: 30 } }),
  fileAsset('player-penitent', penitentIdle1, 'assets/test/characters/thepenitent.png', 'character', 'Penitent player body', 150, 128, { worldScale: 0.58, collision: { shape: 'circle', radius: 30 } }),
  fileAsset('player-ashwalker', ashwalkerIdle1, 'assets/test/characters/ashwalker.png', 'character', 'Ashwalker player body', 128, 150, { worldScale: 0.58, collision: { shape: 'circle', radius: 30 } }),
  fileAsset('enemy-lost-soul', enemyLostSoul, 'assets/test/enemies/lost_soul.png', 'enemy', 'Lost Soul combat body', 128, 128, { worldScale: 0.45, collision: { shape: 'circle', radius: 19 } }),
  fileAsset('enemy-crawler', enemyCrawler, 'assets/test/enemies/grave_crawler.png', 'enemy', 'Grave Crawler combat body', 128, 128, { worldScale: 0.39, collision: { shape: 'circle', radius: 16 } }),
  fileAsset('enemy-limbo-knight', enemyLimboKnight, 'assets/test/enemies/limbo_knight.png', 'enemy', 'Limbo Knight combat body', 128, 128, { worldScale: 0.91, collision: { shape: 'circle', radius: 38 } }),
  fileAsset('enemy-plague-crawler', enemyPlagueCrawler, 'assets/test/enemies/plague_crawler.png', 'enemy', 'Plague Crawler combat body', 128, 128, { worldScale: 0.61, collision: { shape: 'circle', radius: 26 } }),
  fileAsset('enemy-tormented-shade', enemyTormentedShade, 'assets/test/enemies/tormented_shade.png', 'enemy', 'Tormented Shade combat body', 128, 128, { worldScale: 0.65, collision: { shape: 'circle', radius: 26 } }),
  fileAsset('enemy-screamer', enemyScreamer, 'assets/test/enemies/screamer.png', 'enemy', 'Screamer combat body', 128, 128, { worldScale: 0.64, collision: { shape: 'circle', radius: 25 } }),
  fileAsset('enemy-wretched-runt', enemyWretchedRunt, 'assets/test/enemies/wretched_runt.png', 'enemy', 'Wretched Runt combat body', 128, 128, { worldScale: 0.42, collision: { shape: 'circle', radius: 18 } }),
  fileAsset('enemy-stalker', enemyStalker, 'assets/test/enemies/stalker.png', 'enemy', 'Veil/Sinbound Stalker combat body', 128, 150, { worldScale: 0.84, collision: { shape: 'circle', radius: 33 } }),
  fileAsset('enemy-flayed-wanderer', enemyFlayedWanderer, 'assets/test/enemies/flayed_wanderer.png', 'enemy', 'Flayed Wanderer combat body', 128, 128, { worldScale: 0.52, collision: { shape: 'circle', radius: 21 } }),
  fileAsset('enemy-lantern-ghost', enemyGhost, 'assets/test/enemies/ghost.png', 'enemy', 'Lantern Ghost and summoner combat body', 128, 128, { worldScale: 0.61, collision: { shape: 'circle', radius: 24 } }),
  fileAsset('enemy-gravebound-archer', enemyGraveboundArcher, 'assets/test/enemies/gravebound_archer.png', 'enemy', 'Gravebound Archer combat body', 128, 128, { worldScale: 0.59, collision: { shape: 'circle', radius: 23 } }),
  fileAsset('enemy-void-caster', enemyVoidCaster, 'assets/test/enemies/void_caster.png', 'enemy', 'Void Caster and Void Archon combat body', 128, 150, { worldScale: 0.56, collision: { shape: 'circle', radius: 22 } }),
  fileAsset('artifact-cursed-hourglass', artifactCursedHourglass, 'assets/test/artifacts/cursed_hourglass.png', 'artifact', 'Cursed Hourglass selection icon', 128, 128),
  fileAsset('pickup-xp', pickupXp, 'assets/test/misc/xp.png', 'pickup', 'Experience pickup', 128, 128),
  fileAsset('status-bleed', statusBleed, 'assets/test/misc/blood_drop.png', 'status', 'Bleed status icon', 128, 128),
  fileAsset('status-poison', statusPoison, 'assets/test/misc/poison.png', 'status', 'Poison status icon', 128, 128),
  fileAsset('status-skull', statusSkull, 'assets/test/misc/skull.png', 'status', 'Death/curse status icon', 128, 128),
  fileAsset('status-burn', statusBurn, 'assets/test/misc/fire.png', 'status', 'Burn status icon', 128, 128),
  fileAsset('status-slow', statusSlow, 'assets/test/misc/freezing.png', 'status', 'Slow status icon', 128, 128),
  fileAsset('projectile-crossbow-bolt', projectileCrossbowBolt, 'assets/test/projectiles/crossbow_bolt.png', 'projectile', 'Gravetide Repeater bolt', 128, 128),
  fileAsset('poison-ooze', poisonOoze, 'assets/test/misc/ooze.png', 'environment', 'Poison pool decal', 128, 128),
  fileAsset('icon-journal', iconJournal, 'assets/test/misc/journal.png', 'ui', 'Journal navigation icon', 128, 128),
  fileAsset('icon-stats', iconStats, 'assets/test/misc/stats.png', 'ui', 'Run statistics icon', 128, 128),
  fileAsset('weapon-bone-scythe', weaponBoneScythe, 'assets/test/weapons/bone_scythe.png', 'weapon', 'Bone Scythe body and icon', 128, 128),
  fileAsset('weapon-soul-bolt', weaponSoulBolt, 'assets/test/weapons/soul_bolt.png', 'weapon', 'Soul Bolt projectile and icon', 128, 128),
  fileAsset('weapon-hellfire-sigil', weaponHellfireSigil, 'assets/test/weapons/hellfire_sigil.png', 'weapon', 'Hellfire Sigil and icon', 128, 128),
  fileAsset('weapon-grave-lance', weaponGraveLance, 'assets/test/weapons/grave_lance.png', 'weapon', 'Grave Lance projectile and icon', 128, 128),
  fileAsset('weapon-wailing-shards', weaponWailingShards, 'assets/test/weapons/wailing_shard.png', 'weapon', 'Wailing Shards projectile and icon', 128, 128),
  fileAsset('weapon-cinder-reliquary', weaponCinderReliquary, 'assets/test/weapons/cinder_reliquary.png', 'weapon', 'Cinder Reliquary pulse and icon', 128, 128),
  fileAsset('weapon-ashen-longbow', weaponAshenLongbow, 'assets/test/weapons/ashen_longbow.png', 'weapon', 'Ashen Longbow icon', 128, 128),
  fileAsset('weapon-bloodletter-axe', weaponBloodletterAxe, 'assets/test/weapons/bloodletter_axe.png', 'weapon', 'Bloodletter Axe projectile and icon', 128, 128),
  fileAsset('weapon-dirge-staff', weaponDirgeStaff, 'assets/test/weapons/dirge_staff.png', 'weapon', 'Dirge Staff icon', 128, 128),
  fileAsset('weapon-sanguine-needle', weaponSanguineNeedle, 'assets/test/weapons/sanguine_needle.png', 'weapon', 'Sanguine Needle projectile and icon', 128, 128),
  fileAsset('weapon-spectral-chains', weaponSpectralChains, 'assets/test/weapons/spectral_chains.png', 'weapon', 'Spectral Chains attack and icon', 128, 128),
  fileAsset('weapon-gravetide-repeater', weaponGravetideRepeater, 'assets/test/weapons/gravetide_repeater.png', 'weapon', 'Gravetide Repeater icon', 128, 128),
  fileAsset('weapon-gravecleaver', weaponGravecleaver, 'assets/test/weapons/sword1.png', 'weapon', 'Gravecleaver body and icon', 128, 128),
  fileAsset('shop-building', shopBuilding, 'assets/test/buildings/shop.png', 'building', 'Wandering market building', 128, 128),
  fileAsset('arena-tile-1', arenaTile1, 'assets/test/tiles/tile1.png', 'tile', 'Arena floor tile variant one', 128, 128),
  fileAsset('arena-tile-2', arenaTile2, 'assets/test/tiles/tile2.png', 'tile', 'Arena floor tile variant two', 128, 128),
  fileAsset('arena-tile-3', arenaTile3, 'assets/test/tiles/tile3.png', 'tile', 'Arena floor tile variant three', 128, 128),
  fileAsset('arena-tile-4', arenaTile4, 'assets/test/tiles/tile4.png', 'tile', 'Arena floor tile variant four', 128, 128),
  fileAsset('arena-tile-5', arenaTile5, 'assets/test/tiles/tile5.png', 'tile', 'Arena floor tile variant five', 128, 128),
];

const PLACEHOLDER_ASSETS: readonly VisualAssetDefinition[] = [
  aliasAsset('weapon-poison-flask', 'weapon', 'Poison Flask body and icon', 'status-poison'),
  aliasAsset('weapon-tesla-coil', 'weapon', 'Tesla Coil icon', 'weapon-dirge-staff'),
  placeholderAsset('soul', 'pickup', 'Soul currency pickup', primitive('ring', 0x69d9ff, 0xdaf7ff, 'SOUL'), { width: 32, height: 32 }),
  placeholderAsset('enemy-brute', 'enemy', 'Condemned Brute combat body', primitive('square', 0x6e3030, 0xe06a58, 'BRUTE'), { width: 192, height: 192, worldScale: 128 / 192, collision: { shape: 'circle', radius: 42 }, productionOrder: 3 }),
  placeholderAsset('enemy-sentinel', 'enemy', 'Sentinel of Woe combat body', primitive('diamond', 0x5f4a72, 0xbda0df, 'SENTINEL'), { width: 192, height: 192, worldScale: 138 / 192, collision: { shape: 'circle', radius: 45 }, productionOrder: 4 }),
  placeholderAsset('enemy-ember-imp', 'enemy', 'Ember Imp combat body', primitive('triangle', 0x8d341f, 0xf07b35, 'IMP'), { width: 128, height: 128, worldScale: 56 / 128, collision: { shape: 'circle', radius: 18 }, productionOrder: 5 }),
  placeholderAsset('enemy-archer', 'enemy', 'Grave Defiler combat body', primitive('triangle', 0x3e5962, 0x9ac2cf, 'ARCHER'), { collision: { shape: 'circle', radius: 20 }, productionOrder: 6 }),
  placeholderAsset('boss-warden', 'boss', 'Limbo Warden boss body', primitive('ring', 0x331622, 0xc7a76a, 'WARDEN'), { width: 256, height: 256, worldScale: 180 / 256, collision: { shape: 'circle', radius: 56 }, productionOrder: 1 }),
  placeholderAsset('boss-crown', 'artifact', 'Boss crown/reward icon', primitive('triangle', 0x765b22, 0xffda75, 'CROWN')),
  placeholderAsset('boss-key', 'artifact', 'Reliquary key/reward icon', primitive('diamond', 0x7a6734, 0xf4dc8f, 'KEY')),
  placeholderAsset('icon-book', 'ui', 'Book and ledger icon fallback', primitive('square', 0x4b302c, 0xd9b38c, 'BOOK')),
  placeholderAsset('icon-boots', 'ui', 'Movement artifact icon fallback', primitive('triangle', 0x39454f, 0xaec6d5, 'BOOTS')),
  placeholderAsset('icon-bow', 'ui', 'Ranged weapon/pass icon fallback', primitive('ring', 0x4c3a26, 0xcfaa72, 'BOW')),
  placeholderAsset('icon-chest', 'ui', 'Chest/defense icon fallback', primitive('square', 0x55442a, 0xc7a76a, 'CHEST')),
  placeholderAsset('icon-ring', 'ui', 'Ring artifact icon fallback', primitive('ring', 0x4b3f65, 0xcab7ef, 'RING')),
  placeholderAsset('icon-staff', 'ui', 'Magic weapon/artifact icon fallback', primitive('diamond', 0x3b3262, 0x9d72ff, 'STAFF')),
  placeholderAsset('icon-sword', 'ui', 'Melee weapon/artifact icon fallback', primitive('diamond', 0x4b555c, 0xcbdde5, 'SWORD')),
  placeholderAsset('icon-void-sword', 'ui', 'Void/offense artifact icon fallback', primitive('diamond', 0x30204f, 0x9d72ff, 'VOID')),
  placeholderAsset('projectile-laser', 'projectile', 'Fast linear projectile fallback', primitive('diamond', 0x66d3ed, 0xe8fbff, 'BOLT'), { width: 64, height: 32, productionOrder: 7 }),
  placeholderAsset('projectile-magic', 'projectile', 'Magic projectile fallback', primitive('circle', 0x724cb7, 0xd7c6ff, 'MAGIC'), { width: 48, height: 48, productionOrder: 8 }),
  placeholderAsset('projectile-orb', 'projectile', 'Explosive orb projectile fallback', primitive('ring', 0x923a42, 0xffa0a8, 'ORB'), { width: 48, height: 48, productionOrder: 9 }),
  placeholderAsset('projectile-void', 'projectile', 'Void projectile fallback', primitive('circle', 0x2b164f, 0xa67cff, 'VOID'), { width: 48, height: 48, productionOrder: 10 }),
  placeholderAsset('weapon-bellringer-mace', 'weapon', 'Meteor Hammer and bell mace body', primitive('circle', 0x5c4a37, 0xd7bd86, 'MACE'), { productionOrder: 11 }),
  placeholderAsset('reliquary-chest', 'environment', 'Reward reliquary chest', primitive('square', 0x594326, 0xe2bb70, 'RELIC'), { worldScale: 68 / 128, collision: { shape: 'circle', radius: 30 }, productionOrder: 2, productionTier: 'minimum-playable' }),
  placeholderAsset('prop-cage', 'environment', 'Arena cage and spike-trap fallback', primitive('square', 0x3d454a, 0x95a4ac, 'CAGE')),
  placeholderAsset('prop-skeleton', 'environment', 'Arena skeleton dressing', primitive('diamond', 0x77756b, 0xd7d3bd, 'BONES')),
  placeholderAsset('prop-brazier', 'environment', 'Arena brazier dressing', primitive('triangle', 0x7d331e, 0xf07b35, 'FIRE')),
  placeholderAsset('prop-lantern', 'environment', 'Arena lantern dressing', primitive('ring', 0x6c5323, 0xffd77a, 'LAMP')),
  placeholderAsset('prop-rubble', 'environment', 'Arena rubble dressing', primitive('diamond', 0x454b4d, 0x81898c, 'ROCK')),
  placeholderAsset('prop-altar', 'environment', 'Arena sacrifice shrine', primitive('ring', 0x38224d, 0xb99be8, 'ALTAR')),
];

const WEAPON_ICON_FALLBACKS = [
  ['bone-scythe', 'weapon-bone-scythe'], ['soul-bolt', 'weapon-soul-bolt'],
  ['hellfire-sigil', 'weapon-hellfire-sigil'], ['grave-lance', 'weapon-grave-lance'],
  ['wailing-shards', 'weapon-wailing-shards'], ['cinder-reliquary', 'weapon-cinder-reliquary'],
  ['ashen-longbow', 'weapon-ashen-longbow'], ['bloodletter-axe', 'weapon-bloodletter-axe'],
  ['dirge-staff', 'weapon-dirge-staff'], ['poison-flask', 'weapon-poison-flask'],
  ['sanguine-needle', 'weapon-sanguine-needle'], ['spectral-chains', 'weapon-spectral-chains'],
  ['gravetide-repeater', 'weapon-gravetide-repeater'], ['saintbreaker-pike', 'icon-sword'],
  ['ashen-orbit', 'icon-void-sword'], ['choir-of-teeth', 'icon-chest'],
  ['eclipse-brand', 'icon-staff'], ['rustbound-dagger', 'icon-sword'],
  ['pilgrims-sling', 'icon-staff'], ['grave-spark', 'icon-staff'],
  ['bonefan', 'icon-void-sword'], ['candlebrand', 'icon-staff'],
  ['bellringer-mace', 'icon-chest'], ['crowfeather-arbalest', 'icon-bow'],
  ['gravecleaver', 'weapon-gravecleaver'], ['frozen-orb', 'status-slow'],
  ['meteor-hammer', 'status-burn'], ['exploding-revolver', 'weapon-sanguine-needle'],
  ['infernal-blunderbuss', 'status-burn'], ['spike-trap', 'status-bleed'],
  ['pouch-of-chaos', 'status-slow'], ['tesla-coil', 'weapon-tesla-coil'],
] as const;

const ARTIFACT_ICON_FALLBACKS = [
  ['pendant-of-vigor', 'icon-chest'], ['winged-sandals', 'icon-boots'],
  ['magnet-stone', 'icon-void-sword'], ['sharpened-stone', 'icon-sword'],
  ['blood-vial', 'icon-void-sword'], ['reinforced-buckler', 'icon-chest'],
  ['hallowed-ash', 'icon-staff'], ['vampiric-fury', 'icon-sword'],
  ['soul-lantern', 'icon-staff'], ['shadow-cloak', 'icon-boots'],
  ['lucky-clover', 'icon-sword'], ['unstable-core', 'icon-void-sword'],
  ['spiked-collar', 'icon-chest'], ['cursed-hourglass', 'artifact-cursed-hourglass'],
  ['golden-egg', 'icon-staff'], ['death-gaze', 'icon-sword'],
  ['giants-belt', 'icon-chest'], ['wardens-eye', 'icon-void-sword'],
  ['soul-furnace', 'icon-staff'], ['extra-pocket', 'icon-chest'],
  ['spectral-pass', 'icon-bow'], ['ascended-crown', 'icon-staff'],
  ['red-ledger', 'status-bleed'], ['heart-of-the-market', 'status-bleed'],
  ['crown-of-the-second-damnation', 'boss-crown'], ['martyrs-ledger', 'icon-book'],
  ['black-reliquary', 'icon-chest'], ['bell-of-the-hollow-host', 'boss-key'],
  ['unlit-halo', 'icon-ring'], ['cracked-prayer-bead', 'icon-chest'],
  ['soot-stained-bandage', 'icon-chest'], ['iron-nail-charm', 'icon-sword'],
  ['grave-soil-pouch', 'soul'], ['pilgrims-step', 'icon-boots'],
  ['wax-seal-of-mercy', 'icon-chest'], ['martyrs-splinter', 'icon-sword'],
  ['black-candle-stub', 'icon-staff'], ['chain-of-lent', 'icon-void-sword'],
  ['crowbone-dice', 'icon-void-sword'], ['ember-rosary', 'icon-staff'],
  ['hollow-coin', 'soul'], ['saintless-mirror', 'icon-void-sword'],
  ['blood-tithe-chalice', 'icon-void-sword'], ['funeral-bell-clapper', 'icon-chest'],
  ['thornscript-vellum', 'icon-chest'], ['reliquary-key', 'boss-key'],
  ['crown-of-ash', 'icon-void-sword'], ['the-red-testament', 'status-bleed'],
  ['halo-of-flies', 'icon-void-sword'], ['necromancers-skull', 'icon-void-sword'],
] as const;

const POWERUP_ICON_FALLBACKS = [
  ['mending-soul', 'icon-chest'],
  ['soul-vacuum', 'soul'],
  ['grave-frenzy', 'projectile-magic'],
] as const;

const SEMANTIC_ICON_ASSETS: readonly VisualAssetDefinition[] = [
  ...WEAPON_ICON_FALLBACKS.map(([id, fallback], index) => (
    aliasAsset(`icon-weapon-${id}`, 'weapon', `Dedicated icon for weapon ${id}`, fallback, 200 + index)
  )),
  ...ARTIFACT_ICON_FALLBACKS.map(([id, fallback], index) => (
    aliasAsset(`icon-artifact-${id}`, 'artifact', `Dedicated icon for artifact ${id}`, fallback, 400 + index)
  )),
  ...POWERUP_ICON_FALLBACKS.map(([id, fallback], index) => (
    aliasAsset(`icon-powerup-${id}`, 'pickup', `Dedicated icon for powerup ${id}`, fallback, 350 + index)
  )),
];

const runtimeDisplay = (
  consumer: string,
  width: number,
  height = width,
  note?: string,
): AssetRuntimeDisplay => ({ consumer, width, height, note });

/**
 * Source dimensions and worldScale are authoring metadata. These are the exact sizes imposed by
 * current runtime consumers, including intentionally non-uniform presentation. Keeping the two
 * concepts separate prevents replacement art from being authored against a false scalar size.
 */
const RUNTIME_DISPLAYS_BY_ASSET_ID: Readonly<Record<string, readonly AssetRuntimeDisplay[]>> = {
  'player-haunted': [
    runtimeDisplay('gameplay physics proxy', 74, 74, 'transparent while the Haunted overlay is active'),
    runtimeDisplay('gameplay visible Haunted overlay', 88, 104, 'nominal size before momentary squash animation'),
    runtimeDisplay('character-select preview', 114, 135),
    runtimeDisplay('Death Echo enemy', 86),
  ],
  'player-penitent': [runtimeDisplay('gameplay body', 74), runtimeDisplay('character-select preview', 125)],
  'player-ashwalker': [runtimeDisplay('gameplay body', 74), runtimeDisplay('character-select preview', 125)],
  'enemy-lost-soul': [runtimeDisplay('Lost Soul enemy', 58)],
  'enemy-crawler': [runtimeDisplay('Grave Crawler enemy', 50)],
  'enemy-limbo-knight': [runtimeDisplay('Limbo Knight enemy', 117)],
  'enemy-plague-crawler': [runtimeDisplay('Plague Crawler enemy', 78)],
  'enemy-tormented-shade': [runtimeDisplay('Tormented Shade enemy', 83)],
  'enemy-screamer': [runtimeDisplay('Screamer enemy', 82), runtimeDisplay('Banshee Queen elite', 120)],
  'enemy-wretched-runt': [runtimeDisplay('Wretched Runt enemy', 54)],
  'enemy-stalker': [runtimeDisplay('Veil and Sinbound Stalker enemies', 108)],
  'enemy-flayed-wanderer': [runtimeDisplay('Flayed Wanderer enemy', 66)],
  'enemy-lantern-ghost': [runtimeDisplay('Lantern Ghost enemy', 78), runtimeDisplay('Lich King elite', 130)],
  'enemy-gravebound-archer': [runtimeDisplay('Gravebound Archer enemy', 76)],
  'enemy-void-caster': [runtimeDisplay('Void Caster enemy', 72), runtimeDisplay('Void Archon elite', 110)],
  'enemy-brute': [runtimeDisplay('Condemned Brute enemy', 128)],
  'enemy-sentinel': [runtimeDisplay('Sentinel of Woe enemy', 138)],
  'enemy-ember-imp': [runtimeDisplay('Ember Imp enemy', 56)],
  'enemy-archer': [runtimeDisplay('Grave Defiler enemy', 62)],
  'boss-warden': [runtimeDisplay('Limbo Warden boss', 180)],
  'reliquary-chest': [runtimeDisplay('spawned reliquary', 68, 58, 'runtime pulse temporarily scales this by 1.07')],
  'shop-building': [runtimeDisplay('spawned Blood Market', 148, 136)],
  'prop-cage': [runtimeDisplay('arena dressing', 155)],
  'prop-skeleton': [runtimeDisplay('arena dressing', 135)],
  'prop-brazier': [runtimeDisplay('arena dressing', 145)],
  'prop-lantern': [runtimeDisplay('arena dressing', 110)],
  'prop-rubble': [runtimeDisplay('arena dressing', 170)],
  'prop-altar': [runtimeDisplay('arena shrine', 180)],
};

export const VISUAL_ASSET_MANIFEST: readonly VisualAssetDefinition[] = [
  ...FILE_ASSETS,
  ...PLACEHOLDER_ASSETS,
  ...SEMANTIC_ICON_ASSETS,
].map((definition) => ({
  ...definition,
  runtimeDisplays: RUNTIME_DISPLAYS_BY_ASSET_ID[definition.id] ?? definition.runtimeDisplays,
}));

/** Short canonical name for tools and the content laboratory. */
export const VISUAL_ASSETS = VISUAL_ASSET_MANIFEST;

function tone(
  cue: Exclude<AudioCue, 'limbo-ambience'>,
  intendedGameplayUse: string,
  frequencyHz: number,
  endFrequencyHz: number,
  durationSeconds: number,
  gain: number,
  oscillator: OscillatorType,
  cooldownMs: number,
  source?: FileAssetSource,
): AudioAssetDefinition {
  return {
    id: `audio-${cue}`,
    cue,
    category: 'sound-effect',
    intendedGameplayUse,
    productionTargetFilePath: `assets/production/audio/sfx/${cue}.wav`,
    source,
    loop: false,
    required: false,
    developmentFallback: {
      kind: 'procedural-audio', generator: 'web-audio-tone', oscillator,
      frequencyHz, endFrequencyHz, durationSeconds, gain, cooldownMs,
    },
    provenance: source ? 'owner-created' : 'procedural-placeholder',
  };
}

export const AUDIO_ASSET_MANIFEST: readonly AudioAssetDefinition[] = [
  tone('button', 'Menu and interface confirmation', 170, 245, 0.08, 0.045, 'sine', 50),
  tone('dash', 'Player dash movement', 145, 55, 0.14, 0.07, 'triangle', 120),
  tone('soul-bolt', 'Soul Bolt discharge', 480, 225, 0.1, 0.025, 'triangle', 80),
  tone('scythe', 'Bone Scythe swing', 130, 48, 0.23, 0.065, 'sawtooth', 300),
  tone('hellfire', 'Hellfire attack and detonation', 82, 36, 0.38, 0.08, 'sawtooth', 300),
  tone('pickup', 'Pickup collected', 680, 1080, 0.07, 0.025, 'sine', 55),
  tone('hurt', 'Player damage response', 110, 43, 0.22, 0.09, 'square', 250),
  tone('level-up', 'Level-up presentation', 390, 920, 0.35, 0.07, 'sine', 500),
  tone('boss', 'Boss arrival and phase emphasis', 58, 31, 0.7, 0.11, 'sawtooth', 700),
  tone('shield', 'Shield grant or absorb', 460, 720, 0.3, 0.055, 'sine', 500),
  tone('victory', 'Completed-trial stinger', 260, 640, 0.8, 0.08, 'triangle', 1000),
  {
    id: 'audio-limbo-ambience',
    cue: 'limbo-ambience',
    category: 'ambience',
    intendedGameplayUse: 'Looping low-frequency arena ambience',
    productionTargetFilePath: 'assets/production/audio/ambience/limbo-ambience.wav',
    loop: true,
    required: false,
    developmentFallback: {
      kind: 'procedural-audio', generator: 'web-audio-ambience', oscillator: 'sine',
      frequencyHz: 43, endFrequencyHz: 65, gain: 0.018,
    },
    provenance: 'procedural-placeholder',
  },
];

export const ASSET_MANIFEST: AssetManifest = {
  visual: VISUAL_ASSET_MANIFEST,
  audio: AUDIO_ASSET_MANIFEST,
};

export const VISUAL_ASSETS_BY_ID: ReadonlyMap<string, VisualAssetDefinition> = new Map(
  VISUAL_ASSET_MANIFEST.map((definition) => [definition.id, definition]),
);

export const AUDIO_ASSETS_BY_CUE: ReadonlyMap<AudioCue, AudioAssetDefinition> = new Map(
  AUDIO_ASSET_MANIFEST.map((definition) => [definition.cue, definition]),
);

export function isRegisteredVisualAssetId(assetId: string): boolean {
  return VISUAL_ASSETS_BY_ID.has(assetId);
}

/** Compatibility preload list, derived from the canonical manifest. */
export const ASSETS: Array<[string, string]> = getFileAssetPreloads(VISUAL_ASSET_MANIFEST)
  .map(([assetId, url]) => [assetId, url]);
