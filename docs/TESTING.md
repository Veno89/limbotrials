# Testing Strategy

## Running Tests

```bash
# Full validation suite (same as CI)
npm run typecheck   # Strict TypeScript type-checking
npm run lint        # ESLint with recommended + TS rules
npm test            # Vitest unit and integration tests
npm run build       # Production build verification

# Browser smoke tests (requires Playwright)
npm run smoke       # Headless browser smoke test: menu, settings, gameplay, end screens
```

## Test Organization

Tests live in `src/game/tests/` and cover pure-logic systems that do not depend on the Phaser runtime. Each test file maps to one or more system files.

### Naming Convention

- `<systemName>.test.ts` — unit tests for a specific system
- `<featureName>.test.ts` — integration tests spanning multiple related systems

### What Is Tested

| Area | Coverage | Files |
|------|----------|-------|
| Save system | Load, migrate, corrupt data recovery, version upgrades | `saveSystem.test.ts` |
| Damage calculation | Crit rolls, multipliers, boss damage, floor of 1 | `damageSystem.test.ts` |
| Upgrade system | Offer selection, stack limits, weapon levels, evolution gating | `upgradeSystem.test.ts` |
| Progression | XP curves, level-up thresholds | `progression.test.ts` |
| Threat scaling | Tier calculation, health/damage multipliers | `threatRules.test.ts` |
| Wave spawning | Tier selection, population caps, boss triggers | `waves.test.ts` |
| Curse system | Tier thresholds, gain results, crossed tiers | `curseSystem.test.ts` |
| Artifact system | Roll logic, no-duplicate, rarity weighting, tier filtering | `artifactSystem.test.ts` |
| Character unlocks | Condition checking, save integration | `characterUnlocks.test.ts` |
| Talent tree | Allocation, refund, point limits, save round-trip | `talentTreeSystem.test.ts` |
| Balance telemetry | Report generation, weapon results, timeline | `balanceTelemetry.test.ts` |
| Balance report store | localStorage persistence and retrieval | `balanceReportStore.test.ts` |
| Weapon rules | Bloodletter throw calculation, scythe sweep geometry | `weaponRules.test.ts` |
| Curse mutation | Cursed reward generation, pattern selection | `cursedRewardMutation.test.ts` |
| Status effects | Bleed/poison application, tick damage, expiration | `statusEffects.test.ts` |
| Leaderboard | Score parsing, bounds validation | `leaderboard.test.ts` |
| Death echo | Snapshot creation, profile generation | `deathEcho.test.ts` |
| Journal discovery | Entry tracking, sanitization | `journalDiscovery.test.ts` |

### What Is NOT Tested (requires Phaser runtime)

- Scene lifecycle (create, update, shutdown, restart)
- Physics collisions and projectile movement
- Visual effects (tweens, particles, screen shake)
- HUD rendering and layout
- Audio system
- Input handling (keyboard, mouse)

These are covered by the browser smoke test (`scripts/smoke.mjs`) which runs a headless Playwright session through the full game flow.

## Smoke Test

The smoke test (`npm run smoke`) launches the game in a headless browser and verifies:

1. Landing page renders and game launches
2. Main menu, settings, and character select scenes load
3. A run starts and gameplay objects appear
4. Pause and resume work
5. Game over and victory scenes display correctly
6. Return-to-site flow works
7. Leaderboard form appears on standard runs

Screenshots are saved to `.smoke/` (gitignored).

## CI Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main` and all PRs:

1. `npm ci` — clean install
2. `npm run typecheck` — strict TypeScript
3. `npm run lint` — ESLint
4. `npm test` — Vitest
5. `npm run build` — production build

## Adding New Tests

1. Create `src/game/tests/<name>.test.ts`
2. Import only pure-logic modules (no Phaser dependencies)
3. Use `describe`/`it`/`expect` from Vitest
4. Mock any runtime dependencies (e.g., `Math.random` for deterministic rolls)
5. Run `npm test` to verify

## Known Coverage Gaps

- No regression test for scene restart listener cleanup
- No test for `endRun()` save consistency across tab scenarios
- `BalanceReportScene` is defined but not registered in the scene config (dead code)
- No integration test for the full upgrade offer → apply → queue drain cycle with scene shutdown
