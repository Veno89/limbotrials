import type { RunState } from '../RunState';
import { ARTIFACTS } from '../../data/artifacts';
import { SPECIAL_EFFECT_HANDLERS } from '../SpecialEffectHandlers';
import type { ArtifactId, ArtifactDefinition, ArtifactEffectId, AppliedRewardResult } from '../../types/gameTypes';

export class ArtifactManager {
  public readonly collected = new Set<ArtifactId>();
  public readonly definitions = new Map<ArtifactId, ArtifactDefinition>();
  private readonly activeEffects = new Set<ArtifactEffectId>();

  constructor(private readonly run: RunState) {}

  apply(id: ArtifactId): boolean {
    const definition = ARTIFACTS[id];
    return definition ? this.applyReward(definition).applied : false;
  }

  applyReward(definition: ArtifactDefinition): AppliedRewardResult {
    if (this.collected.has(definition.id)) {
      return { applied: false };
    }

    const previousMaxHealth = this.run.stats.current.maxHealth;
    this.collected.add(definition.id);
    this.definitions.set(definition.id, definition);

    if (definition.modifiers) {
      this.run.stats.applyModifiers(definition.modifiers);
    }
    if (definition.weaponModifiers) {
      this.run.weapons.globalModifiers.push(...definition.weaponModifiers);
      for (const [weaponId, state] of this.run.weapons.states) {
        this.run.weapons.applyModifiers(weaponId, state, definition.weaponModifiers);
      }
    }
    if (definition.special) {
      SPECIAL_EFFECT_HANDLERS[definition.special](this.run);
    }
    if (definition.effect) {
      this.activeEffects.add(definition.effect);
    }

    this.run.resources.syncMaxHealth(previousMaxHealth);

    return {
      applied: true,
      curse: this.run.applyCurseReward(definition.curse, {
        kind: 'artifact',
        id: definition.id,
        baseId: definition.id,
        name: definition.name,
        generated: Boolean(definition.curse && ARTIFACTS[definition.id]?.curse !== definition.curse),
      }),
    };
  }

  has(id: ArtifactId): boolean {
    return this.collected.has(id);
  }

  getDefinition(id: ArtifactId): ArtifactDefinition {
    return this.definitions.get(id) ?? ARTIFACTS[id];
  }

  hasEffect(effect: ArtifactEffectId): boolean {
    return this.activeEffects.has(effect);
  }
}
