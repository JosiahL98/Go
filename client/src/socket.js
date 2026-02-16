import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (socket) return socket;
  const token = localStorage.getItem('token');
  if (!token) return null;

  socket = io({
    auth: { token },
    reconnection: true,
  });

  // Refresh token from localStorage on each reconnect attempt
  socket.on('reconnect_attempt', () => {
    const freshToken = localStorage.getItem('token');
    if (freshToken) {
      socket.auth = { token: freshToken };
    }
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
