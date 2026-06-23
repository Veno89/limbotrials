import Phaser from 'phaser';
import type { SpatialGrid, SpatialEntity } from './SpatialGrid';

export class EnemySeparationSystem {
  apply(grid: SpatialGrid, targets: readonly SpatialEntity[]): void {
    for (const target of targets) {
      this.separateTarget(target, grid);
    }
  }

  private separateTarget(target: SpatialEntity, grid: SpatialGrid): void {
    const cellX = Math.floor(target.sprite.x / grid.cellSize);
    const cellY = Math.floor(target.sprite.y / grid.cellSize);
    let pushX = 0;
    let pushY = 0;

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const cell = grid.getCell(cellX + offsetX, cellY + offsetY);
        if (!cell) {
          continue;
        }
        for (const other of cell) {
          if (other.sprite === target.sprite) {
            continue;
          }
          const dx = target.sprite.x - other.sprite.x;
          const dy = target.sprite.y - other.sprite.y;
          const minimumDistance = (target.radius + other.radius) * 0.72;
          const distanceSquared = dx * dx + dy * dy;
          if (distanceSquared >= minimumDistance * minimumDistance) {
            continue;
          }
          const distance = Math.max(0.1, Math.sqrt(distanceSquared));
          const strength = ((minimumDistance - distance) / minimumDistance) * 75;
          pushX += (dx / distance) * strength;
          pushY += (dy / distance) * strength;
        }
      }
    }

    const body = target.sprite.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(body.velocity.x + pushX, body.velocity.y + pushY);
  }
}
