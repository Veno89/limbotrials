import { describe, expect, it } from 'vitest';
import {
  defaultDevModeSettings,
  loadDevModeSettings,
  writeDevModeSettings,
} from '../systems/DevModeSettings';
import type { StorageLike } from '../systems/SaveSystem';

class MemoryStorage implements StorageLike {
  value: string | null = null;

  getItem(): string | null {
    return this.value;
  }

  setItem(_key: string, value: string): void {
    this.value = value;
  }
}

describe('dev mode settings', () => {
  it('defaults to disabled invincibility', () => {
    expect(defaultDevModeSettings()).toEqual({ invincible: false });
    expect(loadDevModeSettings(new MemoryStorage())).toEqual({ invincible: false });
  });

  it('round trips local dev preferences', () => {
    const storage = new MemoryStorage();
    writeDevModeSettings({ invincible: true }, storage);
    expect(loadDevModeSettings(storage)).toEqual({ invincible: true });
  });

  it('falls back safely when local storage is malformed', () => {
    const storage = new MemoryStorage();
    storage.value = '{not-json';
    expect(loadDevModeSettings(storage)).toEqual({ invincible: false });
  });
});
