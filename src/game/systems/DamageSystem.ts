export interface DamageRequest {
  baseDamage: number;
  damageMultiplier: number;
  critChance: number;
  bossMultiplier?: number;
  targetIsBoss?: boolean;
  critMultiplier?: number;
  roll?: number;
}

export interface DamageResult {
  amount: number;
  critical: boolean;
}

export function calculateDamage(request: DamageRequest): DamageResult {
  const roll = request.roll ?? Math.random();
  const critical = roll < request.critChance;
  const criticalMultiplier = critical ? (request.critMultiplier ?? 1.75) : 1;
  const bossMultiplier = request.targetIsBoss ? (request.bossMultiplier ?? 1) : 1;

  return {
    amount: Math.max(
      1,
      Math.round(request.baseDamage * request.damageMultiplier * criticalMultiplier * bossMultiplier),
    ),
    critical,
  };
}
