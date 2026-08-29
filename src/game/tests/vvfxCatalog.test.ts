import { describe, expect, it } from 'vitest';
import chainLightning from '../vfx/effects/chain-lightning.vvfx-runtime.json';
import meteorStrike from '../vfx/effects/meteor-strike.vvfx-runtime.json';
import teslaChainLink from '../vfx/effects/tesla-chain-link.vvfx-runtime.json';
import {
  createVvfxCatalog,
  effectIdFromRuntimePath,
  supportsBeamEndpoints,
} from '../vfx/VvfxCatalog';
import { discoveredVvfxCatalog } from '../vfx/discoveredVvfxCatalog';

describe('VvfxCatalog', () => {
  it('auto-discovers the authored weapon effects with the right placement capability', () => {
    expect(discoveredVvfxCatalog.issues).toEqual([]);
    expect(discoveredVvfxCatalog.effects.get('chain-lightning')).toMatchObject({
      supportsEndpoints: true,
      definition: { name: 'Chain Lightning', formatVersion: 16 },
    });
    expect(discoveredVvfxCatalog.effects.get('tesla-chain-link')).toMatchObject({
      supportsEndpoints: true,
      definition: { formatVersion: 16 },
    });
    expect(discoveredVvfxCatalog.effects.get('meteor-strike')).toMatchObject({
      supportsEndpoints: false,
      definition: { name: 'Meteor Strike', formatVersion: 16 },
    });
  });

  it('uses the runtime file name as a stable effect ID', () => {
    expect(
      effectIdFromRuntimePath('./effects/chain-lightning.vvfx-runtime.json'),
    ).toBe('chain-lightning');
    expect(effectIdFromRuntimePath('C:\\effects\\impact.vvfx-runtime.json')).toBe(
      'impact',
    );
    expect(effectIdFromRuntimePath('./effects/not-runtime.json')).toBeUndefined();
  });

  it('validates and normalizes discovered exports', () => {
    const catalog = createVvfxCatalog({
      './effects/chain-lightning.vvfx-runtime.json': chainLightning,
      './effects/meteor-strike.vvfx-runtime.json': meteorStrike,
      './effects/tesla-chain-link.vvfx-runtime.json': teslaChainLink,
    });

    expect(catalog.issues).toEqual([]);
    expect(catalog.effects.get('chain-lightning')).toMatchObject({
      id: 'chain-lightning',
      supportsEndpoints: true,
      definition: {
        format: 'vvfx-runtime',
        formatVersion: 16,
        name: 'Chain Lightning',
      },
    });
    expect(catalog.effects.get('tesla-chain-link')).toMatchObject({
      id: 'tesla-chain-link',
      supportsEndpoints: true,
      definition: { format: 'vvfx-runtime', formatVersion: 16 },
    });
    expect(catalog.effects.get('meteor-strike')).toMatchObject({
      id: 'meteor-strike',
      supportsEndpoints: false,
      definition: {
        format: 'vvfx-runtime',
        formatVersion: 16,
        name: 'Meteor Strike',
      },
    });
  });

  it('reports invalid exports and case-insensitive ID collisions', () => {
    const catalog = createVvfxCatalog({
      './effects/broken.vvfx-runtime.json': { format: 'something-else' },
      './effects/chain-lightning.vvfx-runtime.json': chainLightning,
      './nested/CHAIN-LIGHTNING.vvfx-runtime.json': chainLightning,
    });

    expect(catalog.effects.size).toBe(1);
    expect(catalog.issues).toHaveLength(2);
    expect(catalog.issues.map((issue) => issue.message).join(' ')).toContain(
      'not a Vvfx runtime definition',
    );
    expect(catalog.issues.map((issue) => issue.message).join(' ')).toContain(
      'case-insensitive',
    );
  });

  it('only advertises endpoint fitting when a Beam layer exists', () => {
    const withBeam = createVvfxCatalog({
      './effects/chain-lightning.vvfx-runtime.json': chainLightning,
    }).effects.get('chain-lightning')!;
    const withoutBeam = {
      ...withBeam.definition,
      layers: withBeam.definition.layers.map((layer) => ({
        ...layer,
        type: 'animated' as const,
      })),
    };

    expect(supportsBeamEndpoints(withoutBeam)).toBe(false);
    expect(supportsBeamEndpoints(withBeam.definition)).toBe(true);
  });
});
