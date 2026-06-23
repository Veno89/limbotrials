import Phaser from 'phaser';
import type { EnemyDefinition } from '../types/gameTypes';

export interface SpatialEntity {
  sprite: Phaser.Physics.Arcade.Image;
  radius: number;
  definition: EnemyDefinition;
}

export class SpatialGrid {
  private readonly cells = new Map<number, SpatialEntity[]>();
  public readonly cellSize = 96;

  clear(): void {
    for (const cell of this.cells.values()) {
      cell.length = 0;
    }
  }

  insert(entity: SpatialEntity): void {
    const key = this.cellKey(entity.sprite.x, entity.sprite.y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = [];
      this.cells.set(key, cell);
    }
    cell.push(entity);
  }

  getNearby(x: number, y: number, range: number, result: SpatialEntity[] = []): SpatialEntity[] {
    result.length = 0;
    const minCellX = Math.floor((x - range) / this.cellSize);
    const maxCellX = Math.floor((x + range) / this.cellSize);
    const minCellY = Math.floor((y - range) / this.cellSize);
    const maxCellY = Math.floor((y + range) / this.cellSize);

    for (let cy = minCellY; cy <= maxCellY; cy += 1) {
      for (let cx = minCellX; cx <= maxCellX; cx += 1) {
        const cell = this.cells.get(this.keyFor(cx, cy));
        if (!cell) continue;
        for (const entity of cell) {
          result.push(entity);
        }
      }
    }
    return result;
  }

  getCell(cx: number, cy: number): SpatialEntity[] | undefined {
    return this.cells.get(this.keyFor(cx, cy));
  }

  cellKey(x: number, y: number): number {
    return this.keyFor(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
  }

  private keyFor(cx: number, cy: number): number {
    return (cx & 0xFFFF) | ((cy & 0xFFFF) << 16);
  }
}
