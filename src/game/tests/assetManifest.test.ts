import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  resolveAssetAttachmentWorldPoint,
  resolveSpriteAssetAttachment,
  resolveVisualAsset,
} from '../assets/AssetResolver';
import {
  reportAssetDiagnosticsOnce,
  validateAssetManifest,
  validateVisualAssetUsage,
  type VisualAssetUsageReference,
} from '../assets/assetValidation';
import type { AssetManifest, VisualAssetDefinition } from '../assets/assetTypes';
import { ARTIFACTS } from '../data/artifacts';
import {
  ASSET_MANIFEST,
  ASSETS,
  AUDIO_ASSET_MANIFEST,
  VISUAL_ASSETS,
  VISUAL_ASSETS_BY_ID,
} from '../data/assets';
import { CHARACTERS } from '../data/characters';
import { ENEMIES } from '../data/enemies';
import { POWERUPS } from '../data/powerups';
import { STATUS_EFFECTS } from '../data/statusEffects';
import { UPGRADES } from '../data/upgrades';
import { WEAPONS } from '../data/weapons';

function validVisual(
  id: string,
  overrides: Partial<VisualAssetDefinition> = {},
): VisualAssetDefinition {
  return {
    id,
    category: 'ui',
    intendedGameplayUse: 'Validator fixture',
    expectedWidth: 128,
    expectedHeight: 128,
    frameWidth: 128,
    frameHeight: 128,
    frameCount: 1,
    origin: { x: 0.5, y: 0.5 },
    worldScale: 1,
    runtimeDisplays: [],
    expectedDepth: 0,
    mirroring: 'none',
    tinting: 'allowed',
    attachments: [{ name: 'center', x: 0.5, y: 0.5 }],
    requiredAttachments: ['center'],
    required: false,
    developmentFallback: {
      kind: 'primitive',
      shape: 'square',
      fillColor: 0x222222,
      strokeColor: 0xffffff,
    },
    provenance: 'procedural-placeholder',
    ...overrides,
  };
}

function currentUsageReferences(): VisualAssetUsageReference[] {
  return [
    ...Object.values(WEAPONS).flatMap((definition) => [
      { assetId: definition.texture, consumerId: `weapon:${definition.id}`, field: 'texture' },
      { assetId: definition.iconTexture, consumerId: `weapon:${definition.id}`, field: 'iconTexture' },
    ]),
    ...Object.values(UPGRADES).map((definition) => ({
      assetId: definition.iconTexture,
      consumerId: `upgrade:${definition.id}`,
      field: 'iconTexture',
    })),
    ...Object.values(ARTIFACTS).map((definition) => ({
      assetId: definition.iconTexture,
      consumerId: `artifact:${definition.id}`,
      field: 'iconTexture',
    })),
    ...Object.values(POWERUPS).map((definition) => ({
      assetId: definition.texture,
      consumerId: `powerup:${definition.id}`,
      field: 'texture',
    })),
    ...Object.values(ENEMIES).map((definition) => ({
      assetId: definition.texture,
      consumerId: `enemy:${definition.id}`,
      field: 'texture',
    })),
    ...Object.values(CHARACTERS).map((definition) => ({
      assetId: definition.texture,
      consumerId: `character:${definition.id}`,
      field: 'texture',
    })),
    ...Object.values(STATUS_EFFECTS).map((definition) => ({
      assetId: definition.iconTexture,
      consumerId: `status:${definition.id}`,
      field: 'iconTexture',
    })),
    ...['reliquary-chest', 'prop-cage', 'prop-skeleton', 'prop-brazier', 'prop-lantern', 'prop-rubble', 'prop-altar']
      .map((assetId) => ({ assetId, consumerId: 'runtime:arena', field: 'texture' })),
  ];
}

describe('asset manifest', () => {
  it('is valid and every explicit source exists in the repository', () => {
    const issues = validateAssetManifest(ASSET_MANIFEST, {
      sourceExists: (filePath) => existsSync(resolve(filePath)),
      sourceDimensions: (filePath) => {
        const bytes = readFileSync(resolve(filePath));
        return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
      },
    });

    expect(issues).toEqual([]);
  });

  it('registers every live content and arena texture key', () => {
    expect(validateVisualAssetUsage(currentUsageReferences(), VISUAL_ASSETS)).toEqual([]);
  });

  it('resolves every registered stable key to a file or safe primitive', () => {
    for (const definition of VISUAL_ASSETS) {
      expect(resolveVisualAsset(VISUAL_ASSETS, definition.id), definition.id).toBeDefined();
    }
  });

  it('uses the four previously dormant owner enemy files under their semantic keys', () => {
    const pathsById = new Map(VISUAL_ASSETS.map(({ id, source }) => [id, source?.filePath]));
    expect(pathsById.get('enemy-flayed-wanderer')).toBe('assets/test/enemies/flayed_wanderer.png');
    expect(pathsById.get('enemy-lantern-ghost')).toBe('assets/test/enemies/ghost.png');
    expect(pathsById.get('enemy-gravebound-archer')).toBe('assets/test/enemies/gravebound_archer.png');
    expect(pathsById.get('enemy-void-caster')).toBe('assets/test/enemies/void_caster.png');
    const preloadedIds = new Set(ASSETS.map(([id]) => id));
    expect([
      'enemy-flayed-wanderer',
      'enemy-lantern-ghost',
      'enemy-gravebound-archer',
      'enemy-void-caster',
    ].every((id) => preloadedIds.has(id))).toBe(true);
  });

  it('defines and requires gameplay attachment names on every entity body', () => {
    const requiredNames = ['weapon-origin', 'chain-source', 'chain-target'];
    const entities = VISUAL_ASSETS.filter(({ category }) => (
      category === 'character' || category === 'enemy' || category === 'boss'
    ));
    for (const definition of entities) {
      const names = new Set(definition.attachments.map(({ name }) => name));
      expect(requiredNames.every((name) => names.has(name)), definition.id).toBe(true);
      expect(requiredNames.every((name) => definition.requiredAttachments?.includes(name)), definition.id).toBe(true);
    }

    const haunted = VISUAL_ASSETS_BY_ID.get('player-haunted');
    expect(haunted).toBeDefined();
    const weaponOrigin = haunted && resolveAssetAttachmentWorldPoint(haunted, 'weapon-origin', {
      x: 100,
      y: 100,
      displayWidth: 100,
      displayHeight: 100,
    });
    expect(weaponOrigin).toMatchObject({ x: 122, y: 98 });
  });

  it('exposes a dedicated semantic icon key for each weapon, artifact, and powerup', () => {
    for (const id of Object.keys(WEAPONS)) {
      expect(VISUAL_ASSETS_BY_ID.has(`icon-weapon-${id}`), id).toBe(true);
    }
    for (const id of Object.keys(ARTIFACTS)) {
      expect(VISUAL_ASSETS_BY_ID.has(`icon-artifact-${id}`), id).toBe(true);
    }
    for (const id of Object.keys(POWERUPS)) {
      expect(VISUAL_ASSETS_BY_ID.has(`icon-powerup-${id}`), id).toBe(true);
    }
  });

  it('keeps every procedural audio cue registered as an explicit fallback', () => {
    expect(AUDIO_ASSET_MANIFEST.map(({ cue }) => cue)).toEqual([
      'button', 'dash', 'soul-bolt', 'scythe', 'hellfire', 'pickup', 'hurt',
      'level-up', 'boss', 'shield', 'victory', 'limbo-ambience',
    ]);
    expect(AUDIO_ASSET_MANIFEST.every(({ developmentFallback }) => (
      developmentFallback.kind === 'procedural-audio'
    ))).toBe(true);
    expect(AUDIO_ASSET_MANIFEST.every(({ productionTargetFilePath }) => (
      productionTargetFilePath.startsWith('assets/production/audio/')
      && productionTargetFilePath.endsWith('.wav')
    ))).toBe(true);
  });

  it('publishes production specs for test art and the exact first five backlog tasks', () => {
    const testArt = VISUAL_ASSETS.filter(({ source }) => source?.filePath.startsWith('assets/test/'));
    expect(testArt.length).toBeGreaterThan(0);
    expect(testArt.every(({ production }) => Boolean(production))).toBe(true);
    expect(VISUAL_ASSETS.every(({ production }) => (
      !production?.templateFilePath || existsSync(resolve(production.templateFilePath))
    ))).toBe(true);
    expect(VISUAL_ASSETS_BY_ID.get('player-haunted')?.production?.targetFilePath)
      .toBe('assets/production/characters/player-haunted.png');
    expect(VISUAL_ASSETS_BY_ID.get('arena-tile-1')?.production?.targetFilePath)
      .toBe('assets/production/tiles/arena-tile-1.png');

    const firstFive = VISUAL_ASSETS
      .filter(({ production }) => production?.tier === 'minimum-playable')
      .sort((left, right) => (left.production?.order ?? 0) - (right.production?.order ?? 0))
      .slice(0, 5)
      .map(({ id }) => id);
    expect(firstFive).toEqual([
      'boss-warden',
      'reliquary-chest',
      'enemy-brute',
      'enemy-sentinel',
      'enemy-ember-imp',
    ]);
    expect(VISUAL_ASSETS_BY_ID.get('boss-warden')).toMatchObject({
      expectedWidth: 256,
      expectedHeight: 256,
      collision: { shape: 'circle', radius: 56 },
    });
    expect(VISUAL_ASSETS_BY_ID.get('reliquary-chest')).toMatchObject({
      expectedWidth: 128,
      expectedHeight: 128,
      collision: { shape: 'circle', radius: 30 },
    });
    expect(VISUAL_ASSETS_BY_ID.get('enemy-brute')).toMatchObject({
      expectedWidth: 192,
      expectedHeight: 192,
      collision: { shape: 'circle', radius: 42 },
    });
    expect(VISUAL_ASSETS_BY_ID.get('enemy-sentinel')).toMatchObject({
      expectedWidth: 192,
      expectedHeight: 192,
      collision: { shape: 'circle', radius: 45 },
    });
    expect(VISUAL_ASSETS_BY_ID.get('enemy-ember-imp')).toMatchObject({
      expectedWidth: 128,
      expectedHeight: 128,
      collision: { shape: 'circle', radius: 18 },
    });
    expect(VISUAL_ASSETS_BY_ID.get('boss-warden')?.runtimeDisplays).toEqual([
      expect.objectContaining({ consumer: 'Limbo Warden boss', width: 180, height: 180 }),
    ]);
    expect(VISUAL_ASSETS_BY_ID.get('reliquary-chest')?.runtimeDisplays).toEqual([
      expect.objectContaining({ consumer: 'spawned reliquary', width: 68, height: 58 }),
    ]);
    const entityAssets = VISUAL_ASSETS.filter(({ category }) => (
      category === 'character' || category === 'enemy' || category === 'boss'
    ));
    expect(entityAssets.every(({ runtimeDisplays }) => runtimeDisplays.length > 0)).toBe(true);
    for (const enemy of Object.values(ENEMIES)) {
      const displayContracts = VISUAL_ASSETS_BY_ID.get(enemy.texture)?.runtimeDisplays ?? [];
      expect(
        displayContracts.some(({ width, height }) => (
          width === enemy.displaySize && height === enemy.displaySize
        )),
        `${enemy.texture} must describe ${enemy.id}'s ${enemy.displaySize}px runtime display`,
      ).toBe(true);
    }
  });
});

describe('asset manifest validation', () => {
  it('reports duplicate IDs, missing files, invalid frame data, attachments, animation, and fallback cycles', () => {
    const cycleA = validVisual('cycle-a', {
      developmentFallback: { kind: 'asset', assetId: 'cycle-b' },
    });
    const cycleB = validVisual('cycle-b', {
      developmentFallback: { kind: 'asset', assetId: 'cycle-a' },
    });
    const invalid = validVisual('invalid', {
      source: { kind: 'file', filePath: 'assets/missing.png', url: '/missing.png' },
      required: true,
      expectedWidth: 127,
      frameWidth: 64,
      frameCount: 2,
      animation: { startFrame: 2, endFrame: 1, framesPerSecond: 0, loop: true },
      runtimeDisplays: [{ consumer: '', width: 0, height: -1 }],
      requiredAttachments: ['muzzle'],
    });
    const manifest: AssetManifest = {
      visual: [cycleA, cycleB, invalid, validVisual('invalid')],
      audio: [],
    };
    const codes = validateAssetManifest(manifest, { sourceExists: () => false })
      .map(({ code }) => code);

    expect(codes).toEqual(expect.arrayContaining([
      'duplicate-id',
      'fallback-cycle',
      'missing-source-file',
      'invalid-frame-math',
      'invalid-frame-range',
      'invalid-animation',
      'invalid-runtime-display',
      'missing-required-attachment',
    ]));
  });

  it('returns sorted usage diagnostics and emits each diagnostic once', () => {
    const usage = validateVisualAssetUsage([
      { assetId: 'missing-z', consumerId: 'b', field: 'texture' },
      { assetId: 'missing-a', consumerId: 'a', field: 'iconTexture' },
      { assetId: 'missing-z', consumerId: 'b', field: 'texture' },
    ], []);
    expect(usage.map(({ assetId }) => assetId)).toEqual(['missing-a', 'missing-z']);
    expect(usage[1]?.consumers).toEqual(['b.texture']);

    const report = vi.fn();
    const seen = new Set<string>();
    const issues = validateAssetManifest({ visual: [validVisual('same'), validVisual('same')], audio: [] });
    expect(reportAssetDiagnosticsOnce(issues, report, seen)).toBe(1);
    expect(reportAssetDiagnosticsOnce(issues, report, seen)).toBe(0);
    expect(report).toHaveBeenCalledTimes(1);
  });
});

describe('asset attachment resolver', () => {
  it('resolves mirroring and rotation into a world point', () => {
    const definition = validVisual('attachment', {
      attachments: [{ name: 'muzzle', x: 0.75, y: 0.5 }],
      requiredAttachments: ['muzzle'],
    });

    const point = resolveAssetAttachmentWorldPoint(definition, 'muzzle', {
      x: 10,
      y: 20,
      displayWidth: 100,
      displayHeight: 80,
      rotation: Math.PI / 2,
      flipX: true,
    });

    expect(point?.x).toBeCloseTo(10);
    expect(point?.y).toBeCloseTo(-5);
    expect(resolveAssetAttachmentWorldPoint(definition, 'missing', {
      x: 0,
      y: 0,
      displayWidth: 100,
      displayHeight: 100,
    })).toBeUndefined();

    expect(resolveSpriteAssetAttachment([definition], {
      x: 10,
      y: 20,
      displayWidth: 100,
      displayHeight: 80,
      texture: { key: 'attachment' },
    }, 'muzzle')).toMatchObject({ x: 35, y: 20 });
  });
});
