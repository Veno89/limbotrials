import type {
  AssetManifest,
  AssetPoint,
  AudioAssetDefinition,
  FileAssetSource,
  VisualAssetDefinition,
} from './assetTypes';

export type AssetValidationCode =
  | 'duplicate-id'
  | 'missing-required-source'
  | 'missing-optional-fallback'
  | 'missing-source-file'
  | 'source-dimension-mismatch'
  | 'invalid-source'
  | 'invalid-dimensions'
  | 'invalid-frame-math'
  | 'invalid-frame-range'
  | 'invalid-animation'
  | 'invalid-origin'
  | 'invalid-scale'
  | 'invalid-runtime-display'
  | 'invalid-depth'
  | 'invalid-collision'
  | 'duplicate-attachment'
  | 'invalid-attachment'
  | 'missing-required-attachment'
  | 'unknown-fallback'
  | 'fallback-cycle'
  | 'invalid-audio-fallback';

export interface AssetValidationIssue {
  code: AssetValidationCode;
  severity: 'error' | 'warning';
  assetId: string;
  message: string;
}

export interface AssetValidationOptions {
  /** Supply a filesystem-aware predicate in build tooling/tests. Runtime validation may omit it. */
  sourceExists?: (repositoryRelativePath: string) => boolean;
  /** Supply decoded image dimensions in build tooling/tests to catch stale manifest specifications. */
  sourceDimensions?: (repositoryRelativePath: string) => { width: number; height: number } | undefined;
}

export interface VisualAssetUsageReference {
  assetId: string;
  consumerId: string;
  field: string;
}

export interface VisualAssetUsageIssue {
  assetId: string;
  consumers: readonly string[];
  message: string;
}

const defaultReportedDiagnostics = new Set<string>();

function issueKey(issue: AssetValidationIssue): string {
  return `${issue.severity}|${issue.code}|${issue.assetId}|${issue.message}`;
}

function pushIssue(
  issues: Map<string, AssetValidationIssue>,
  issue: AssetValidationIssue,
): void {
  issues.set(issueKey(issue), issue);
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function isNormalizedPoint(point: AssetPoint): boolean {
  return Number.isFinite(point.x)
    && Number.isFinite(point.y)
    && point.x >= 0
    && point.x <= 1
    && point.y >= 0
    && point.y <= 1;
}

function validateSource(
  assetId: string,
  source: FileAssetSource,
  required: boolean,
  expectedDimensions: { width: number; height: number } | undefined,
  issues: Map<string, AssetValidationIssue>,
  options: AssetValidationOptions,
): void {
  if (source.filePath.trim().length === 0 || source.url.trim().length === 0) {
    pushIssue(issues, {
      code: 'invalid-source',
      severity: 'error',
      assetId,
      message: 'File-backed assets require both a repository path and an imported URL.',
    });
  }
  const sourceExists = options.sourceExists?.(source.filePath);
  if (sourceExists === false) {
    pushIssue(issues, {
      code: 'missing-source-file',
      severity: required ? 'error' : 'warning',
      assetId,
      message: `Source file does not exist: ${source.filePath}`,
    });
  }
  const actualDimensions = sourceExists === false
    ? undefined
    : options.sourceDimensions?.(source.filePath);
  if (expectedDimensions
    && actualDimensions
    && (actualDimensions.width !== expectedDimensions.width
      || actualDimensions.height !== expectedDimensions.height)) {
    pushIssue(issues, {
      code: 'source-dimension-mismatch',
      severity: 'error',
      assetId,
      message: `Expected ${expectedDimensions.width}x${expectedDimensions.height}, received ${actualDimensions.width}x${actualDimensions.height}: ${source.filePath}`,
    });
  }
}

function validateVisualDefinition(
  definition: VisualAssetDefinition,
  issues: Map<string, AssetValidationIssue>,
  options: AssetValidationOptions,
): void {
  const id = definition.id;
  if (definition.source) {
    validateSource(id, definition.source, definition.required, {
      width: definition.expectedWidth,
      height: definition.expectedHeight,
    }, issues, options);
  } else if (definition.required) {
    pushIssue(issues, {
      code: 'missing-required-source',
      severity: 'error',
      assetId: id,
      message: 'Required asset has no file source.',
    });
  } else if (!definition.developmentFallback) {
    pushIssue(issues, {
      code: 'missing-optional-fallback',
      severity: 'warning',
      assetId: id,
      message: 'Optional asset has neither a file source nor a development fallback.',
    });
  }

  if (!isPositiveInteger(definition.expectedWidth)
    || !isPositiveInteger(definition.expectedHeight)
    || !isPositiveInteger(definition.frameWidth)
    || !isPositiveInteger(definition.frameHeight)
    || !isPositiveInteger(definition.frameCount)) {
    pushIssue(issues, {
      code: 'invalid-dimensions',
      severity: 'error',
      assetId: id,
      message: 'Expected dimensions, frame dimensions, and frame count must be positive integers.',
    });
  } else {
    const columns = Math.floor(definition.expectedWidth / definition.frameWidth);
    const rows = Math.floor(definition.expectedHeight / definition.frameHeight);
    if (definition.expectedWidth % definition.frameWidth !== 0
      || definition.expectedHeight % definition.frameHeight !== 0
      || columns * rows < definition.frameCount) {
      pushIssue(issues, {
        code: 'invalid-frame-math',
        severity: 'error',
        assetId: id,
        message: 'Frame dimensions must divide the source dimensions and contain every declared frame.',
      });
    }
  }

  if (definition.frameCount > 1 && !definition.animation) {
    pushIssue(issues, {
      code: 'invalid-animation',
      severity: 'error',
      assetId: id,
      message: 'Multi-frame assets require animation configuration.',
    });
  }
  if (definition.animation) {
    const { startFrame, endFrame, framesPerSecond } = definition.animation;
    if (!Number.isInteger(startFrame)
      || !Number.isInteger(endFrame)
      || startFrame < 0
      || endFrame < startFrame
      || endFrame >= definition.frameCount) {
      pushIssue(issues, {
        code: 'invalid-frame-range',
        severity: 'error',
        assetId: id,
        message: 'Animation frame range must be ordered and remain within the declared frame count.',
      });
    }
    if (!Number.isFinite(framesPerSecond) || framesPerSecond <= 0) {
      pushIssue(issues, {
        code: 'invalid-animation',
        severity: 'error',
        assetId: id,
        message: 'Animation frame rate must be greater than zero.',
      });
    }
  }

  if (!isNormalizedPoint(definition.origin)) {
    pushIssue(issues, {
      code: 'invalid-origin',
      severity: 'error',
      assetId: id,
      message: 'Origin coordinates must be finite normalized values from zero through one.',
    });
  }
  if (!Number.isFinite(definition.worldScale) || definition.worldScale <= 0) {
    pushIssue(issues, {
      code: 'invalid-scale',
      severity: 'error',
      assetId: id,
      message: 'World scale must be greater than zero.',
    });
  }
  for (const runtimeDisplay of definition.runtimeDisplays) {
    if (runtimeDisplay.consumer.trim().length === 0
      || !Number.isFinite(runtimeDisplay.width)
      || !Number.isFinite(runtimeDisplay.height)
      || runtimeDisplay.width <= 0
      || runtimeDisplay.height <= 0) {
      pushIssue(issues, {
        code: 'invalid-runtime-display',
        severity: 'error',
        assetId: id,
        message: 'Runtime display contracts require a named consumer and positive finite dimensions.',
      });
    }
  }
  if (!Number.isFinite(definition.expectedDepth)) {
    pushIssue(issues, {
      code: 'invalid-depth',
      severity: 'error',
      assetId: id,
      message: 'Expected depth must be finite.',
    });
  }

  if (definition.collision?.shape === 'circle'
    && (!Number.isFinite(definition.collision.radius) || definition.collision.radius <= 0)) {
    pushIssue(issues, {
      code: 'invalid-collision',
      severity: 'error',
      assetId: id,
      message: 'Circle collision radius must be greater than zero.',
    });
  }
  if (definition.collision?.shape === 'box'
    && (!Number.isFinite(definition.collision.width)
      || !Number.isFinite(definition.collision.height)
      || definition.collision.width <= 0
      || definition.collision.height <= 0)) {
    pushIssue(issues, {
      code: 'invalid-collision',
      severity: 'error',
      assetId: id,
      message: 'Box collision dimensions must be greater than zero.',
    });
  }

  const attachmentNames = new Set<string>();
  for (const attachment of definition.attachments) {
    if (attachmentNames.has(attachment.name)) {
      pushIssue(issues, {
        code: 'duplicate-attachment',
        severity: 'error',
        assetId: id,
        message: `Attachment name is duplicated: ${attachment.name}`,
      });
    }
    attachmentNames.add(attachment.name);
    if (attachment.name.trim().length === 0 || !isNormalizedPoint(attachment)) {
      pushIssue(issues, {
        code: 'invalid-attachment',
        severity: 'error',
        assetId: id,
        message: `Attachment must have a name and normalized coordinates: ${attachment.name || '<blank>'}`,
      });
    }
  }
  for (const requiredAttachment of definition.requiredAttachments ?? []) {
    if (!attachmentNames.has(requiredAttachment)) {
      pushIssue(issues, {
        code: 'missing-required-attachment',
        severity: 'error',
        assetId: id,
        message: `Required attachment is not defined: ${requiredAttachment}`,
      });
    }
  }
}

function validateAudioDefinition(
  definition: AudioAssetDefinition,
  issues: Map<string, AssetValidationIssue>,
  options: AssetValidationOptions,
): void {
  if (definition.source) {
    validateSource(definition.id, definition.source, definition.required, undefined, issues, options);
  } else if (definition.required) {
    pushIssue(issues, {
      code: 'missing-required-source',
      severity: 'error',
      assetId: definition.id,
      message: 'Required audio asset has no file source.',
    });
  }

  const fallback = definition.developmentFallback;
  if (!Number.isFinite(fallback.frequencyHz)
    || fallback.frequencyHz <= 0
    || (fallback.endFrequencyHz !== undefined
      && (!Number.isFinite(fallback.endFrequencyHz) || fallback.endFrequencyHz <= 0))
    || (fallback.durationSeconds !== undefined
      && (!Number.isFinite(fallback.durationSeconds) || fallback.durationSeconds <= 0))
    || !Number.isFinite(fallback.gain)
    || fallback.gain < 0
    || fallback.gain > 1
    || (fallback.cooldownMs !== undefined
      && (!Number.isFinite(fallback.cooldownMs) || fallback.cooldownMs < 0))) {
    pushIssue(issues, {
      code: 'invalid-audio-fallback',
      severity: 'error',
      assetId: definition.id,
      message: 'Procedural audio frequencies/durations must be positive, gain must be 0..1, and cooldown cannot be negative.',
    });
  }
}

function canonicalCycle(cycle: readonly string[]): readonly string[] {
  let firstIndex = 0;
  for (let index = 1; index < cycle.length; index += 1) {
    if ((cycle[index] ?? '').localeCompare(cycle[firstIndex] ?? '') < 0) {
      firstIndex = index;
    }
  }
  return [...cycle.slice(firstIndex), ...cycle.slice(0, firstIndex)];
}

function validateFallbackReferences(
  definitions: readonly VisualAssetDefinition[],
  issues: Map<string, AssetValidationIssue>,
): void {
  const byId = new Map<string, VisualAssetDefinition>();
  for (const definition of definitions) {
    if (!byId.has(definition.id)) {
      byId.set(definition.id, definition);
    }
  }

  for (const definition of [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))) {
    const fallback = definition.developmentFallback;
    if (fallback?.kind === 'asset' && !byId.has(fallback.assetId)) {
      pushIssue(issues, {
        code: 'unknown-fallback',
        severity: 'error',
        assetId: definition.id,
        message: `Fallback asset is not registered: ${fallback.assetId}`,
      });
    }
  }

  const states = new Map<string, 'visiting' | 'visited'>();
  const stack: string[] = [];
  const emittedCycles = new Set<string>();
  const visit = (id: string): void => {
    const state = states.get(id);
    if (state === 'visited') {
      return;
    }
    if (state === 'visiting') {
      const cycleStart = stack.indexOf(id);
      const cycle = canonicalCycle(stack.slice(cycleStart));
      const cycleKey = cycle.join('|');
      if (!emittedCycles.has(cycleKey)) {
        emittedCycles.add(cycleKey);
        const path = [...cycle, cycle[0]].join(' -> ');
        pushIssue(issues, {
          code: 'fallback-cycle',
          severity: 'error',
          assetId: cycle[0] ?? id,
          message: `Fallback cycle detected: ${path}`,
        });
      }
      return;
    }

    states.set(id, 'visiting');
    stack.push(id);
    const fallback = byId.get(id)?.developmentFallback;
    if (fallback?.kind === 'asset' && byId.has(fallback.assetId)) {
      visit(fallback.assetId);
    }
    stack.pop();
    states.set(id, 'visited');
  };

  for (const id of [...byId.keys()].sort((left, right) => left.localeCompare(right))) {
    visit(id);
  }
}

export function validateAssetManifest(
  manifest: AssetManifest,
  options: AssetValidationOptions = {},
): AssetValidationIssue[] {
  const issues = new Map<string, AssetValidationIssue>();
  const firstKinds = new Map<string, 'visual' | 'audio'>();
  for (const [kind, definitions] of [
    ['visual', manifest.visual],
    ['audio', manifest.audio],
  ] as const) {
    for (const definition of definitions) {
      const previousKind = firstKinds.get(definition.id);
      if (previousKind) {
        pushIssue(issues, {
          code: 'duplicate-id',
          severity: 'error',
          assetId: definition.id,
          message: `Asset ID is duplicated (${previousKind} and ${kind} registry entries).`,
        });
      } else {
        firstKinds.set(definition.id, kind);
      }
    }
  }

  for (const definition of manifest.visual) {
    validateVisualDefinition(definition, issues, options);
  }
  for (const definition of manifest.audio) {
    validateAudioDefinition(definition, issues, options);
  }
  validateFallbackReferences(manifest.visual, issues);

  return [...issues.values()].sort((left, right) => (
    left.assetId.localeCompare(right.assetId)
      || left.code.localeCompare(right.code)
      || left.message.localeCompare(right.message)
  ));
}

export function reportAssetDiagnosticsOnce(
  issues: readonly AssetValidationIssue[],
  report: (issue: AssetValidationIssue) => void,
  alreadyReported: Set<string> = defaultReportedDiagnostics,
): number {
  let emitted = 0;
  for (const issue of [...issues].sort((left, right) => (
    left.assetId.localeCompare(right.assetId)
      || left.code.localeCompare(right.code)
      || left.message.localeCompare(right.message)
  ))) {
    const key = issueKey(issue);
    if (alreadyReported.has(key)) {
      continue;
    }
    alreadyReported.add(key);
    report(issue);
    emitted += 1;
  }
  return emitted;
}

/** Reports every unregistered stable texture key once, with deterministic consumer evidence. */
export function validateVisualAssetUsage(
  references: readonly VisualAssetUsageReference[],
  definitions: readonly VisualAssetDefinition[],
): VisualAssetUsageIssue[] {
  const registered = new Set(definitions.map(({ id }) => id));
  const consumersByMissingId = new Map<string, Set<string>>();
  for (const reference of references) {
    if (registered.has(reference.assetId)) {
      continue;
    }
    const consumers = consumersByMissingId.get(reference.assetId) ?? new Set<string>();
    consumers.add(`${reference.consumerId}.${reference.field}`);
    consumersByMissingId.set(reference.assetId, consumers);
  }
  return [...consumersByMissingId.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([assetId, consumers]) => {
      const sortedConsumers = [...consumers].sort((left, right) => left.localeCompare(right));
      return {
        assetId,
        consumers: sortedConsumers,
        message: `Texture key is not registered: ${assetId} (${sortedConsumers.join(', ')})`,
      };
    });
}
