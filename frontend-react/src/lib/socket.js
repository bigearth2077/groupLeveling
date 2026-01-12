import io from 'socket.io-client';
import { getToken } from '@/utils/token';

let socket = null;

export const connectSocket = () => {
  if (socket?.connected) return socket;

  const token = getToken();
  if (!token) return null;

  socket = io('/', {
    query: { token },
    transports: ['websocket'], // Force websocket only
    reconnection: true,
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
