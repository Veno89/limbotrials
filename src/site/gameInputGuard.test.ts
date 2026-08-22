import { describe, expect, it, vi } from 'vitest';
import { reserveGameSecondaryClick } from './gameInputGuard';

describe('game input guard', () => {
  it('reserves the context menu and secondary button without blocking primary input', () => {
    const target = new EventTarget() as HTMLElement;
    const pointerListener = vi.fn();
    const release = reserveGameSecondaryClick(target);
    target.addEventListener('pointerdown', pointerListener);

    const contextMenu = new Event('contextmenu', { cancelable: true });
    const secondaryDown = buttonEvent('pointerdown', 2);
    const primaryDown = buttonEvent('pointerdown', 0);

    target.dispatchEvent(contextMenu);
    target.dispatchEvent(secondaryDown);
    target.dispatchEvent(primaryDown);

    expect(contextMenu.defaultPrevented).toBe(true);
    expect(secondaryDown.defaultPrevented).toBe(true);
    expect(primaryDown.defaultPrevented).toBe(false);
    expect(pointerListener).toHaveBeenCalledTimes(1);

    release();
    const restoredContextMenu = new Event('contextmenu', { cancelable: true });
    target.dispatchEvent(restoredContextMenu);
    expect(restoredContextMenu.defaultPrevented).toBe(false);
  });
});

function buttonEvent(type: string, button: number): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'button', { value: button });
  return event;
}
