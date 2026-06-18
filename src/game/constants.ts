export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;
export const ARENA_WIDTH = 2560;
export const ARENA_HEIGHT = 1920;
export const RUN_DURATION_MS = 15 * 60 * 1000;
export const BOSS_SPAWN_MS = RUN_DURATION_MS - 60 * 1000;
export const SAVE_KEY = 'everlasting-oblivion-limbo-trial';
export const SAVE_VERSION = 6;

export const COLORS = {
  background: 0x071014,
  panel: 0x0b1419,
  panelLight: 0x14242b,
  border: 0x637985,
  pale: 0xcbdde5,
  soul: 0x69d9ff,
  void: 0x9d72ff,
  blood: 0xa52d35,
  hellfire: 0xf07b35,
  gold: 0xc7a76a,
  enemyProjectile: 0xd94545,
  enemyProjectileGlow: 0xff6a4d,
  enemyTelegraph: 0xff3b30,
} as const;
