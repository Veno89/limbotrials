import type {
  AssetAttachmentPoint,
  AssetPoint,
  PrimitiveAssetFallback,
  VisualAssetDefinition,
} from './assetTypes';

export type ResolvedVisualAsset =
  | {
      kind: 'file';
      requestedId: string;
      resolvedDefinition: VisualAssetDefinition;
      url: string;
    }
  | {
      kind: 'primitive';
      requestedId: string;
      resolvedDefinition: VisualAssetDefinition;
      fallback: PrimitiveAssetFallback;
    };

export interface AssetAttachmentTransform {
  x: number;
  y: number;
  displayWidth: number;
  displayHeight: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
}

export interface ResolvedAttachmentPoint extends AssetPoint {
  name: string;
}

export interface AssetSpriteLike {
  readonly x: number;
  readonly y: number;
  readonly displayWidth?: number;
  readonly displayHeight?: number;
  readonly rotation?: number;
  readonly flipX?: boolean;
  readonly flipY?: boolean;
  readonly texture?: { readonly key?: string };
}

const definitionIndexes = new WeakMap<
  readonly VisualAssetDefinition[],
  ReadonlyMap<string, VisualAssetDefinition>
>();

function indexFirstDefinitions(
  definitions: readonly VisualAssetDefinition[],
): ReadonlyMap<string, VisualAssetDefinition> {
  const cached = definitionIndexes.get(definitions);
  if (cached) {
    return cached;
  }
  const byId = new Map<string, VisualAssetDefinition>();
  for (const definition of definitions) {
    if (!byId.has(definition.id)) {
      byId.set(definition.id, definition);
    }
  }
  definitionIndexes.set(definitions, byId);
  return byId;
}

/**
 * Resolves a stable texture key to either an explicitly imported file or a primitive fallback.
 * Cycles and unknown references resolve to undefined; the validator reports their detailed cause.
 */
export function resolveVisualAsset(
  definitions: readonly VisualAssetDefinition[],
  assetId: string,
): ResolvedVisualAsset | undefined {
  const byId = indexFirstDefinitions(definitions);
  const visited = new Set<string>();
  let current = byId.get(assetId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.source) {
      return {
        kind: 'file',
        requestedId: assetId,
        resolvedDefinition: current,
        url: current.source.url,
      };
    }
    if (current.developmentFallback?.kind === 'primitive') {
      return {
        kind: 'primitive',
        requestedId: assetId,
        resolvedDefinition: current,
        fallback: current.developmentFallback,
      };
    }
    if (current.developmentFallback?.kind !== 'asset') {
      return undefined;
    }
    current = byId.get(current.developmentFallback.assetId);
  }
  return undefined;
}

/** Resolves only the fallback chain, allowing preload to recover from a failed file request. */
export function resolveVisualAssetFallback(
  definitions: readonly VisualAssetDefinition[],
  assetId: string,
): PrimitiveAssetFallback | undefined {
  const byId = indexFirstDefinitions(definitions);
  const visited = new Set<string>();
  let current = byId.get(assetId);

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.developmentFallback?.kind === 'primitive') {
      return current.developmentFallback;
    }
    if (current.developmentFallback?.kind !== 'asset') {
      return undefined;
    }
    current = byId.get(current.developmentFallback.assetId);
  }
  return undefined;
}

export function getFileAssetPreloads(
  definitions: readonly VisualAssetDefinition[],
): Array<readonly [string, string]> {
  const preloads: Array<readonly [string, string]> = [];
  const emitted = new Set<string>();
  for (const definition of definitions) {
    if (emitted.has(definition.id)) {
      continue;
    }
    const resolved = resolveVisualAsset(definitions, definition.id);
    if (resolved?.kind === 'file') {
      preloads.push([definition.id, resolved.url]);
      emitted.add(definition.id);
    }
  }
  return preloads;
}

export function getPrimitiveAssetFallbacks(
  definitions: readonly VisualAssetDefinition[],
): Array<{
  id: string;
  width: number;
  height: number;
  fallback: PrimitiveAssetFallback;
}> {
  const fallbacks: Array<{
    id: string;
    width: number;
    height: number;
    fallback: PrimitiveAssetFallback;
  }> = [];
  const emitted = new Set<string>();
  for (const definition of definitions) {
    if (emitted.has(definition.id)) {
      continue;
    }
    const resolved = resolveVisualAsset(definitions, definition.id);
    if (resolved?.kind === 'primitive') {
      fallbacks.push({
        id: definition.id,
        width: definition.frameWidth,
        height: definition.frameHeight,
        fallback: resolved.fallback,
      });
      emitted.add(definition.id);
    }
  }
  return fallbacks;
}

export function findAssetAttachment(
  definition: VisualAssetDefinition,
  attachmentName: string,
): AssetAttachmentPoint | undefined {
  return definition.attachments.find(({ name }) => name === attachmentName);
}

/** Converts a normalized manifest attachment into a rotated world-space point. */
export function resolveAssetAttachmentWorldPoint(
  definition: VisualAssetDefinition,
  attachmentName: string,
  transform: AssetAttachmentTransform,
): ResolvedAttachmentPoint | undefined {
  const attachment = findAssetAttachment(definition, attachmentName);
  if (!attachment) {
    return undefined;
  }

  const horizontalDirection = transform.flipX ? -1 : 1;
  const verticalDirection = transform.flipY ? -1 : 1;
  const localX = (attachment.x - definition.origin.x) * transform.displayWidth * horizontalDirection;
  const localY = (attachment.y - definition.origin.y) * transform.displayHeight * verticalDirection;
  const rotation = transform.rotation ?? 0;
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);

  return {
    name: attachment.name,
    x: transform.x + localX * cosine - localY * sine,
    y: transform.y + localX * sine + localY * cosine,
  };
}

/** Duck-typed Phaser adapter suitable for WeaponAttachmentResolver and other gameplay systems. */
export function resolveSpriteAssetAttachment(
  definitions: readonly VisualAssetDefinition[],
  sprite: AssetSpriteLike,
  attachmentName: string,
): ResolvedAttachmentPoint | undefined {
  const textureKey = sprite.texture?.key;
  if (!textureKey) {
    return undefined;
  }
  const definition = indexFirstDefinitions(definitions).get(textureKey);
  if (!definition) {
    return undefined;
  }
  return resolveAssetAttachmentWorldPoint(definition, attachmentName, {
    x: sprite.x,
    y: sprite.y,
    displayWidth: sprite.displayWidth ?? definition.frameWidth * definition.worldScale,
    displayHeight: sprite.displayHeight ?? definition.frameHeight * definition.worldScale,
    rotation: sprite.rotation,
    flipX: sprite.flipX,
    flipY: sprite.flipY,
  });
}
