import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GameList({ games }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (games.length === 0) {
    return <p className="muted">No games available. Create one!</p>;
  }

  return (
    <table className="game-table">
      <thead>
        <tr>
          <th>Board</th>
          <th>Black</th>
          <th>White</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {games.map((g) => (
          <tr key={g.id}>
            <td>{g.board_size}x{g.board_size}</td>
            <td>{g.black_username}</td>
            <td>{g.white_username || '(waiting)'}</td>
            <td>{g.status}</td>
            <td>
              {g.status === 'waiting' && g.black_id !== user.id ? (
                <button className="btn btn-small" onClick={() => navigate(`/game/${g.id}`)}>
                  Join
                </button>
              ) : (
                <button className="btn btn-small btn-outline" onClick={() => navigate(`/game/${g.id}`)}>
                  {g.status === 'active' && (g.black_id === user.id || g.white_id === user.id) ? 'Play' : 'View'}
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
