import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <Link to="/lobby" className="navbar-brand">Go Game</Link>
        <Link to="/rules" className="navbar-link">Rules</Link>
      </div>
      {user && (
        <div className="navbar-right">
          <span className="navbar-user">{user.username}</span>
          <button onClick={handleLogout} className="btn btn-small">Logout</button>
        </div>
      )}
    </nav>
  );
}
