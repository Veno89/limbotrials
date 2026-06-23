import { describe, expect, it } from 'vitest';
import { TALENT_NODES, TALENT_POINT_THRESHOLDS, talentPointsForLegacySouls } from '../data/talentTree';
import { createDefaultSave } from '../systems/SaveSystem';
import {
  allocateTalentNode,
  availableTalentPoints,
  pathTalentPoints,
  refundCharacterTalents,
  sanitizeTalentProgress,
} from '../systems/TalentTreeSystem';
import { RunState } from '../systems/RunState';

describe('talent tree system', () => {
  it('defines a large character-specific tree with three paths per character', () => {
    expect(Object.values(TALENT_NODES)).toHaveLength(99);
    expect(Object.values(TALENT_NODES).filter((node) => node.characterId === 'haunted')).toHaveLength(33);
    expect(Object.values(TALENT_NODES).filter((node) => node.characterId === 'the-penitent')).toHaveLength(33);
    expect(Object.values(TALENT_NODES).filter((node) => node.characterId === 'ashwalker')).toHaveLength(33);
  });

  it('grants talent points from character legacy souls', () => {
    expect(talentPointsForLegacySouls(0)).toBe(0);
    expect(talentPointsForLegacySouls(TALENT_POINT_THRESHOLDS[0]!)).toBe(1);
    expect(talentPointsForLegacySouls(TALENT_POINT_THRESHOLDS.at(-1)!)).toBe(32);
  });

  it('enforces prerequisites, path depth, available points, and refunding', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.legacySouls = TALENT_POINT_THRESHOLDS[5]!;

    expect(allocateTalentNode(save, 'haunted-reaper-left-1')).toMatchObject({
      allowed: false,
      reason: 'A connected prerequisite is missing.',
    });

    expect(allocateTalentNode(save, 'haunted-reaper-root').allowed).toBe(true);
    expect(allocateTalentNode(save, 'haunted-reaper-left-1')).toMatchObject({
      allowed: false,
      reason: 'Requires 3 points in Reaper.',
    });

    expect(allocateTalentNode(save, 'haunted-reaper-root').allowed).toBe(true);
    expect(allocateTalentNode(save, 'haunted-reaper-root').allowed).toBe(true);
    expect(allocateTalentNode(save, 'haunted-reaper-left-1').allowed).toBe(true);
    expect(pathTalentPoints(save, 'haunted', 'haunted-reaper')).toBe(4);
    expect(availableTalentPoints(save, 'haunted')).toBe(2);

    refundCharacterTalents(save, 'haunted');
    expect(pathTalentPoints(save, 'haunted', 'haunted-reaper')).toBe(0);
    expect(availableTalentPoints(save, 'haunted')).toBe(6);
  });

  it('enforces mutually exclusive choice pairs', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.legacySouls = TALENT_POINT_THRESHOLDS[15]!;
    save.talentProgress.haunted.allocations = {
      'haunted-remnant-root': 5,
      'haunted-remnant-left-1': 3,
      'haunted-remnant-middle': 5,
    };

    expect(allocateTalentNode(save, 'haunted-remnant-choice-a').allowed).toBe(true);
    expect(allocateTalentNode(save, 'haunted-remnant-choice-b')).toMatchObject({
      allowed: false,
      reason: 'Another choice in this pair is already selected.',
    });
  });

  it('sanitizes invalid stored allocations', () => {
    const progress = sanitizeTalentProgress({
      haunted: {
        legacySouls: 1000,
        allocations: {
          'haunted-reaper-root': 99,
          'ashwalker-ember-root': 1,
          unknown: 1,
        },
      },
    });

    expect(progress.haunted.legacySouls).toBe(1000);
    expect(progress.haunted.allocations['haunted-reaper-root']).toBe(5);
    expect(progress.haunted.allocations['ashwalker-ember-root']).toBeUndefined();
  });

  it('applies targeted weapon talents and run-start effects through RunState', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.allocations = {
      'haunted-reaper-root': 2,
      'haunted-remnant-capstone': 1,
      'haunted-echo-notable-1': 1,
      'haunted-remnant-choice-b': 1,
    };

    const run = new RunState(save);

    expect(run.stats.current.damage).toBe(1);
    expect(run.weapons.getState('bone-scythe').stats.damage).toBeGreaterThan(36);
    expect(run.upgrades.getChoiceCount()).toBe(4);
    expect(run.resources.rerolls).toBe(2);
    expect(run.resources.shield).toBe(30);
  });

  it('builds the approved Reaper combat profile without leaking bonuses to other weapons', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.allocations = {
      'haunted-reaper-root': 5,
      'haunted-reaper-right-1': 3,
      'haunted-reaper-notable-1': 1,
      'haunted-reaper-choice-b': 1,
      'haunted-reaper-notable-2': 1,
      'haunted-reaper-deep-left': 3,
      'haunted-reaper-deep-right': 3,
    };

    const run = new RunState(save);
    const scythe = run.weapons.getState('bone-scythe').stats;
    run.weapons.add('soul-bolt');
    const soulBolt = run.weapons.getState('soul-bolt').stats;

    expect(scythe.damage).toBeGreaterThan(36);
    expect(scythe.cooldownMs).toBeLessThan(1500);
    expect(scythe.area).toBeLessThan(150);
    expect(scythe.critChance).toBeCloseTo(0.06);
    expect(scythe.critDamage).toBeCloseTo(0.36);
    expect(soulBolt).toMatchObject({ damage: 18, cooldownMs: 500, area: 100 });
    expect(run.boneScythe.getProfile()).toMatchObject({
      fullHealthDamageMultiplier: 1.6,
      consumeBleed: true,
      wakeDamageScale: 0.36,
      executionHealthThreshold: 0.3,
      executionDamageMultiplier: 1.45,
    });
  });

  it('configures Harvest Steps, Crooked Reach, and fifth-reap Grave Procession', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.allocations = {
      'haunted-reaper-left-1': 3,
      'haunted-reaper-middle': 5,
      'haunted-reaper-choice-a': 1,
    };

    const run = new RunState(save);

    const profile = run.boneScythe.getProfile();
    expect(profile.harvestStepsChance).toBeCloseTo(0.15);
    expect(profile.harvestStepsMoveSpeedMultiplier).toBeCloseTo(1.15);
    expect(profile.crookedReachRanks).toBe(5);
    expect(profile.graveProcessionInterval).toBe(5);
  });

  it('turns the Haunted Reaper capstone into a full-circle Bone Scythe reap', () => {
    const save = createDefaultSave();
    save.talentProgress.haunted.allocations = { 'haunted-reaper-capstone': 1 };

    const run = new RunState(save);

    expect(TALENT_NODES['haunted-reaper-capstone'].effect).toBe('bone-scythe-full-circle');
    expect(run.boneScythe.hasFullCircle()).toBe(true);
  });
});
