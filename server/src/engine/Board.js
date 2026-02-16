import { EMPTY, BLACK, WHITE } from './constants.js';

export default class Board {
  constructor(size) {
    this.size = size;
    this.grid = new Array(size * size).fill(EMPTY);
  }

  _idx(x, y) {
    return y * this.size + x;
  }

  inBounds(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  get(x, y) {
    return this.grid[this._idx(x, y)];
  }

  set(x, y, color) {
    this.grid[this._idx(x, y)] = color;
  }

  remove(x, y) {
    this.grid[this._idx(x, y)] = EMPTY;
  }

  clone() {
    const copy = new Board(this.size);
    copy.grid = this.grid.slice();
    return copy;
  }

  getNeighbors(x, y) {
    const neighbors = [];
    if (x > 0) neighbors.push({ x: x - 1, y });
    if (x < this.size - 1) neighbors.push({ x: x + 1, y });
    if (y > 0) neighbors.push({ x, y: y - 1 });
    if (y < this.size - 1) neighbors.push({ x, y: y + 1 });
    return neighbors;
  }

  // BFS to find connected group and its liberties
  getGroup(x, y) {
    const color = this.get(x, y);
    if (color === EMPTY) return { stones: [], liberties: new Set() };

    const visited = new Set();
    const stones = [];
    const liberties = new Set();
    const queue = [{ x, y }];
    visited.add(`${x},${y}`);

    while (queue.length > 0) {
      const pos = queue.shift();
      stones.push(pos);

      for (const n of this.getNeighbors(pos.x, pos.y)) {
        const key = `${n.x},${n.y}`;
        if (visited.has(key)) continue;
        visited.add(key);

        const nColor = this.get(n.x, n.y);
        if (nColor === EMPTY) {
          liberties.add(key);
        } else if (nColor === color) {
          queue.push(n);
        }
      }
    }

    return { stones, liberties };
  }

  // After placing a stone at (x,y) of `color`, capture any opponent groups with 0 liberties
  captureDeadGroups(x, y, color) {
    const opponent = color === BLACK ? WHITE : BLACK;
    const captured = [];
    const checked = new Set();

    for (const n of this.getNeighbors(x, y)) {
      const key = `${n.x},${n.y}`;
      if (checked.has(key)) continue;
      if (this.get(n.x, n.y) !== opponent) continue;

      const group = this.getGroup(n.x, n.y);
      for (const s of group.stones) checked.add(`${s.x},${s.y}`);

      if (group.liberties.size === 0) {
        for (const s of group.stones) {
          this.remove(s.x, s.y);
          captured.push({ x: s.x, y: s.y });
        }
      }
    }

    return captured;
  }

  // Hash for ko detection
  hash() {
    return this.grid.join(',');
  }

  toJSON() {
    return { size: this.size, grid: Array.from(this.grid) };
  }

  static fromJSON(data) {
    const board = new Board(data.size);
    board.grid = data.grid;
    return board;
  }
}
