import { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { disconnectSocket } from '../socket';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      // V-17: Guard against corrupted localStorage
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  async function login(username, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  async function register(username, password) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
