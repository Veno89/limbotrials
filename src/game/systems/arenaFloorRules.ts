export type ArenaTileId = 1 | 2 | 3 | 4 | 5;

const RARE_TILES = new Set<ArenaTileId>([3, 4, 5]);

export function selectArenaTile(roll: number): ArenaTileId {
  if (roll < 0.42) {
    return 1;
  }
  if (roll < 0.77) {
    return 2;
  }
  if (roll < 0.86) {
    return 3;
  }
  if (roll < 0.94) {
    return 4;
  }
  return 5;
}

export function canFlipArenaTile(tile: ArenaTileId): boolean {
  return tile !== 3 && tile !== 5;
}

export function createArenaFloorLayout(columns: number, rows: number, seed = 0x51a7): ArenaTileId[][] {
  const random = seededRandom(seed);
  const layout: ArenaTileId[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const tiles: ArenaTileId[] = [];
    for (let column = 0; column < columns; column += 1) {
      let tile = selectArenaTile(random());
      const rareNeighbor =
        (column > 0 && RARE_TILES.has(tiles[column - 1]!)) ||
        (row > 0 && RARE_TILES.has(layout[row - 1]![column]!));
      if (RARE_TILES.has(tile) && rareNeighbor) {
        tile = random() < 0.55 ? 1 : 2;
      }
      tiles.push(tile);
    }
    layout.push(tiles);
  }
  return layout;
}

function seededRandom(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}
