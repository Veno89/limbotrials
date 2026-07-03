export const GAMEPLAY_CAMERA_ZOOM = 1.12;
export const MIN_GAMEPLAY_CAMERA_ZOOM = 1.08;
export const MAX_GAMEPLAY_CAMERA_ZOOM = 1.2;
export const DEFAULT_UI_ZOOM = 1;

export interface ZoomableCamera {
  setZoom(value: number): unknown;
}

export function clampGameplayCameraZoom(zoom = GAMEPLAY_CAMERA_ZOOM): number {
  return Math.min(MAX_GAMEPLAY_CAMERA_ZOOM, Math.max(MIN_GAMEPLAY_CAMERA_ZOOM, zoom));
}

export function applyGameplayCameraZoom(camera: ZoomableCamera, zoom = GAMEPLAY_CAMERA_ZOOM): void {
  camera.setZoom(clampGameplayCameraZoom(zoom));
}

export function applyUiCameraZoom(camera: ZoomableCamera): void {
  camera.setZoom(DEFAULT_UI_ZOOM);
}
