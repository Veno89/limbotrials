import { describe, expect, it } from 'vitest';
import {
  planTeslaChain,
  selectTeslaTarget,
  type TeslaChainCandidate,
} from '../systems/weapons/teslaChainRules';

interface Target {
  id: string;
}

function candidate(id: string, x: number, y: number): TeslaChainCandidate<Target> {
  return {
    target: { id },
    stableId: id,
    position: { x, y },
  };
}

describe('Tesla chain rules', () => {
  it('uses stable IDs to break equal-distance ties independent of input order', () => {
    const alpha = candidate('alpha', -10, 0);
    const beta = candidate('beta', 10, 0);

    expect(selectTeslaTarget({ x: 0, y: 0 }, [beta, alpha], 10, new Set(), 'never')).toBe(alpha);
    expect(selectTeslaTarget({ x: 0, y: 0 }, [alpha, beta], 10, new Set(), 'never')).toBe(alpha);
  });

  it('treats the configured range as inclusive', () => {
    const edge = candidate('edge', 3, 4);

    expect(selectTeslaTarget({ x: 0, y: 0 }, [edge], 5, new Set(), 'never')).toBe(edge);
    expect(selectTeslaTarget({ x: 0, y: 0 }, [edge], 4.99, new Set(), 'never')).toBeUndefined();
  });

  it('applies separate initial and hop ranges with a strict maximum', () => {
    const first = candidate('first', 8, 0);
    const second = candidate('second', 13, 0);
    const tooFarFromSecond = candidate('third', 30, 0);

    const plan = planTeslaChain({ x: 0, y: 0 }, [tooFarFromSecond, second, first], {
      initialRange: 10,
      hopRange: 6,
      maxTargets: 5,
      repeatPolicy: 'never',
    });

    expect(plan.map((segment) => segment.target.stableId)).toEqual(['first', 'second']);
    expect(plan[1]?.source?.stableId).toBe('first');
  });

  it('makes repeat policy explicit and remains bounded by maxTargets', () => {
    const only = candidate('only', 2, 0);

    expect(planTeslaChain({ x: 0, y: 0 }, [only], {
      initialRange: 4,
      hopRange: 4,
      maxTargets: 3,
      repeatPolicy: 'never',
    })).toHaveLength(1);
    expect(planTeslaChain({ x: 0, y: 0 }, [only], {
      initialRange: 4,
      hopRange: 4,
      maxTargets: 3,
      repeatPolicy: 'allow',
    })).toHaveLength(3);
  });
});
