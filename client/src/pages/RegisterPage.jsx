import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      await register(username, password);
      navigate('/lobby');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="auth-page">
      <h1>Go Game</h1>
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Register</h2>
        {error && <p className="error">{error}</p>}
        <input
          type="text" placeholder="Username (letters, numbers, _ -)" value={username}
          onChange={(e) => setUsername(e.target.value)} required minLength={3} maxLength={20}
          pattern="[a-zA-Z0-9_-]{3,20}"
        />
        <input
          type="password" placeholder="Password (8+ chars)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8}
        />
        <button type="submit" className="btn btn-primary">Register</button>
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
