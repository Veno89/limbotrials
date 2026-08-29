import {
  validateRuntimeDefinition,
  type VvfxRuntimeDefinition,
} from '@vvfx/phaser-runtime';

const RUNTIME_FILE_SUFFIX = '.vvfx-runtime.json';

export interface VvfxCatalogEntry {
  readonly id: string;
  readonly sourcePath: string;
  readonly definition: VvfxRuntimeDefinition;
  readonly supportsEndpoints: boolean;
}

export interface VvfxCatalogIssue {
  readonly sourcePath: string;
  readonly message: string;
}

export interface VvfxCatalog {
  readonly effects: ReadonlyMap<string, VvfxCatalogEntry>;
  readonly issues: readonly VvfxCatalogIssue[];
}

function runtimeInput(moduleValue: unknown): unknown {
  if (
    typeof moduleValue === 'object' &&
    moduleValue !== null &&
    'default' in moduleValue
  ) {
    return (moduleValue as { default: unknown }).default;
  }
  return moduleValue;
}

export function effectIdFromRuntimePath(sourcePath: string): string | undefined {
  const fileName = sourcePath.replaceAll('\\', '/').split('/').at(-1);
  if (!fileName?.endsWith(RUNTIME_FILE_SUFFIX)) {
    return undefined;
  }
  const id = fileName.slice(0, -RUNTIME_FILE_SUFFIX.length).trim();
  return id.length > 0 ? id : undefined;
}

export function supportsBeamEndpoints(
  definition: Pick<VvfxRuntimeDefinition, 'layers'>,
): boolean {
  return definition.layers.some((layer) => layer.type === 'beam');
}

export function createVvfxCatalog(
  modules: Readonly<Record<string, unknown>>,
): VvfxCatalog {
  const effects = new Map<string, VvfxCatalogEntry>();
  const idsIgnoringCase = new Map<string, string>();
  const issues: VvfxCatalogIssue[] = [];

  for (const [sourcePath, moduleValue] of Object.entries(modules).sort(([left], [right]) =>
    left.localeCompare(right),
  )) {
    const id = effectIdFromRuntimePath(sourcePath);
    if (!id) {
      issues.push({
        sourcePath,
        message: `The file name must end in ${RUNTIME_FILE_SUFFIX} and include an effect name.`,
      });
      continue;
    }

    const existingId = idsIgnoringCase.get(id.toLocaleLowerCase());
    if (existingId) {
      issues.push({
        sourcePath,
        message: `The effect ID "${id}" conflicts with "${existingId}". File-name IDs are case-insensitive.`,
      });
      continue;
    }

    const validation = validateRuntimeDefinition(runtimeInput(moduleValue));
    if (!validation.ok || !validation.definition) {
      issues.push({
        sourcePath,
        message: validation.error ?? 'The runtime definition is invalid.',
      });
      continue;
    }

    idsIgnoringCase.set(id.toLocaleLowerCase(), id);
    effects.set(id, {
      id,
      sourcePath,
      definition: validation.definition,
      supportsEndpoints: supportsBeamEndpoints(validation.definition),
    });
  }

  return { effects, issues };
}
