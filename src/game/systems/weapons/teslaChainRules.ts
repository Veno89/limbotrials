import type { VvfxPoint } from '../../vfx/VvfxSystem';

export type TeslaRepeatPolicy = 'never' | 'allow';

export interface TeslaChainCandidate<T> {
  readonly target: T;
  readonly position: VvfxPoint;
  /** Stable within a run; used only after distance for deterministic ties. */
  readonly stableId: string;
}

export interface TeslaChainRules {
  readonly initialRange: number;
  readonly hopRange: number;
  readonly maxTargets: number;
  readonly repeatPolicy: TeslaRepeatPolicy;
}

export interface TeslaChainSegment<T> {
  readonly source?: TeslaChainCandidate<T>;
  readonly target: TeslaChainCandidate<T>;
  readonly index: number;
}

function distanceSquared(left: VvfxPoint, right: VvfxPoint): number {
  const dx = left.x - right.x;
  const dy = left.y - right.y;
  return dx * dx + dy * dy;
}

/**
 * Pure target selection. Range is inclusive, and equal-distance candidates are
 * ordered by stable ID rather than spatial-grid traversal order.
 */
export function selectTeslaTarget<T>(
  origin: VvfxPoint,
  candidates: readonly TeslaChainCandidate<T>[],
  range: number,
  visited: ReadonlySet<T>,
  repeatPolicy: TeslaRepeatPolicy,
): TeslaChainCandidate<T> | undefined {
  if (!Number.isFinite(range) || range < 0) {
    return undefined;
  }
  const rangeSquared = range * range;
  return candidates
    .filter((candidate) =>
      (repeatPolicy === 'allow' || !visited.has(candidate.target)) &&
      distanceSquared(origin, candidate.position) <= rangeSquared,
    )
    .sort((left, right) => {
      const distanceDifference =
        distanceSquared(origin, left.position) - distanceSquared(origin, right.position);
      if (distanceDifference !== 0) {
        return distanceDifference;
      }
      return left.stableId < right.stableId
        ? -1
        : left.stableId > right.stableId
          ? 1
          : 0;
    })[0];
}

export function planTeslaChain<T>(
  origin: VvfxPoint,
  candidates: readonly TeslaChainCandidate<T>[],
  rules: TeslaChainRules,
): TeslaChainSegment<T>[] {
  const targetLimit = Number.isFinite(rules.maxTargets)
    ? Math.max(0, Math.floor(rules.maxTargets))
    : 0;
  const visited = new Set<T>();
  const segments: TeslaChainSegment<T>[] = [];
  let currentOrigin = origin;
  let source: TeslaChainCandidate<T> | undefined;

  for (let index = 0; index < targetLimit; index += 1) {
    const target = selectTeslaTarget(
      currentOrigin,
      candidates,
      index === 0 ? rules.initialRange : rules.hopRange,
      visited,
      rules.repeatPolicy,
    );
    if (!target) {
      break;
    }
    segments.push({ source, target, index });
    visited.add(target.target);
    source = target;
    currentOrigin = target.position;
  }

  return segments;
}
