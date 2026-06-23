import type { RunState } from '../RunState';
import { UPGRADES } from '../../data/upgrades';
import { EVOLUTION_READY_LEVEL, MAX_WEAPON_LEVEL } from '../../types/gameTypes';
import type { UpgradeId, UpgradeDefinition, AppliedRewardResult, WeaponUpgradeEffectId, ConditionalUpgradeEffectId } from '../../types/gameTypes';

export class UpgradeManager {
  public readonly stacks = new Map<UpgradeId, number>();
  public choiceBonus = 0;

  constructor(private readonly run: RunState) {}

  apply(id: UpgradeId): boolean {
    return this.applyChoice(UPGRADES[id]).applied;
  }

  applyChoice(definition: UpgradeDefinition): AppliedRewardResult {
    const applied = this.applyDefinition(definition);
    return {
      applied,
      ...(applied
        ? {
            curse: this.run.applyCurseReward(definition.curse, {
              kind: 'upgrade',
              id: definition.id,
              baseId: definition.id,
              name: definition.name,
              generated: Boolean(definition.curse && UPGRADES[definition.id]?.curse !== definition.curse),
            }),
          }
        : {}),
    };
  }

  private applyDefinition(definition: UpgradeDefinition): boolean {
    if ((this.stacks.get(definition.id) ?? 0) >= definition.maxStacks) {
      return false;
    }
    const previousMaxHealth = this.run.stats.current.maxHealth;
    let applied = false;

    if (definition.category === 'weapon' && definition.unlockWeapon) {
      applied = this.run.weapons.add(definition.unlockWeapon);
      if (applied && definition.weaponModifiers) {
        const state = this.run.weapons.states.get(definition.unlockWeapon);
        if (state) {
          this.run.weapons.applyModifiers(definition.unlockWeapon, state, definition.weaponModifiers);
        }
      }
    } else if (definition.category === 'weapon-level' && definition.targetWeapon) {
      const state = this.run.weapons.states.get(definition.targetWeapon);
      if (state && state.level < EVOLUTION_READY_LEVEL) {
        this.run.weapons.advance(definition.targetWeapon, state);
        this.run.weapons.applyModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        applied = true;
      }
    } else if (definition.category === 'weapon-upgrade' && definition.targetWeapon) {
      const state = this.run.weapons.states.get(definition.targetWeapon);
      if (state && (state.level < EVOLUTION_READY_LEVEL || state.level === MAX_WEAPON_LEVEL)) {
        this.run.weapons.applyModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        if (state.level < EVOLUTION_READY_LEVEL) {
          this.run.weapons.advance(definition.targetWeapon, state);
        }
        applied = true;
      }
    } else if (definition.category === 'weapon-evolution' && definition.targetWeapon) {
      const state = this.run.weapons.states.get(definition.targetWeapon);
      if (state?.level === EVOLUTION_READY_LEVEL) {
        this.run.weapons.advance(definition.targetWeapon, state);
        this.run.weapons.applyModifiers(definition.targetWeapon, state, definition.weaponModifiers ?? []);
        applied = true;
      }
    } else if (definition.category === 'stat' || definition.category === 'curse') {
      this.run.stats.applyModifiers(definition.modifiers ?? []);
      applied = true;
    }

    if (!applied) {
      return false;
    }
    this.stacks.set(definition.id, (this.stacks.get(definition.id) ?? 0) + 1);
    
    this.run.resources.syncMaxHealth(previousMaxHealth);

    return true;
  }

  has(id: UpgradeId): boolean {
    return (this.stacks.get(id) ?? 0) > 0;
  }

  hasWeaponEffect(effect: WeaponUpgradeEffectId): boolean {
    for (const [id, stackCount] of this.stacks) {
      if (stackCount > 0 && UPGRADES[id].weaponEffect === effect) {
        return true;
      }
    }
    return false;
  }

  hasConditionalEffect(effect: ConditionalUpgradeEffectId): boolean {
    for (const [id, stackCount] of this.stacks) {
      if (stackCount > 0 && UPGRADES[id].conditionalEffect === effect) {
        return true;
      }
    }
    return false;
  }

  getConditionalEffects(): ConditionalUpgradeEffectId[] {
    const effects: ConditionalUpgradeEffectId[] = [];
    for (const [id, stackCount] of this.stacks) {
      const effect = UPGRADES[id].conditionalEffect;
      if (stackCount > 0 && effect) {
        effects.push(effect);
      }
    }
    return effects;
  }

  getChoiceCount(): number {
    return 3 + this.choiceBonus;
  }

  addChoiceBonus(amount: number): void {
    this.choiceBonus = Math.max(0, this.choiceBonus + amount);
  }
}
