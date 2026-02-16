import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
      navigate('/lobby');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <h1>Go Game</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Login</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="text" placeholder="Username" value={username}
          onChange={(e) => setUsername(e.target.value)} required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)} required
        />
        <button type="submit" className="btn btn-primary">Login</button>
        <p>Don't have an account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
