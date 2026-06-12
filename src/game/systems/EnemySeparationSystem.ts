import Phaser from 'phaser';

export interface SeparationTarget {
  sprite: Phaser.Physics.Arcade.Image;
  radius: number;
}

export class EnemySeparationSystem {
  private readonly cells = new Map<string, SeparationTarget[]>();
  private readonly cellSize = 96;

  apply(targets: readonly SeparationTarget[]): void {
    this.cells.clear();
    for (const target of targets) {
      const key = this.cellKey(target.sprite.x, target.sprite.y);
      const cell = this.cells.get(key);
      if (cell) {
        cell.push(target);
      } else {
        this.cells.set(key, [target]);
      }
    }

    for (const target of targets) {
      this.separateTarget(target);
    }
  }

  private separateTarget(target: SeparationTarget): void {
    const cellX = Math.floor(target.sprite.x / this.cellSize);
    const cellY = Math.floor(target.sprite.y / this.cellSize);
    let pushX = 0;
    let pushY = 0;

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const cell = this.cells.get(`${cellX + offsetX},${cellY + offsetY}`);
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

  private cellKey(x: number, y: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }
}
