import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
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
          <button onClick={toggleTheme} className="theme-toggle" title="Toggle theme">
            {theme === 'light' ? '\u{1F319}' : '\u{2600}\u{FE0F}'}
          </button>
          <span className="navbar-user">{user.username}</span>
          <button onClick={handleLogout} className="btn btn-small">Logout</button>
        </div>
      )}
    </nav>
  );
}
