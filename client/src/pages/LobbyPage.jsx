import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';
import GameList from '../components/GameList';

export default function LobbyPage() {
  const [games, setGames] = useState([]);
  const [boardSize, setBoardSize] = useState(19);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadGames() {
    try {
      const data = await apiFetch('/games');
      setGames(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadGames();
    const interval = setInterval(loadGames, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    try {
      const game = await apiFetch('/games', {
        method: 'POST',
        body: JSON.stringify({ boardSize }),
      });
      navigate(`/game/${game.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="lobby-page">
      <h2>Game Lobby</h2>

      <form onSubmit={handleCreate} className="create-game-form">
        <label>
          Board size:
          <select value={boardSize} onChange={(e) => setBoardSize(Number(e.target.value))}>
            <option value={9}>9x9</option>
            <option value={13}>13x13</option>
            <option value={19}>19x19</option>
          </select>
        </label>
        <button type="submit" className="btn btn-primary">Create Game</button>
      </form>

      {error && <p className="error">{error}</p>}

      <GameList games={games} />
    </div>
  );
}
