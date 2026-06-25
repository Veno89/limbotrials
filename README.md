# Everlasting Oblivion: Limbo Trial

Everlasting Oblivion: Limbo Trial is a browser-playable dark fantasy arena roguelite
prototype built with Phaser, TypeScript, and Vite.

Choose a condemned soul, survive an escalating fifteen-minute trial, assemble a
five-weapon build, claim artifacts from reliquaries, and defeat the Limbo Warden.
Completed runs feed a small permanent-progression system stored locally in the
browser.

## Current Features

- Three playable characters with distinct starter weapons, stat profiles, and unlock conditions
- Twenty-five auto-weapons with explicit level-seven evolutions and evolved specializations
- Sixteen enemy definitions, independently capped combat roles, authored encounters, elites, and a six-attack three-phase boss
- Bounded adaptive threat scaling based on run time and player power
- Run-only artifacts, themed reliquaries, curses, rare powerups, and a blood shrine
- Categorized upgrade offers, rerolls, skip rewards, weapon synergies, and permanent progression
- Source-aware combat telemetry, multi-tab balance reports, JSON export, and deterministic balance labs
- Tailwind landing page, public Supabase leaderboard, private run analytics, and bounded Netlify Function submissions
- Strict TypeScript, Vitest coverage, ESLint, production builds, and a full browser smoke test

Development status, known issues, and the next recommended work are tracked in
[docs/PROGRESS.md](docs/PROGRESS.md).

## Requirements

- Node.js 22 or newer
- npm
- Chrome, Edge, or Chromium for `npm run smoke`

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
| `npm run typecheck` | Run strict TypeScript validation |
| `npm run lint` | Run ESLint |
| `npm test` | Run the pure-logic Vitest suite |
| `npm run build` | Type-check and create the production bundle |
| `npm run smoke` | Run the headless browser gameplay and performance smoke test |

The smoke test detects common Chrome and Edge installations. Set `CHROME_PATH` to
use another executable.

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

Development builds also expose focused balance and debugging shortcuts. See
[docs/BALANCE_TESTING.md](docs/BALANCE_TESTING.md) for the complete workflow and
key bindings.

## Project Structure

```text
assets/          Source art used by the game
docs/            Design, architecture, progress, and balance notes
scripts/         Browser smoke and development automation
src/game/data/   Data-defined weapons, enemies, upgrades, waves, and artifacts
src/game/scenes/ Phaser scene composition and lifecycle
src/game/systems/Focused gameplay systems
src/game/tests/  Pure-logic Vitest coverage
src/game/ui/     HUD and presentation components
```

The architecture favors typed data definitions and focused systems over generic
scripting or monolithic scene files. Start with
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) before extending gameplay.

## Documentation

- [Design](docs/DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Progress and known issues](docs/PROGRESS.md)
- [Balance testing workflow](docs/BALANCE_TESTING.md)
- [Next combat expansion](docs/NEXT_COMBAT_EXPANSION.md)
- [Longer-term roadmap](docs/ROADMAP.md)
- [Netlify and Supabase deployment](docs/DEPLOYMENT.md)
- [Run analytics and persistence boundaries](docs/RUN_ANALYTICS.md)

## Repository Notes

- Generated builds, dependencies, local smoke captures, environment files, and
  exported balance reports are intentionally excluded from Git.
- Copy `.env.example` for local leaderboard configuration; never expose a Supabase
  secret key through a `VITE_` variable.
- The repository does not currently include an open-source license. All rights are
  reserved unless a license is added later.
