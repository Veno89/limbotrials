import { describe, expect, it } from 'vitest';
import { createDefaultSave } from '../systems/SaveSystem';
import { RunState } from '../systems/RunState';
import { mutateUpgradeChoices } from '../systems/CursedRewardMutationSystem';
import { selectCurseChoices, selectUpgradeChoices } from '../systems/UpgradeSystem';
import { EVOLUTION_READY_LEVEL, MAX_WEAPON_LEVEL, type UpgradeId, type WeaponId } from '../types/gameTypes';
import { WEAPONS } from '../data/weapons';
import { UPGRADES } from '../data/upgrades';

function selectionContext(run: RunState, playerLevel: number) {
  return {
    stacks: run.upgrades.stacks,
    equippedWeapons: run.weapons.equipped,
    weaponLevels: run.weapons.getLevels(),
    playerLevel,
    shieldSource: run.stats.current.shieldInterval > 0 || run.resources.shield > 0,
    curseLevel: run.curse.snapshot().level,
  };
}

function seededRandom(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

describe('categorized upgrade system', () => {
  it('defines unlock, level, and evolution progression for every weapon', () => {
    expect(Object.keys(WEAPONS)).toHaveLength(24);
    for (const weapon of Object.values(WEAPONS)) {
      const progression = Object.values(UPGRADES).filter((upgrade) => upgrade.targetWeapon === weapon.id);
      expect(Object.values(UPGRADES).some((upgrade) => upgrade.unlockWeapon === weapon.id)).toBe(
        weapon.id !== 'bone-scythe',
      );
      expect(progression.some((upgrade) => upgrade.category === 'weapon-level')).toBe(true);
      expect(progression.some((upgrade) => upgrade.category === 'weapon-evolution')).toBe(true);
      if (!['gravetide-repeater', 'saintbreaker-pike', 'ashen-orbit', 'choir-of-teeth', 'eclipse-brand'].includes(weapon.id)) {
        expect(progression.some((upgrade) => upgrade.category === 'weapon-upgrade')).toBe(true);
      }
    }
  });

  it('starts with Bone Scythe and enforces the five-weapon cap', () => {
    const run = new RunState(createDefaultSave());
    expect([...run.weapons.equipped]).toEqual(['bone-scythe']);
    expect(run.weapons.add('soul-bolt')).toBe(true);
    expect(run.weapons.add('hellfire-sigil')).toBe(true);
    expect(run.weapons.add('grave-lance')).toBe(true);
    expect(run.weapons.add('wailing-shards')).toBe(true);
    expect(run.weapons.add('cinder-reliquary')).toBe(false);
    expect(run.weapons.equipped.size).toBe(5);
  });

  it('applies weapon-specific levels and upgrades', () => {
    const run = new RunState(createDefaultSave());
    const before = { ...run.weapons.getState('bone-scythe').stats };

    expect(run.upgrades.apply('level-bone-scythe')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(2);
    expect(run.weapons.getState('bone-scythe').stats.damage).toBeGreaterThan(before.damage);

    expect(run.upgrades.apply('bone-scythe-area')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(3);
    expect(run.weapons.getState('bone-scythe').stats.area).toBeGreaterThan(before.area);
  });

  it('adds a longer pre-evolution progression and offers evolution at readiness', () => {
    const run = new RunState(createDefaultSave());
    for (let index = 1; index < EVOLUTION_READY_LEVEL; index += 1) {
      expect(run.upgrades.apply('level-bone-scythe')).toBe(true);
    }
    expect(run.weapons.getState('bone-scythe').level).toBe(EVOLUTION_READY_LEVEL);
    expect(run.upgrades.apply('level-bone-scythe')).toBe(false);
    expect(run.upgrades.apply('bone-scythe-area')).toBe(false);

    const choices = selectUpgradeChoices(selectionContext(run, 10), seededRandom(2), 3);
    expect(choices[0]?.id).toBe('evolve-bone-scythe');
    expect(run.upgrades.apply('evolve-bone-scythe')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(MAX_WEAPON_LEVEL);

    const evolvedArea = run.weapons.getState('bone-scythe').stats.area;
    expect(run.upgrades.apply('bone-scythe-area')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(MAX_WEAPON_LEVEL);
    expect(run.weapons.getState('bone-scythe').stats.area).toBeGreaterThan(evolvedArea);
  });

  it('keeps Bone Scythe baseline restrained so its character talents stay meaningful', () => {
    expect(WEAPONS['bone-scythe'].baseStats.damage).toBe(36);
    expect(WEAPONS['bone-scythe'].baseStats.cooldownMs).toBe(1500);
    expect(WEAPONS['bone-scythe'].baseStats.range).toBe(150);
  });

  it('advances weapon level when choosing a focused weapon upgrade', () => {
    const run = new RunState(createDefaultSave());
    expect(run.upgrades.apply('bone-scythe-crit')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(2);
  });

  it('offers remaining focused upgrades after evolution without offering more levels', () => {
    const run = new RunState(createDefaultSave());
    for (let index = 1; index < EVOLUTION_READY_LEVEL; index += 1) {
      expect(run.upgrades.apply('level-bone-scythe')).toBe(true);
    }
    expect(run.upgrades.apply('evolve-bone-scythe')).toBe(true);

    const choices = selectUpgradeChoices(selectionContext(run, 14), seededRandom(8), 100);
    expect(choices.some((choice) => choice.id === 'bone-scythe-area')).toBe(true);
    expect(choices.some((choice) => choice.id === 'bone-scythe-crit')).toBe(true);
    expect(choices.some((choice) => choice.id === 'level-bone-scythe')).toBe(false);
    expect(choices.some((choice) => choice.id === 'evolve-bone-scythe')).toBe(false);
  });

  it('defines one-stack cadence tradeoffs for the remaining identity weapons', () => {
    const tradeoffs = [
      UPGRADES['bone-scythe-committed-reap'],
      UPGRADES['wailing-shards-fractured-choir'],
      UPGRADES['cinder-reliquary-funeral-furnace'],
      UPGRADES['ashen-longbow-full-draw'],
    ];

    expect(tradeoffs.every((upgrade) => upgrade.category === 'weapon-upgrade')).toBe(true);
    expect(tradeoffs.every((upgrade) => upgrade.rarity === 'rare')).toBe(true);
    expect(tradeoffs.every((upgrade) => upgrade.maxStacks === 1)).toBe(true);
    expect(
      tradeoffs.every((upgrade) =>
        upgrade.weaponModifiers?.some((modifier) => modifier.stat === 'cooldownMs' && modifier.value > 1),
      ),
    ).toBe(true);
  });

  it('applies Committed Reaping as a stronger, larger, slower sweep', () => {
    const run = new RunState(createDefaultSave());
    const before = { ...run.weapons.getState('bone-scythe').stats };

    expect(run.upgrades.apply('bone-scythe-committed-reap')).toBe(true);
    const after = run.weapons.getState('bone-scythe');
    expect(after.level).toBe(2);
    expect(after.stats.damage).toBeGreaterThan(before.damage * 1.5);
    expect(after.stats.area).toBeGreaterThan(before.area * 1.15);
    expect(after.stats.cooldownMs).toBeCloseTo(before.cooldownMs * 1.35);
    expect(run.upgrades.apply('bone-scythe-committed-reap')).toBe(false);
    expect(run.upgrades.stacks.get('bone-scythe-committed-reap')).toBe(1);
  });

  it('preserves Longbow volley count through normal levels and changes it only through volley upgrades', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('ashen-longbow')).toBe(true);
    const baseCount = run.weapons.getState('ashen-longbow').stats.projectileCount;

    expect(run.upgrades.apply('level-ashen-longbow')).toBe(true);
    expect(run.weapons.getState('ashen-longbow').stats.projectileCount).toBe(baseCount);
    expect(run.upgrades.apply('ashen-longbow-volley')).toBe(true);
    expect(run.weapons.getState('ashen-longbow').stats.projectileCount).toBe(baseCount + 2);
  });

  it('turns Full Draw into a visibly heavier and slower fixed volley', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('ashen-longbow')).toBe(true);
    const before = { ...run.weapons.getState('ashen-longbow').stats };

    expect(run.upgrades.apply('ashen-longbow-full-draw')).toBe(true);
    const after = run.weapons.getState('ashen-longbow');
    expect(after.level).toBe(2);
    expect(after.stats.damage).toBeGreaterThan(before.damage * 1.6);
    expect(after.stats.projectileSize).toBeCloseTo(before.projectileSize * 1.25);
    expect(after.stats.projectileCount).toBe(before.projectileCount);
    expect(after.stats.cooldownMs).toBeCloseTo(before.cooldownMs * 1.45);
  });

  it('defines focused authored weapon effects without a generic script payload', () => {
    expect(UPGRADES['bone-scythe-crimson-harvest']).toMatchObject({
      category: 'weapon-upgrade',
      maxStacks: 1,
      targetWeapon: 'bone-scythe',
      weaponEffect: 'bone-scythe-crimson-harvest',
      iconTexture: 'status-bleed',
    });
    expect(UPGRADES['soul-bolt-splintering-memory']).toMatchObject({
      category: 'weapon-upgrade',
      maxStacks: 1,
      targetWeapon: 'soul-bolt',
      weaponEffect: 'soul-bolt-splintering-memory',
    });
    expect(UPGRADES['hellfire-spreading-sentence']).toMatchObject({
      category: 'weapon-upgrade',
      maxStacks: 1,
      targetWeapon: 'hellfire-sigil',
      weaponEffect: 'hellfire-spreading-sentence',
    });
    expect(UPGRADES['dirge-staff-echoed-rites']).toMatchObject({
      category: 'weapon-upgrade',
      maxStacks: 1,
      targetWeapon: 'dirge-staff',
      weaponEffect: 'dirge-staff-echoed-rites',
    });
  });

  it('applies a focused runtime effect choice and advances only its equipped weapon', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('soul-bolt')).toBe(true);

    expect(run.upgrades.apply('soul-bolt-splintering-memory')).toBe(true);
    expect(run.upgrades.has('soul-bolt-splintering-memory')).toBe(true);
    expect(run.upgrades.hasWeaponEffect('soul-bolt-splintering-memory')).toBe(true);
    expect(run.weapons.getState('soul-bolt').level).toBe(2);
    expect(run.weapons.getState('bone-scythe').level).toBe(1);
    expect(run.upgrades.apply('soul-bolt-splintering-memory')).toBe(false);
  });

  it('applies Crimson Harvest as a Bone Scythe status upgrade', () => {
    const run = new RunState(createDefaultSave());

    expect(run.upgrades.apply('bone-scythe-crimson-harvest')).toBe(true);
    expect(run.upgrades.hasWeaponEffect('bone-scythe-crimson-harvest')).toBe(true);
    expect(run.weapons.getState('bone-scythe').level).toBe(2);
    expect(run.upgrades.apply('bone-scythe-crimson-harvest')).toBe(false);
  });

  it('applies authored focused effects to evolved weapons without advancing beyond level seven', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('soul-bolt')).toBe(true);
    for (let index = 1; index < EVOLUTION_READY_LEVEL; index += 1) {
      expect(run.upgrades.apply('level-soul-bolt')).toBe(true);
    }
    expect(run.upgrades.apply('evolve-soul-bolt')).toBe(true);

    expect(run.upgrades.apply('soul-bolt-splintering-memory')).toBe(true);
    expect(run.weapons.getState('soul-bolt').level).toBe(MAX_WEAPON_LEVEL);
    expect(run.upgrades.hasWeaponEffect('soul-bolt-splintering-memory')).toBe(true);
  });

  it('makes Bloodletter projectile count improve both forms through one typed stat', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('bloodletter-axe')).toBe(true);

    expect(run.upgrades.apply('bloodletter-axe-count')).toBe(true);
    expect(run.weapons.getState('bloodletter-axe').stats.projectileCount).toBe(2);
    expect(UPGRADES['bloodletter-axe-count']).toMatchObject({
      maxStacks: 2,
      targetWeapon: 'bloodletter-axe',
      weaponModifiers: [{ stat: 'projectileCount', mode: 'add', value: 1 }],
    });
  });

  it('lets Poison Flask widen pools and throw extra bottles through focused upgrades', () => {
    const run = new RunState(createDefaultSave());
    expect(run.weapons.add('poison-flask')).toBe(true);
    const before = { ...run.weapons.getState('poison-flask').stats };

    expect(run.upgrades.apply('poison-flask-area')).toBe(true);
    expect(run.weapons.getState('poison-flask').level).toBe(2);
    expect(run.weapons.getState('poison-flask').stats.area).toBeGreaterThan(before.area);

    expect(run.upgrades.apply('poison-flask-count')).toBe(true);
    expect(run.weapons.getState('poison-flask').stats.projectileCount).toBe(before.projectileCount + 1);
    expect(run.weapons.getState('poison-flask').stats.cooldownMs).toBeCloseTo(before.cooldownMs * 1.12);
  });

  it('tracks per-weapon run results', () => {
    const run = new RunState(createDefaultSave());
    run.weapons.recordHit('bone-scythe', 42, true, true, false);
    run.weapons.recordHit('bone-scythe', 18, false, false, false);
    expect(run.summary(false).weaponResults[0]).toEqual({
      id: 'bone-scythe',
      damage: 60,
      kills: 1,
      hits: 2,
      criticalHits: 1,
      bossDamage: 0,
      dps: 60,
    });
  });

  it('only offers weapon-specific progression for equipped weapons', () => {
    const run = new RunState(createDefaultSave());
    const choices = selectUpgradeChoices(selectionContext(run, 8), seededRandom(4), 100);
    const forbidden = new Set<UpgradeId>([
      'level-soul-bolt',
      'soul-bolt-projectiles',
      'level-grave-lance',
      'grave-lance-pierce',
      'level-poison-flask',
      'poison-flask-area',
      'poison-flask-count',
    ]);
    expect(choices.some((choice) => forbidden.has(choice.id))).toBe(false);
  });

  it('weights new weapons more heavily during early levels', () => {
    const earlyRun = new RunState(createDefaultSave());
    const lateRun = new RunState(createDefaultSave());
    let earlyWeapons = 0;
    let lateWeapons = 0;

    for (let roll = 0; roll < 100; roll += 1) {
      const random = () => (roll + 0.5) / 100;
      earlyWeapons += selectUpgradeChoices(selectionContext(earlyRun, 2), random, 1).filter(
        (choice) => choice.category === 'weapon',
      ).length;
      lateWeapons += selectUpgradeChoices(selectionContext(lateRun, 10), random, 1).filter(
        (choice) => choice.category === 'weapon',
      ).length;
    }

    expect(earlyWeapons).toBeGreaterThan(lateWeapons);
  });

  it('offers no more than one new weapon on the same screen', () => {
    const run = new RunState(createDefaultSave());
    const choices = selectUpgradeChoices(selectionContext(run, 2), seededRandom(3), 100);
    expect(choices.filter((choice) => choice.category === 'weapon')).toHaveLength(1);
  });

  it('stops offering new weapons at the cap', () => {
    const run = new RunState(createDefaultSave());
    for (const weapon of ['soul-bolt', 'hellfire-sigil', 'grave-lance', 'wailing-shards'] as WeaponId[]) {
      run.weapons.add(weapon);
    }
    const choices = selectUpgradeChoices(selectionContext(run, 2), seededRandom(7), 100);
    expect(choices.some((choice) => choice.category === 'weapon')).toBe(false);
  });

  it('keeps curses out of normal choices and offers them through their own pool', () => {
    const run = new RunState(createDefaultSave());
    const context = selectionContext(run, 6);
    expect(selectUpgradeChoices(context, seededRandom(5), 100).some((choice) => choice.category === 'curse')).toBe(
      false,
    );
    expect(selectCurseChoices(context, seededRandom(5), 3).every((choice) => choice.category === 'curse')).toBe(
      true,
    );
  });

  it('applies curse tradeoffs and limits rerolls', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.allocations['haunted-echo-notable-1'] = 1;
    const run = new RunState(save);
    expect(run.resources.rerolls).toBe(2);
    expect(run.upgrades.apply('curse-blood-price')).toBe(true);
    expect(run.stats.current.damage).toBeGreaterThan(1);
    expect(run.stats.current.maxHealth).toBeLessThan(100);
    expect(run.resources.useReroll()).toBe(true);
    expect(run.resources.useReroll()).toBe(true);
    expect(run.resources.useReroll()).toBe(false);
  });

  it('records authored cursed upgrades as structured analytics', () => {
    const run = new RunState(createDefaultSave());

    expect(run.upgrades.apply('curse-blood-price')).toBe(true);

    expect(run.summary(false).balance.cursedRewards[0]).toMatchObject({
      sourceKind: 'upgrade',
      sourceId: 'curse-blood-price',
      baseId: 'curse-blood-price',
      generated: false,
      name: 'Blood Price',
      pattern: 'blood-price',
      curseGain: 8,
      curseBefore: 0,
      curseAfter: 8,
      tierBefore: 'unmarked',
      tierAfter: 'touched',
      crossedTiers: ['touched'],
    });
  });

  it('records generated cursed upgrade variants as structured analytics', () => {
    const run = new RunState(createDefaultSave());
    run.upgrades.apply('curse-blood-price');
    const [choice] = mutateUpgradeChoices([UPGRADES['stat-pickup']], run.curse.snapshot(), 'standard', () => 0);

    expect(choice?.curse?.pattern).toBe('greed-mark');
    expect(choice ? run.upgrades.applyChoice(choice).applied : false).toBe(true);

    expect(run.summary(false).balance.cursedRewards.at(-1)).toMatchObject({
      sourceKind: 'upgrade',
      sourceId: 'stat-pickup',
      baseId: 'stat-pickup',
      generated: true,
      pattern: 'greed-mark',
      curseGain: 7,
      curseBefore: 8,
      curseAfter: 15,
      tierBefore: 'touched',
      tierAfter: 'touched',
      crossedTiers: [],
    });
  });

  it('keeps shield conversion out of offers until a shield source exists', () => {
    const run = new RunState(createDefaultSave());

    expect(
      selectUpgradeChoices(selectionContext(run, 8), seededRandom(11), 100).some(
        (choice) => choice.id === 'stat-bulwark-pyre',
      ),
    ).toBe(false);

    expect(run.artifacts.apply('reinforced-buckler')).toBe(true);
    expect(
      selectUpgradeChoices(selectionContext(run, 8), seededRandom(11), 100).some(
        (choice) => choice.id === 'stat-bulwark-pyre',
      ),
    ).toBe(true);
  });
});
