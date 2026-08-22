const SECONDARY_BUTTON = 2;
const SECONDARY_EVENT_TYPES = ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'auxclick'] as const;
const CAPTURE = { capture: true } as const;

export function reserveGameSecondaryClick(target: HTMLElement): () => void {
  const blockContextMenu = (event: Event): void => {
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const blockSecondaryButton = (event: Event): void => {
    if (!hasButton(event) || event.button !== SECONDARY_BUTTON) {
      return;
    }
    event.preventDefault();
    event.stopImmediatePropagation();
  };

  target.addEventListener('contextmenu', blockContextMenu, CAPTURE);
  for (const eventType of SECONDARY_EVENT_TYPES) {
    target.addEventListener(eventType, blockSecondaryButton, CAPTURE);
  }

  return () => {
    target.removeEventListener('contextmenu', blockContextMenu, CAPTURE);
    for (const eventType of SECONDARY_EVENT_TYPES) {
      target.removeEventListener(eventType, blockSecondaryButton, CAPTURE);
    }
  };
}

function hasButton(event: Event): event is Event & { button: number } {
  return 'button' in event && typeof event.button === 'number';
}
