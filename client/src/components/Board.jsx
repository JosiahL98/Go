import { HOSHI_POINTS } from '../constants';

const BLACK = 1;
const WHITE = 2;

export default function Board({ grid, size, onIntersectionClick, lastMove, currentPlayer, myTurn }) {
  const padding = 1.5;
  const viewSize = size - 1 + padding * 2;

  function getStarPoints() {
    return HOSHI_POINTS[size] || [];
  }

  return (
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className="go-board"
      style={{ maxWidth: Math.min(600, size * 32), maxHeight: Math.min(600, size * 32) }}
    >
      {/* Board background */}
      <rect x="0" y="0" width={viewSize} height={viewSize} fill="#dcb35c" rx="0.2" />

      {/* Grid lines */}
      {Array.from({ length: size }, (_, i) => (
        <g key={`lines-${i}`}>
          <line
            x1={padding} y1={padding + i}
            x2={padding + size - 1} y2={padding + i}
            stroke="#333" strokeWidth="0.04"
          />
          <line
            x1={padding + i} y1={padding}
            x2={padding + i} y2={padding + size - 1}
            stroke="#333" strokeWidth="0.04"
          />
        </g>
      ))}

      {/* Star points (hoshi) */}
      {getStarPoints().map(([x, y]) => (
        <circle
          key={`star-${x}-${y}`}
          cx={padding + x} cy={padding + y}
          r={0.12} fill="#333"
        />
      ))}

      {/* Stones */}
      {grid && grid.map((cell, idx) => {
        if (cell === 0) return null;
        const x = idx % size;
        const y = Math.floor(idx / size);
        const isLast = lastMove && lastMove.x === x && lastMove.y === y;
        return (
          <g key={`stone-${idx}`}>
            <circle
              cx={padding + x} cy={padding + y}
              r={0.45}
              fill={cell === BLACK ? '#111' : '#eee'}
              stroke={cell === BLACK ? '#000' : '#999'}
              strokeWidth="0.04"
            />
            {/* Subtle gradient for 3D look */}
            <circle
              cx={padding + x - 0.12} cy={padding + y - 0.12}
              r={0.18}
              fill={cell === BLACK ? '#444' : '#fff'}
              opacity="0.3"
            />
            {/* Last move indicator */}
            {isLast && (
              <circle
                cx={padding + x} cy={padding + y}
                r={0.15}
                fill="none"
                stroke={cell === BLACK ? '#fff' : '#333'}
                strokeWidth="0.06"
              />
            )}
          </g>
        );
      })}

      {/* Click targets */}
      {myTurn && Array.from({ length: size * size }, (_, idx) => {
        const x = idx % size;
        const y = Math.floor(idx / size);
        if (grid && grid[idx] !== 0) return null;
        return (
          <rect
            key={`click-${idx}`}
            x={padding + x - 0.5} y={padding + y - 0.5}
            width={1} height={1}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => onIntersectionClick(x, y)}
          />
        );
      })}

      {/* Hover indicator via CSS - handled by cursor style above */}
    </svg>
  );
}
