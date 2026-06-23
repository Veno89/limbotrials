import type { RunState } from '../RunState';
import { WEAPONS } from '../../data/weapons';
import { applyWeaponModifiers } from '../../utils/statModifiers';
import { WEAPON_CAP, MAX_WEAPON_LEVEL } from '../../types/gameTypes';
import type { WeaponId, WeaponRuntimeState, WeaponModifier } from '../../types/gameTypes';

export class WeaponStateManager {
  public readonly equipped = new Set<WeaponId>();
  public readonly states = new Map<WeaponId, WeaponRuntimeState>();
  public cap = WEAPON_CAP;
  public readonly globalModifiers: WeaponModifier[] = [];
  public readonly targetedTalentModifiers = new Map<WeaponId, WeaponModifier[]>();

  constructor(private readonly run: RunState) {}

  add(id: WeaponId): boolean {
    if (this.equipped.has(id) || this.equipped.size >= this.cap) return false;
    const definition = WEAPONS[id];
    this.equipped.add(id);
    this.run.balance.recordWeaponEquipped(id, this.run.elapsedMs);
    this.states.set(id, {
      level: 1,
      stats: { ...definition.baseStats },
    });
    const state = this.states.get(id)!;
    this.applyModifiers(id, state, this.globalModifiers);
    this.applyModifiers(id, state, this.targetedTalentModifiers.get(id) ?? []);
    return true;
  }

  getState(id: WeaponId): WeaponRuntimeState {
    const state = this.states.get(id);
    if (!state) throw new Error(`Weapon ${id} is not equipped.`);
    return state;
  }

  getLevels(): Map<WeaponId, number> {
    return new Map([...this.states].map(([id, state]) => [id, state.level]));
  }

  advance(id: WeaponId, state: WeaponRuntimeState): void {
    state.level = Math.min(MAX_WEAPON_LEVEL, state.level + 1);
    this.applyModifiers(id, state, WEAPONS[id].levelGrowth);
  }

  applyModifiers(id: WeaponId, state: WeaponRuntimeState, modifiers: readonly WeaponModifier[]): void {
    applyWeaponModifiers(state.stats, modifiers, WEAPONS[id].baseStats);
  }

  increaseCap(amount: number): void {
    this.cap = Math.max(WEAPON_CAP, this.cap + amount);
  }

  addGlobalPierce(amount: number): void {
    const modifier: WeaponModifier = { stat: 'pierce', mode: 'add', value: amount };
    this.globalModifiers.push(modifier);
    for (const [weaponId, state] of this.states) {
      this.applyModifiers(weaponId, state, [modifier]);
    }
  }

  recordHit(id: WeaponId, amount: number, killed: boolean, critical: boolean, boss: boolean): void {
    this.run.balance.recordWeaponHit(id, amount, killed, critical, boss, this.run.elapsedMs);
  }
}
