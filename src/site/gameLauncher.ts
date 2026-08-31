import Phaser from 'phaser';
import { gameConfig } from '../game/config';
import { RETURN_TO_SITE_EVENT } from '../game/gameExitEvents';
import { reserveGameSecondaryClick } from './gameInputGuard';

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

  const gameSurface = root.querySelector<HTMLElement>('#game');
  if (!gameSurface) {
    throw new Error('Missing game surface.');
  }
  const releaseSecondaryClick = reserveGameSecondaryClick(gameSurface);
  const developmentToolsEnabled =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true';
  let runtimeConfig = gameConfig;
  if (developmentToolsEnabled) {
    const [{ DevModeScene }, { ContentLabScene }] = await Promise.all([
      import('../game/scenes/DevModeScene'),
      import('../game/scenes/ContentLabScene'),
    ]);
    const configuredScenes = Array.isArray(gameConfig.scene)
      ? gameConfig.scene
      : gameConfig.scene
        ? [gameConfig.scene]
        : [];
    runtimeConfig = {
      ...gameConfig,
      scene: [...configuredScenes, DevModeScene, ContentLabScene],
    };
  }
  const game = new Phaser.Game(runtimeConfig);
  let releaseDevelopmentTools = (): void => undefined;
  if (developmentToolsEnabled) {
    const openContentLab = (): void => {
      if (game.scene.isActive('ContentLabScene')) {
        return;
      }
      const resumeSceneKeys = game.scene
        .getScenes(true)
        .map((scene) => scene.scene.key)
        .filter((key) => key !== 'ContentLabScene');
      for (const sceneKey of resumeSceneKeys) {
        game.scene.pause(sceneKey);
      }
      game.scene.start('ContentLabScene', { resumeSceneKeys });
      game.scene.bringToTop('ContentLabScene');
    };
    let pendingMainMenu: Phaser.Scene | undefined;
    let mainMenuCreatedHandler: (() => void) | undefined;
    const openAfterAssetsReady = (): void => {
      if (game.scene.isActive('MainMenuScene')) {
        openContentLab();
        return;
      }
      if (mainMenuCreatedHandler) {
        return;
      }
      pendingMainMenu = game.scene.getScene('MainMenuScene');
      mainMenuCreatedHandler = () => {
        pendingMainMenu = undefined;
        mainMenuCreatedHandler = undefined;
        openContentLab();
      };
      pendingMainMenu.events.once(Phaser.Scenes.Events.CREATE, mainMenuCreatedHandler);
      // Covers a Main Menu transition completing between the active check and listener install.
      if (game.scene.isActive('MainMenuScene')) {
        pendingMainMenu.events.off(Phaser.Scenes.Events.CREATE, mainMenuCreatedHandler);
        mainMenuCreatedHandler();
      }
    };
    const requestContentLab = (event?: KeyboardEvent): void => {
      event?.preventDefault();
      if (game.registry.get('limbo:assets-ready') === true) {
        openContentLab();
        return;
      }
      game.events.once('limbo:assets-ready', openAfterAssetsReady);
      // Covers an asset-ready event emitted between the registry check and listener install.
      if (game.registry.get('limbo:assets-ready') === true) {
        game.events.off('limbo:assets-ready', openAfterAssetsReady);
        openAfterAssetsReady();
      }
    };
    const contentLabShortcut = (event: KeyboardEvent): void => {
      if (event.code === 'F11') {
        requestContentLab(event);
      }
    };
    window.addEventListener('keydown', contentLabShortcut);
    if (new URLSearchParams(window.location.search).get('content-lab') === '1') {
      requestContentLab();
    }
    releaseDevelopmentTools = () => {
      window.removeEventListener('keydown', contentLabShortcut);
      game.events.off('limbo:assets-ready', openAfterAssetsReady);
      if (pendingMainMenu && mainMenuCreatedHandler) {
        pendingMainMenu.events.off(Phaser.Scenes.Events.CREATE, mainMenuCreatedHandler);
      }
    };
  }
  let exited = false;
  const exit = (): void => {
    if (exited) {
      return;
    }
    exited = true;
    window.removeEventListener(RETURN_TO_SITE_EVENT, exit);
    releaseDevelopmentTools();
    releaseSecondaryClick();
    game.destroy(true);
    delete document.body.dataset.limboScene;
    onExit();
  };
  window.addEventListener(RETURN_TO_SITE_EVENT, exit);
  root.querySelector<HTMLButtonElement>('[data-exit-game]')?.addEventListener('click', exit);
}
