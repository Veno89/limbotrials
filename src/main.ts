import './style.css';
import { renderLandingPage } from './site/landingPage';

const root = document.querySelector<HTMLElement>('#app');

if (!root) {
  throw new Error('Missing application root.');
}

async function showLandingPage(): Promise<void> {
  document.body.classList.remove('game-running');
  renderLandingPage(root!, () => {
    void startGame();
  });
}

async function startGame(): Promise<void> {
  document.body.classList.add('game-running');
  root!.innerHTML = `
    <div class="grid min-h-screen place-items-center bg-abyss text-fog">
      <div class="text-center">
        <div class="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-mist/20 border-t-soul"></div>
        <p class="font-display text-sm tracking-[0.32em] text-mist">OPENING THE LIMBO GATE</p>
      </div>
    </div>
  `;
  try {
    const { launchGame } = await import('./site/gameLauncher');
    await launchGame(root!, () => {
      void showLandingPage();
    });
  } catch {
    document.body.classList.remove('game-running');
    root!.innerHTML = `
      <main class="grid min-h-screen place-items-center bg-abyss px-5 text-center text-fog">
        <div class="max-w-lg border border-blood-light/30 bg-panel p-8">
          <p class="font-display text-xs tracking-[0.22em] text-blood-light">THE GATE REMAINS SEALED</p>
          <p class="mt-4 text-sm leading-7 text-mist">The game failed to load. Return to the site and try opening Limbo again.</p>
          <button data-return-site type="button" class="mt-6 border border-mist/25 px-5 py-3 font-display text-xs tracking-[0.16em] text-fog hover:border-soul/50">
            RETURN TO SITE
          </button>
        </div>
      </main>
    `;
    root!.querySelector<HTMLButtonElement>('[data-return-site]')?.addEventListener('click', () => {
      void showLandingPage();
    });
  }
}

const openContentLabDirectly = (
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true'
) && new URLSearchParams(window.location.search).get('content-lab') === '1';

void (openContentLabDirectly ? startGame() : showLandingPage());
