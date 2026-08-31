# Everlasting Oblivion: Limbo Trial

Everlasting Oblivion: Limbo Trial is a browser-playable dark-fantasy arena
roguelite built with Phaser, TypeScript, and Vite.

Choose one of three condemned souls, survive a fifteen-minute trial, assemble up
to five weapons, claim artifacts from reliquaries, and defeat the Limbo Warden.
Runs feed local progression, journal discovery, and an instrumented balance
report.

The intended vertical slice is structurally complete and playable with safe
development fallbacks. It is not yet qualified as a public demo: final owner art,
audio approval, repeated full-run balance sessions, direct multi-browser QA, and
deployment checks remain. See
[Vertical Slice Completion](docs/VERTICAL_SLICE_COMPLETION.md) for the exact
boundary and evidence status.

## Current Slice

- Three playable characters with distinct starters, stats, unlocks, and talent trees
- Thirty-two auto-weapons, a five-slot loadout, and explicit level-seven evolutions
- Twenty-two enemy definitions, role-capped waves, nine authored encounters, elites, curses, and a saved Death Echo
- Reliquaries, fifty run-only artifacts, three powerups, a blood shrine, and the Blood Market
- A six-attack, three-phase Limbo Warden entering at `14:00` in the standard fifteen-minute run
- Death/victory results, local progression, journal discovery, run archives, and optional Supabase submission
- Typed asset/audio and gameplay-effect registries, VVFX Runtime JSON playback, deterministic diagnostics, and development laboratories

## Requirements

- Node.js 22 or newer
- npm
- Chrome, Edge, or Chromium for the automated browser smoke

## Getting Started

```bash
git clone https://github.com/Veno89/limbotrials.git
cd limbotrials
npm install
npm run dev
```

Open the local URL printed by Vite.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run validate:content` | Validate registered assets, fallbacks, effects, and content links |
| `npm run assets:backlog` | Regenerate the categorized owner-art checklist from registered concepts |
| `npm run assets:backlog:check` | Fail when the generated checklist has drifted from its registered sources |
| `npm run balance:diagnostics` | Print deterministic balance diagnostics; does not judge fun or final balance |
| `npm run typecheck` | Run strict TypeScript validation |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest suite |
| `npm run build` | Type-check and create the production bundle |
| `npm run check:prod-bundle` | Prove normal production JavaScript excludes development scenes |
| `npm run smoke:dev` | Exercise the development flow in a headless browser |
| `npm run smoke:prod` | Exercise the built production flow in a headless browser |
| `npm run verify` | Run the aggregate non-browser source/content/build gate |
| `npm run verify:release` | Run `verify` plus development and production browser smokes |
| `npm run runs:index` | Rebuild local playtest indexes after adding run JSON manually |

There is currently no formatter script in `package.json`; do not report a
formatting gate as passed until one is added. The smoke test detects common Chrome
and Edge installations. Set `CHROME_PATH` to use another executable.

Automated smoke coverage is useful regression evidence, but it is not a
substitute for hands-on browser, visual, accessibility, or balance review.

## Controls

| Input | Action |
| --- | --- |
| `WASD` or arrow keys | Move |
| `Space` | Dash |
| `E` | Use a nearby shrine |
| `R` | Reroll an upgrade offer |
| `Tab` | Toggle live build and weapon stats |
| `Esc` | Pause |
| `1`, `2`, `3` | Select an offered upgrade |

In a development build, press `F11` to open the Content Lab and Backquote or
`F12` to open Dev Mode. The lab may also be opened directly with
`?content-lab=1`. These scenes are excluded from normal production bundles;
`VITE_ENABLE_DEV_TOOLS=true` is the explicit opt-in for a production-mode test
bundle. See [Balance Testing](docs/BALANCE_TESTING.md) for focused presets and
debug controls.

## Owner Asset Workflow

Gameplay refers to stable asset IDs instead of filenames. To replace an existing
fallback or owner asset:

1. Choose a concept from [the generated asset checklist](docs/ASSET_PRODUCTION_BACKLOG.md).
   It provides the owner-facing name and short themed design prompt without
   duplicating implementation metadata.
2. Read the matching row in `src/game/data/assets.ts` for the exact target path,
   canvas, frames, orientation, pivot, transparency, attachments, and other
   runtime requirements. Start from a guide in `assets/templates/` when one
   exists; the guides contain only technical boundaries and labels.
3. Deliver to the manifest's production target, add one explicit Vite `?url`
   import, and update the `source` on that same stable-ID manifest row. Overwrite
   an existing file in place only when intentionally retaining its current path.
   Primitive/alias rows (including the first five tasks) accept the new
   `{ filePath, url }` source without losing their fallback. Merely placing a file
   beside the repository does not bundle it; do not add an ad hoc gameplay preload.
4. Update the manifest's dimensions, frame metadata, attachment points, fallback,
   and provenance if the delivered asset differs from the specification.
5. Regenerate the checklist, run `npm run validate:content`, open the Content
   Lab, then run the normal verification gates.

Missing optional art resolves to a declared development fallback. Missing
required art emits one clear diagnostic instead of one warning per spawn.
Gameplay already owns hit flash, game-specific tints/statuses, and registered
effect attachments where configured. Additional outline, shadow, glow, recoil,
hover, spawn/death, trail, and impact helpers are opt-in and can be qualified in
Content Lab; its toggles do not imply every entity uses them. Do not bake runtime
effects into final art; keep those effects owned by the runtime presentation.

For audio, deliver the WAV at the manifest entry's `productionTargetFilePath`,
import it with Vite's `?url` suffix in `src/game/data/assets.ts`, and pass that
`{ kind: 'file', filePath, url }` source to the matching cue definition. The
audio system will use the file automatically, follow the existing volume
controls, and fall back to the registered procedural cue if loading or playback
fails.

No generated or downloaded AI artwork is part of this workflow.

## Gameplay Effect And VVFX Workflow

Authored Runtime JSON files live in
`src/game/vfx/effects/*.vvfx-runtime.json`. Their stable filename IDs are mapped
to semantic gameplay roles in `src/game/vfx/GameplayEffectRegistry.ts`. Gameplay
asks for a typed sequence and role; it does not inspect Beam layers or raw export
composition.

To replace an existing effect, export Runtime JSON from VVFX, keep or update the
registry's stable raw effect ID, and validate it in the Content Lab. To add an
effect, add the Runtime JSON, register its semantic role, declare dependencies and
fallback behavior, then run content validation and lifecycle tests.

Tesla Coil is the reference integration. Its presentation roles are initial
discharge, source-to-target chain beam, electricity across the target, impact,
and optional final-chain response. The registry declares presentation cadence
and which visual file or primitive fallback represents each role; combat applies
that cadence while owning target choice, range, damage, cancellation, and
deterministic ordering.

## Project Structure

```text
assets/                 Owner-created source art and technical templates
docs/                   Design, completion, production, and test documentation
scripts/                Validation, diagnostics, checklist, and browser automation
src/game/assets/        Typed manifest, validation, and runtime resolution
src/game/balance/       Pure headless diagnostic models
src/game/data/          Data-defined gameplay content
src/game/presentation/  Optional reusable code-driven presentation effects
src/game/scenes/        Phaser scene composition and lifecycle
src/game/systems/       Focused gameplay systems
src/game/tests/         Pure-logic and registry coverage
src/game/vfx/           Semantic effect registry, VVFX catalog, and runtime bridge
```

Start with [Architecture](docs/ARCHITECTURE.md) before extending gameplay.

## Documentation

- [Vertical slice completion](docs/VERTICAL_SLICE_COMPLETION.md)
- [Asset creation checklist](docs/ASSET_PRODUCTION_BACKLOG.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Balance testing workflow](docs/BALANCE_TESTING.md)
- [Testing strategy](docs/TESTING.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Progress and known issues](docs/PROGRESS.md)
- [Design](docs/DESIGN.md)
- [Run analytics and persistence](docs/RUN_ANALYTICS.md)
- [Netlify and Supabase deployment](docs/DEPLOYMENT.md)
- [Longer-term roadmap](docs/ROADMAP.md)

## Repository Notes

- Generated builds, dependencies, local smoke captures, environment files, and
  exported balance reports are intentionally excluded from Git.
- Copy `.env.example` for local leaderboard configuration. Never expose a Supabase
  secret key through a `VITE_` variable.
- The repository does not currently include an open-source license. All rights
  are reserved unless a license is added later.
