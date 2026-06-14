import heroBackground from '../../assets/sprites/backgrounds/realmainmenubackground.png?url';
import wardenImage from '../../assets/sprites/bossprites/floor boss 1.png?url';
import hauntedImage from '../../assets/sprites/playersprites/Haunted.png?url';
import penitentImage from '../../assets/sprites/playersprites/bulwark.png?url';
import ashwalkerImage from '../../assets/sprites/playersprites/Arcanist.png?url';
import reliquaryImage from '../../assets/sprites/items/reliquary_chest.png?url';
import voidSwordImage from '../../assets/sprites/items/icon_sword_void.png?url';
import { loadPlayerName, savePlayerName } from '../leaderboard/playerIdentity';
import { parsePlayerName } from '../leaderboard/scoreSubmissionRules';
import { mountLeaderboardPanel } from './leaderboardPanel';

export function renderLandingPage(root: HTMLElement, onStart: () => void): void {
  root.innerHTML = `
    <div class="min-h-screen overflow-hidden bg-abyss text-fog">
      <header class="fixed inset-x-0 top-0 z-50 border-b border-mist/10 bg-abyss/75 backdrop-blur-xl">
        <div class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <a href="#top" class="font-display text-xs font-bold tracking-[0.22em] text-fog sm:text-sm">
            EVERLASTING <span class="text-soul">OBLIVION</span>
          </a>
          <nav class="hidden items-center gap-8 text-[11px] font-semibold uppercase tracking-[0.18em] text-mist md:flex">
            <a class="transition hover:text-fog" href="#the-trial">The Trial</a>
            <a class="transition hover:text-fog" href="#souls">Condemned Souls</a>
            <a class="transition hover:text-fog" href="#leaderboard">Leaderboard</a>
          </nav>
          <button
            type="button"
            data-start-game
            class="border border-blood-light/60 bg-blood/20 px-4 py-2 font-display text-[10px] font-bold tracking-[0.18em] text-fog transition hover:border-blood-light hover:bg-blood/35 sm:px-5"
          >
            ENTER LIMBO
          </button>
        </div>
      </header>

      <main id="top">
        <section class="landing-hero relative isolate flex min-h-screen items-center overflow-hidden" style="background-image: url('${heroBackground}')">
          <div class="relative z-10 mx-auto grid w-full max-w-7xl gap-12 px-5 pb-20 pt-32 lg:grid-cols-[1.15fr_0.85fr] lg:px-8">
            <div class="max-w-3xl">
              <p class="mb-6 inline-flex items-center gap-3 border border-relic/25 bg-abyss/55 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.24em] text-relic backdrop-blur">
                <span class="h-1.5 w-1.5 rounded-full bg-blood-light shadow-[0_0_12px_#d26468]"></span>
                Browser trial · Active development
              </p>
              <h1 class="font-display text-5xl font-extrabold leading-[0.98] tracking-[-0.04em] text-fog sm:text-7xl lg:text-[5.8rem]">
                EVERLASTING
                <span class="block bg-gradient-to-r from-blood-light via-relic to-soul bg-clip-text text-transparent">
                  OBLIVION
                </span>
              </h1>
              <p class="mt-6 font-display text-base tracking-[0.3em] text-mist sm:text-xl">LIMBO TRIAL</p>
              <p class="mt-8 max-w-2xl text-base leading-8 text-mist sm:text-lg">
                Survive fifteen minutes of escalating damnation. Build an evolving arsenal,
                claim forbidden relics, and face the Warden before Limbo erases your name.
              </p>
              <div class="mt-10 flex flex-col gap-4 sm:flex-row">
                <button
                  type="button"
                  data-start-game
                  class="group border border-blood-light/70 bg-blood/30 px-7 py-4 text-left transition hover:-translate-y-0.5 hover:border-blood-light hover:bg-blood/45 hover:shadow-[0_20px_70px_rgb(165_45_53/25%)]"
                >
                  <span class="block font-display text-sm font-bold tracking-[0.2em] text-fog">BEGIN THE TRIAL</span>
                  <span class="mt-1 block text-xs text-mist">Play instantly in your browser</span>
                </button>
                <a
                  href="#leaderboard"
                  class="border border-mist/20 bg-panel/70 px-7 py-4 transition hover:-translate-y-0.5 hover:border-soul/45 hover:bg-panel-light/90"
                >
                  <span class="block font-display text-sm font-bold tracking-[0.2em] text-fog">VIEW THE FALLEN</span>
                  <span class="mt-1 block text-xs text-mist">Damage and kill records</span>
                </a>
              </div>
              <div class="mt-10 max-w-xl border-l border-relic/45 pl-5">
                <label for="leaderboard-name" class="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-relic">
                  Name carved into the leaderboard
                </label>
                <div class="mt-3 flex items-center border-b border-mist/25 bg-abyss/35">
                  <input
                    id="leaderboard-name"
                    data-player-name
                    maxlength="24"
                    autocomplete="nickname"
                    placeholder="Enter a name for public records"
                    class="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-fog outline-none placeholder:text-mist/40"
                  />
                  <span data-name-status class="px-4 text-[10px] uppercase tracking-[0.14em] text-mist/55">Local only</span>
                </div>
                <p class="mt-2 text-xs leading-5 text-mist/55">
                  Every standard run contributes private balance analytics. Add a name to also enter the public leaderboard.
                </p>
              </div>
            </div>

            <aside class="hidden self-end justify-self-end lg:block">
              <div class="site-panel w-[21rem] border border-mist/15 p-5">
                <p class="font-display text-[10px] tracking-[0.22em] text-relic">THE TRIAL REMEMBERS</p>
                <div class="ornament-line my-4 h-px"></div>
                <div class="grid grid-cols-2 gap-3">
                  ${statCard('15:00', 'Survive')}
                  ${statCard('9', 'Weapons')}
                  ${statCard('16', 'Enemies')}
                  ${statCard('3', 'Condemned souls')}
                </div>
                <p class="mt-5 text-xs leading-6 text-mist/60">
                  Every fast-growing build raises Limbo's threat. Power remains rewarding,
                  but safety must still be earned.
                </p>
              </div>
            </aside>
          </div>
        </section>

        <section id="the-trial" class="relative border-y border-mist/10 bg-ink py-24">
          <div class="mx-auto max-w-7xl px-5 lg:px-8">
            ${sectionHeading('THE TRIAL', 'Build power. Read danger. Refuse oblivion.', 'Nine weapons, evolved specializations, adaptive threat, run-only artifacts, and authored enemy pressure shape each attempt.')}
            <div class="mt-14 grid gap-5 md:grid-cols-3">
              ${featureCard(voidSwordImage, 'Forge An Identity', 'Combine five weapons, focused upgrades, explicit evolutions, and synergies into a build with a real combat profile.')}
              ${featureCard(reliquaryImage, 'Claim The Reliquaries', 'Find and open timed reliquaries in the arena to secure powerful run-only artifacts before they fade.')}
              ${featureCard(wardenImage, 'Face The Warden', 'Survive long enough to confront a three-phase boss with six telegraphed attacks demanding active movement.')}
            </div>
          </div>
        </section>

        <section id="souls" class="relative overflow-hidden py-24">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgb(105_217_255/8%),transparent_36%),radial-gradient(circle_at_80%_60%,rgb(165_45_53/10%),transparent_32%)]"></div>
          <div class="relative mx-auto max-w-7xl px-5 lg:px-8">
            ${sectionHeading('THE CONDEMNED', 'Choose who enters Limbo.', 'Each soul begins with a distinct weapon and stat profile. Their differences matter from the first second of the run.')}
            <div class="mt-14 grid gap-5 lg:grid-cols-3">
              ${soulCard(hauntedImage, 'The Haunted', 'Balanced survivor', 'Bone Scythe', 'A versatile condemned soul pursued by memories it cannot bury.', 'border-soul/30')}
              ${soulCard(penitentImage, 'The Penitent', 'Durable bulwark', 'Grave Lance', 'A slower, resilient fighter who turns endurance into another chance.', 'border-relic/30')}
              ${soulCard(ashwalkerImage, 'Ashwalker', 'Volatile arcanist', 'Hellfire Sigil', 'A fragile source of violent power that accepts no quiet path through Limbo.', 'border-blood-light/30')}
            </div>
          </div>
        </section>

        <section id="leaderboard" class="border-y border-mist/10 bg-ink py-24">
          <div class="mx-auto max-w-6xl px-5 lg:px-8">
            ${sectionHeading('THE LEDGER OF THE FALLEN', 'Leave proof that you resisted.', 'Completed standard runs can be carved into the public record. Compare total damage dealt or enemies ended.')}
            <div class="site-panel mt-12 overflow-hidden border border-mist/15">
              <div class="flex flex-col gap-4 border-b border-mist/10 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div class="flex gap-2">
                  <button
                    type="button"
                    data-leaderboard-metric="damage_dealt"
                    class="border px-4 py-2 font-display text-[10px] tracking-[0.17em] transition hover:text-fog"
                  >
                    MOST DAMAGE
                  </button>
                  <button
                    type="button"
                    data-leaderboard-metric="enemies_killed"
                    class="border px-4 py-2 font-display text-[10px] tracking-[0.17em] transition hover:text-fog"
                  >
                    MOST KILLS
                  </button>
                </div>
                <div class="flex items-center gap-3">
                  <span class="h-1.5 w-1.5 rounded-full bg-soul shadow-[0_0_12px_#69d9ff]"></span>
                  <span data-leaderboard-status class="font-display text-[10px] tracking-[0.18em] text-mist">CONSULTING THE RECORDS</span>
                  <button data-leaderboard-retry type="button" class="hidden text-[10px] uppercase tracking-[0.16em] text-relic hover:text-fog">Retry</button>
                </div>
              </div>
              <div class="hidden grid-cols-[4rem_1fr_9rem_8rem] gap-3 border-b border-mist/10 px-6 py-3 text-[9px] uppercase tracking-[0.2em] text-mist/45 md:grid">
                <span>Rank</span><span>Condemned soul</span><span class="text-right">Record</span><span class="text-right">Survived</span>
              </div>
              <div data-leaderboard-body></div>
            </div>
            <p class="mx-auto mt-5 max-w-3xl text-center text-xs leading-6 text-mist/50">
              Leaderboard submissions are bounded and validated server-side. Because the game runs
              in the browser, public scores should be treated as playtest records rather than cheat-proof competition.
            </p>
          </div>
        </section>

        <section class="relative overflow-hidden py-28">
          <div class="absolute inset-0 opacity-20" style="background-image: url('${wardenImage}'); background-position: center 38%; background-size: cover"></div>
          <div class="absolute inset-0 bg-gradient-to-r from-abyss via-abyss/90 to-abyss/70"></div>
          <div class="relative mx-auto max-w-5xl px-5 text-center">
            <p class="font-display text-xs tracking-[0.28em] text-relic">THE GATE IS OPEN</p>
            <h2 class="mt-5 font-display text-4xl font-bold tracking-[-0.03em] text-fog sm:text-6xl">How long will Limbo remember you?</h2>
            <p class="mx-auto mt-6 max-w-2xl text-base leading-8 text-mist">
              No download. No account required. Enter the current browser prototype and begin building your run.
            </p>
            <button
              type="button"
              data-start-game
              class="mt-10 border border-blood-light/70 bg-blood/30 px-9 py-4 font-display text-sm font-bold tracking-[0.2em] text-fog transition hover:-translate-y-0.5 hover:bg-blood/50 hover:shadow-[0_20px_70px_rgb(165_45_53/25%)]"
            >
              START THE GAME
            </button>
          </div>
        </section>
      </main>

      <footer class="border-t border-mist/10 bg-ink px-5 py-8">
        <div class="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-mist/55 sm:flex-row sm:items-center sm:justify-between lg:px-3">
          <p>Everlasting Oblivion: Limbo Trial · Browser prototype</p>
          <div class="flex gap-5">
            <a class="transition hover:text-fog" href="https://github.com/Veno89/limbotrials" target="_blank" rel="noreferrer">GitHub</a>
            <a class="transition hover:text-fog" href="#top">Return to top</a>
          </div>
        </div>
      </footer>
    </div>
  `;

  for (const button of root.querySelectorAll<HTMLButtonElement>('[data-start-game]')) {
    button.addEventListener('click', onStart);
  }

  const input = root.querySelector<HTMLInputElement>('[data-player-name]');
  const status = root.querySelector<HTMLElement>('[data-name-status]');
  if (input) {
    input.value = loadPlayerName();
    updateNameStatus(status, input.value);
    input.addEventListener('input', () => {
      updateNameStatus(status, savePlayerName(input.value));
    });
    input.addEventListener('change', () => {
      input.value = savePlayerName(input.value);
      updateNameStatus(status, input.value);
    });
  }
  mountLeaderboardPanel(root);
}

function updateNameStatus(status: HTMLElement | null, value: string): void {
  if (!status) {
    return;
  }
  const valid = Boolean(parsePlayerName(value));
  status.textContent = valid ? 'Runs submit' : 'Analytics only';
  status.classList.toggle('text-soul', valid);
}

function statCard(value: string, label: string): string {
  return `
    <div class="border border-mist/10 bg-abyss/45 p-4">
      <p class="font-display text-xl text-fog">${value}</p>
      <p class="mt-1 text-[9px] uppercase tracking-[0.18em] text-mist/55">${label}</p>
    </div>
  `;
}

function sectionHeading(kicker: string, title: string, description: string): string {
  return `
    <div class="max-w-3xl">
      <p class="font-display text-[11px] font-bold tracking-[0.24em] text-relic">${kicker}</p>
      <h2 class="mt-4 font-display text-3xl font-bold tracking-[-0.03em] text-fog sm:text-5xl">${title}</h2>
      <p class="mt-5 text-base leading-8 text-mist">${description}</p>
    </div>
  `;
}

function featureCard(image: string, title: string, description: string): string {
  return `
    <article class="site-panel group border border-mist/10 p-6 transition duration-300 hover:-translate-y-1 hover:border-soul/25">
      <div class="flex h-28 items-center justify-center overflow-hidden border border-mist/10 bg-abyss/50">
        <img src="${image}" alt="" class="h-24 w-24 object-contain drop-shadow-[0_0_18px_rgb(105_217_255/20%)] transition duration-500 group-hover:scale-110" />
      </div>
      <h3 class="mt-6 font-display text-lg font-bold tracking-[0.04em] text-fog">${title}</h3>
      <p class="mt-3 text-sm leading-7 text-mist">${description}</p>
    </article>
  `;
}

function soulCard(
  image: string,
  name: string,
  role: string,
  weapon: string,
  description: string,
  border: string,
): string {
  return `
    <article class="site-panel group overflow-hidden border ${border}">
      <div class="relative h-72 overflow-hidden bg-[radial-gradient(circle_at_50%_70%,rgb(105_217_255/12%),transparent_50%)]">
        <div class="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent"></div>
        <img src="${image}" alt="${name}" class="h-full w-full object-contain p-6 drop-shadow-[0_25px_30px_rgb(0_0_0/80%)] transition duration-500 group-hover:scale-105" />
      </div>
      <div class="border-t border-mist/10 p-6">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h3 class="font-display text-xl font-bold text-fog">${name}</h3>
            <p class="mt-1 text-[10px] uppercase tracking-[0.2em] text-relic">${role}</p>
          </div>
          <span class="border border-mist/15 bg-abyss/50 px-3 py-2 text-[9px] uppercase tracking-[0.14em] text-mist">${weapon}</span>
        </div>
        <p class="mt-4 text-sm leading-7 text-mist">${description}</p>
      </div>
    </article>
  `;
}
