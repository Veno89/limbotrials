import { WEAPONS } from '../data/weapons';
import type { RunState } from '../systems/RunState';
import { WeaponSynergySystem } from '../systems/WeaponSynergySystem';
import { MAX_WEAPON_LEVEL, type WeaponId } from '../types/gameTypes';
import { calculateCrimsonOrbit } from '../systems/crimsonOrbitRules';

export interface GeneralStatDisplay {
  label: string;
  value: string;
}

export interface WeaponStatDisplay {
  id: WeaponId;
  name: string;
  levelLabel: string;
  primary: string;
  details: string;
}

export interface StatsPanelModel {
  general: GeneralStatDisplay[];
  synergies: string[];
  weapons: WeaponStatDisplay[];
}

export function buildStatsPanelModel(run: RunState): StatsPanelModel {
  const synergies = new WeaponSynergySystem(run);
  return {
    general: [
      { label: 'HEALTH', value: `${Math.ceil(run.resources.health)} / ${Math.round(run.stats.current.maxHealth)}` },
      { label: 'DAMAGE', value: multiplier(run.stats.current.damage) },
      { label: 'ATTACK SPEED', value: multiplier(run.stats.current.attackSpeed) },
      { label: 'MOVE SPEED', value: `${Math.round(run.stats.current.moveSpeed)}` },
      { label: 'CRIT CHANCE', value: percent(run.stats.current.critChance) },
      { label: 'CRIT DAMAGE', value: multiplier(run.stats.current.critDamage) },
      { label: 'PICKUP RADIUS', value: `${Math.round(run.stats.current.pickupRadius)}` },
      { label: 'DASH COOLDOWN', value: seconds(run.stats.current.dashCooldown) },
      { label: 'BOSS DAMAGE', value: multiplier(run.stats.current.bossDamage) },
      { label: 'SOUL GAIN', value: multiplier(run.stats.current.soulGain) },
      { label: 'XP GAIN', value: multiplier(run.stats.current.xpGain) },
      { label: 'THREAT POWER', value: `+${Math.round(run.stats.current.threatPowerBonus)}` },
      { label: 'CURSE', value: `${run.curse.snapshot().level} ${run.curse.snapshot().tierLabel.toUpperCase()}` },
      { label: 'SHIELD', value: run.resources.shield > 0 ? `${Math.round(run.resources.shield)}` : run.stats.current.shieldInterval > 0 ? 'RECHARGING' : 'NONE' },
      { label: 'REROLLS', value: `${run.resources.rerolls}` },
    ],
    synergies: synergies.active().map((synergy) => synergy.name.toUpperCase()),
    weapons: [...run.weapons.equipped].map((id) => weaponDisplay(run, synergies, id)),
  };
}

function weaponDisplay(run: RunState, synergies: WeaponSynergySystem, id: WeaponId): WeaponStatDisplay {
  const definition = WEAPONS[id];
  const state = run.weapons.getState(id);
  const stats = state.stats;
  const effectiveDamage = stats.damage * run.stats.current.damage * synergies.damageMultiplier(id);
  const effectiveCrit = run.stats.current.critChance + stats.critChance + synergies.critChanceBonus(id);
  const effectiveCritDamage = run.stats.current.critDamage + stats.critDamage;
  const crimsonOrbit =
    id === 'bloodletter-axe' && state.level >= MAX_WEAPON_LEVEL
      ? calculateCrimsonOrbit(stats, run.stats.current.attackSpeed)
      : undefined;
  const projectileBehavior = ['targeted-projectile', 'fan-projectile', 'returning-projectile', 'radial-projectile'].includes(
    definition.behavior,
  ) && !crimsonOrbit;
  const areaBehavior = ['scythe', 'sigil', 'pulse', 'chain-strike'].includes(definition.behavior);
  const details = crimsonOrbit ? [
    `AXES ${crimsonOrbit.axeCount}`,
    `ORBIT ${Math.round(crimsonOrbit.radius)}`,
    `REAP ${seconds(crimsonOrbit.hitCooldownMs)}`,
    `SIZE ${Math.round(crimsonOrbit.axeSize)}`,
  ] : [
    areaBehavior ? `AREA ${Math.round(stats.area)}` : '',
    !['scythe', 'pulse'].includes(definition.behavior) ? `RANGE ${Math.round(stats.range)}` : '',
    stats.projectileCount > 1 ? `PROJECTILES ${Math.floor(stats.projectileCount)}` : '',
    stats.targetCount > 1 ? `TARGETS ${Math.floor(stats.targetCount)}` : '',
    stats.pierce > 0 ? `PIERCE ${Math.floor(stats.pierce)}` : '',
    projectileBehavior ? `SPEED ${Math.round(stats.projectileSpeed)}` : '',
    projectileBehavior ? `SIZE ${Math.round(stats.projectileSize)}` : '',
  ].filter(Boolean);

  return {
    id,
    name: definition.name.toUpperCase(),
    levelLabel: state.level >= MAX_WEAPON_LEVEL ? 'EVOLVED' : `LEVEL ${state.level}`,
    primary: `${Math.round(effectiveDamage * (crimsonOrbit?.damageScale ?? 1))} DMG  |  ${crimsonOrbit ? 'CONTINUOUS' : seconds(stats.cooldownMs / run.stats.current.attackSpeed)}  |  ${percent(effectiveCrit)} CRIT x${effectiveCritDamage.toFixed(2)}`,
    details: details.join('  |  '),
  };
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function multiplier(value: number): string {
  return `x${value.toFixed(2)}`;
}

function seconds(milliseconds: number): string {
  return `${(milliseconds / 1000).toFixed(2)}s`;
}
