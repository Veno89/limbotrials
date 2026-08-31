import type { GameplayEffectSequenceId } from '../types/gameTypes';
import type { VvfxPlayback } from './VvfxSystem';

export type GameplayEffectRole =
  | 'initialDischarge'
  | 'beam'
  | 'targetElectricity'
  | 'impact'
  | 'finalChain';

export interface BeamFallbackDefinition {
  readonly kind: 'beam';
  readonly color: number;
  readonly width: number;
  readonly alpha: number;
  readonly durationMs: number;
}

export interface PulseFallbackDefinition {
  readonly kind: 'pulse';
  readonly color: number;
  readonly radius: number;
  readonly alpha: number;
  readonly durationMs: number;
}

export type GameplayEffectFallbackDefinition =
  | BeamFallbackDefinition
  | PulseFallbackDefinition;

export interface GameplayEffectRoleDefinition {
  readonly placement: 'point' | 'beam';
  /** Runtime filename stem. It is deliberately confined to this registry. */
  readonly runtimeEffectId?: string;
  /** Missing required exports are reported, while the code fallback stays safe. */
  readonly runtimeRequired: boolean;
  readonly optional: boolean;
  readonly baseDepth: number;
  readonly maxDurationMs: number;
  readonly beamFit?: 'stretch' | 'crop';
  readonly beamThicknessScale?: number;
  readonly fallback: GameplayEffectFallbackDefinition;
}

export interface GameplayEffectSequenceDefinition {
  readonly id: GameplayEffectSequenceId;
  readonly roles: Readonly<Record<GameplayEffectRole, GameplayEffectRoleDefinition>>;
  readonly timing: {
    readonly chainStartDelayMs: number;
    readonly chainStepDelayMs: number;
  };
  readonly targeting: {
    readonly repeatPolicy: 'never' | 'allow';
  };
  readonly feedback: {
    readonly audioCue: 'soul-bolt';
    /** Camera feedback is reserved for unusually long completed chains. */
    readonly heavyImpactAtTargets: number;
  };
}

export interface GameplayEffectRegistryIssue {
  readonly sequenceId: GameplayEffectSequenceId;
  readonly role: GameplayEffectRole;
  readonly severity: 'warn' | 'error';
  readonly message: string;
}

const TESLA_ROLES: Readonly<Record<GameplayEffectRole, GameplayEffectRoleDefinition>> = {
  initialDischarge: {
    placement: 'beam',
    runtimeEffectId: 'chain-lightning',
    runtimeRequired: true,
    optional: false,
    baseDepth: 32,
    beamFit: 'crop',
    beamThicknessScale: 0.67,
    maxDurationMs: 500,
    fallback: {
      kind: 'beam',
      color: 0xaadfff,
      width: 5,
      alpha: 0.92,
      durationMs: 130,
    },
  },
  beam: {
    placement: 'beam',
    runtimeEffectId: 'tesla-chain-link',
    runtimeRequired: true,
    optional: false,
    baseDepth: 32,
    beamFit: 'crop',
    beamThicknessScale: 0.75,
    maxDurationMs: 500,
    fallback: {
      kind: 'beam',
      color: 0x7bcfff,
      width: 4,
      alpha: 0.86,
      durationMs: 110,
    },
  },
  targetElectricity: {
    placement: 'point',
    runtimeRequired: false,
    optional: false,
    baseDepth: 34,
    maxDurationMs: 180,
    fallback: {
      kind: 'pulse',
      color: 0x69d9ff,
      radius: 25,
      alpha: 0.34,
      durationMs: 150,
    },
  },
  impact: {
    placement: 'point',
    runtimeRequired: false,
    optional: false,
    baseDepth: 35,
    maxDurationMs: 220,
    fallback: {
      kind: 'pulse',
      color: 0xb88ce1,
      radius: 42,
      alpha: 0.2,
      durationMs: 180,
    },
  },
  finalChain: {
    placement: 'point',
    runtimeRequired: false,
    optional: true,
    baseDepth: 35,
    maxDurationMs: 260,
    fallback: {
      kind: 'pulse',
      color: 0xdaf7ff,
      radius: 58,
      alpha: 0.16,
      durationMs: 230,
    },
  },
};

export const GAMEPLAY_EFFECT_SEQUENCES: Readonly<
  Record<GameplayEffectSequenceId, GameplayEffectSequenceDefinition>
> = {
  'tesla-chain': {
    id: 'tesla-chain',
    roles: TESLA_ROLES,
    timing: {
      chainStartDelayMs: 420,
      chainStepDelayMs: 70,
    },
    targeting: {
      repeatPolicy: 'never',
    },
    feedback: {
      audioCue: 'soul-bolt',
      heavyImpactAtTargets: 5,
    },
  },
};

export function getGameplayEffectSequence(
  id: GameplayEffectSequenceId,
): GameplayEffectSequenceDefinition {
  return GAMEPLAY_EFFECT_SEQUENCES[id];
}

export function validateGameplayEffectRegistry(
  playback: Pick<VvfxPlayback, 'hasEffect' | 'supportsEndpoints'>,
  registry: Readonly<Record<GameplayEffectSequenceId, GameplayEffectSequenceDefinition>> =
    GAMEPLAY_EFFECT_SEQUENCES,
): GameplayEffectRegistryIssue[] {
  const issues: GameplayEffectRegistryIssue[] = [];
  for (const sequence of Object.values(registry)) {
    for (const [roleName, role] of Object.entries(sequence.roles) as Array<
      [GameplayEffectRole, GameplayEffectRoleDefinition]
    >) {
      const expectedFallbackKind = role.placement === 'beam' ? 'beam' : 'pulse';
      if (expectedFallbackKind !== role.fallback.kind) {
        issues.push({
          sequenceId: sequence.id,
          role: roleName,
          severity: 'error',
          message: `[Effects:${sequence.id}/${roleName}] ${role.placement} placement requires a ${expectedFallbackKind} code fallback.`,
        });
      }
      if (!role.runtimeEffectId) {
        if (role.runtimeRequired) {
          issues.push({
            sequenceId: sequence.id,
            role: roleName,
            severity: 'error',
            message: `[Effects:${sequence.id}/${roleName}] A required runtime effect ID is not configured; the code fallback will be used.`,
          });
        }
        continue;
      }
      if (!playback.hasEffect(role.runtimeEffectId)) {
        issues.push({
          sequenceId: sequence.id,
          role: roleName,
          severity: role.runtimeRequired ? 'error' : 'warn',
          message: `[Effects:${sequence.id}/${roleName}] Missing runtime effect "${role.runtimeEffectId}"; the code fallback will be used.`,
        });
        continue;
      }
      if (role.placement === 'beam' && !playback.supportsEndpoints(role.runtimeEffectId)) {
        issues.push({
          sequenceId: sequence.id,
          role: roleName,
          severity: 'error',
          message: `[Effects:${sequence.id}/${roleName}] Runtime effect "${role.runtimeEffectId}" has no Beam layer; the code fallback will be used.`,
        });
      }
    }
  }
  return issues;
}
