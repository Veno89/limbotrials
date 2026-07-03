import { describe, expect, it } from 'vitest';
import {
  DEFAULT_UI_ZOOM,
  GAMEPLAY_CAMERA_ZOOM,
  MAX_GAMEPLAY_CAMERA_ZOOM,
  MIN_GAMEPLAY_CAMERA_ZOOM,
  applyGameplayCameraZoom,
  applyUiCameraZoom,
  clampGameplayCameraZoom,
} from '../config/cameraConfig';

describe('cameraConfig', () => {
  it('keeps the gameplay zoom in the conservative readability range', () => {
    expect(GAMEPLAY_CAMERA_ZOOM).toBeGreaterThanOrEqual(MIN_GAMEPLAY_CAMERA_ZOOM);
    expect(GAMEPLAY_CAMERA_ZOOM).toBeLessThanOrEqual(MAX_GAMEPLAY_CAMERA_ZOOM);
    expect(DEFAULT_UI_ZOOM).toBe(1);
  });

  it('applies clamped gameplay zoom through the central helper', () => {
    const applied: number[] = [];
    const camera = { setZoom: (value: number) => applied.push(value) };

    applyGameplayCameraZoom(camera, MAX_GAMEPLAY_CAMERA_ZOOM + 0.5);

    expect(applied).toEqual([MAX_GAMEPLAY_CAMERA_ZOOM]);
    expect(clampGameplayCameraZoom(MIN_GAMEPLAY_CAMERA_ZOOM - 0.5)).toBe(MIN_GAMEPLAY_CAMERA_ZOOM);
  });

  it('keeps UI cameras unzoomed', () => {
    const applied: number[] = [];
    const camera = { setZoom: (value: number) => applied.push(value) };

    applyUiCameraZoom(camera);

    expect(applied).toEqual([DEFAULT_UI_ZOOM]);
  });
});
