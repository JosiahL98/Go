import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { getSocket } from '../socket';
import { useAuth } from '../context/AuthContext';
import Board from '../components/Board';
import GameInfo from '../components/GameInfo';
import { BLACK, WHITE } from '../constants';

export default function GamePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const socketRef = useRef(null);

  const [gameState, setGameState] = useState(null);
  const [blackPlayer, setBlackPlayer] = useState(null);
  const [whitePlayer, setWhitePlayer] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [lastMove, setLastMove] = useState(null);
  const [scores, setScores] = useState(null);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    socketRef.current = socket;

    socket.emit('join-game', { gameId: Number(id) });

    socket.on('game-state', (state) => {
      setGameState(state);
      setBlackPlayer(state.blackPlayer);
      setWhitePlayer(state.whitePlayer);
      setStatus(state.status);
      setError('');
    });

    socket.on('move-made', ({ x, y, color, captured, moveNumber }) => {
      setGameState((prev) => {
        if (!prev) return prev;
        const grid = [...prev.board.grid];
        grid[y * prev.board.size + x] = color;
        for (const c of captured) {
          grid[c.y * prev.board.size + c.x] = 0;
        }
        const capturedByBlack = prev.capturedByBlack + (color === BLACK ? captured.length : 0);
        const capturedByWhite = prev.capturedByWhite + (color === WHITE ? captured.length : 0);
        return {
          ...prev,
          board: { ...prev.board, grid },
          currentPlayer: color === BLACK ? WHITE : BLACK,
          capturedByBlack,
          capturedByWhite,
          moveCount: moveNumber,
        };
      });
      setLastMove({ x, y });
    });

    socket.on('player-passed', ({ color }) => {
      setGameState((prev) => prev ? {
        ...prev,
        currentPlayer: color === BLACK ? WHITE : BLACK,
      } : prev);
    });

    socket.on('player-joined', ({ userId, username, color }) => {
      if (color === WHITE) {
        setWhitePlayer({ id: userId, username });
        setStatus('active');
      }
    });

    socket.on('game-over', ({ winner, result, blackScore, whiteScore }) => {
      setGameState((prev) => prev ? {
        ...prev,
        isOver: true,
        winner,
        result,
      } : prev);
      setScores({ blackScore, whiteScore });
      setStatus('finished');
    });

    socket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 3000);
    });

    return () => {
      socket.off('game-state');
      socket.off('move-made');
      socket.off('player-passed');
      socket.off('player-joined');
      socket.off('game-over');
      socket.off('error');
    };
  }, [id]);

  function handlePlaceStone(x, y) {
    socketRef.current?.emit('place-stone', { gameId: Number(id), x, y });
  }

  function handlePass() {
    socketRef.current?.emit('pass', { gameId: Number(id) });
  }

  function handleResign() {
    if (confirm('Are you sure you want to resign?')) {
      socketRef.current?.emit('resign', { gameId: Number(id) });
    }
  }

  if (!gameState) {
    return <div className="game-page"><p>Loading game...</p></div>;
  }

  const myColor = blackPlayer?.id === user.id ? BLACK :
                  whitePlayer?.id === user.id ? WHITE : null;
  const myTurn = gameState.currentPlayer === myColor && status === 'active';

  return (
    <div className="game-page">
      {error && <p className="error toast">{error}</p>}

      {status === 'waiting' && (
        <div className="waiting-banner">
          <p>Waiting for opponent to join...</p>
        </div>
      )}

      <div className="game-layout">
        <Board
          grid={gameState.board.grid}
          size={gameState.board.size}
          onIntersectionClick={handlePlaceStone}
          lastMove={lastMove}
          currentPlayer={gameState.currentPlayer}
          myTurn={myTurn}
        />
        <GameInfo
          currentPlayer={gameState.currentPlayer}
          capturedByBlack={gameState.capturedByBlack}
          capturedByWhite={gameState.capturedByWhite}
          myColor={myColor}
          onPass={handlePass}
          onResign={handleResign}
          isOver={gameState.isOver}
          result={gameState.result}
          blackPlayer={blackPlayer}
          whitePlayer={whitePlayer}
          blackScore={scores?.blackScore}
          whiteScore={scores?.whiteScore}
        />
      </div>
    </div>
  );
}
