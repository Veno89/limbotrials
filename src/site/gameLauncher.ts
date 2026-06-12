import Phaser from 'phaser';
import { gameConfig } from '../game/config';

export async function launchGame(root: HTMLElement, onExit: () => void): Promise<void> {
  root.innerHTML = `
    <div class="game-shell">
      <button
        type="button"
        data-exit-game
        class="game-exit border border-mist/25 bg-abyss/80 px-4 py-2 font-display text-[10px] tracking-[0.2em] text-mist opacity-40 backdrop-blur transition hover:border-soul/50 hover:text-fog hover:opacity-100"
      >
        RETURN TO SITE
      </button>
      <main id="game" aria-label="Everlasting Oblivion game canvas"></main>
    </div>
  `;

  const game = new Phaser.Game(gameConfig);
  root.querySelector<HTMLButtonElement>('[data-exit-game]')?.addEventListener('click', () => {
    game.destroy(true);
    onExit();
  });
}
