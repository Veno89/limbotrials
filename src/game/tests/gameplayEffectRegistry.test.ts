import { describe, expect, it, vi } from 'vitest';
import { WEAPONS } from '../data/weapons';
import {
  GAMEPLAY_EFFECT_SEQUENCES,
  getGameplayEffectSequence,
  validateGameplayEffectRegistry,
} from '../vfx/GameplayEffectRegistry';
import { discoveredVvfxCatalog } from '../vfx/discoveredVvfxCatalog';

function discoveredPlayback() {
  return {
    hasEffect: (id: string) => discoveredVvfxCatalog.effects.has(id),
    supportsEndpoints: (id: string) =>
      discoveredVvfxCatalog.effects.get(id)?.supportsEndpoints ?? false,
  };
}

describe('gameplay effect registry', () => {
  it('maps every Tesla role while weapon data owns only the semantic sequence ID', () => {
    const sequence = getGameplayEffectSequence('tesla-chain');

    expect(WEAPONS['tesla-coil'].presentationId).toBe('tesla-chain');
    expect(sequence.roles).toMatchObject({
      initialDischarge: { placement: 'beam', runtimeEffectId: 'chain-lightning' },
      beam: { placement: 'beam', runtimeEffectId: 'tesla-chain-link' },
      targetElectricity: { placement: 'point' },
      impact: { placement: 'point' },
      finalChain: { placement: 'point', optional: true },
    });
    expect(Object.keys(sequence.roles)).toEqual([
      'initialDischarge',
      'beam',
      'targetElectricity',
      'impact',
      'finalChain',
    ]);
  });

  it('has all required runtime dependencies and Beam capabilities in the discovered catalog', () => {
    expect(validateGameplayEffectRegistry(discoveredPlayback())).toEqual([]);
  });

  it('reports missing and non-Beam dependencies while preserving fallback definitions', () => {
    const missingPlayback = {
      hasEffect: vi.fn((id: string) => id === 'chain-lightning'),
      supportsEndpoints: vi.fn(() => false),
    };

    const issues = validateGameplayEffectRegistry(missingPlayback);

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: 'initialDischarge', severity: 'error' }),
        expect.objectContaining({ role: 'beam', severity: 'error' }),
      ]),
    );
    expect(
      Object.values(GAMEPLAY_EFFECT_SEQUENCES['tesla-chain'].roles).every(
        (role) => Boolean(role.fallback),
      ),
    ).toBe(true);
  });
});
