import { EMPTY, BLACK, WHITE } from './constants.js';

// Chinese area scoring: stones on board + surrounded empty territory
export function scoreGame(board, komi) {
  let blackStones = 0;
  let whiteStones = 0;
  let blackTerritory = 0;
  let whiteTerritory = 0;

  // Count stones on board
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const c = board.get(x, y);
      if (c === BLACK) blackStones++;
      else if (c === WHITE) whiteStones++;
    }
  }

  // Find empty regions and assign territory
  const visited = new Set();

  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      if (board.get(x, y) !== EMPTY) continue;
      const key = `${x},${y}`;
      if (visited.has(key)) continue;

      // BFS to find connected empty region
      const region = [];
      const borders = new Set(); // which colors border this region
      const queue = [{ x, y }];
      visited.add(key);

      while (queue.length > 0) {
        const pos = queue.shift();
        region.push(pos);

        for (const n of board.getNeighbors(pos.x, pos.y)) {
          const nKey = `${n.x},${n.y}`;
          const nColor = board.get(n.x, n.y);

          if (nColor === EMPTY) {
            if (!visited.has(nKey)) {
              visited.add(nKey);
              queue.push(n);
            }
          } else {
            borders.add(nColor);
          }
        }
      }

      // Assign territory if bordered by exactly one color
      if (borders.size === 1) {
        const owner = borders.values().next().value;
        if (owner === BLACK) blackTerritory += region.length;
        else if (owner === WHITE) whiteTerritory += region.length;
      }
      // If borders both colors (dame) or no color, territory is neutral
    }
  }

  const blackScore = blackStones + blackTerritory;
  const whiteScore = whiteStones + whiteTerritory + komi;

  const diff = blackScore - whiteScore;
  const winner = diff > 0 ? BLACK : diff < 0 ? WHITE : null;
  const absDiff = Math.abs(diff);
  const result = winner
    ? `${winner === BLACK ? 'B' : 'W'}+${absDiff}`
    : 'Draw';

  return { blackScore, whiteScore, winner, result };
}
