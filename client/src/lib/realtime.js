import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:5000';
let socket;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SERVER_URL, {
      transports: ['websocket'],
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
  }
  return socket;
}

export function joinBoard(boardId) {
  const s = getSocket();
  s.emit('join-board', { boardId });
}

export function leaveBoard(boardId) {
  if (!socket) return;
  socket.emit('leave-board', { boardId });
}

export function on(event, handler) {
  const s = getSocket();
  s.on(event, handler);
}

export function off(event, handler) {
  if (!socket) return;
  if (handler) socket.off(event, handler);
  else socket.off(event);
}
