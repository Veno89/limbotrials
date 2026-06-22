import { describe, expect, it, vi } from 'vitest';
import {
  MAIN_MENU_RETURN_TARGET,
  returnFromMenu,
  type MenuNavigationActions,
} from '../systems/MenuNavigationSystem';

function createActions(): MenuNavigationActions {
  return {
    start: vi.fn(),
    bringToTop: vi.fn(),
  };
}

describe('menu navigation', () => {
  it('starts the main menu by default', () => {
    const actions = createActions();

    returnFromMenu(actions);

    expect(actions.start).toHaveBeenCalledWith(MAIN_MENU_RETURN_TARGET.sceneKey, undefined);
    expect(actions.bringToTop).toHaveBeenCalledWith(MAIN_MENU_RETURN_TARGET.sceneKey);
  });

  it('forwards scene data when starting a destination', () => {
    const actions = createActions();
    const data = { selectedCharacter: 'haunted' };

    returnFromMenu(actions, { sceneKey: 'CharacterSelectScene', data });

    expect(actions.start).toHaveBeenCalledWith('CharacterSelectScene', data);
    expect(actions.bringToTop).toHaveBeenCalledWith('CharacterSelectScene');
  });

  it('starts a menu before moving it above the paused game', () => {
    const order: string[] = [];

    returnFromMenu(
      {
        start: (sceneKey) => order.push(`start:${sceneKey}`),
        bringToTop: (sceneKey) => order.push(`top:${sceneKey}`),
      },
      { sceneKey: 'JournalScene' },
    );

    expect(order).toEqual(['start:JournalScene', 'top:JournalScene']);
  });
});
