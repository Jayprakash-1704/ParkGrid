import { io } from 'socket.io-client';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(window.location.origin, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });
  }
  return socket;
}

export function joinLotRoom(lotId) {
  if (!lotId) return;
  const s = getSocket();
  s.emit('lot:join', lotId);
}

export function leaveLotRoom(lotId) {
  if (!lotId) return;
  const s = getSocket();
  s.emit('lot:leave', lotId);
}

export function joinRoleChannel(user) {
  if (!user) return;
  const s = getSocket();
  s.emit('role:join', {
    role: user.role,
    userId: user._id,
    lotId: user.assignedLot?._id || user.assignedLot || null,
  });
}
