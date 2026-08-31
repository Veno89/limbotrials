import Phaser from 'phaser';

export type BrowserFlowScene =
  | 'main-menu'
  | 'settings'
  | 'character-select'
  | 'gameplay'
  | 'pause'
  | 'result-loss'
  | 'result-victory';

/**
 * Exposes a narrow, non-authoritative scene marker for browser regression tests.
 * Gameplay never reads this value; it exists because canvas presence alone cannot
 * prove that a coordinate-driven smoke test reached the intended Phaser scene.
 */
export function markBrowserFlowScene(
  scene: Phaser.Scene,
  state: BrowserFlowScene,
  stateAfterShutdown?: BrowserFlowScene,
): void {
  document.body.dataset.limboScene = state;
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    if (document.body.dataset.limboScene !== state) {
      return;
    }
    if (stateAfterShutdown) {
      document.body.dataset.limboScene = stateAfterShutdown;
    } else {
      delete document.body.dataset.limboScene;
    }
  });
}
