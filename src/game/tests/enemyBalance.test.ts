import { describe, expect, it } from 'vitest';
import { ENEMIES } from '../data/enemies';

describe('enemy balance', () => {
  it('keeps fodder contact damage below specialist contact damage', () => {
    expect(ENEMIES['lost-soul'].contactDamage).toBe(6);
    expect(ENEMIES['bone-crawler'].contactDamage).toBe(4);
    expect(ENEMIES['lost-soul'].contactDamage).toBeLessThan(ENEMIES.wraith.contactDamage);
    expect(ENEMIES['bone-crawler'].contactDamage).toBeLessThan(ENEMIES['void-caster'].contactDamage);
  });

  it('makes later replacements sturdier and more rewarding than opening fodder', () => {
    expect(ENEMIES['flayed-wanderer'].maxHealth).toBeGreaterThan(ENEMIES['lost-soul'].maxHealth);
    expect(ENEMIES['lantern-ghost'].maxHealth).toBeGreaterThan(ENEMIES.wraith.maxHealth);
    expect(ENEMIES['gravebound-archer'].xp).toBeGreaterThan(ENEMIES['bone-crawler'].xp);
    expect(ENEMIES['sentinel-of-woe'].elite).toBe(true);
    expect(ENEMIES['sentinel-of-woe'].maxHealth).toBeGreaterThan(ENEMIES['condemned-brute'].maxHealth);
  });
});
