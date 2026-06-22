import Phaser from 'phaser';
import { ARENA_HEIGHT, ARENA_WIDTH } from '../constants';
import { canFlipArenaTile, createArenaFloorLayout, type ArenaTileId } from './arenaFloorRules';

const TILE_SIZE = 128;
const FLOOR_TEXTURE = 'arena-floor-composite';
const SEAM_BLEND_PX = 5;

export class ArenaFloorSystem {
  static create(scene: Phaser.Scene): void {
    scene.cameras.main.setRoundPixels(true);
    scene.add.rectangle(0, 0, ARENA_WIDTH, ARENA_HEIGHT, 0x161b1e).setOrigin(0).setDepth(-1);
    if (!scene.textures.exists(FLOOR_TEXTURE)) {
      this.createCompositeTexture(scene);
    }
    scene.add
      .image(0, 0, FLOOR_TEXTURE)
      .setOrigin(0)
      .setTint(0x9aa5aa)
      .setDepth(0);
    this.addMortarOverlay(scene);
  }

  private static createCompositeTexture(scene: Phaser.Scene): void {
    const texture = scene.textures.createCanvas(FLOOR_TEXTURE, ARENA_WIDTH, ARENA_HEIGHT);
    if (!texture) {
      throw new Error('Could not create the arena floor texture.');
    }
    const context = texture.getContext();
    const columns = Math.ceil(ARENA_WIDTH / TILE_SIZE);
    const rows = Math.ceil(ARENA_HEIGHT / TILE_SIZE);
    const layout = createArenaFloorLayout(columns, rows);
    layout.forEach((tiles, row) => {
      tiles.forEach((tile, column) => this.drawTile(scene, context, tile, column, row));
    });
    blendSeams(context, ARENA_WIDTH, ARENA_HEIGHT, TILE_SIZE, SEAM_BLEND_PX);
    texture.refresh();
  }

  private static drawTile(
    scene: Phaser.Scene,
    context: CanvasRenderingContext2D,
    tile: ArenaTileId,
    column: number,
    row: number,
  ): void {
    const source = scene.textures.get(`arena-tile-${tile}`).getSourceImage() as unknown as CanvasImageSource;
    const orientation = Math.imul(row + 1, 73856093) ^ Math.imul(column + 1, 19349663);
    const flipX = canFlipArenaTile(tile) && (orientation & 1) !== 0;
    const flipY = canFlipArenaTile(tile) && (orientation & 2) !== 0;
    context.save();
    context.translate(column * TILE_SIZE + TILE_SIZE / 2, row * TILE_SIZE + TILE_SIZE / 2);
    context.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    context.drawImage(source, -TILE_SIZE / 2, -TILE_SIZE / 2, TILE_SIZE, TILE_SIZE);
    context.restore();
  }

  private static addMortarOverlay(scene: Phaser.Scene): void {
    const mortar = scene.add.graphics().setDepth(0.5);
    mortar.lineStyle(1, 0x151b1e, 0.14);
    for (let x = 32; x < ARENA_WIDTH; x += 32) {
      mortar.lineBetween(x, 0, x, ARENA_HEIGHT);
    }
    for (let y = 32; y < ARENA_HEIGHT; y += 32) {
      mortar.lineBetween(0, y, ARENA_WIDTH, y);
    }
  }
}

function blendSeams(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  tileSize: number,
  radius: number,
): void {
  const image = context.getImageData(0, 0, width, height);
  const pixels = image.data;
  for (let x = tileSize; x < width; x += tileSize) {
    blendVerticalSeam(pixels, width, height, x, radius);
  }
  for (let y = tileSize; y < height; y += tileSize) {
    blendHorizontalSeam(pixels, width, y, radius);
  }
  context.putImageData(image, 0, 0);
}

function blendVerticalSeam(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  seamX: number,
  radius: number,
): void {
  const span = radius * 2;
  for (let y = 0; y < height; y += 1) {
    const left = (y * width + seamX - radius - 1) * 4;
    const right = (y * width + seamX + radius) * 4;
    for (let offset = 0; offset < span; offset += 1) {
      const ratio = (offset + 1) / (span + 1);
      const target = (y * width + seamX - radius + offset) * 4;
      blendPixel(pixels, target, left, right, ratio);
    }
  }
}

function blendHorizontalSeam(
  pixels: Uint8ClampedArray,
  width: number,
  seamY: number,
  radius: number,
): void {
  const span = radius * 2;
  for (let x = 0; x < width; x += 1) {
    const top = ((seamY - radius - 1) * width + x) * 4;
    const bottom = ((seamY + radius) * width + x) * 4;
    for (let offset = 0; offset < span; offset += 1) {
      const ratio = (offset + 1) / (span + 1);
      const target = ((seamY - radius + offset) * width + x) * 4;
      blendPixel(pixels, target, top, bottom, ratio);
    }
  }
}

function blendPixel(
  pixels: Uint8ClampedArray,
  target: number,
  start: number,
  end: number,
  ratio: number,
): void {
  for (let channel = 0; channel < 4; channel += 1) {
    pixels[target + channel] = Math.round(
      pixels[start + channel]! * (1 - ratio) + pixels[end + channel]! * ratio,
    );
  }
}
