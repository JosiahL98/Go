import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import RulesPage from './pages/RulesPage';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/lobby" /> : children;
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <main className="container">
          <Routes>
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/lobby" element={<ProtectedRoute><LobbyPage /></ProtectedRoute>} />
            <Route path="/game/:id" element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
            <Route path="/rules" element={<RulesPage />} />
            <Route path="*" element={<Navigate to="/lobby" />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
