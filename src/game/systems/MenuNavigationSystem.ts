export interface MenuReturnTarget {
  sceneKey: string;
  data?: object;
}

export interface MenuNavigationActions {
  start: (sceneKey: string, data?: object) => void;
  bringToTop: (sceneKey: string) => void;
}

export const MAIN_MENU_RETURN_TARGET: MenuReturnTarget = {
  sceneKey: 'MainMenuScene',
};

export function returnFromMenu(
  actions: MenuNavigationActions,
  target: MenuReturnTarget = MAIN_MENU_RETURN_TARGET,
): void {
  actions.start(target.sceneKey, target.data);
  actions.bringToTop(target.sceneKey);
}
