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
    <div className="board-container" style={{ maxWidth: Math.min(600, size * 32) }}>
    <div className="board-inner">
    <svg
      viewBox={`0 0 ${viewSize} ${viewSize}`}
      className="go-board"
    >
      <defs>
        {/* Board wood grain texture */}
        <linearGradient id="board-grain" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e2be6a" />
          <stop offset="25%" stopColor="#d4ab54" />
          <stop offset="50%" stopColor="#dbb960" />
          <stop offset="75%" stopColor="#cfa44e" />
          <stop offset="100%" stopColor="#d9b65c" />
        </linearGradient>

        {/* Engraved line effect — shadow below, highlight above */}
        <filter id="engrave" x="-50%" y="-50%" width="200%" height="200%">
          <feOffset in="SourceGraphic" dx="0" dy="0.03" result="shadow" />
          <feFlood floodColor="#b8952e" floodOpacity="0.6" result="shadowColor" />
          <feComposite in="shadowColor" in2="shadow" operator="in" result="darkLine" />
          <feOffset in="SourceGraphic" dx="0" dy="-0.03" result="highlight" />
          <feFlood floodColor="#f0d88a" floodOpacity="0.5" result="highlightColor" />
          <feComposite in="highlightColor" in2="highlight" operator="in" result="lightLine" />
          <feMerge>
            <feMergeNode in="darkLine" />
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="lightLine" />
          </feMerge>
        </filter>

        {/* Engraved star point */}
        <filter id="engrave-dot" x="-100%" y="-100%" width="300%" height="300%">
          <feDropShadow dx="0.03" dy="0.03" stdDeviation="0.02" floodColor="#b8952e" floodOpacity="0.7" />
          <feDropShadow dx="-0.02" dy="-0.02" stdDeviation="0.02" floodColor="#f0d88a" floodOpacity="0.4" />
        </filter>

        {/* Black stone — 3D sphere with shadow */}
        <radialGradient id="black-stone" cx="0.35" cy="0.35" r="0.55">
          <stop offset="0%" stopColor="#555" />
          <stop offset="50%" stopColor="#222" />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <filter id="stone-shadow" x="-30%" y="-30%" width="180%" height="180%">
          <feDropShadow dx="0.06" dy="0.08" stdDeviation="0.08" floodColor="#000" floodOpacity="0.5" />
        </filter>

        {/* White stone — 3D sphere with shadow */}
        <radialGradient id="white-stone" cx="0.35" cy="0.35" r="0.55">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="50%" stopColor="#f0f0f0" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </radialGradient>
      </defs>

      {/* Board background with grain */}
      <rect x="0" y="0" width={viewSize} height={viewSize} fill="url(#board-grain)" rx="0" />

      {/* Subtle inner bevel on the board surface */}
      <rect
        x="0.15" y="0.15"
        width={viewSize - 0.3} height={viewSize - 0.3}
        fill="none"
        stroke="#f0d88a"
        strokeWidth="0.08"
        opacity="0.3"
        rx="0"
      />
      <rect
        x="0.05" y="0.05"
        width={viewSize - 0.1} height={viewSize - 0.1}
        fill="none"
        stroke="#a0841e"
        strokeWidth="0.06"
        opacity="0.2"
        rx="0"
      />

      {/* Grid lines — engraved into board */}
      <g filter="url(#engrave)">
        {Array.from({ length: size }, (_, i) => (
          <g key={`lines-${i}`}>
            <line
              x1={padding} y1={padding + i}
              x2={padding + size - 1} y2={padding + i}
              stroke="#3d2e10" strokeWidth="0.06"
            />
            <line
              x1={padding + i} y1={padding}
              x2={padding + i} y2={padding + size - 1}
              stroke="#3d2e10" strokeWidth="0.06"
            />
          </g>
        ))}
      </g>

      {/* Border lines — thicker engraved edges */}
      <g filter="url(#engrave)">
        <rect
          x={padding} y={padding}
          width={size - 1} height={size - 1}
          fill="none"
          stroke="#2a1e08"
          strokeWidth="0.09"
        />
      </g>

      {/* Star points (hoshi) — engraved dots */}
      {getStarPoints().map(([x, y]) => (
        <circle
          key={`star-${x}-${y}`}
          cx={padding + x} cy={padding + y}
          r={0.14}
          fill="#6b5520"
          filter="url(#engrave-dot)"
        />
      ))}

      {/* Stones — 3D spheres with drop shadows */}
      {grid && grid.map((cell, idx) => {
        if (cell === 0) return null;
        const x = idx % size;
        const y = Math.floor(idx / size);
        const isLast = lastMove && lastMove.x === x && lastMove.y === y;
        const isBlack = cell === BLACK;
        return (
          <g key={`stone-${idx}`} filter="url(#stone-shadow)">
            <circle
              cx={padding + x} cy={padding + y}
              r={0.46}
              fill={isBlack ? 'url(#black-stone)' : 'url(#white-stone)'}
              stroke={isBlack ? '#000' : '#aaa'}
              strokeWidth="0.02"
            />
            {/* Specular highlight */}
            <ellipse
              cx={padding + x - 0.1} cy={padding + y - 0.12}
              rx={0.13} ry={0.09}
              fill="#fff"
              opacity={isBlack ? 0.15 : 0.5}
            />
            {/* Last move indicator */}
            {isLast && (
              <circle
                cx={padding + x} cy={padding + y}
                r={0.15}
                fill="none"
                stroke={isBlack ? '#fff' : '#333'}
                strokeWidth="0.06"
                opacity="0.8"
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
    </svg>
    </div>
    </div>
  );
}
