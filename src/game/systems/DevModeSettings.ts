import type { StorageLike } from './SaveSystem';

const DEV_MODE_SETTINGS_KEY = 'everlasting-oblivion-limbo-trial-dev-mode';

export interface DevModeSettings {
  invincible: boolean;
}

export function defaultDevModeSettings(): DevModeSettings {
  return { invincible: false };
}

export function loadDevModeSettings(storage: StorageLike = localStorage): DevModeSettings {
  try {
    const raw = storage.getItem(DEV_MODE_SETTINGS_KEY);
    if (!raw) {
      return defaultDevModeSettings();
    }
    const parsed = JSON.parse(raw) as Partial<DevModeSettings>;
    return {
      invincible: Boolean(parsed.invincible),
    };
  } catch {
    return defaultDevModeSettings();
  }
}

export function writeDevModeSettings(
  settings: DevModeSettings,
  storage: StorageLike = localStorage,
): void {
  storage.setItem(DEV_MODE_SETTINGS_KEY, JSON.stringify(settings));
}
